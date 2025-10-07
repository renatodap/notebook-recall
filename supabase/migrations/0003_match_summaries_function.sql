-- Migration: Create match_summaries function for semantic search
-- This function performs vector similarity search on summaries

-- Drop any existing versions of the function
DROP FUNCTION IF EXISTS match_summaries;
DROP FUNCTION IF EXISTS match_summaries(vector);
DROP FUNCTION IF EXISTS match_summaries(vector, float);
DROP FUNCTION IF EXISTS match_summaries(vector, float, int);
DROP FUNCTION IF EXISTS match_summaries(vector, float, int, uuid);
DROP FUNCTION IF EXISTS match_summaries(vector, float, int, uuid, uuid);

-- Create the match_summaries function
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

-- Create HNSW index for faster vector search (if embeddings exist)
DO $$
BEGIN
  -- Drop old index if exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_summaries_embedding'
  ) THEN
    DROP INDEX idx_summaries_embedding;
  END IF;

  -- Create HNSW index if there are any embeddings
  IF EXISTS (SELECT 1 FROM summaries WHERE embedding IS NOT NULL LIMIT 1) THEN
    CREATE INDEX idx_summaries_embedding ON summaries
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;
