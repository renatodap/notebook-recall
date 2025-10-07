# 🔍 Embeddings Troubleshooting Guide

## How to Ensure Search & Tools Always Have Access to Embeddings

This guide helps you diagnose and fix issues with semantic search and RAG (Retrieval-Augmented Generation).

---

## 🩺 Quick Health Check

**Run the diagnostics endpoint:**
```bash
# In your browser or via curl:
GET http://localhost:3000/api/embeddings/diagnostic
```

This will check:
- ✅ Which sources have embeddings
- ✅ Which embedding provider is active
- ✅ Whether search is working
- ✅ Rate limit status
- ✅ Cost tracking

---

## 🔧 Common Issues & Solutions

### Issue 1: Search Returns No Results

**Symptoms**: Semantic search returns "No results found" even though sources exist

**Possible Causes**:

#### A) Embeddings Not Generated
```bash
# Check if embeddings exist
# Run in Supabase SQL Editor:
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
WHERE s.user_id = '<your-user-id>'
ORDER BY s.created_at DESC
LIMIT 10;
```

**Solution**: Run backfill to generate missing embeddings
```bash
POST http://localhost:3000/api/embeddings/backfill
```

#### B) Similarity Threshold Too High

The default threshold is `0.7` (70% similarity). Your query might not match that closely.

**Solution**: Lower the threshold in search:
```typescript
// In your search API call:
{
  "query": "your search",
  "mode": "hybrid",  // Use hybrid mode
  "threshold": 0.5   // Lower threshold to 50%
}
```

#### C) Different Embedding Providers

If sources were created with OpenAI embeddings but searches use Gemini (or vice versa), similarity scores may be inconsistent.

**Solution**: Use consistent provider:
```bash
# In .env.local:
EMBEDDING_PROVIDER=gemini-only  # or openai-only

# Or regenerate all embeddings with current provider:
POST /api/embeddings/backfill?force=true
```

#### D) Database Function Missing

**Check if match_summaries exists:**
```sql
SELECT proname
FROM pg_proc
WHERE proname = 'match_summaries';
```

**Solution**: Run the migration from `APPLY_MIGRATION.md`

---

### Issue 2: Embeddings Not Generated on Source Creation

**Symptoms**: New sources don't have embeddings

**Check console logs** when creating a source:
```
[Embeddings] Generating embedding for source "..."
[Embeddings] ✅ Generated embedding: { provider: 'gemini', ... }
[Embeddings] ✅ Embedding saved successfully to database
```

**If you don't see these logs:**

#### A) API Key Missing
```bash
# Check environment variables:
echo $GOOGLE_GEMINI_API_KEY
echo $OPENAI_API_KEY
```

**Solution**: Add API keys to `.env.local`

#### B) Generation Failed
Check server logs for errors like:
- `401 Unauthorized` - Invalid API key
- `429 Rate limit exceeded` - Hit daily/hourly limits
- `Network error` - Connection issues

**Solution**:
- Verify API keys are correct
- If rate limited, wait or use fallback provider
- Check internet connection

---

### Issue 3: Research Assistant Not Using Sources

**Symptoms**: Chat gives generic answers without referencing your sources

**Possible Causes**:

#### A) No Sources Found by Semantic Search

The Research Assistant automatically searches for relevant sources. If search returns no results (see Issue 1), it can't use them.

**Check logs** for:
```
[Search] match_summaries result: { results_count: 0 }
```

**Solution**: Fix search issues (see Issue 1)

#### B) Sources Outside Chat Context

If you selected a specific collection, only sources in that collection are searched.

**Solution**: Switch to "All Sources" in chat context dropdown

---

### Issue 4: Slow Search Performance

**Symptoms**: Search takes >3 seconds

**Possible Causes**:

#### A) No Index on Embeddings
```sql
-- Check if HNSW index exists:
SELECT indexname
FROM pg_indexes
WHERE tablename = 'summaries'
AND indexname LIKE '%embedding%';
```

**Solution**: Create index (if missing):
```sql
CREATE INDEX summaries_embedding_idx
ON summaries
USING hnsw (embedding vector_cosine_ops);
```

#### B) Too Many Sources
With 10,000+ sources, search can slow down even with indexes.

**Solution**: Use collections to limit search scope

---

## 🎯 Best Practices

### 1. Always Verify Embedding Generation

When creating sources programmatically, check the response:

```typescript
const response = await fetch('/api/sources', {
  method: 'POST',
  body: JSON.stringify({ /* source data */ })
});

const data = await response.json();

// Verify summary has embedding
if (!data.summary?.embedding) {
  console.error('⚠️ Embedding not generated!');
  // Trigger backfill or retry
}
```

### 2. Use Consistent Providers

Pick one strategy and stick with it:

```bash
# .env.local

# Option 1: Gemini primary (FREE), OpenAI fallback
EMBEDDING_PROVIDER=dual  # ✅ Recommended

# Option 2: Gemini only (FREE, no fallback)
EMBEDDING_PROVIDER=gemini-only

# Option 3: OpenAI only (paid, no rate limits)
EMBEDDING_PROVIDER=openai-only
```

