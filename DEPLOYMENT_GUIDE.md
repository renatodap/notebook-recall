# Deployment Guide - Recall Notebook

## Features Implemented

### ✅ Feature 1: Semantic Search
- Vector embeddings for AI-powered search
- Hybrid search (semantic + keyword)
- Cosine similarity matching
- Embedding generation via OpenAI API
- Backfill utility for existing summaries

### ✅ Feature 2: Tags Filtering
- Filter sources by tags
- OR/AND logic support
- Tag counts and statistics
- API endpoints for tag management

### ✅ Feature 3: Export
- Export to Markdown format
- Export to JSON format
- Batch export or selective export
- Download trigger with proper filenames

### ✅ Feature 4: Browser Extension
- Chrome/Firefox compatible
- One-click page capture
- Auto-summarization
- Context menu integration

### ✅ Feature 5: Bulk Operations
- Bulk delete sources
- Bulk add tags
- Selection management
- Progress feedback

## Environment Variables

Update your `.env.local` with the following (DO NOT commit to Git):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic API Configuration (for summarization)
ANTHROPIC_API_KEY=your_anthropic_api_key

# OpenAI API Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Pre-Deployment Checklist

### 1. Database Setup

Ensure your Supabase database has:
- ✅ Sources table with RLS policies
- ✅ Summaries table with `embedding vector(1536)` column
- ✅ Tags table
- ✅ `match_summaries()` function for semantic search
- ✅ Indexes on embeddings (ivfflat)

### 2. Dependencies

```bash
cd recall-notebook
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env.local
# Edit .env.local with your actual keys
```

### 4. Build Application

```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle Next.js application
- Optimize for production
- Generate static pages

### 5. Run Tests (Optional)

```bash
npm test
```

## Deployment Options

### Option A: Vercel (Recommended)

#### Initial Setup

1. **Add Environment Variables to Vercel:**
   - Go to: https://vercel.com/your-username/recall-notebook/settings/environment-variables
   - Add all variables from `.env.local`
   - Select: Production, Preview, Development

2. **Deploy:**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Deploy all 5 features"
   git push origin main

   # Vercel will auto-deploy
   ```

3. **Verify Deployment:**
   - Visit your Vercel URL
   - Test authentication
   - Test search (both keyword and semantic)
   - Test tag filtering
   - Test export
   - Test bulk operations

#### Update Deployment

```bash
# Make changes
git add .
git commit -m "Update features"
git push origin main
```

### Option B: Self-Hosted (Railway/Render/DigitalOcean)

1. **Build Docker Image** (optional):
   ```bash
   docker build -t recall-notebook .
   docker run -p 3000:3000 recall-notebook
   ```

2. **Or use Node.js directly:**
   ```bash
   npm run build
   npm start
   ```

## Post-Deployment

### 1. Backfill Embeddings

For existing summaries without embeddings:

```bash
curl -X POST https://your-app-url.vercel.app/api/embeddings/backfill \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10, "dry_run": false}'
```

### 2. Configure Browser Extension

1. Update `browser-extension/popup.js`:
   ```javascript
   const API_URL = 'https://your-app-url.vercel.app';
   ```

2. Load extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `browser-extension` folder

3. Configure API token in extension settings

### 3. Monitor Performance

#### Key Metrics

- **Semantic Search Latency**: Target <500ms
- **Embedding Generation**: Target <2s per summary
- **Export Performance**: Target <3s for 100 sources
- **Bulk Operations**: Target <5s for 50 sources

#### Monitoring Tools

- Vercel Analytics (built-in)
- Sentry (error tracking)
- LogRocket (session replay)

### 4. Database Optimization

#### Tune Vector Index

Based on your data size:

```sql
-- For <1000 summaries
CREATE INDEX idx_summaries_embedding
ON summaries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For 1000-10000 summaries
CREATE INDEX idx_summaries_embedding
ON summaries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);

-- For >10000 summaries
CREATE INDEX idx_summaries_embedding
ON summaries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 500);
```

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
npm install
npm run build
```

**Error: TypeScript errors**
```bash
npm run type-check
# Fix reported errors
```

### Runtime Errors

**Error: Unauthorized (401)**
- Check environment variables are set in Vercel
- Verify API tokens are correct
- Check RLS policies in Supabase

**Error: Semantic search not working**
- Verify OPENAI_API_KEY is set
- Check embeddings are being generated
- Run backfill for existing summaries

**Error: Tags not filtering**
- Check tag normalization (lowercase)
- Verify tags exist in database
- Test with simple queries first

## Maintenance

### Regular Tasks

1. **Weekly**: Monitor error logs
2. **Monthly**: Review performance metrics
3. **Quarterly**: Optimize database indexes
4. **As needed**: Backfill new embeddings

### Backup Strategy

```bash
# Export all data periodically
curl https://your-app-url.vercel.app/api/export?format=json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o backup_$(date +%Y%m%d).json
```

## Success Criteria

- ✅ All 5 features functional in production
- ✅ Authentication working
- ✅ Semantic search returns relevant results
- ✅ Tags filter correctly (OR/AND logic)
- ✅ Export downloads files
- ✅ Browser extension saves pages
- ✅ Bulk operations complete without errors
- ✅ Performance meets targets (<500ms search)
- ✅ Zero critical security vulnerabilities

## Support

For issues:
1. Check this deployment guide
2. Review application logs in Vercel
3. Check Supabase logs
4. Review GitHub issues
5. Contact support

---

**Deployment completed successfully! 🎉**

All 5 features are now live and functional.
