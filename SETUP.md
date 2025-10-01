# Setup Guide

This guide will walk you through setting up Recall Notebook from scratch.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An Anthropic API key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: recall-notebook (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be provisioned (~2 minutes)

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys")

### 2.3 Run Database Migrations

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20250101000000_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press Ctrl/Cmd + Enter
6. Verify success: You should see "Success. No rows returned"

### 2.4 Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see three tables:
   - `sources`
   - `summaries`
   - `tags`
3. Go to **Authentication** → **Policies** to verify RLS is enabled

## Step 3: Get Anthropic API Key

### 3.1 Create Anthropic Account

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or sign in
3. Complete any required verification

### 3.2 Get API Key

1. Go to **Settings** → **API Keys**
2. Click "Create Key"
3. Give it a name (e.g., "Recall Notebook")
4. Copy the API key immediately (you won't see it again!)
5. Store it securely

### 3.3 Add Credits (if needed)

- Free tier may be limited
- Add credits under **Settings** → **Billing** if needed

## Step 4: Configure Environment Variables

### 4.1 Create .env.local File

```bash
cp .env.example .env.local
```

### 4.2 Fill in Environment Variables

Open `.env.local` and fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Replace all `your_*_here` values with actual credentials
- Never commit `.env.local` to version control (it's in `.gitignore`)
- For production, use your production URL for `NEXT_PUBLIC_APP_URL`

## Step 5: Run the Application

### 5.1 Start Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

### 5.2 Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the Recall Notebook landing page.

## Step 6: Create Your First Account

1. Click "Get Started" or "Sign Up"
2. Enter your email and password
3. Check your email for confirmation link
4. Click the confirmation link
5. You'll be redirected to login
6. Sign in with your credentials
7. You should see the dashboard!

## Step 7: Test the Application

### Test Content Ingestion

1. Go to the Dashboard
2. Try each tab:
   - **Text**: Paste some sample text and click "Process & Save"
   - **URL**: Try a blog post URL (e.g., from Medium)
   - **PDF**: Upload a small PDF file

3. Wait for processing (should take 5-15 seconds)
4. Verify the content appears in your library

### Test Search

1. Click "🔍 Search" button
2. Enter a search query related to your saved content
3. Verify search results appear

### Test Detail View

1. Click on any saved source card
2. Verify you see:
   - Full summary
   - Key actions
   - Topics/tags
   - Original content

## Troubleshooting

### Database Connection Issues

**Error: Invalid API key**
- Double-check your Supabase keys in `.env.local`
- Make sure you're using the correct project

**Error: relation "sources" does not exist**
- Run the migration SQL again
- Verify the SQL executed successfully

### Authentication Issues

**Error: Email not confirmed**
- Check your email for confirmation link
- Check spam folder
- Go to Supabase → Authentication → Users to manually confirm

**Stuck on login page**
- Clear browser cookies
- Check browser console for errors
- Verify environment variables are set

### Claude API Issues

**Error: 401 Unauthorized**
- Check your Anthropic API key
- Verify you have credits in your account
- Make sure the key is active

**Error: 429 Rate Limit**
- You've hit rate limits
- Wait a few minutes and try again
- Consider upgrading your Anthropic plan

### Content Processing Issues

**URL fetching fails**
- Some websites block scraping
- Try a different URL
- Check if the website requires authentication

**PDF processing fails**
- Ensure PDF is not password-protected
- Try a smaller PDF (< 10MB recommended)
- Some PDFs with images only won't extract text

## Production Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
6. Click "Deploy"
7. Wait for deployment to complete
8. Visit your deployed URL!

### Post-Deployment

1. Update Supabase redirect URLs:
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL"
   - Add `https://your-app.vercel.app/auth/callback` to "Redirect URLs"

2. Test the deployed app:
   - Create a new account
   - Try all features
   - Check for any errors

## Next Steps

- Explore the codebase in `src/`
- Read the design docs in `docs/design/`
- Check out the database schema in `docs/design/database-schema.md`
- Run tests with `npm test`

## Getting Help

- Check existing GitHub issues
- Create a new issue with:
  - Error message
  - Steps to reproduce
  - Environment details (OS, Node version, etc.)

## Security Notes

- Never commit `.env.local` or `.env`
- Never share your Supabase service role key
- Never share your Anthropic API key
- Rotate keys if accidentally exposed
- Use environment variables for all secrets

## Performance Tips

- Keep content under 100,000 characters for best performance
- PDFs larger than 10MB may be slow to process
- Use pagination when viewing many sources
- Clear browser cache if experiencing issues

---

**You're all set!** Start building your personal knowledge base with AI-powered summaries. 🚀
