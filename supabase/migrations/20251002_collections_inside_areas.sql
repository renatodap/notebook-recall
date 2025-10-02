-- Migration: Collections Inside Areas
-- Make collections an optional organizational tool within areas
-- Sources can be in areas directly OR organized into collections within areas
-- Example: Area = "School" with Collections = "Math Class", "English Class"
-- Example: Area = "Fitness" with Collections = "Running", "Gym", "Supplements"

-- ============================================================================
-- 0. Drop any dependent views first (to avoid "cannot drop columns" error)
-- ============================================================================

DROP VIEW IF EXISTS public.collections_with_area CASCADE;

-- ============================================================================
-- 1. Add area_id column to collections table (if it doesn't exist)
-- ============================================================================

DO $$
BEGIN
  -- Check if area_id column exists, add it if it doesn't
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'collections'
    AND column_name = 'area_id'
  ) THEN
    ALTER TABLE public.collections ADD COLUMN area_id uuid;
  END IF;
END $$;

-- ============================================================================
-- 2. Add foreign key constraint
-- ============================================================================

DO $$
BEGIN
  -- Drop constraint if exists (to allow re-running migration)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'collections_area_id_fkey'
    AND table_name = 'collections'
  ) THEN
    ALTER TABLE public.collections DROP CONSTRAINT collections_area_id_fkey;
  END IF;

  -- Add the constraint
  ALTER TABLE public.collections
  ADD CONSTRAINT collections_area_id_fkey
    FOREIGN KEY (area_id)
    REFERENCES public.areas(id)
    ON DELETE CASCADE;
END $$;

-- ============================================================================
-- 3. Migrate existing collections to areas
-- ============================================================================

-- For each user with collections but no area_id assigned:
-- - Create a "General" area if they don't have any areas
-- - Assign all their collections to that area

DO $$
DECLARE
  user_record RECORD;
  default_area_id uuid;
BEGIN
  -- For each user with collections that have NULL area_id
  FOR user_record IN
    SELECT DISTINCT c.user_id
    FROM public.collections c
    WHERE c.area_id IS NULL
  LOOP
    -- Check if user has at least one area
    SELECT id INTO default_area_id
    FROM public.areas
    WHERE user_id = user_record.user_id
    LIMIT 1;

    -- If no area exists, create a default one
    IF default_area_id IS NULL THEN
      INSERT INTO public.areas (user_id, name, description)
      VALUES (
        user_record.user_id,
        'General',
        'Default area for organizing collections'
      )
      RETURNING id INTO default_area_id;
    END IF;

    -- Assign all user's NULL collections to this area
    UPDATE public.collections
    SET area_id = default_area_id
    WHERE user_id = user_record.user_id
      AND area_id IS NULL;
  END LOOP;
END $$;

-- ============================================================================
-- 4. Make area_id NOT NULL
-- ============================================================================

-- Now that all existing collections have been assigned, make the column NOT NULL
DO $$
BEGIN
  -- Check if column is nullable and make it NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'collections'
    AND column_name = 'area_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.collections
    ALTER COLUMN area_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 5. Create index for performance
-- ============================================================================

DROP INDEX IF EXISTS public.idx_collections_area_id;
CREATE INDEX idx_collections_area_id ON public.collections(area_id);

-- ============================================================================
-- 6. Create view for collections with area information
-- ============================================================================

CREATE OR REPLACE VIEW public.collections_with_area AS
SELECT
  c.id as collection_id,
  c.user_id,
  c.name as collection_name,
  c.description as collection_description,
  c.is_public,
  c.collection_type,
  c.metadata as collection_metadata,
  c.created_at as collection_created_at,
  c.updated_at as collection_updated_at,
  c.area_id,
  a.name as area_name,
  a.description as area_description,
  -- Count sources in this collection
  (SELECT COUNT(*)
   FROM public.collection_sources cs
   WHERE cs.collection_id = c.id) as source_count
FROM public.collections c
INNER JOIN public.areas a ON c.area_id = a.id;

-- ============================================================================
-- 7. Update RLS policies for collections
-- ============================================================================

-- Drop all existing collection policies
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can view public collections" ON public.collections;
DROP POLICY IF EXISTS "Users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete collections" ON public.collections;

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Users can view their own collections (must belong to their area)
CREATE POLICY "Users can view their own collections"
  ON public.collections FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.areas a
      WHERE a.id = area_id AND a.user_id = auth.uid()
    )
  );

