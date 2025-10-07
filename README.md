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
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with pgvector)
- **Authentication**: Supabase Auth
- **AI**:
  - Anthropic Claude API (Summaries, Analysis)
  - Google Gemini (Embeddings - FREE tier, 1500/day)
  - OpenAI (Embeddings fallback)
- **Content Processing**: Cheerio (URLs), pdf-parse (PDFs)
- **Deployment**: Vercel-ready

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

## Setup Guide

See [SETUP.md](SETUP.md) for detailed setup instructions including:
- Creating a Supabase project
- Running database migrations
- Getting your Anthropic API key
- Configuring environment variables

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

### Core Features
- `POST /api/summarize` - Generate AI summary for content
- `POST /api/sources` - Create new source with summary
- `GET /api/sources` - List all sources (paginated)
- `GET /api/sources/[id]` - Get single source
- `DELETE /api/sources/[id]` - Delete source
- `POST /api/search` - Search sources
- `POST /api/fetch-url` - Fetch content from URL
- `POST /api/process-pdf` - Process PDF file

### Onboarding & Quick Wins (Phase 2)
- `POST /api/onboarding/seed-demo` - Seed demo data for new users (rate limited: 3/hour)
- `GET /api/quick-wins` - Get user's quick wins progress
- `POST /api/quick-wins` - Mark a quick win as completed (rate limited: 10/minute)

All Phase 2 endpoints include:
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
