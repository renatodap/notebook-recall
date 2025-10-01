-- Complete Feature Database Schema Migration
-- Adds all missing tables for features 18-32

-- ============================================================================
-- FEATURE 19: PDF Annotations (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  annotation_type varchar(50) DEFAULT 'highlight',
  selected_text text DEFAULT '',
  note text DEFAULT '',
  color varchar(20) DEFAULT '#FFFF00',
  position jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_annotations_source ON public.pdf_annotations(source_id);
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_user ON public.pdf_annotations(user_id);

-- ============================================================================
-- FEATURE 25: Public/Private Source Sharing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.source_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL UNIQUE REFERENCES public.sources(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility varchar(20) DEFAULT 'private', -- 'public', 'private', 'specific'
  shared_with_user_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_shares_owner ON public.source_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_source_shares_visibility ON public.source_shares(visibility);

-- ============================================================================
-- FEATURE 26: Follow Researchers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- ============================================================================
-- FEATURE 28: Social Features (Likes & Comments - Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type varchar(50) NOT NULL, -- 'source', 'output', 'comment'
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_target ON public.likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);

-- Update comments table to support multiple target types
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS target_type varchar(50) DEFAULT 'source',
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS comment_text text;

-- Migrate existing data if comments table exists
UPDATE public.comments
SET target_id = source_id, target_type = 'source'
WHERE target_id IS NULL AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments(target_type, target_id);

-- ============================================================================
-- FEATURE 29: Team Workspaces
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(20) DEFAULT 'member', -- 'admin', 'member', 'viewer'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);

-- ============================================================================
-- FEATURE 24: Research Assistant Chat
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);

-- ============================================================================
-- FEATURE 17: Cross-Source Q&A History
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.qa_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  source_ids uuid[] DEFAULT '{}',
  confidence float DEFAULT 0.5,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_history_user ON public.qa_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_history_created ON public.qa_history(created_at DESC);

-- ============================================================================
-- FEATURE 10: Research Gap Analyzer
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.research_gap_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus text,
  source_ids uuid[] NOT NULL,
  executive_summary text,
  gaps_by_category jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  future_directions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gap_analyses_user ON public.research_gap_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_analyses_created ON public.research_gap_analyses(created_at DESC);

-- ============================================================================
-- FEATURE 22: Academic Writing Assistant
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.writing_assistance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  improved_text text NOT NULL,
  suggestions_count integer DEFAULT 0,
  context text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_history_user ON public.writing_assistance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_history_created ON public.writing_assistance_history(created_at DESC);

