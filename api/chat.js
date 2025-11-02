import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// very small in-memory rate limiter (works for Vercel demo; for production use redis / DB)
const RATE_MAP = new Map();
const MAX_PER_MIN = 8;

function checkRate(ip) {
  const now = Date.now();
  const entry = RATE_MAP.get(ip) || { count: 0, t0: now };
  // reset every 60s
  if (now - entry.t0 > 60_000) {
    entry.count = 1;
    entry.t0 = now;
  } else {
    entry.count++;
  }
  RATE_MAP.set(ip, entry);
  return entry.count <= MAX_PER_MIN;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

    // Extract IP address - handle forwarded-for header which may contain multiple IPs
    let ip = "local";
    if (req.headers["x-forwarded-for"]) {
      ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    }
    if (!checkRate(ip)) {
      return res.status(429).json({ error: "Too many requests — slow down a bit." });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message required and must be a non-empty string" });
    }

    // instruct model to return structured JSON to simplify parsing
    const system = `
You are MindEase, an empathetic mental health assistant. Follow these rules:
1) Respond kindly and succinctly.
2) After reading the user's message, return a JSON object ONLY (no extra commentary) with keys:
   - "reply": a short empathetic helpful response (max ~220 words),
   - "mood": one of ["calm","sad","anxious","angry","neutral","confused","urgent"].
   - "tone": one of ["calming","encouraging","informational","reflective"].
   - "resources": an array of objects { "title": "...", "url": "..." } with up to 3 helpful resources.
   - "action": optional quick action string like "breathing_exercise" or "call_hotline".
3) NEVER provide medical diagnosis or promise outcomes. For crisis/urgent mood, include hotline resources and gentle instruction to seek immediate help.
4) Keep JSON valid, compact, and parseable.
`;

    const messages = [
      { role: "system", content: system },
      { role: "user", content: `User message: ${message}` }
    ];

    // call OpenAI Chat Completions
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 400,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return res.status(500).json({ error: "No response from model" });
    }

    // try parse JSON: model instructed to return JSON only
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // fallback: attempt to extract JSON substring
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        parsed = JSON.parse(m[0]);
      } else {
        return res.status(500).json({ error: "Failed to parse model output", raw: text });
      }
    }

    // sanitize basic fields
    parsed.reply = (parsed.reply || "").toString().trim();
    if (!parsed.reply) {
      return res.status(500).json({ error: "Empty response from model" });
    }
    parsed.mood = parsed.mood || "neutral";
    parsed.tone = parsed.tone || "informational";
    parsed.resources = Array.isArray(parsed.resources) 
      ? parsed.resources
          .slice(0, 3)
          .filter(r => r && (typeof r === "object"))
          .map(r => ({
            title: (r.title || r.url || "Resource").toString().trim(),
            url: (r.url || "#").toString().trim()
          }))
      : [];
    parsed.action = parsed.action || null;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message || err.toString() });
  }
}
