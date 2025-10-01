# How to Apply the Migration

## The Error You Saw

```
ERROR: 42725: function name "match_summaries" is not unique
```

This happened because PostgreSQL found multiple versions of the `match_summaries` function and didn't know which one to replace.

## The Fix

The migration file has been updated to explicitly drop the old function first:

```sql
-- Drop the old match_summaries function explicitly
DROP FUNCTION IF EXISTS match_summaries(vector, float, int, uuid);

-- Then create the new version
CREATE OR REPLACE FUNCTION match_summaries(...)
```

## Steps to Apply

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project**
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "New Query"**
4. **Copy the entire contents** of:
   ```
   supabase/migrations/20250105000000_optimize_collection_search.sql
   ```
5. **Paste into the SQL Editor**
6. **Click "Run"** or press Ctrl+Enter
7. **Wait for "Success"** message

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL (If you prefer step-by-step)

Run these sections **one at a time** in Supabase SQL Editor:

**Step 1: Upgrade Vector Index**
```sql
DO $$
BEGIN
  -- Drop old IVFFlat index
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_summaries_embedding'
  ) THEN
    DROP INDEX idx_summaries_embedding;
  END IF;

  -- Create HNSW index if embeddings exist
  IF EXISTS (SELECT 1 FROM summaries WHERE embedding IS NOT NULL LIMIT 1) THEN
    CREATE INDEX idx_summaries_embedding ON summaries
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;
```

**Step 2: Add Composite Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_collection_sources_composite
  ON collection_sources(collection_id, source_id);

CREATE INDEX IF NOT EXISTS idx_sources_user_created
  ON sources(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sources_tags_gin
  ON sources USING GIN(tags);
```

**Step 3: Update match_summaries Function**
```sql
-- Drop old version
DROP FUNCTION IF EXISTS match_summaries(vector, float, int, uuid);

-- Create new version (copy from migration file)
CREATE OR REPLACE FUNCTION match_summaries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL,
  p_collection_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  user_id uuid,
  title text,
  content_type text,
  original_content text,
  url text,
  created_at timestamptz,
  updated_at timestamptz,
  summary_id uuid,
  summary_text text,
  key_actions text[],
  key_topics text[],
  word_count integer,
  summary_created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    src.id,
    src.id as source_id,
    src.user_id,
    src.title,
    src.content_type::text,
    src.original_content,
    src.url,
    src.created_at,
    src.updated_at,
    s.id as summary_id,
    s.summary_text,
    s.key_actions,
    s.key_topics,
    s.word_count,
    s.created_at as summary_created_at,
    (1 - (s.embedding <=> query_embedding))::float as similarity
  FROM summaries s
  INNER JOIN sources src ON src.id = s.source_id
  LEFT JOIN collection_sources cs ON cs.source_id = src.id
  WHERE s.embedding IS NOT NULL
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
    AND (p_user_id IS NULL OR src.user_id = p_user_id)
    AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Step 4: Create Helper Functions**

Copy the `get_sources_by_tags` and `get_sources_by_collection` functions from the migration file.

## Verify the Migration

After running, verify everything worked:

```sql
-- 1. Check HNSW index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_summaries_embedding';
-- Should show "hnsw" in the indexdef

-- 2. Check new indexes exist
SELECT indexname
FROM pg_indexes
WHERE indexname IN (
  'idx_collection_sources_composite',
  'idx_sources_user_created',
  'idx_sources_tags_gin'
);
-- Should return 3 rows

-- 3. Check new functions exist
SELECT
  proname,
  pronargs
FROM pg_proc
WHERE proname IN (
  'match_summaries',
  'get_sources_by_tags',
  'get_sources_by_collection'
);
-- Should return 3 rows
-- match_summaries should have pronargs = 5 (5 parameters)

-- 4. Test the new match_summaries function
SELECT
  proname,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'match_summaries';
-- Should show: query_embedding vector, match_threshold double precision,
--              match_count integer, p_user_id uuid, p_collection_id uuid
```

## If You Still Get Errors

### Error: "function match_summaries does not exist"
**Solution:** The old function had a different signature. Drop all versions:

```sql
-- Drop all versions
DROP FUNCTION IF EXISTS match_summaries;
DROP FUNCTION IF EXISTS match_summaries(vector);
DROP FUNCTION IF EXISTS match_summaries(vector, float);
DROP FUNCTION IF EXISTS match_summaries(vector, float, int);
DROP FUNCTION IF EXISTS match_summaries(vector, float, int, uuid);

-- Then run the CREATE OR REPLACE from the migration
```

### Error: "type vector does not exist"
**Solution:** pgvector extension not installed:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "access method hnsw does not exist"
**Solution:** Your pgvector version is too old. Update pgvector:

```sql
-- Check version
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- If version < 0.5.0, you need to update pgvector
-- In Supabase dashboard: Database > Extensions > vector > Update

-- Alternative: Use IVFFlat instead
DROP INDEX IF EXISTS idx_summaries_embedding;
CREATE INDEX idx_summaries_embedding ON summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Error: "index ... already exists"
**Solution:** That's fine! The `IF NOT EXISTS` should prevent this, but if you see it, it means the index already exists. You can ignore it or:

```sql
-- Check which indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('sources', 'summaries', 'collection_sources')
ORDER BY indexname;
```

## Rollback (If Needed)

If something goes wrong and you need to rollback:

```sql
-- Restore old match_summaries
DROP FUNCTION IF EXISTS match_summaries;

CREATE OR REPLACE FUNCTION match_summaries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  summary_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.source_id,
    s.summary_text,
    1 - (s.embedding <=> query_embedding) as similarity
  FROM summaries s
  INNER JOIN sources src ON src.id = s.source_id
  WHERE s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
    AND (p_user_id IS NULL OR src.user_id = p_user_id)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Remove new functions
DROP FUNCTION IF EXISTS get_sources_by_tags;
DROP FUNCTION IF EXISTS get_sources_by_collection;

-- Revert to IVFFlat index
DROP INDEX IF EXISTS idx_summaries_embedding;
CREATE INDEX idx_summaries_embedding ON summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## Next Steps

After successful migration:

1. ✅ Deploy your updated code to production
2. ✅ Test the new API endpoints
3. ✅ Monitor performance
4. ✅ Enjoy faster searches!
