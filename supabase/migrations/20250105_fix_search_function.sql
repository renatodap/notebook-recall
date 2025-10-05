-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_sources_by_embedding(vector, float, int, uuid);
DROP FUNCTION IF EXISTS search_sources_by_embedding(vector, double precision, int, uuid);

-- Create the semantic search function with correct signature
CREATE OR REPLACE FUNCTION search_sources_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  target_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  source_id uuid,
  similarity float,
  chunk_id int,
  content_preview text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.source_id,
    (1 - (s.embedding <=> query_embedding))::float as similarity,
    0 as chunk_id,
    s.summary_text::text as content_preview
  FROM summaries s
  INNER JOIN sources src ON src.id = s.source_id
  WHERE s.embedding IS NOT NULL
    AND (target_user_id IS NULL OR src.user_id = target_user_id)
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