### 3. Monitor with Diagnostics

Run diagnostics weekly:
```bash
GET /api/embeddings/diagnostic
```

Look for:
- ❌ `sources.without_embeddings > 0` → Run backfill
- ❌ `embedding_generation.status: error` → Check API keys
- ❌ `semantic_search.results_count: 0` → Lower threshold

### 4. Use Hybrid Search

Hybrid mode combines semantic + keyword for best results:

```typescript
// ✅ Best
{ mode: 'hybrid', threshold: 0.6 }

// ❌ May miss results
{ mode: 'semantic', threshold: 0.8 }
```

### 5. Regular Backfills

Schedule weekly backfills to catch any missed embeddings:

```bash
# Run in cron job or manually:
POST /api/embeddings/backfill
```

---

## 🚀 Testing Embeddings Are Working

### Test 1: Create a Source

```bash
curl -X POST http://localhost:3000/api/sources \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Source",
    "content_type": "text",
    "original_content": "Artificial intelligence and machine learning",
    "summary_text": "A test about AI and ML",
    "key_topics": ["ai", "ml"],
    "key_actions": [],
    "word_count": 8
  }'
```

**Expected Console Output**:
```
[Embeddings] Generating embedding for source "Test Source"...
[Embeddings] ✅ Generated embedding: { provider: 'gemini', model: 'gemini-embedding-001', ... }
[Embeddings] ✅ Embedding saved successfully to database
```

### Test 2: Search for It

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "mode": "hybrid",
    "threshold": 0.5,
    "limit": 5
  }'
```

**Expected**:
- `results.length > 0`
- `results[0].match_type === 'semantic'` or `'hybrid'`
- `results[0].relevance_score > 0.5`

### Test 3: Ask Research Assistant

Go to `/chat` and ask:
```
"What do I know about machine learning?"
```

**Expected**:
- Sources used: `[source_id]`
- Answer references your test source

---

## 📊 Monitoring Dashboard

Create a simple monitoring page by calling diagnostic endpoint:

```typescript
// components/EmbeddingsHealth.tsx
export function EmbeddingsHealth() {
  const { data } = useSWR('/api/embeddings/diagnostic');

  return (
    <div>
      <h2>Embeddings Health</h2>
      <p>Status: {data?.overall_status}</p>
      <p>Sources with embeddings: {data?.checks?.sources?.with_embeddings}</p>
      <p>Provider: {data?.checks?.provider?.strategy}</p>
      <p>Cost per request: ${data?.checks?.embedding_generation?.cost}</p>
    </div>
  );
}
```

---

## 🆘 Still Having Issues?

### Debug Checklist

- [ ] ✅ API keys configured in `.env.local`
- [ ] ✅ Supabase connection working
- [ ] ✅ `match_summaries` database function exists
- [ ] ✅ Sources have `summaries` with `embedding` column
- [ ] ✅ Embeddings are 1536 dimensions
- [ ] ✅ Search threshold ≤ 0.7
- [ ] ✅ Using `hybrid` or `semantic` mode
- [ ] ✅ User has sources in database
- [ ] ✅ RLS policies allow user to read their sources
- [ ] ✅ Console shows embedding generation logs
- [ ] ✅ No errors in browser/server console

### Get Detailed Logs

```bash
# Set debug logging:
LOG_LEVEL=debug npm run dev

# Watch logs:
tail -f .next/trace
```

### Database Inspection

```sql
-- Check everything:
SELECT
  s.id,
  s.title,
  s.user_id,
  s.created_at,
  sum.id as summary_id,
  CASE
    WHEN sum.embedding IS NOT NULL
    THEN 'HAS EMBEDDING (' || array_length(sum.embedding::vector, 1) || ' dims)'
    ELSE '❌ NO EMBEDDING'
  END as status,
  sum.created_at as summary_created
FROM sources s
LEFT JOIN summaries sum ON sum.source_id = s.id
ORDER BY s.created_at DESC
LIMIT 20;
```

---

## 🎉 Success Indicators

You know embeddings are working when:

✅ New sources immediately show `[Embeddings] ✅ Embedding saved successfully`
✅ Search returns relevant results with `match_type: 'semantic'`
✅ Research Assistant cites your sources
✅ Diagnostic endpoint shows `overall_status: 'healthy'`
✅ Cost is $0.00 (Gemini) or very low (OpenAI)

---

## 💡 Pro Tips

1. **Use Collections** - Group related sources for faster, more accurate search
2. **Descriptive Summaries** - Better summaries = better semantic matching
3. **Key Topics** - Include topics in embeddings for broader matching
4. **Hybrid Mode** - Best of both semantic + keyword worlds
5. **Lower Threshold** - Start at 0.5-0.6, increase if too many results

---

**Need more help?** Check server logs and run `/api/embeddings/diagnostic` first!
