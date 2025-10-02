-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  page_number integer,
  quote text NOT NULL,
  comment text,
  color character varying DEFAULT '#FFEB3B'::character varying,
  position jsonb,
  annotation_type character varying DEFAULT 'highlight'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT annotations_pkey PRIMARY KEY (id),
  CONSTRAINT annotations_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.batch_operations_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation character varying NOT NULL,
  target_type character varying NOT NULL,
  target_count integer NOT NULL,
  successful_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT batch_operations_log_pkey PRIMARY KEY (id),
  CONSTRAINT batch_operations_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.citations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  doi text,
  isbn text,
  pmid text,
  arxiv_id text,
  url text,
  citation_metadata jsonb NOT NULL,
  bibtex text,
  ris text,
  apa text,
  mla text,
  chicago text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT citations_pkey PRIMARY KEY (id),
  CONSTRAINT citations_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.collection_collaborators (
  collection_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying DEFAULT 'viewer'::character varying,
  added_at timestamp with time zone DEFAULT now(),
  permission_level character varying DEFAULT 'view'::character varying,
  invited_by uuid,
  CONSTRAINT collection_collaborators_pkey PRIMARY KEY (collection_id, user_id),
  CONSTRAINT collection_collaborators_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id),
  CONSTRAINT collection_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT collection_collaborators_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.collection_sources (
  collection_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_by uuid,
  note text,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collection_sources_pkey PRIMARY KEY (collection_id, source_id),
  CONSTRAINT collection_sources_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id),
  CONSTRAINT collection_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT collection_sources_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  collection_type character varying DEFAULT 'project'::character varying,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collections_pkey PRIMARY KEY (id),
  CONSTRAINT collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  target_type character varying DEFAULT 'source'::character varying,
  target_id uuid,
  comment_text text,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.concepts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  normalized_name text NOT NULL,
  definition text,
  embedding USER-DEFINED,
  frequency integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT concepts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.content_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding USER-DEFINED,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT content_chunks_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.contradictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_a_id uuid NOT NULL,
  source_b_id uuid NOT NULL,
  topic text NOT NULL,
  claim_a text NOT NULL,
  claim_b text NOT NULL,
  severity character varying DEFAULT 'moderate'::character varying,
  resolution_status character varying DEFAULT 'unresolved'::character varying,
  notes text,
  detected_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT contradictions_pkey PRIMARY KEY (id),
  CONSTRAINT contradictions_source_a_id_fkey FOREIGN KEY (source_a_id) REFERENCES public.sources(id),
  CONSTRAINT contradictions_source_b_id_fkey FOREIGN KEY (source_b_id) REFERENCES public.sources(id),
  CONSTRAINT contradictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.digest_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  digest_type text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  content text NOT NULL,
  source_count integer DEFAULT 0,
  sent_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT digest_emails_pkey PRIMARY KEY (id),
  CONSTRAINT digest_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.email_captures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_from text NOT NULL,
  email_subject text,
  email_body text NOT NULL,
  source_id uuid,
  processed boolean DEFAULT false,
  captured_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT email_captures_pkey PRIMARY KEY (id),
  CONSTRAINT email_captures_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT email_captures_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (following_id, follower_id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type character varying NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.methodologies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  method_type character varying,
  sample_size integer,
  population text,
  variables jsonb,
  measures jsonb,
  analysis_methods ARRAY,
  limitations text,
  extracted_at timestamp with time zone DEFAULT now(),
  research_design text,
  data_collection_methods ARRAY,
  analysis_techniques ARRAY,
  sample_description text,
  validity_considerations text,
  extracted_text text,
  CONSTRAINT methodologies_pkey PRIMARY KEY (id),
  CONSTRAINT methodologies_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.output_sources (
  output_id uuid NOT NULL,
  source_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT output_sources_pkey PRIMARY KEY (output_id, source_id),
  CONSTRAINT output_sources_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.published_outputs(id),
  CONSTRAINT output_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.pdf_annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  page_number integer NOT NULL,
  annotation_type character varying DEFAULT 'highlight'::character varying,
  selected_text text DEFAULT ''::text,
  note text DEFAULT ''::text,
  color character varying DEFAULT '#FFFF00'::character varying,
  position jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pdf_annotations_pkey PRIMARY KEY (id),
  CONSTRAINT pdf_annotations_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT pdf_annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.published_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  output_type character varying NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  format character varying DEFAULT 'markdown'::character varying,
  source_ids ARRAY,
  metadata jsonb,
  status character varying DEFAULT 'draft'::character varying,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT published_outputs_pkey PRIMARY KEY (id),
  CONSTRAINT published_outputs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.publishing_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  template_type character varying NOT NULL,
  template_content text NOT NULL,
  is_public boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT publishing_templates_pkey PRIMARY KEY (id),
  CONSTRAINT publishing_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.qa_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  source_ids ARRAY DEFAULT '{}'::uuid[],
  confidence double precision DEFAULT 0.5,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT qa_history_pkey PRIMARY KEY (id),
  CONSTRAINT qa_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.question_sources (
  question_id uuid NOT NULL,
  source_id uuid NOT NULL,
  relevance_note text,
  answers_question boolean DEFAULT false,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_sources_pkey PRIMARY KEY (question_id, source_id),
  CONSTRAINT question_sources_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.research_questions(id),
  CONSTRAINT question_sources_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.research_gap_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  focus text,
  source_ids ARRAY NOT NULL,
  executive_summary text,
  gaps_by_category jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  future_directions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT research_gap_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT research_gap_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.research_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  description text,
  status character varying DEFAULT 'open'::character varying,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category character varying DEFAULT 'general'::character varying,
  priority_level character varying DEFAULT 'medium'::character varying,
  CONSTRAINT research_questions_pkey PRIMARY KEY (id),
  CONSTRAINT research_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.source_concepts (
  source_id uuid NOT NULL,
  concept_id uuid NOT NULL,
  relevance double precision DEFAULT 0.5,
  mentions integer DEFAULT 1,
  context text,
  CONSTRAINT source_concepts_pkey PRIMARY KEY (source_id, concept_id),
  CONSTRAINT source_concepts_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT source_concepts_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.concepts(id)
);
CREATE TABLE public.source_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_a_id uuid NOT NULL,
  source_b_id uuid NOT NULL,
  connection_type character varying NOT NULL,
  strength double precision DEFAULT 0.5,
  evidence text,
  auto_generated boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT source_connections_pkey PRIMARY KEY (id),
  CONSTRAINT source_connections_source_a_id_fkey FOREIGN KEY (source_a_id) REFERENCES public.sources(id),
  CONSTRAINT source_connections_source_b_id_fkey FOREIGN KEY (source_b_id) REFERENCES public.sources(id),
  CONSTRAINT source_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.source_likes (
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT source_likes_pkey PRIMARY KEY (user_id, source_id),
  CONSTRAINT source_likes_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT source_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.source_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  visibility character varying DEFAULT 'private'::character varying,
  shared_with_user_ids ARRAY DEFAULT '{}'::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT source_shares_pkey PRIMARY KEY (id),
  CONSTRAINT source_shares_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id),
  CONSTRAINT source_shares_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content_type USER-DEFINED NOT NULL,
  original_content text NOT NULL,
  url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_type character varying DEFAULT 'article'::character varying,
  tags ARRAY DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  audio_url text,
  audio_duration integer,
  transcript text,
  youtube_id text,
  youtube_title text,
  youtube_channel text,
  CONSTRAINT sources_pkey PRIMARY KEY (id),
  CONSTRAINT sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  summary_text text NOT NULL,
  key_actions ARRAY DEFAULT '{}'::text[],
  key_topics ARRAY DEFAULT '{}'::text[],
  word_count integer NOT NULL,
  embedding USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT summaries_pkey PRIMARY KEY (id),
  CONSTRAINT summaries_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.synthesis_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  report_type character varying,
  content text NOT NULL,
  source_ids ARRAY NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT synthesis_reports_pkey PRIMARY KEY (id),
  CONSTRAINT synthesis_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  tag_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_preferences (
  user_id uuid NOT NULL,
  digest_frequency text DEFAULT 'weekly'::text,
  digest_day integer DEFAULT 1,
  digest_time time without time zone DEFAULT '09:00:00'::time without time zone,
  digest_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  capture_email text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL,
  display_name text,
  username text UNIQUE,
  bio text,
  avatar_url text,
  is_public boolean DEFAULT false,
  research_interests ARRAY,
  affiliation text,
  website_url text,
  twitter_handle text,
  google_scholar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.workspace_members (
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying DEFAULT 'member'::character varying,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workspace_members_pkey PRIMARY KEY (workspace_id, user_id),
  CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id),
  CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workspaces_pkey PRIMARY KEY (id),
  CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.writing_assistance_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  original_text text NOT NULL,
  improved_text text NOT NULL,
  suggestions_count integer DEFAULT 0,
  context text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT writing_assistance_history_pkey PRIMARY KEY (id),
  CONSTRAINT writing_assistance_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);