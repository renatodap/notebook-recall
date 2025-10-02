-- Add icons to PARA tables and create relationship junction tables
-- Migration Date: 2025-02-02
-- Description: Adds icon columns to projects, areas, and resources; creates many-to-many relationship tables

-- ============================================
-- PART 1: Add icon columns to PARA tables
-- ============================================

-- Add icon field to projects (default: 🎯)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS icon text DEFAULT '🎯';

-- Add icon field to areas (default: 🌳)
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS icon text DEFAULT '🌳';

-- Add icon field to resources (default: 💎)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS icon text DEFAULT '💎';


-- ============================================
-- PART 2: Create PARA relationship tables
-- ============================================

-- Projects <-> Areas (many-to-many)
CREATE TABLE IF NOT EXISTS public.project_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_areas_unique UNIQUE (project_id, area_id)
);

-- Projects <-> Resources (many-to-many)
CREATE TABLE IF NOT EXISTS public.project_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_resources_unique UNIQUE (project_id, resource_id)
);

-- Areas <-> Resources (many-to-many)
CREATE TABLE IF NOT EXISTS public.area_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT area_resources_unique UNIQUE (area_id, resource_id)
);


-- ============================================
-- PART 3: Add RLS policies
-- ============================================

-- Enable RLS on project_areas
ALTER TABLE public.project_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project_areas"
  ON public.project_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project_areas"
  ON public.project_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project_areas"
  ON public.project_areas FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on project_resources
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project_resources"
  ON public.project_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project_resources"
  ON public.project_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project_resources"
  ON public.project_resources FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on area_resources
ALTER TABLE public.area_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own area_resources"
  ON public.area_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own area_resources"
  ON public.area_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own area_resources"
  ON public.area_resources FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- PART 4: Create indexes for performance
-- ============================================

-- Indexes for project_areas
CREATE INDEX IF NOT EXISTS idx_project_areas_project_id ON public.project_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_areas_area_id ON public.project_areas(area_id);
CREATE INDEX IF NOT EXISTS idx_project_areas_user_id ON public.project_areas(user_id);

-- Indexes for project_resources
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_user_id ON public.project_resources(user_id);

-- Indexes for area_resources
CREATE INDEX IF NOT EXISTS idx_area_resources_area_id ON public.area_resources(area_id);
CREATE INDEX IF NOT EXISTS idx_area_resources_resource_id ON public.area_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_area_resources_user_id ON public.area_resources(user_id);
