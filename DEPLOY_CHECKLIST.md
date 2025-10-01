# 🚀 DEPLOYMENT CHECKLIST - Recall Notebook

## ⚠️ CRITICAL ISSUES FIXED

**Database Function Bug Fixed:** The `match_summaries` function now accepts `p_user_id` parameter (was missing, would have caused semantic search to fail).

---

## Step 1: Database Migration (CRITICAL)

**You MUST run this SQL in your Supabase database or semantic search will NOT work.**

### Option A: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of: `supabase/migrations/20250102000000_add_vector_search.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Verify no errors

**This migration is SAFE to run on existing schema - it uses IF NOT EXISTS checks.**

### Option B: Use Supabase CLI

```bash
cd recall-notebook
npx supabase db push
```

### Verify Migration Success

Run this query in Supabase SQL Editor:

```sql
-- Check if pgvector extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if embedding column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'summaries' AND column_name = 'embedding';

-- Check if match_summaries function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'match_summaries';
```

**Expected Results:**
- Extension: 1 row with `vector`
- Column: 1 row with `embedding` of type `USER-DEFINED`
- Function: 1 row with `match_summaries`

**If any query returns 0 rows, the migration FAILED. You must fix this before deploying.**

---

## Step 2: Environment Variables in Vercel

Add these environment variables in Vercel dashboard:

1. Go to your Vercel project → **Settings** → **Environment Variables**

