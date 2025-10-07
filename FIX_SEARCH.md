# Fix Search: Quick Guide

Your search isn't working because either:
1. The `match_summaries` database function doesn't exist
2. Your source doesn't have an embedding yet

## Step 1: Apply the Database Migration

**Option A: Supabase Dashboard (Easiest)**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of:
   ```
   supabase/migrations/0003_match_summaries_function.sql
   ```
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success" message

**Option B: Supabase CLI**

```bash
supabase db push
```

## Step 2: Check if Your Source Has an Embedding

Go to your Supabase SQL Editor and run:

```sql
SELECT
  s.title,
  s.created_at,
  CASE
    WHEN sum.embedding IS NOT NULL
    THEN 'YES - ' || array_length(sum.embedding::vector, 1) || ' dims'
    ELSE 'NO EMBEDDING'
  END as embedding_status
FROM sources s
LEFT JOIN summaries sum ON sum.source_id = s.id
ORDER BY s.created_at DESC
LIMIT 10;
```

**If you see "NO EMBEDDING":**

Your source was created but the embedding generation failed. This happens sometimes with API rate limits or errors.

## Step 3: Generate Missing Embeddings (if needed)

**Option A: Use the Backfill API (Recommended)**

In your browser or Postman, send a POST request to:
```
http://localhost:3000/api/embeddings/backfill
```

Or using curl:
```bash
curl -X POST http://localhost:3000/api/embeddings/backfill
```

**Option B: Check the Diagnostic Endpoint**

Visit in your browser:
```
http://localhost:3000/api/embeddings/diagnostic
```

This will show:
- Which sources have embeddings
- Which provider is being used (Gemini or OpenAI)
- Total embeddings count
- Any errors

## Step 4: Try Searching Again

Now try your search again:
- Query: "what is the lesson policy for csse416?"
- Mode: Hybrid (best results)
- Threshold: 0.5 (lower = more results)

## Still Not Working?

### Lower the Similarity Threshold

The default threshold is 0.7 (70% similar). Try 0.5 (50% similar):

```typescript
// In the search component
{
  "query": "lesson policy csse416",
  "mode": "hybrid",
  "threshold": 0.5  // Lower threshold
}
```

### Try Different Search Modes

1. **Hybrid** (default): Combines semantic + keyword
2. **Semantic**: AI-powered similarity search
3. **Keyword**: Basic text matching

### Check Your Search Query

For the CSSE 416 document, try these queries:
- "lesson policy" (simpler = better matches)
- "csse416 lessons"
- "48 hours lesson" (specific detail)

## Verify Everything is Working

Run this SQL query to test the function:

```sql
-- Check if match_summaries function exists
SELECT
  proname,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'match_summaries';
```

Should show:
```
proname: match_summaries
arguments: query_embedding vector, match_threshold double precision,
           match_count integer, p_user_id uuid, p_collection_id uuid
```

## Common Errors

### "function match_summaries does not exist"
→ Run Step 1 (apply migration)

### "No results found" but embeddings exist
→ Try Step 4 with lower threshold (0.5 or 0.3)

### "embedding column is null"
→ Run Step 3 (backfill embeddings)

## After Fixing

Once search works, commit the migration:

```bash
git add supabase/migrations/0003_match_summaries_function.sql
git commit -m "feat: Add match_summaries database function for semantic search"
git push
```
