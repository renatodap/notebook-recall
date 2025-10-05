-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Source embeddings table
CREATE TABLE IF NOT EXISTS source_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  chunk_id INTEGER DEFAULT 0,
  embedding vector(1536),
  content_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, chunk_id)
);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS source_embeddings_vector_idx
  ON source_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Create index on source_id for faster lookups
CREATE INDEX IF NOT EXISTS source_embeddings_source_id_idx
  ON source_embeddings(source_id);

-- RPC function for semantic search
CREATE OR REPLACE FUNCTION search_sources_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  source_id uuid,
  chunk_id int,
  distance float,
  content_preview text,
  title text,
  content_type text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.source_id,
    se.chunk_id,
    (se.embedding <=> query_embedding)::float as distance,
    se.content_preview,
    s.title,
    s.content_type,
    s.created_at
  FROM source_embeddings se
  JOIN sources s ON se.source_id = s.id
  WHERE
    (user_id_filter IS NULL OR s.user_id = user_id_filter)
    AND (se.embedding <=> query_embedding) < match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_source_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER source_embeddings_updated_at
  BEFORE UPDATE ON source_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_source_embeddings_updated_at();
