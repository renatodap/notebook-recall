-- ==========================================
-- CREATE DATABASE INDEXES
-- Part 3 of security hardening
-- ~60 indexes for performance optimization
-- ==========================================

BEGIN;

-- ==========================================
-- CORE TABLE INDEXES (CRITICAL)
-- ==========================================

-- Sources (most critical table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_created_at_desc ON sources(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_content_type ON sources(content_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_user_created ON sources(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_archived ON sources(archived) WHERE archived = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_url ON sources(url) WHERE url IS NOT NULL;

-- Summaries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_source_id ON summaries(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_created_at ON summaries(created_at DESC);

-- Tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_source_id ON tags(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_tag_name ON tags(tag_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name_lower ON tags(LOWER(tag_name));

-- Collections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_area_id ON collections(area_id) WHERE area_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_sources_collection_id ON collection_sources(collection_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_sources_source_id ON collection_sources(source_id);

-- ==========================================
-- VECTOR SEARCH INDEXES (MOST CRITICAL FOR PERFORMANCE)
-- ==========================================

-- HNSW indexes for fast similarity search
-- m = 16: number of connections per layer (balance speed vs accuracy)
-- ef_construction = 64: size of dynamic candidate list (build quality)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_embedding
  ON summaries
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_embeddings_embedding
  ON source_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_chunks_embedding
  ON content_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_chunks_source_id ON content_chunks(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_embeddings_source_id ON source_embeddings(source_id);

-- ==========================================
-- PARA SYSTEM INDEXES
-- ==========================================

-- Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);

-- Areas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_areas_user_id ON areas(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_areas_created_at ON areas(created_at DESC);

-- Resources
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- PARA relationship tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_sources_source_id ON project_sources(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_sources_area_id ON area_sources(area_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_sources_source_id ON area_sources(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_sources_resource_id ON resource_sources(resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_sources_source_id ON resource_sources(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_areas_area_id ON project_areas(area_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_resources_resource_id ON project_resources(resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_resources_area_id ON area_resources(area_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_resources_resource_id ON area_resources(resource_id);

-- ==========================================
-- ANNOTATIONS & COMMENTS INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annotations_source_id ON annotations(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annotations_created_at ON annotations(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pdf_annotations_source_id ON pdf_annotations(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pdf_annotations_user_id ON pdf_annotations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pdf_annotations_page ON pdf_annotations(page_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_source_id ON comments(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ==========================================
-- SOCIAL FEATURES INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_id ON follows(following_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_likes_source_id ON source_likes(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_likes_user_id ON source_likes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_likes_created_at ON source_likes(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id ON likes(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_shares_owner_id ON source_shares(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_shares_source_id ON source_shares(source_id);

-- ==========================================
-- AI FEATURES INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_connections_source_a ON source_connections(source_a_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_connections_source_b ON source_connections(source_b_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_connections_user_id ON source_connections(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_connections_created_at ON source_connections(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contradictions_source_a ON contradictions(source_a_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contradictions_source_b ON contradictions(source_b_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contradictions_user_id ON contradictions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contradictions_severity ON contradictions(severity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_synthesis_reports_user_id ON synthesis_reports(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_synthesis_reports_created_at ON synthesis_reports(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_research_questions_user_id ON research_questions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_research_questions_created_at ON research_questions(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_sources_question_id ON question_sources(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_sources_source_id ON question_sources(source_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gap_analyses_user_id ON research_gap_analyses(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qa_history_user_id ON qa_history(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qa_history_created_at ON qa_history(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concepts_name ON concepts(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_concepts_source_id ON source_concepts(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_concepts_concept_id ON source_concepts(concept_id);

-- ==========================================
-- CHAT & AI ASSISTANT INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reasoning_steps_session ON reasoning_steps(session_id);

-- ==========================================
-- PUBLISHING INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_outputs_user_id ON published_outputs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_outputs_created_at ON published_outputs(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publishing_templates_user_id ON publishing_templates(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_output_sources_output_id ON output_sources(output_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_output_sources_source_id ON output_sources(source_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_methodologies_source_id ON methodologies(source_id);

-- ==========================================
-- USER DATA INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pinned_items_user_id ON pinned_items(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pinned_items_source_id ON pinned_items(source_id);

-- ==========================================
-- CITATIONS INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citations_source_id ON citations(source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citations_doi ON citations(doi) WHERE doi IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citations_isbn ON citations(isbn) WHERE isbn IS NOT NULL;

-- ==========================================
-- WORKSPACES INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- ==========================================
-- OPERATION LOGS & HISTORY INDEXES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_ops_user_id ON batch_operations_log(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_ops_created_at ON batch_operations_log(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_digest_emails_user_id ON digest_emails(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_digest_emails_created_at ON digest_emails(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_captures_user_id ON email_captures(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_writing_history_user_id ON writing_assistance_history(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_collaborators_collection_id ON collection_collaborators(collection_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_collaborators_user_id ON collection_collaborators(user_id);

COMMIT;