-- ============================================================================
-- FEATURE 31: Batch Operations Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.batch_operations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation varchar(100) NOT NULL,
  target_type varchar(50) NOT NULL,
  target_count integer NOT NULL,
  successful_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_log_user ON public.batch_operations_log(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_log_created ON public.batch_operations_log(created_at DESC);

-- ============================================================================
-- FEATURE 16: Publishing - Output Sources Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.output_sources (
  output_id uuid NOT NULL REFERENCES public.published_outputs(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (output_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_output_sources_output ON public.output_sources(output_id);
CREATE INDEX IF NOT EXISTS idx_output_sources_source ON public.output_sources(source_id);

-- ============================================================================
-- ENHANCEMENTS: Update Existing Tables
-- ============================================================================

-- Update methodologies table with fields used by API
ALTER TABLE public.methodologies
  ADD COLUMN IF NOT EXISTS research_design text,
  ADD COLUMN IF NOT EXISTS data_collection_methods text[],
  ADD COLUMN IF NOT EXISTS analysis_techniques text[],
  ADD COLUMN IF NOT EXISTS sample_description text,
  ADD COLUMN IF NOT EXISTS validity_considerations text,
  ADD COLUMN IF NOT EXISTS extracted_text text;

-- Rename type column to output_type for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'published_outputs'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.published_outputs RENAME COLUMN type TO output_type;
  END IF;
END $$;

-- Add permission_level to collection_collaborators
ALTER TABLE public.collection_collaborators
  ADD COLUMN IF NOT EXISTS permission_level varchar(20) DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);

UPDATE public.collection_collaborators SET permission_level = role WHERE permission_level = 'view';

-- Add category and priority to research_questions
ALTER TABLE public.research_questions
  ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority_level varchar(20) DEFAULT 'medium';

-- Update contradictions table with user_id
ALTER TABLE public.contradictions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to source_connections
ALTER TABLE public.source_connections
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add source_type, tags, and metadata to sources if missing
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS source_type varchar(50) DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_assistance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.output_sources ENABLE ROW LEVEL SECURITY;

-- PDF Annotations policies
CREATE POLICY "Users can view their own annotations" ON public.pdf_annotations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own annotations" ON public.pdf_annotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own annotations" ON public.pdf_annotations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own annotations" ON public.pdf_annotations
  FOR DELETE USING (auth.uid() = user_id);

-- Source Shares policies
CREATE POLICY "Users can view their own shares" ON public.source_shares
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create shares for their sources" ON public.source_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own shares" ON public.source_shares
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own shares" ON public.source_shares
  FOR DELETE USING (auth.uid() = owner_id);

-- User Follows policies
CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can create follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they're members of" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Workspace owners can update" ON public.workspaces
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Workspace owners can delete" ON public.workspaces
  FOR DELETE USING (auth.uid() = owner_id);

-- Workspace Members policies
CREATE POLICY "Users can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
  );
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Chat Sessions policies
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- QA History policies
CREATE POLICY "Users can view their own QA history" ON public.qa_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own QA history" ON public.qa_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Research Gap Analyses policies
CREATE POLICY "Users can view their own gap analyses" ON public.research_gap_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own gap analyses" ON public.research_gap_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Writing Assistance History policies
CREATE POLICY "Users can view their own writing history" ON public.writing_assistance_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own writing history" ON public.writing_assistance_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Batch Operations Log policies
CREATE POLICY "Users can view their own batch operations" ON public.batch_operations_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own batch operations" ON public.batch_operations_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Output Sources policies
CREATE POLICY "Users can view output sources for their outputs" ON public.output_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.published_outputs WHERE id = output_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can manage output sources" ON public.output_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.published_outputs WHERE id = output_id AND user_id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_pdf_annotations_updated_at ON public.pdf_annotations;
CREATE TRIGGER update_pdf_annotations_updated_at
  BEFORE UPDATE ON public.pdf_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_source_shares_updated_at ON public.source_shares;
CREATE TRIGGER update_source_shares_updated_at
  BEFORE UPDATE ON public.source_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sources_user_created ON public.sources(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_tags ON public.sources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_published_outputs_user_type ON public.published_outputs(user_id, output_type);
CREATE INDEX IF NOT EXISTS idx_published_outputs_status ON public.published_outputs(status);
CREATE INDEX IF NOT EXISTS idx_synthesis_reports_user_created ON public.synthesis_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_user_public ON public.collections(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_concepts_name ON public.concepts(normalized_name);
CREATE INDEX IF NOT EXISTS idx_source_connections_sources ON public.source_connections(source_a_id, source_b_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_sources ON public.contradictions(source_a_id, source_b_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.pdf_annotations IS 'Feature 19: PDF annotations with highlights and notes';
COMMENT ON TABLE public.source_shares IS 'Feature 25: Public/private source sharing';
COMMENT ON TABLE public.user_follows IS 'Feature 26: Follow researchers';
COMMENT ON TABLE public.likes IS 'Feature 28: Social likes system';
COMMENT ON TABLE public.workspaces IS 'Feature 29: Team workspaces';
COMMENT ON TABLE public.workspace_members IS 'Feature 29: Workspace membership';
COMMENT ON TABLE public.chat_sessions IS 'Feature 24: Research assistant chat';
COMMENT ON TABLE public.qa_history IS 'Feature 17: Cross-source Q&A history';
COMMENT ON TABLE public.research_gap_analyses IS 'Feature 10: Research gap analysis';
COMMENT ON TABLE public.writing_assistance_history IS 'Feature 22: Writing assistance history';
COMMENT ON TABLE public.batch_operations_log IS 'Feature 31: Batch operations logging';
COMMENT ON TABLE public.output_sources IS 'Feature 16: Published outputs to sources junction';
