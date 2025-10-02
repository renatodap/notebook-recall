-- PARA System Implementation Migration
-- Projects, Areas, Resources, Archive organizational system for sources

-- ============================================================================
-- 1. Create PARA Category Tables
-- ============================================================================

-- Projects: Short-term efforts with specific goals and deadlines
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  goal text,
  deadline timestamp with time zone,
  status character varying DEFAULT 'active'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Areas: Long-term responsibilities and areas of focus
CREATE TABLE public.areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  standard text, -- The standard of success for this area
  review_frequency character varying DEFAULT 'monthly'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT areas_pkey PRIMARY KEY (id),
  CONSTRAINT areas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Resources: Topics of interest and reference materials
CREATE TABLE public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category character varying, -- e.g., 'reference', 'learning', 'inspiration'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resources_pkey PRIMARY KEY (id),
  CONSTRAINT resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. Add Archive Field to Sources
-- ============================================================================

ALTER TABLE public.sources
ADD COLUMN archived boolean DEFAULT false,
ADD COLUMN archived_at timestamp with time zone;

-- ============================================================================
-- 3. Create Junction Tables (Many-to-Many Relationships)
-- ============================================================================

-- Project-Source Relationships
CREATE TABLE public.project_sources (
  project_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT project_sources_pkey PRIMARY KEY (project_id, source_id),
  CONSTRAINT project_sources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE
);

-- Area-Source Relationships
CREATE TABLE public.area_sources (
  area_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT area_sources_pkey PRIMARY KEY (area_id, source_id),
  CONSTRAINT area_sources_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE,
  CONSTRAINT area_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE
);

-- Resource-Source Relationships
CREATE TABLE public.resource_sources (
  resource_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT resource_sources_pkey PRIMARY KEY (resource_id, source_id),
  CONSTRAINT resource_sources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE,
  CONSTRAINT resource_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. Create Indexes for Performance
-- ============================================================================

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_areas_user_id ON public.areas(user_id);
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_sources_archived ON public.sources(archived);
CREATE INDEX idx_sources_user_archived ON public.sources(user_id, archived);
CREATE INDEX idx_project_sources_source_id ON public.project_sources(source_id);
CREATE INDEX idx_area_sources_source_id ON public.area_sources(source_id);
CREATE INDEX idx_resource_sources_source_id ON public.resource_sources(source_id);

-- ============================================================================
-- 5. Create View for Source PARA Status
-- ============================================================================

-- View to see which PARA categories each source belongs to
CREATE OR REPLACE VIEW public.source_para_status AS
SELECT
  s.id as source_id,
  s.user_id,
  s.title,
  s.archived,
  COALESCE(json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name))
    FILTER (WHERE p.id IS NOT NULL), '[]'::json) as projects,
  COALESCE(json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name))
    FILTER (WHERE a.id IS NOT NULL), '[]'::json) as areas,
  COALESCE(json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name))
    FILTER (WHERE r.id IS NOT NULL), '[]'::json) as resources,
  -- Check if source has at least one PAR assignment
  CASE
    WHEN p.id IS NOT NULL OR a.id IS NOT NULL OR r.id IS NOT NULL THEN true
    ELSE false
  END as has_para_assignment
FROM public.sources s
LEFT JOIN public.project_sources ps ON s.id = ps.source_id
LEFT JOIN public.projects p ON ps.project_id = p.id
LEFT JOIN public.area_sources ars ON s.id = ars.source_id
LEFT JOIN public.areas a ON ars.area_id = a.id
LEFT JOIN public.resource_sources rs ON s.id = rs.source_id
LEFT JOIN public.resources r ON rs.resource_id = r.id
GROUP BY s.id, s.user_id, s.title, s.archived, p.id, a.id, r.id;

-- ============================================================================
-- 6. Create Helper Functions
-- ============================================================================

-- Function to check if a source meets PARA requirements (has assignment OR is archived)
CREATE OR REPLACE FUNCTION public.source_meets_para_requirements(source_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_archived boolean;
  has_project boolean;
  has_area boolean;
  has_resource boolean;
BEGIN
  -- Check if source is archived
  SELECT archived INTO is_archived FROM public.sources WHERE id = source_uuid;

  -- If archived, requirement is met
  IF is_archived THEN
    RETURN true;
  END IF;

  -- Check for at least one PAR assignment
  SELECT EXISTS(SELECT 1 FROM public.project_sources WHERE source_id = source_uuid) INTO has_project;
  SELECT EXISTS(SELECT 1 FROM public.area_sources WHERE source_id = source_uuid) INTO has_area;
  SELECT EXISTS(SELECT 1 FROM public.resource_sources WHERE source_id = source_uuid) INTO has_resource;

  RETURN (has_project OR has_area OR has_resource);
END;
$$ LANGUAGE plpgsql;

-- Function to get unassigned sources for a user
CREATE OR REPLACE FUNCTION public.get_unassigned_sources(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.created_at
  FROM public.sources s
  WHERE s.user_id = p_user_id
    AND s.archived = false
    AND NOT EXISTS (SELECT 1 FROM public.project_sources WHERE source_id = s.id)
    AND NOT EXISTS (SELECT 1 FROM public.area_sources WHERE source_id = s.id)
    AND NOT EXISTS (SELECT 1 FROM public.resource_sources WHERE source_id = s.id);
END;
$$ LANGUAGE plpgsql;

-- Function to get source counts per PARA category
CREATE OR REPLACE FUNCTION public.get_para_stats(p_user_id uuid)
RETURNS TABLE (
  total_sources bigint,
  archived_sources bigint,
  unassigned_sources bigint,
  project_count bigint,
  area_count bigint,
  resource_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.sources WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM public.sources WHERE user_id = p_user_id AND archived = true),
    (SELECT COUNT(*) FROM public.get_unassigned_sources(p_user_id)),
    (SELECT COUNT(*) FROM public.projects WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM public.areas WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM public.resources WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_sources ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Areas policies
CREATE POLICY "Users can view their own areas"
  ON public.areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own areas"
  ON public.areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own areas"
  ON public.areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own areas"
  ON public.areas FOR DELETE
  USING (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Users can view their own resources"
  ON public.resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources"
  ON public.resources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources"
  ON public.resources FOR DELETE
  USING (auth.uid() = user_id);

-- Junction table policies (project_sources)
CREATE POLICY "Users can view their project-source links"
  ON public.project_sources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their project-source links"
  ON public.project_sources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their project-source links"
  ON public.project_sources FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  ));

-- Junction table policies (area_sources)
CREATE POLICY "Users can view their area-source links"
  ON public.area_sources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.areas a
    WHERE a.id = area_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their area-source links"
  ON public.area_sources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.areas a
    WHERE a.id = area_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their area-source links"
  ON public.area_sources FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.areas a
    WHERE a.id = area_id AND a.user_id = auth.uid()
  ));

-- Junction table policies (resource_sources)
CREATE POLICY "Users can view their resource-source links"
  ON public.resource_sources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.resources r
    WHERE r.id = resource_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their resource-source links"
  ON public.resource_sources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.resources r
    WHERE r.id = resource_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their resource-source links"
  ON public.resource_sources FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.resources r
    WHERE r.id = resource_id AND r.user_id = auth.uid()
  ));

-- ============================================================================
-- 8. Triggers for Updated_At Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update archived_at when archiving
CREATE OR REPLACE FUNCTION public.update_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived = true AND OLD.archived = false THEN
    NEW.archived_at = now();
  ELSIF NEW.archived = false AND OLD.archived = true THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sources_archived_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_archived_at();
