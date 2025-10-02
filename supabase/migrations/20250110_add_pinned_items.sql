-- Add pinned items functionality for PARA dashboard
-- Allows users to pin up to 3 sources per PARA category

CREATE TABLE public.pinned_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('projects', 'areas', 'resources')),
  pinned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pinned_items_pkey PRIMARY KEY (id),
  CONSTRAINT pinned_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT pinned_items_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE,
  CONSTRAINT pinned_items_unique UNIQUE (user_id, source_id, category)
);

-- Index for fast lookups
CREATE INDEX idx_pinned_items_user_category ON public.pinned_items(user_id, category);
CREATE INDEX idx_pinned_items_source ON public.pinned_items(source_id);

-- Enable RLS
ALTER TABLE public.pinned_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pinned items"
  ON public.pinned_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pinned items"
  ON public.pinned_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned items"
  ON public.pinned_items FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get pinned sources for a user and category
CREATE OR REPLACE FUNCTION public.get_pinned_sources(
  p_user_id uuid,
  p_category text
)
RETURNS TABLE (
  source_id uuid,
  pinned_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT pi.source_id, pi.pinned_at
  FROM public.pinned_items pi
  WHERE pi.user_id = p_user_id
    AND pi.category = p_category
  ORDER BY pi.pinned_at DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a source is pinned
CREATE OR REPLACE FUNCTION public.is_source_pinned(
  p_user_id uuid,
  p_source_id uuid,
  p_category text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pinned_items
    WHERE user_id = p_user_id
      AND source_id = p_source_id
      AND category = p_category
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE public.pinned_items IS 'Stores pinned sources for quick access in PARA dashboard';
