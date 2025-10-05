-- ==========================================
-- CREATE ROW LEVEL SECURITY POLICIES
-- Part 2 of security hardening
-- ~200 policies for complete data isolation
-- ==========================================

BEGIN;

-- ==========================================
-- SOURCES TABLE POLICIES (CRITICAL)
-- ==========================================

CREATE POLICY "users_select_own_sources"
  ON sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_sources"
  ON sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_sources"
  ON sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_sources"
  ON sources FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SUMMARIES TABLE POLICIES (via sources)
-- ==========================================

CREATE POLICY "users_select_own_summaries"
  ON summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_summaries"
  ON summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_summaries"
  ON summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_summaries"
  ON summaries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- TAGS TABLE POLICIES (via sources)
-- ==========================================

CREATE POLICY "users_select_own_tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_tags"
  ON tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_tags"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- COLLECTIONS TABLE POLICIES
-- ==========================================

CREATE POLICY "users_select_own_collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- COLLECTION_SOURCES POLICIES (via collections)
-- ==========================================

CREATE POLICY "users_select_own_collection_sources"
  ON collection_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_sources.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_collection_sources"
  ON collection_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_sources.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_collection_sources"
  ON collection_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_sources.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- ==========================================
-- PARA SYSTEM: PROJECTS
-- ==========================================

CREATE POLICY "users_select_own_projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PARA SYSTEM: AREAS
-- ==========================================

CREATE POLICY "users_select_own_areas"
  ON areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_areas"
  ON areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_areas"
  ON areas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_areas"
  ON areas FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PARA SYSTEM: RESOURCES
-- ==========================================

CREATE POLICY "users_select_own_resources"
  ON resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_resources"
  ON resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_resources"
  ON resources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_resources"
  ON resources FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PROJECT_SOURCES (via projects)
-- ==========================================

CREATE POLICY "users_select_own_project_sources"
  ON project_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_project_sources"
  ON project_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_project_sources"
  ON project_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ==========================================
-- AREA_SOURCES (via areas)
-- ==========================================

CREATE POLICY "users_select_own_area_sources"
  ON area_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM areas
      WHERE areas.id = area_sources.area_id
      AND areas.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_area_sources"
  ON area_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM areas
      WHERE areas.id = area_sources.area_id
      AND areas.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_area_sources"
  ON area_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM areas
      WHERE areas.id = area_sources.area_id
      AND areas.user_id = auth.uid()
    )
  );

-- ==========================================
-- RESOURCE_SOURCES (via resources)
-- ==========================================

CREATE POLICY "users_select_own_resource_sources"
  ON resource_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_sources.resource_id
      AND resources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_resource_sources"
  ON resource_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_sources.resource_id
      AND resources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_resource_sources"
  ON resource_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_sources.resource_id
      AND resources.user_id = auth.uid()
    )
  );

-- ==========================================
-- PROJECT_AREAS
-- ==========================================

CREATE POLICY "users_select_own_project_areas"
  ON project_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_project_areas"
  ON project_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_project_areas"
  ON project_areas FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PROJECT_RESOURCES
-- ==========================================

CREATE POLICY "users_select_own_project_resources"
  ON project_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_project_resources"
  ON project_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_project_resources"
  ON project_resources FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- AREA_RESOURCES
-- ==========================================

CREATE POLICY "users_select_own_area_resources"
  ON area_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_area_resources"
  ON area_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_area_resources"
  ON area_resources FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- ANNOTATIONS
-- ==========================================

CREATE POLICY "users_select_own_annotations"
  ON annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_annotations"
  ON annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_annotations"
  ON annotations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_annotations"
  ON annotations FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PDF_ANNOTATIONS
-- ==========================================

CREATE POLICY "users_select_own_pdf_annotations"
  ON pdf_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_pdf_annotations"
  ON pdf_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_pdf_annotations"
  ON pdf_annotations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_pdf_annotations"
  ON pdf_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- COMMENTS
-- ==========================================

