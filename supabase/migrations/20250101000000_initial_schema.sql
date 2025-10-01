-- Initial schema for Recall Notebook application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums
CREATE TYPE content_type AS ENUM ('text', 'url', 'pdf', 'note');

-- Create sources table
CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type content_type NOT NULL,
  original_content text NOT NULL,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create summaries table
CREATE TABLE summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  summary_text text NOT NULL,
  key_actions text[] DEFAULT '{}',
  key_topics text[] DEFAULT '{}',
  word_count integer NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, tag_name)
);

-- Create indexes for sources
CREATE INDEX idx_sources_user_id ON sources(user_id);
CREATE INDEX idx_sources_content_type ON sources(content_type);
CREATE INDEX idx_sources_created_at ON sources(created_at DESC);

-- Create indexes for summaries
CREATE INDEX idx_summaries_source_id ON summaries(source_id);
CREATE INDEX idx_summaries_embedding ON summaries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for tags
CREATE INDEX idx_tags_source_id ON tags(source_id);
CREATE INDEX idx_tags_tag_name ON tags(tag_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sources updated_at
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_summaries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
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
  WHERE s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sources
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

-- RLS Policies for summaries
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

-- RLS Policies for tags
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
