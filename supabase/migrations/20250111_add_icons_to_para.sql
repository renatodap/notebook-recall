-- Add icon field to projects, areas, and resources
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS icon text DEFAULT '🎯';
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS icon text DEFAULT '🌳';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS icon text DEFAULT '💎';