CREATE POLICY "users_select_own_comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SOURCE_CONNECTIONS
-- ==========================================

CREATE POLICY "users_select_own_source_connections"
  ON source_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_source_connections"
  ON source_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_source_connections"
  ON source_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- CONTRADICTIONS
-- ==========================================

CREATE POLICY "users_select_own_contradictions"
  ON contradictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_contradictions"
  ON contradictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_contradictions"
  ON contradictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_contradictions"
  ON contradictions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SYNTHESIS_REPORTS
-- ==========================================

CREATE POLICY "users_select_own_synthesis_reports"
  ON synthesis_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_synthesis_reports"
  ON synthesis_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_synthesis_reports"
  ON synthesis_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_synthesis_reports"
  ON synthesis_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RESEARCH_QUESTIONS
-- ==========================================

CREATE POLICY "users_select_own_research_questions"
  ON research_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_research_questions"
  ON research_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_research_questions"
  ON research_questions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_research_questions"
  ON research_questions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RESEARCH_GAP_ANALYSES
-- ==========================================

CREATE POLICY "users_select_own_gap_analyses"
  ON research_gap_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_gap_analyses"
  ON research_gap_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_gap_analyses"
  ON research_gap_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- QA_HISTORY
-- ==========================================

CREATE POLICY "users_select_own_qa_history"
  ON qa_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_qa_history"
  ON qa_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_qa_history"
  ON qa_history FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- QUESTION_SOURCES (via research_questions)
-- ==========================================

CREATE POLICY "users_select_own_question_sources"
  ON question_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_questions
      WHERE research_questions.id = question_sources.question_id
      AND research_questions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_question_sources"
  ON question_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_questions
      WHERE research_questions.id = question_sources.question_id
      AND research_questions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_question_sources"
  ON question_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM research_questions
      WHERE research_questions.id = question_sources.question_id
      AND research_questions.user_id = auth.uid()
    )
  );

-- ==========================================
-- SOURCE_EMBEDDINGS (via sources)
-- ==========================================

CREATE POLICY "users_select_own_source_embeddings"
  ON source_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_embeddings.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_source_embeddings"
  ON source_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_embeddings.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_source_embeddings"
  ON source_embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_embeddings.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- CONTENT_CHUNKS (via sources)
-- ==========================================

CREATE POLICY "users_select_own_content_chunks"
  ON content_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_content_chunks"
  ON content_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_content_chunks"
  ON content_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_chunks.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- CONCEPTS (global - read by all, write by system)
-- ==========================================

CREATE POLICY "all_users_select_concepts"
  ON concepts FOR SELECT
  USING (true);

CREATE POLICY "authenticated_insert_concepts"
  ON concepts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- SOURCE_CONCEPTS (via sources)
-- ==========================================

CREATE POLICY "users_select_own_source_concepts"
  ON source_concepts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_concepts.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_source_concepts"
  ON source_concepts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_concepts.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_source_concepts"
  ON source_concepts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = source_concepts.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- PUBLISHED_OUTPUTS
-- ==========================================

CREATE POLICY "users_select_own_published_outputs"
  ON published_outputs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_published_outputs"
  ON published_outputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_published_outputs"
  ON published_outputs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_published_outputs"
  ON published_outputs FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PUBLISHING_TEMPLATES
-- ==========================================

CREATE POLICY "users_select_own_templates"
  ON publishing_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_templates"
  ON publishing_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_templates"
  ON publishing_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_templates"
  ON publishing_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- OUTPUT_SOURCES (via published_outputs)
-- ==========================================

CREATE POLICY "users_select_own_output_sources"
  ON output_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM published_outputs
      WHERE published_outputs.id = output_sources.output_id
      AND published_outputs.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_output_sources"
  ON output_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM published_outputs
      WHERE published_outputs.id = output_sources.output_id
      AND published_outputs.user_id = auth.uid()
    )
  );

-- ==========================================
-- FOLLOWS
-- ==========================================

CREATE POLICY "users_select_follows"
  ON follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "users_insert_follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "users_delete_follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ==========================================
