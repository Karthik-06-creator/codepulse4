# MindEase — Empathetic AI Chatbot

A client-first mental-health chatbot using OpenAI. Frontend is static HTML/CSS/JS, serverless backend is a Vercel Node function.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- OpenAI API key
- Vercel CLI (for local development)

## How to run locally

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd codepulse2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Or if you have Vercel CLI installed globally:
   ```bash
   vercel dev
   ```

5. Open your browser and navigate to `http://localhost:3000` (or the port shown in the terminal)

## Deploy to Vercel

1. Push your repository to GitHub (or GitLab/Bitbucket)

2. On Vercel:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click **Import Project**
   - Select your repository
   - Framework Preset: **Other**
   - Root Directory: `/` (or the folder containing `index.html` and `api/`)

3. Add Environment Variable:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-...` (your OpenAI API key)

4. Click **Deploy**

5. Your app will be live at a Vercel-provided URL

## Project Structure

```
.
├── api/
│   └── chat.js          # Serverless API endpoint
├── index.html           # Main HTML file
├── script.js            # Frontend JavaScript
├── style.css            # Styles
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel configuration
└── README.md            # This file
```

## Features

- Empathetic AI conversation powered by OpenAI GPT-3.5
- Mood detection and appropriate responses
- Quick action tools (breathing exercises, journaling prompts)
- Resource suggestions based on conversation context
- Responsive design for mobile and desktop
- Rate limiting for API protection

## Notes & Safety

⚠️ **Important**: This chatbot is not a replacement for professional mental health care.

- For emergencies, contact local emergency services or your local crisis hotline
- For production deployments:
  - Use persistent rate-limiting (Redis or database)
  - Implement proper logging and audit trails
  - Review and refine AI prompts regularly
  - Consider additional security measures
