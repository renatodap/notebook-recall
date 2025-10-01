-- Migration: Optimize for collection-scoped search and tag filtering
-- Purpose: Improve performance for students using one collection per class
-- Version: 2 - Fixed function drop issues

-- ============================================================================
-- STEP 1: CHECK AND DROP ALL VERSIONS OF match_summaries
-- ============================================================================

-- Drop ALL versions of match_summaries function (no matter the signature)
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Find and drop all match_summaries functions
  FOR func_record IN
    SELECT
      p.oid::regprocedure::text as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'match_summaries'
      AND n.nspname = 'public'
  LOOP
    EXECUTE 'DROP FUNCTION ' || func_record.func_signature;
    RAISE NOTICE 'Dropped function: %', func_record.func_signature;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: UPGRADE VECTOR INDEX FROM IVFFLAT TO HNSW
-- ============================================================================

DO $$
BEGIN
  -- Drop the old ivfflat index if it exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_summaries_embedding'
  ) THEN
    EXECUTE 'DROP INDEX idx_summaries_embedding';
    RAISE NOTICE 'Dropped old IVFFlat index';
  END IF;

  -- Create HNSW index if we have embeddings
  -- Check pgvector version first
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'vector'
    AND extversion >= '0.5.0'
  ) THEN
    -- HNSW is available (pgvector 0.5.0+)
    IF EXISTS (SELECT 1 FROM summaries WHERE embedding IS NOT NULL LIMIT 1) THEN
      EXECUTE 'CREATE INDEX idx_summaries_embedding ON summaries
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)';
      RAISE NOTICE 'Created HNSW index';
    ELSE
      RAISE NOTICE 'No embeddings found, skipping index creation';
    END IF;
  ELSE
    -- Fall back to IVFFlat for older pgvector versions
    IF EXISTS (SELECT 1 FROM summaries WHERE embedding IS NOT NULL LIMIT 1) THEN
      EXECUTE 'CREATE INDEX idx_summaries_embedding ON summaries
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)';
      RAISE NOTICE 'Created IVFFlat index (pgvector < 0.5.0)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD COMPOSITE INDEXES FOR COLLECTION-BASED QUERIES
-- ============================================================================

-- Optimize collection_sources lookups
CREATE INDEX IF NOT EXISTS idx_collection_sources_composite
  ON collection_sources(collection_id, source_id);

-- Optimize sources queries filtered by user and collection
CREATE INDEX IF NOT EXISTS idx_sources_user_created
  ON sources(user_id, created_at DESC);

-- Optimize tag-based filtering using GIN index on array column
CREATE INDEX IF NOT EXISTS idx_sources_tags_gin
  ON sources USING GIN(tags);

-- ============================================================================
-- STEP 4: CREATE NEW ENHANCED match_summaries FUNCTION
-- ============================================================================

CREATE FUNCTION match_summaries(
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

-- ============================================================================
-- STEP 5: CREATE HELPER FUNCTION FOR TAG FILTERING
-- ============================================================================

DROP FUNCTION IF EXISTS get_sources_by_tags;

CREATE FUNCTION get_sources_by_tags(
  p_user_id uuid,
  p_tags text[],
  p_tag_logic text DEFAULT 'OR',
  p_content_type text DEFAULT NULL,
  p_collection_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content_type text,
  original_content text,
  url text,
  created_at timestamptz,
  updated_at timestamptz,
  source_type text,
  tags text[],
  metadata jsonb,
  notes text
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_tag_logic = 'AND' THEN
    RETURN QUERY
    SELECT DISTINCT
      s.id,
      s.user_id,
      s.title,
      s.content_type::text,
      s.original_content,
      s.url,
      s.created_at,
      s.updated_at,
      s.source_type,
      s.tags,
      s.metadata,
      s.notes
    FROM sources s
    LEFT JOIN collection_sources cs ON cs.source_id = s.id
    WHERE s.user_id = p_user_id
      AND (p_content_type IS NULL OR s.content_type::text = p_content_type)
      AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
      AND s.tags @> p_tags
    ORDER BY s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSE
    RETURN QUERY
    SELECT DISTINCT
      s.id,
      s.user_id,
      s.title,
      s.content_type::text,
      s.original_content,
      s.url,
      s.created_at,
      s.updated_at,
      s.source_type,
      s.tags,
      s.metadata,
      s.notes
    FROM sources s
    LEFT JOIN collection_sources cs ON cs.source_id = s.id
    WHERE s.user_id = p_user_id
      AND (p_content_type IS NULL OR s.content_type::text = p_content_type)
      AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
      AND s.tags && p_tags
    ORDER BY s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$$;

-- ============================================================================
-- STEP 6: CREATE FUNCTION TO GET SOURCES BY COLLECTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_sources_by_collection;

CREATE FUNCTION get_sources_by_collection(
  p_user_id uuid,
  p_collection_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content_type text,
  original_content text,
  url text,
  created_at timestamptz,
  updated_at timestamptz,
  source_type text,
  tags text[],
  metadata jsonb,
  notes text,
  collection_note text,
  added_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.title,
    s.content_type::text,
    s.original_content,
    s.url,
    s.created_at,
    s.updated_at,
    s.source_type,
    s.tags,
    s.metadata,
    s.notes,
    cs.note as collection_note,
    cs.added_at
  FROM sources s
  INNER JOIN collection_sources cs ON cs.source_id = s.id
  INNER JOIN collections c ON c.id = cs.collection_id
  WHERE s.user_id = p_user_id
    AND cs.collection_id = p_collection_id
    AND c.user_id = p_user_id
  ORDER BY cs.added_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION match_summaries IS
'Enhanced vector similarity search with optional collection and user filtering.
Use p_collection_id to search within a specific collection (e.g., one class).
Automatically uses HNSW index if available, falls back to IVFFlat for older pgvector.';

COMMENT ON FUNCTION get_sources_by_tags IS
'Server-side tag filtering with AND/OR logic and optional collection filtering.
Replaces client-side filtering for better performance and proper pagination.';

COMMENT ON FUNCTION get_sources_by_collection IS
'Get all sources in a collection with pagination support.
Returns collection-specific metadata like notes and added_at timestamp.';

COMMENT ON INDEX idx_sources_tags_gin IS
'GIN index enables fast array operations (@>, &&) for tag filtering.
Supports both contains (@>) and overlap (&&) operators.';

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  idx_count int;
  func_count int;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_summaries_embedding',
    'idx_collection_sources_composite',
    'idx_sources_user_created',
    'idx_sources_tags_gin'
  );

  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN (
    'match_summaries',
    'get_sources_by_tags',
    'get_sources_by_collection'
  );

  RAISE NOTICE '✓ Migration complete!';
  RAISE NOTICE '  - Created % indexes', idx_count;
  RAISE NOTICE '  - Created % functions', func_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy updated code to production';
  RAISE NOTICE '2. Test collection-scoped search';
  RAISE NOTICE '3. Monitor performance improvements';
END $$;
