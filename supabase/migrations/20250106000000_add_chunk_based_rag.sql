-- ============================================================================
-- Migration: Add Chunk-Based RAG System
-- Purpose: Enable granular passage-level search and retrieval
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CONTENT_CHUNKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT content_chunks_source_id_fkey FOREIGN KEY (source_id)
    REFERENCES public.sources(id) ON DELETE CASCADE,
  CONSTRAINT content_chunks_unique_index UNIQUE (source_id, chunk_index)
);

-- Add helpful comment
COMMENT ON TABLE public.content_chunks IS
'Stores document chunks for granular semantic search. Each source can have multiple chunks with embeddings.';

COMMENT ON COLUMN public.content_chunks.metadata IS
'Stores chunk metadata like: {page_number, start_char, end_char, heading, chunk_type}';

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR CHUNKS
-- ============================================================================

-- Vector similarity index (HNSW preferred, fallback to IVFFlat)
DO $$
BEGIN
  -- Check pgvector version and create appropriate index
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'vector'
    AND extversion >= '0.5.0'
  ) THEN
    -- HNSW is available (pgvector 0.5.0+)
    CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding
      ON public.content_chunks
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    RAISE NOTICE 'Created HNSW index on content_chunks';
  ELSE
    -- Fall back to IVFFlat for older pgvector versions
    CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding
      ON public.content_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    RAISE NOTICE 'Created IVFFlat index on content_chunks (pgvector < 0.5.0)';
  END IF;
END $$;

-- Source lookup index
CREATE INDEX IF NOT EXISTS idx_content_chunks_source_id
  ON public.content_chunks(source_id);

-- Composite index for efficient chunk retrieval
CREATE INDEX IF NOT EXISTS idx_content_chunks_source_index
  ON public.content_chunks(source_id, chunk_index);

-- ============================================================================
-- STEP 3: CREATE HIERARCHICAL SEARCH FUNCTION
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_content_chunks;

CREATE FUNCTION match_content_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  p_user_id uuid DEFAULT NULL,
  p_collection_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chunk_id uuid,
  source_id uuid,
  user_id uuid,
  chunk_index integer,
  chunk_content text,
  chunk_metadata jsonb,
  source_title text,
  source_content_type text,
  source_url text,
  source_created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id as chunk_id,
    cc.source_id,
    src.user_id,
    cc.chunk_index,
    cc.content as chunk_content,
    cc.metadata as chunk_metadata,
    src.title as source_title,
    src.content_type::text as source_content_type,
    src.url as source_url,
    src.created_at as source_created_at,
    (1 - (cc.embedding <=> query_embedding))::float as similarity
  FROM content_chunks cc
  INNER JOIN sources src ON src.id = cc.source_id
  LEFT JOIN collection_sources cs ON cs.source_id = src.id
  WHERE cc.embedding IS NOT NULL
    AND (1 - (cc.embedding <=> query_embedding)) > match_threshold
    AND (p_user_id IS NULL OR src.user_id = p_user_id)
    AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_content_chunks IS
'Chunk-level vector similarity search. Returns individual passages with highest relevance.
Use this for granular "find the exact passage" queries.';

-- ============================================================================
-- STEP 4: CREATE HYBRID SEARCH FUNCTION (CHUNKS + SUMMARIES)
-- ============================================================================

DROP FUNCTION IF EXISTS hybrid_search;

CREATE FUNCTION hybrid_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  chunk_count int DEFAULT 10,
  summary_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL,
  p_collection_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  result_type text,
  content text,
  title text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Chunk results
  SELECT
    cc.id,
    cc.source_id,
    'chunk'::text as result_type,
    cc.content,
    src.title,
    jsonb_build_object(
      'chunk_index', cc.chunk_index,
      'chunk_metadata', cc.metadata,
      'source_type', src.content_type,
      'source_url', src.url
    ) as metadata,
    (1 - (cc.embedding <=> query_embedding))::float as similarity
  FROM content_chunks cc
  INNER JOIN sources src ON src.id = cc.source_id
  LEFT JOIN collection_sources cs ON cs.source_id = src.id
  WHERE cc.embedding IS NOT NULL
    AND (1 - (cc.embedding <=> query_embedding)) > match_threshold
    AND (p_user_id IS NULL OR src.user_id = p_user_id)
    AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
  ORDER BY cc.embedding <=> query_embedding
  LIMIT chunk_count

  UNION ALL

  -- Summary results
  SELECT
    s.id,
    s.source_id,
    'summary'::text as result_type,
    s.summary_text as content,
    src.title,
    jsonb_build_object(
      'key_topics', s.key_topics,
      'key_actions', s.key_actions,
      'source_type', src.content_type,
      'source_url', src.url
    ) as metadata,
    (1 - (s.embedding <=> query_embedding))::float as similarity
  FROM summaries s
  INNER JOIN sources src ON src.id = s.source_id
  LEFT JOIN collection_sources cs ON cs.source_id = src.id
  WHERE s.embedding IS NOT NULL
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
    AND (p_user_id IS NULL OR src.user_id = p_user_id)
    AND (p_collection_id IS NULL OR cs.collection_id = p_collection_id)
  ORDER BY s.embedding <=> query_embedding
  LIMIT summary_count

  ORDER BY similarity DESC;