-- Users can view public collections
CREATE POLICY "Users can view public collections"
  ON public.collections FOR SELECT
  USING (is_public = true);

-- Users can create collections (must own the area)
CREATE POLICY "Users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.areas a
      WHERE a.id = area_id AND a.user_id = auth.uid()
    )
  );

-- Users can update their own collections (must own the area)
CREATE POLICY "Users can update collections"
  ON public.collections FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.areas a
      WHERE a.id = area_id AND a.user_id = auth.uid()
    )
  );

-- Users can delete their own collections (must own the area)
CREATE POLICY "Users can delete collections"
  ON public.collections FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.areas a
      WHERE a.id = area_id AND a.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Create helper functions
-- ============================================================================

-- Get collections by area
CREATE OR REPLACE FUNCTION public.get_collections_by_area(p_area_id uuid, p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_public boolean,
  collection_type character varying,
  source_count bigint,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.description,
    c.is_public,
    c.collection_type,
    (SELECT COUNT(*) FROM public.collection_sources cs WHERE cs.collection_id = c.id)::bigint as source_count,
    c.created_at,
    c.updated_at
  FROM public.collections c
  WHERE c.area_id = p_area_id
    AND c.user_id = p_user_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get areas with collection and source counts
CREATE OR REPLACE FUNCTION public.get_areas_with_collections(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  standard text,
  review_frequency character varying,
  collection_count bigint,
  direct_source_count bigint,
  total_source_count bigint,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.standard,
    a.review_frequency,
    -- Count collections in this area
    (SELECT COUNT(*) FROM public.collections c WHERE c.area_id = a.id)::bigint as collection_count,
    -- Count sources linked directly to the area (via area_sources)
    (SELECT COUNT(*) FROM public.area_sources ars WHERE ars.area_id = a.id)::bigint as direct_source_count,
    -- Count total unique sources (direct + in collections)
    (SELECT COUNT(DISTINCT source_id) FROM (
      SELECT source_id FROM public.area_sources WHERE area_id = a.id
      UNION
      SELECT cs.source_id FROM public.collection_sources cs
      INNER JOIN public.collections c ON cs.collection_id = c.id
      WHERE c.area_id = a.id
    ) combined)::bigint as total_source_count,
    a.created_at,
    a.updated_at
  FROM public.areas a
  WHERE a.user_id = p_user_id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get sources in an area (both direct and via collections)
CREATE OR REPLACE FUNCTION public.get_area_sources(p_area_id uuid, p_user_id uuid)
RETURNS TABLE (
  source_id uuid,
  title text,
  source_type character varying,
  created_at timestamp with time zone,
  is_in_collection boolean,
  collection_ids uuid[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id as source_id,
    s.title,
    s.source_type,
    s.created_at,
    -- Check if source is in any collection within this area
    EXISTS(
      SELECT 1 FROM public.collection_sources cs
      INNER JOIN public.collections c ON cs.collection_id = c.id
      WHERE cs.source_id = s.id AND c.area_id = p_area_id
    ) as is_in_collection,
    -- Array of collection IDs this source belongs to within this area
    ARRAY(
      SELECT c.id FROM public.collection_sources cs
      INNER JOIN public.collections c ON cs.collection_id = c.id
      WHERE cs.source_id = s.id AND c.area_id = p_area_id
    ) as collection_ids
  FROM public.sources s
  WHERE s.user_id = p_user_id
  AND (
    -- Source is directly in the area
    EXISTS(SELECT 1 FROM public.area_sources WHERE area_id = p_area_id AND source_id = s.id)
    OR
    -- Source is in a collection within the area
    EXISTS(
      SELECT 1 FROM public.collection_sources cs
      INNER JOIN public.collections c ON cs.collection_id = c.id
      WHERE cs.source_id = s.id AND c.area_id = p_area_id
    )
  )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Comments
-- ============================================================================

COMMENT ON COLUMN public.collections.area_id IS 'Foreign key to areas table. Collections are optional organizational tools within areas.';
COMMENT ON VIEW public.collections_with_area IS 'View showing collections with their parent area information and source counts';
COMMENT ON FUNCTION public.get_collections_by_area IS 'Get all collections within a specific area for a user';
COMMENT ON FUNCTION public.get_areas_with_collections IS 'Get all areas with their collection counts and source counts (both direct and via collections)';
COMMENT ON FUNCTION public.get_area_sources IS 'Get all sources in an area (both directly linked and via collections)';