2. Add **OPENAI_API_KEY** (CRITICAL - semantic search won't work without this):
   ```
   Variable: OPENAI_API_KEY
   Value: sk-...your-openai-api-key
   Environments: Production, Preview, Development
   ```

3. Verify existing variables are set:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `ANTHROPIC_API_KEY`
   - ⚠️ `OPENAI_API_KEY` (ADD THIS NOW)
   - ✅ `NEXT_PUBLIC_APP_URL` (should be your production URL)

---

## Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add all 5 features with complete UI integration"
git push origin main
```

Vercel will auto-deploy. Wait for deployment to complete.

---

## Step 4: Generate Embeddings for Existing Sources

**If you have existing sources, they need embeddings for semantic search.**

After deployment, run this command (replace URL and token):

```bash
curl -X POST https://your-app.vercel.app/api/embeddings/backfill \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10, "skip_existing": true}'
```

**To get YOUR_SUPABASE_TOKEN:**
1. Log into your deployed app
2. Open browser DevTools → Console
3. Run: `(await supabase.auth.getSession()).data.session.access_token`
4. Copy the token

Or use the Supabase service role key (not recommended for security).

---

## Step 5: Browser Extension Setup

1. Update API URL in `browser-extension/popup.js`:
   ```javascript
   const API_URL = 'https://your-app.vercel.app';  // Line 3
   ```

2. Load extension in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension` folder

3. Configure API token:
   - Click extension icon
   - Click "Settings"
   - Enter your Supabase access token (get from step 4 above)
   - Save

**Note:** Browser extension is NOT deployed. Users must load it manually as unpacked extension.

---

## Step 6: Verify All Features

### ✅ Feature 1: Semantic Search

1. Go to `/search`
2. Select "🧠 Semantic" mode
3. Search for conceptual query (e.g., "machine learning basics")
4. Should return relevant results even if exact words don't match

**If it fails:**
- Check OPENAI_API_KEY is in Vercel
- Check database migration ran successfully
- Check browser console for errors

### ✅ Feature 2: Tags Filtering

1. Go to `/dashboard`
2. Left sidebar should show "Filter by Tags"
3. Click a tag → sources should filter
4. Select multiple tags → try OR/AND logic toggle

**If it fails:**
- Check `/api/tags` returns data
- Check browser console for errors

### ✅ Feature 3: Export

1. On dashboard, click "📥 Export" button (top right)
2. Select "Export as Markdown"
3. File should download with `.md` extension
4. Try "Export as JSON" → should download `.json`

**If it fails:**
- Check `/api/export?format=markdown` returns data
- Check browser console for download errors

### ✅ Feature 4: Browser Extension

1. Visit any website
2. Click extension icon
3. Should pre-fill title and URL
4. Click "Save to Recall Notebook"
5. Should save source and auto-summarize

**If it fails:**
- Check API URL is correct in popup.js
- Check API token is configured
- Check browser console for CORS errors

### ✅ Feature 5: Bulk Operations

1. On dashboard, click checkboxes on multiple sources
2. Blue toolbar should appear at top
3. Click "🏷️ Add Tags" → enter tags → verify they're added
4. Select sources → click "📥 Export" → verify download
5. Select sources → click "🗑️ Delete" → confirm → verify deletion

**If it fails:**
- Check `/api/bulk/delete` and `/api/bulk/tag` work
- Check browser console for errors

---

## Step 7: Performance Check

### Check Semantic Search Speed

```bash
time curl -X POST https://your-app.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "test", "mode": "semantic"}'
```

**Expected:** < 2 seconds

**If slow:**
- Check ivfflat index exists on embeddings column
- Reduce `match_count` parameter
- Check OpenAI API latency

---

## Common Issues & Fixes

### Issue: Semantic search returns 0 results

**Causes:**
1. No embeddings generated yet → Run backfill (Step 4)
2. OPENAI_API_KEY missing → Add to Vercel (Step 2)
3. Database migration not run → Run SQL (Step 1)
4. Threshold too high → Lower to 0.5 in API

### Issue: Browser extension shows CORS error

**Fix:**
- Ensure `NEXT_PUBLIC_APP_URL` in Vercel matches extension API_URL
- Check Supabase CORS settings

### Issue: Tags not showing on dashboard

**Fix:**
- Check `/api/tags` endpoint returns data
- Verify tags table has data: `SELECT * FROM tags LIMIT 10`
- Check RLS policies allow tag reads

### Issue: Export downloads empty file

**Fix:**
- Check `/api/sources` returns sources
- Verify export format parameter is correct
- Check browser console for errors

---

## Security Checklist

- ✅ Never commit `.env.local` to git
- ✅ Use environment variables in Vercel
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ API endpoints validate user ownership
- ✅ Supabase service role key kept secret
- ⚠️ Browser extension API token stored in chrome.storage (encrypted)

---

## What You MUST Do Now

1. **[CRITICAL]** Run database migration in Supabase SQL Editor
2. **[CRITICAL]** Add OPENAI_API_KEY to Vercel environment variables
3. Deploy to Vercel (`git push`)
4. Run embeddings backfill for existing sources
5. Update browser extension API URL
6. Test all 5 features manually

**DO NOT skip steps 1-2 or the app will be broken.**

---

## Files Modified in This Session

### Backend APIs
- `src/app/api/search/route.ts` - Semantic search
- `src/app/api/tags/route.ts` - Tag filtering
- `src/app/api/export/route.ts` - Export functionality
- `src/app/api/bulk/delete/route.ts` - Bulk delete
- `src/app/api/bulk/tag/route.ts` - Bulk tag
- `src/lib/embeddings/client.ts` - OpenAI embeddings
- `src/lib/embeddings/utils.ts` - Vector math
- `src/lib/export/markdown.ts` - Markdown formatter
- `src/lib/export/json.ts` - JSON formatter

### Frontend UI
- `src/components/tags/TagPill.tsx` - Tag display component
- `src/components/tags/TagFilter.tsx` - Tag filtering UI
- `src/components/ExportButton.tsx` - Export dropdown
- `src/components/BulkActions.tsx` - Bulk actions toolbar
- `src/components/DashboardClient.tsx` - Dashboard state
- `src/components/SourceCard.tsx` - Bulk selection checkbox
- `src/app/search/page.tsx` - Search mode selector
- `src/app/dashboard/page.tsx` - Integrated all features

### Database
- `supabase/migrations/20250101000000_initial_schema.sql` - Complete schema with vector support

### Browser Extension
- `browser-extension/manifest.json`
- `browser-extension/popup.js`
- `browser-extension/popup.html`
- `browser-extension/content.js`
- `browser-extension/background.js`

**Total Files Modified/Created:** 40+ files

---

## Success Criteria

✅ Database migration runs without errors
✅ All environment variables set in Vercel
✅ Production build succeeds (already verified)
✅ Semantic search returns results
✅ Tag filtering works with OR/AND logic
✅ Export downloads markdown/JSON files
✅ Bulk operations modify multiple sources
✅ Browser extension saves pages

**When all checkboxes are ✅, deployment is complete.**