END;
$$;

COMMENT ON FUNCTION hybrid_search IS
'Combines chunk-level and summary-level search for best of both worlds.
Returns passages for granular search + summaries for high-level context.';

-- ============================================================================
-- STEP 5: CREATE CHUNK STATISTICS FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_chunk_stats;

CREATE FUNCTION get_chunk_stats(p_source_id uuid)
RETURNS TABLE (
  total_chunks integer,
  chunks_with_embeddings integer,
  chunks_without_embeddings integer,
  avg_chunk_length float
)
LANGUAGE sql
AS $$
  SELECT
    COUNT(*)::integer as total_chunks,
    COUNT(embedding)::integer as chunks_with_embeddings,
    (COUNT(*) - COUNT(embedding))::integer as chunks_without_embeddings,
    AVG(LENGTH(content))::float as avg_chunk_length
  FROM content_chunks
  WHERE source_id = p_source_id;
$$;

-- ============================================================================
-- STEP 6: ADD RLS POLICIES FOR CHUNKS
-- ============================================================================

-- Enable RLS on content_chunks
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see chunks from their own sources
DROP POLICY IF EXISTS chunks_user_isolation ON public.content_chunks;

CREATE POLICY chunks_user_isolation ON public.content_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Policy: Users can insert chunks for their own sources
DROP POLICY IF EXISTS chunks_user_insert ON public.content_chunks;

CREATE POLICY chunks_user_insert ON public.content_chunks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Policy: Users can update chunks for their own sources
DROP POLICY IF EXISTS chunks_user_update ON public.content_chunks;

CREATE POLICY chunks_user_update ON public.content_chunks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Policy: Users can delete chunks for their own sources
DROP POLICY IF EXISTS chunks_user_delete ON public.content_chunks;

CREATE POLICY chunks_user_delete ON public.content_chunks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: CREATE CLEANUP TRIGGER
-- ============================================================================

-- Function to clean up orphaned chunks (safety net)
DROP FUNCTION IF EXISTS cleanup_orphaned_chunks CASCADE;

CREATE FUNCTION cleanup_orphaned_chunks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a source is deleted, chunks are auto-deleted via CASCADE
  -- This is just a safety trigger for logging
  RAISE NOTICE 'Source % deleted, cascading to % chunks',
    OLD.id,
    (SELECT COUNT(*) FROM content_chunks WHERE source_id = OLD.id);
  RETURN OLD;
END;
$$;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count int;
  idx_count int;
  func_count int;
  policy_count int;
BEGIN
  -- Check table exists
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE tablename = 'content_chunks' AND schemaname = 'public';

  -- Check indexes
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename = 'content_chunks' AND schemaname = 'public';

  -- Check functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('match_content_chunks', 'hybrid_search', 'get_chunk_stats');

  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'content_chunks';

  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION COMPLETE - Chunk-Based RAG System';
  RAISE NOTICE '================================================';
  RAISE NOTICE '  Tables created: %', table_count;
  RAISE NOTICE '  Indexes created: %', idx_count;
  RAISE NOTICE '  Functions created: %', func_count;
  RAISE NOTICE '  RLS policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '  1. Deploy chunking service to create chunks';
  RAISE NOTICE '  2. Backfill existing sources with chunks';
  RAISE NOTICE '  3. Update search API to use hybrid_search()';
  RAISE NOTICE '  4. Update UI to display passage highlights';
  RAISE NOTICE '';
END $$;
