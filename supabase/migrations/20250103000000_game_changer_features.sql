-- Migration: Add all game-changer features for academic research platform
-- Adds 32 features across 4 pillars: Academic, AI, Collaboration, Publishing

-- ============================================================================
-- PILLAR 1: ACADEMIC FEATURES
-- ============================================================================

-- Citations: Store citation metadata and formatted citations
CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  doi text,
  isbn text,
  pmid text, -- PubMed ID
  arxiv_id text,
  url text,
  citation_metadata jsonb NOT NULL, -- {authors, year, journal, volume, pages, etc}
  bibtex text,
  ris text,
  apa text,
  mla text,
  chicago text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citations_source_id ON citations(source_id);
CREATE INDEX IF NOT EXISTS idx_citations_doi ON citations(doi) WHERE doi IS NOT NULL;

-- PDF Annotations: Highlights, comments, notes on PDFs
CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number int,
  quote text NOT NULL,
  comment text,
  color varchar(20) DEFAULT '#FFEB3B',
  position jsonb, -- {x, y, width, height, pageIndex}
  annotation_type varchar(20) DEFAULT 'highlight', -- 'highlight', 'note', 'underline'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annotations_source_id ON annotations(source_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);

-- Research Questions: Track research questions and link to sources
CREATE TABLE IF NOT EXISTS research_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  description text,
  status varchar(20) DEFAULT 'open', -- 'open', 'partial', 'answered'
  priority int DEFAULT 0, -- 0-5, higher = more important
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_sources (
  question_id uuid REFERENCES research_questions(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  relevance_note text,
  answers_question boolean DEFAULT false,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (question_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_research_questions_user_id ON research_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_sources_question_id ON question_sources(question_id);
CREATE INDEX IF NOT EXISTS idx_question_sources_source_id ON question_sources(source_id);

-- Methodologies: Extract and track research methodologies
CREATE TABLE IF NOT EXISTS methodologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  method_type varchar(100), -- 'qualitative', 'quantitative', 'mixed-methods', etc
  sample_size int,
  population text,
  variables jsonb, -- {independent: [], dependent: [], control: []}
  measures jsonb, -- {instrument: '', reliability: '', validity: ''}
  analysis_methods text[],
  limitations text,
  extracted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_methodologies_source_id ON methodologies(source_id);
CREATE INDEX IF NOT EXISTS idx_methodologies_method_type ON methodologies(method_type);

-- ============================================================================
-- PILLAR 2: AI-FIRST FEATURES
-- ============================================================================

-- Source Connections: Relationships between sources
CREATE TABLE IF NOT EXISTS source_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_a_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_b_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  connection_type varchar(50) NOT NULL, -- 'cites', 'similar', 'contradicts', 'extends', 'refutes'
  strength float DEFAULT 0.5, -- 0-1 score
  evidence text, -- Why this connection exists
  auto_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_a_id, source_b_id, connection_type)
);

CREATE INDEX IF NOT EXISTS idx_connections_source_a ON source_connections(source_a_id);
CREATE INDEX IF NOT EXISTS idx_connections_source_b ON source_connections(source_b_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON source_connections(connection_type);

-- Concepts: Key concepts extracted from sources
CREATE TABLE IF NOT EXISTS concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  normalized_name text NOT NULL, -- lowercase, trimmed
  definition text,
  embedding vector(1536),
  frequency int DEFAULT 1, -- How many sources mention this
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_concepts (
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts(id) ON DELETE CASCADE,
  relevance float DEFAULT 0.5, -- 0-1 score: how important is this concept to this source
  mentions int DEFAULT 1, -- How many times mentioned in source
  context text, -- Example sentence where concept appears
  PRIMARY KEY (source_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_concepts_normalized_name ON concepts(normalized_name);
CREATE INDEX IF NOT EXISTS idx_concepts_frequency ON concepts(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_source_concepts_source_id ON source_concepts(source_id);
CREATE INDEX IF NOT EXISTS idx_source_concepts_concept_id ON source_concepts(concept_id);

-- Synthesis Reports: AI-generated literature reviews and insights
CREATE TABLE IF NOT EXISTS synthesis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  report_type varchar(50), -- 'literature_review', 'thematic_synthesis', 'gap_analysis', etc
  content text NOT NULL,
  source_ids uuid[] NOT NULL, -- Sources included in synthesis
  metadata jsonb, -- {themes: [], gaps: [], contradictions: [], word_count: 0}
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synthesis_reports_user_id ON synthesis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_synthesis_reports_type ON synthesis_reports(report_type);

-- Contradictions: Conflicting findings across sources
CREATE TABLE IF NOT EXISTS contradictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_a_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_b_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic text NOT NULL,
  claim_a text NOT NULL, -- What source A says
  claim_b text NOT NULL, -- What source B says (contradicts A)
  severity varchar(20) DEFAULT 'moderate', -- 'minor', 'moderate', 'major'
  resolution_status varchar(20) DEFAULT 'unresolved', -- 'unresolved', 'noted', 'resolved'
  notes text,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contradictions_source_a ON contradictions(source_a_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_source_b ON contradictions(source_b_id);

-- ============================================================================
-- PILLAR 3: COLLABORATIVE FEATURES
-- ============================================================================

-- Collections: Group sources together (projects, topics, shared collections)
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  collection_type varchar(50) DEFAULT 'project', -- 'project', 'reading_list', 'literature_review', 'course'
  metadata jsonb, -- {color: '', icon: '', tags: []}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_sources (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (collection_id, source_id)
);

CREATE TABLE IF NOT EXISTS collection_collaborators (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(20) DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collection_sources_collection_id ON collection_sources(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_sources_source_id ON collection_sources(source_id);

-- User Profiles: Public profiles for researchers
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  username text UNIQUE, -- URL-friendly username
  bio text,
  avatar_url text,
  is_public boolean DEFAULT false,
  research_interests text[],
  affiliation text, -- University, organization
  website_url text,
  twitter_handle text,
  google_scholar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_public ON user_profiles(is_public) WHERE is_public = true;

-- Follows: Follow other researchers
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Comments: Comment on sources
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_source_id ON comments(source_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Likes/Bookmarks
CREATE TABLE IF NOT EXISTS source_likes (
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (source_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_source_likes_source_id ON source_likes(source_id);
CREATE INDEX IF NOT EXISTS idx_source_likes_user_id ON source_likes(user_id);

-- ============================================================================
-- PILLAR 4: PUBLISHING FEATURES
-- ============================================================================

-- Published Outputs: Generated blogs, newsletters, papers, books
CREATE TABLE IF NOT EXISTS published_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL, -- 'blog_post', 'newsletter', 'paper', 'book_outline', 'presentation'
  title text NOT NULL,
  content text NOT NULL,
  format varchar(20) DEFAULT 'markdown', -- 'markdown', 'html', 'latex', 'docx'
  source_ids uuid[], -- Sources used to generate this
  metadata jsonb, -- {word_count: 0, tone: '', target_audience: '', seo: {}}
  status varchar(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_published_outputs_user_id ON published_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_published_outputs_type ON published_outputs(type);
CREATE INDEX IF NOT EXISTS idx_published_outputs_status ON published_outputs(status);

-- Publishing Templates: Reusable templates for outputs
CREATE TABLE IF NOT EXISTS publishing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type varchar(50) NOT NULL, -- 'blog', 'newsletter', 'paper', etc
  template_content text NOT NULL, -- Template with placeholders
  is_public boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publishing_templates_user_id ON publishing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_templates_type ON publishing_templates(template_type);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at for new tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_citations_updated_at ON citations;
CREATE TRIGGER update_citations_updated_at
  BEFORE UPDATE ON citations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_annotations_updated_at ON annotations;
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_research_questions_updated_at ON research_questions;
CREATE TRIGGER update_research_questions_updated_at
  BEFORE UPDATE ON research_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_published_outputs_updated_at ON published_outputs;
CREATE TRIGGER update_published_outputs_updated_at
  BEFORE UPDATE ON published_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to find similar sources based on concepts
CREATE OR REPLACE FUNCTION find_similar_sources(
  p_source_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  source_id uuid,
  similarity_score float,
  shared_concepts int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc2.source_id,
    AVG(sc1.relevance * sc2.relevance) as similarity_score,
    COUNT(*)::int as shared_concepts
  FROM source_concepts sc1
  INNER JOIN source_concepts sc2 ON sc1.concept_id = sc2.concept_id
  WHERE sc1.source_id = p_source_id
    AND sc2.source_id != p_source_id
  GROUP BY sc2.source_id
  ORDER BY similarity_score DESC, shared_concepts DESC
  LIMIT p_limit;
END;
$$;

-- Function to get follower/following counts
CREATE OR REPLACE FUNCTION get_follow_counts(p_user_id uuid)
RETURNS TABLE (
  followers_count bigint,
  following_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = p_user_id) as followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p_user_id) as following_count;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Citations: view if you own the source
CREATE POLICY "Users can view citations for their sources" ON citations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sources WHERE sources.id = citations.source_id AND sources.user_id = auth.uid())
  );

CREATE POLICY "Users can manage citations for their sources" ON citations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sources WHERE sources.id = citations.source_id AND sources.user_id = auth.uid())
  );

-- Annotations: only own annotations
CREATE POLICY "Users can view own annotations" ON annotations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own annotations" ON annotations
  FOR ALL USING (user_id = auth.uid());

-- Research Questions: only own questions
CREATE POLICY "Users can view own research questions" ON research_questions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own research questions" ON research_questions
  FOR ALL USING (user_id = auth.uid());

-- Collections: view if public OR owner OR collaborator
CREATE POLICY "Users can view accessible collections" ON collections
  FOR SELECT USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collection_collaborators
      WHERE collection_collaborators.collection_id = collections.id
      AND collection_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (user_id = auth.uid());

-- User Profiles: view if public OR own
CREATE POLICY "Users can view public profiles" ON user_profiles
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Follows: anyone can view, only manage own
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (follower_id = auth.uid());

-- Comments: view public comments, manage own
CREATE POLICY "Users can view comments on accessible sources" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = comments.source_id
      AND (sources.user_id = auth.uid() OR sources.id IN (
        SELECT source_id FROM collection_sources
        WHERE collection_id IN (SELECT id FROM collections WHERE is_public = true)
      ))
    )
  );

CREATE POLICY "Users can manage own comments" ON comments
  FOR ALL USING (user_id = auth.uid());

-- Published Outputs: own outputs
CREATE POLICY "Users can view own published outputs" ON published_outputs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own published outputs" ON published_outputs
  FOR ALL USING (user_id = auth.uid());

-- Concepts & Connections: readable by all authenticated users, writable by system
CREATE POLICY "Authenticated users can view concepts" ON concepts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view source concepts" ON source_concepts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view connections" ON source_connections
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Synthesis Reports: own reports
CREATE POLICY "Users can view own synthesis reports" ON synthesis_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own synthesis reports" ON synthesis_reports
  FOR ALL USING (user_id = auth.uid());
