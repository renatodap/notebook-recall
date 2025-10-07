-- Migration: Setup sources, summaries, and tags tables with RLS
-- This migration creates the core tables for the Recall Notebook application

-- ============================================================================
-- SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content_type character varying NOT NULL,
  original_content text NOT NULL,
  url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_type character varying DEFAULT 'article'::character varying,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  audio_url text,
  audio_duration integer,
  transcript text,
  youtube_id text,
  youtube_title text,
  youtube_channel text,
  archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  CONSTRAINT sources_pkey PRIMARY KEY (id),
  CONSTRAINT sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on sources
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sources
DROP POLICY IF EXISTS "Users can view own sources" ON public.sources;
CREATE POLICY "Users can view own sources"
  ON public.sources FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sources" ON public.sources;
CREATE POLICY "Users can insert own sources"
  ON public.sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sources" ON public.sources;
CREATE POLICY "Users can update own sources"
  ON public.sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sources" ON public.sources;
CREATE POLICY "Users can delete own sources"
  ON public.sources FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUMMARIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  summary_text text NOT NULL,
  key_actions text[] DEFAULT '{}'::text[],
  key_topics text[] DEFAULT '{}'::text[],
  word_count integer NOT NULL,
  embedding vector(1536),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT summaries_pkey PRIMARY KEY (id),
  CONSTRAINT summaries_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE
);

-- Enable RLS on summaries
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for summaries
DROP POLICY IF EXISTS "Users can view own summaries" ON public.summaries;
CREATE POLICY "Users can view own summaries"
  ON public.summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own summaries" ON public.summaries;
CREATE POLICY "Users can insert own summaries"
  ON public.summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own summaries" ON public.summaries;
CREATE POLICY "Users can update own summaries"
  ON public.summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own summaries" ON public.summaries;
CREATE POLICY "Users can delete own summaries"
  ON public.summaries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  tag_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own tags" ON public.tags;
CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_created_at ON public.sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_source_id ON public.summaries(source_id);
CREATE INDEX IF NOT EXISTS idx_tags_source_id ON public.tags(source_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON public.tags(tag_name);

-- ============================================================================
-- VECTOR EXTENSION (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
