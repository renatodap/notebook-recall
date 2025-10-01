-- Migration: Add vector search and missing features to existing schema
-- This is safe to run on existing database - uses IF NOT EXISTS and CREATE OR REPLACE

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add unique constraint to tags if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_source_id_tag_name_key'
  ) THEN
    ALTER TABLE tags ADD CONSTRAINT tags_source_id_tag_name_key UNIQUE(source_id, tag_name);
  END IF;
END $$;

-- Update foreign key constraints to add ON DELETE CASCADE
-- First, drop existing constraints if they don't have CASCADE
DO $$
BEGIN
  -- Fix sources.user_id foreign key
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sources_user_id_fkey'
    AND confdeltype != 'c'  -- 'c' means CASCADE
  ) THEN
    ALTER TABLE sources DROP CONSTRAINT sources_user_id_fkey;
    ALTER TABLE sources ADD CONSTRAINT sources_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Fix summaries.source_id foreign key
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'summaries_source_id_fkey'
    AND confdeltype != 'c'
  ) THEN
    ALTER TABLE summaries DROP CONSTRAINT summaries_source_id_fkey;
    ALTER TABLE summaries ADD CONSTRAINT summaries_source_id_fkey
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE;
  END IF;

  -- Fix tags.source_id foreign key
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_source_id_fkey'
    AND confdeltype != 'c'
  ) THEN
    ALTER TABLE tags DROP CONSTRAINT tags_source_id_fkey;
    ALTER TABLE tags ADD CONSTRAINT tags_source_id_fkey
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_content_type ON sources(content_type);
CREATE INDEX IF NOT EXISTS idx_sources_created_at ON sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_source_id ON summaries(source_id);
CREATE INDEX IF NOT EXISTS idx_tags_source_id ON tags(source_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON tags(tag_name);

-- Create vector index for embeddings (only if embedding column has data)
-- Using ivfflat for fast approximate nearest neighbor search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_summaries_embedding'
  ) THEN
    -- Check if we have any embeddings before creating index
    IF EXISTS (SELECT 1 FROM summaries WHERE embedding IS NOT NULL LIMIT 1) THEN
      CREATE INDEX idx_summaries_embedding ON summaries
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
  END IF;
END $$;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_sources_updated_at'
  ) THEN
    CREATE TRIGGER update_sources_updated_at
      BEFORE UPDATE ON sources
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create or replace vector similarity search function
-- THIS IS THE CRITICAL FIX - adds p_user_id parameter for user isolation
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

-- Enable Row Level Security (idempotent)
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate with correct definitions)
DROP POLICY IF EXISTS "Users can view own sources" ON sources;
DROP POLICY IF EXISTS "Users can insert own sources" ON sources;
DROP POLICY IF EXISTS "Users can update own sources" ON sources;
DROP POLICY IF EXISTS "Users can delete own sources" ON sources;

DROP POLICY IF EXISTS "Users can view own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON summaries;

DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- Create RLS Policies for sources
CREATE POLICY "Users can view own sources"
  ON sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sources"
  ON sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources"
  ON sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources"
  ON sources FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for summaries
CREATE POLICY "Users can view own summaries"
  ON summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own summaries"
  ON summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own summaries"
  ON summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own summaries"
  ON summaries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Create RLS Policies for tags
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Verification queries (comment out if you don't want to see results)
-- SELECT 'Vector extension enabled' as status, count(*) as count FROM pg_extension WHERE extname = 'vector';
-- SELECT 'Embeddings exist' as status, count(*) as count FROM summaries WHERE embedding IS NOT NULL;
-- SELECT 'match_summaries function exists' as status, count(*) as count FROM pg_proc WHERE proname = 'match_summaries';
