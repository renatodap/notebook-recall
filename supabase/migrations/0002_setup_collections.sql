-- Migration: Setup collections tables with RLS
-- This migration creates the collections and collection_sources tables

-- ============================================================================
-- COLLECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  collection_type character varying DEFAULT 'general'::character varying,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collections_pkey PRIMARY KEY (id),
  CONSTRAINT collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
DROP POLICY IF EXISTS "Users can view own collections" ON public.collections;
CREATE POLICY "Users can view own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public collections" ON public.collections;
CREATE POLICY "Users can view public collections"
  ON public.collections FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert own collections" ON public.collections;
CREATE POLICY "Users can insert own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COLLECTION_SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collection_sources (
  collection_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_by uuid,
  note text,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collection_sources_pkey PRIMARY KEY (collection_id, source_id),
  CONSTRAINT collection_sources_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
  CONSTRAINT collection_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE,
  CONSTRAINT collection_sources_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);

-- Enable RLS on collection_sources
ALTER TABLE public.collection_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_sources
DROP POLICY IF EXISTS "Users can view own collection sources" ON public.collection_sources;
CREATE POLICY "Users can view own collection sources"
  ON public.collection_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_sources.collection_id
      AND (collections.user_id = auth.uid() OR collections.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can add sources to own collections" ON public.collection_sources;
CREATE POLICY "Users can add sources to own collections"
  ON public.collection_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_sources.collection_id
      AND collections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove sources from own collections" ON public.collection_sources;
CREATE POLICY "Users can remove sources from own collections"
  ON public.collection_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_sources.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_sources_collection_id ON public.collection_sources(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_sources_source_id ON public.collection_sources(source_id);
