# Recall Notebook

An AI-powered knowledge management system that ingests content from multiple sources, generates intelligent summaries, and enables semantic search across everything you've saved.

## Features

- **Multi-Source Content Ingestion**: Upload text, paste URLs, or upload PDFs
- **AI-Powered Summarization**: Get instant, intelligent summaries with key actions and topics extracted automatically using Claude AI
- **Semantic Search**: Find anything with natural language queries across all your saved content
- **Organized Library**: View, organize, and manage all your sources in one place
- **Secure & Private**: Row-level security ensures your data is protected and isolated
- **3-Minute Onboarding**: Interactive onboarding flow with demo data for instant time-to-value
- **Quick Wins Tracking**: Gamified milestone system to guide new users through key features
- **Smart Content Detection**: Automatic detection of content type (text, URL, PDF) with contextual feedback

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend API**: Python FastAPI (see [recall-notebook-api](https://github.com/yourusername/recall-notebook-api))
- **Database**: Supabase (PostgreSQL with pgvector)
- **Authentication**: Supabase Auth
- **AI** (Cost-optimized):
  - **Anthropic Claude** (Summaries, Analysis) - $3-15/M tokens
  - **Google Gemini** (Embeddings - **FREE tier**, 1500/day) 🎉
  - **OpenAI** (Embeddings fallback) - $0.13/M tokens
- **Content Processing**: Cheerio (URLs), pdf-parse (PDFs)
- **Deployment**: Vercel (frontend), Railway (backend API)

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Gemini API key (FREE tier - 1500 embeddings/day)
- Anthropic API key (for summaries)
- OpenAI API key (optional, for embedding fallback)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables (see SETUP.md for detailed instructions)

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Backend API

This frontend uses the [**Recall Notebook API**](https://github.com/yourusername/recall-notebook-api) - a Python FastAPI backend designed for RAG (Retrieval-Augmented Generation) agents.

**Key Features:**
- 🆓 FREE embeddings (Google Gemini)
- 🔍 Hybrid search (semantic + keyword)
- 📦 Batch operations (100 embeddings, 50 sources)
- 🔔 Real-time webhooks

**For Local Development:**
1. Clone the API repository
2. Follow setup in [recall-notebook-api README](https://github.com/yourusername/recall-notebook-api)
3. Run backend: `poetry run uvicorn app.main:app --reload`
4. Update frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`

**For Production:**
- Frontend: Deployed to Vercel automatically
- Backend: Deployed to Railway (see [API deployment docs](https://github.com/yourusername/recall-notebook-api#deployment-to-railway))

## Setup Guide

See [SETUP.md](SETUP.md) for detailed setup instructions including:
- Creating a Supabase project
- Running database migrations
- Getting your Anthropic API key
- Configuring environment variables
- Setting up the backend API

## Project Structure

```
recall-notebook/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── search/            # Search page
│   │   └── source/[id]/       # Source detail page
│   ├── components/            # React components
│   │   ├── auth/              # Auth-related components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utility libraries
│   │   ├── auth/              # Auth utilities
│   │   ├── claude/            # Claude API integration
│   │   ├── content/           # Content processing
│   │   └── supabase/          # Supabase clients
│   └── types/                 # TypeScript type definitions
├── supabase/migrations/       # Database migrations
└── docs/                      # Documentation
```

## API Routes

### Backend API (recall-notebook-api)
Core knowledge management features are provided by the [Python FastAPI backend](https://github.com/yourusername/recall-notebook-api):

- **Sources**: Create, read, update, delete sources with AI summaries
- **Search**: Semantic, keyword, and hybrid search with pgvector
- **Embeddings**: Generate embeddings (FREE Gemini + OpenAI fallback)
- **Collections**: Organize sources into collections
- **Webhooks**: Real-time event notifications
- **Batch Operations**: Process up to 100 embeddings or 50 sources at once

See [API Documentation](https://github.com/yourusername/recall-notebook-api) for complete reference.

### Frontend API Routes (Next.js)
UI-specific features in this repository:

- `POST /api/onboarding/seed-demo` - Seed demo data for new users (rate limited: 3/hour)
- `GET /api/quick-wins` - Get user's quick wins progress
- `POST /api/quick-wins` - Mark a quick win as completed (rate limited: 10/minute)

All endpoints include:
- ✅ Zod input validation
- ✅ Rate limiting
- ✅ Proper error handling
- ✅ Type-safe responses
- ✅ Row-level security

## Testing

```bash
npm test              # Run tests
npm run test:coverage # Run with coverage
npm run test:watch    # Watch mode
```

## Deployment

Deploy to Vercel:
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## Environment Variables

See `.env.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `NEXT_PUBLIC_APP_URL` - Your app URL

## License

MIT