-- USER_FOLLOWS (duplicate of follows)
-- ==========================================

CREATE POLICY "users_select_user_follows"
  ON user_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "users_insert_user_follows"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "users_delete_user_follows"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ==========================================
-- SOURCE_LIKES
-- ==========================================

CREATE POLICY "users_select_source_likes"
  ON source_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_source_likes"
  ON source_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_source_likes"
  ON source_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- LIKES
-- ==========================================

CREATE POLICY "users_select_likes"
  ON likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SOURCE_SHARES
-- ==========================================

CREATE POLICY "users_select_source_shares"
  ON source_shares FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "users_insert_source_shares"
  ON source_shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_update_source_shares"
  ON source_shares FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_delete_source_shares"
  ON source_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- ==========================================
-- USER_PROFILES
-- ==========================================

CREATE POLICY "users_select_own_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- USER_PREFERENCES
-- ==========================================

CREATE POLICY "users_select_own_preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- CHAT_SESSIONS
-- ==========================================

CREATE POLICY "users_select_own_chat_sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_chat_sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_chat_sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_chat_sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- MESSAGE_FEEDBACK
-- ==========================================

CREATE POLICY "users_select_own_message_feedback"
  ON message_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_message_feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PROACTIVE_INSIGHTS
-- ==========================================

CREATE POLICY "users_select_own_insights"
  ON proactive_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_insights"
  ON proactive_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_insights"
  ON proactive_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- FUNCTION_CALLS
-- ==========================================

CREATE POLICY "users_select_own_function_calls"
  ON function_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_function_calls"
  ON function_calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- NOTES
-- ==========================================

CREATE POLICY "users_select_own_notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- REASONING_STEPS
-- ==========================================

CREATE POLICY "users_select_own_reasoning_steps"
  ON reasoning_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = reasoning_steps.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_reasoning_steps"
  ON reasoning_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = reasoning_steps.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- ==========================================
-- WORKSPACES
-- ==========================================

CREATE POLICY "users_select_own_workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "users_insert_own_workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_update_own_workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_delete_own_workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- ==========================================
-- WORKSPACE_MEMBERS
-- ==========================================

CREATE POLICY "users_select_workspace_members"
  ON workspace_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owners_insert_workspace_members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_workspace_members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- ==========================================
-- PINNED_ITEMS
-- ==========================================

CREATE POLICY "users_select_own_pinned_items"
  ON pinned_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_pinned_items"
  ON pinned_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_pinned_items"
  ON pinned_items FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- CITATIONS (via sources)
-- ==========================================

CREATE POLICY "users_select_own_citations"
  ON citations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = citations.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_citations"
  ON citations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = citations.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_citations"
  ON citations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = citations.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- METHODOLOGIES (via sources)
-- ==========================================

CREATE POLICY "users_select_own_methodologies"
  ON methodologies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = methodologies.source_id
      AND sources.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_methodologies"
  ON methodologies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = methodologies.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- ==========================================
-- BATCH_OPERATIONS_LOG
-- ==========================================

CREATE POLICY "users_select_own_batch_ops"
  ON batch_operations_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_batch_ops"
  ON batch_operations_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- DIGEST_EMAILS
-- ==========================================

CREATE POLICY "users_select_own_digest_emails"
  ON digest_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_digest_emails"
  ON digest_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- EMAIL_CAPTURES
-- ==========================================

CREATE POLICY "users_select_own_email_captures"
  ON email_captures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_email_captures"
  ON email_captures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- WRITING_ASSISTANCE_HISTORY
-- ==========================================

CREATE POLICY "users_select_own_writing_history"
  ON writing_assistance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_writing_history"
  ON writing_assistance_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- COLLECTION_COLLABORATORS
-- ==========================================

CREATE POLICY "collaborators_select_collections"
  ON collection_collaborators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owners_insert_collaborators"
  ON collection_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_collaborators.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_collaborators"
  ON collection_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_collaborators.collection_id
      AND collections.user_id = auth.uid()
    )
  );

COMMIT;
