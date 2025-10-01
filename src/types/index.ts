// Database types
export type ContentType = 'text' | 'url' | 'pdf' | 'note' | 'image';

export interface Source {
  id: string;
  user_id: string;
  title: string;
  content_type: ContentType;
  original_content: string;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  source_id: string;
  summary_text: string;
  key_actions: string[];
  key_topics: string[];
  word_count: number;
  embedding: number[] | null;
  created_at: string;
}

export interface Tag {
  id: string;
  source_id: string;
  tag_name: string;
  created_at: string;
}

// API request/response types
export interface SummarizeRequest {
  content: string;
  contentType: ContentType;
  title?: string;
  url?: string;
}

export interface SummarizeResponse {
  summary: string;
  actions: string[];
  topics: string[];
}

export interface CreateSourceRequest {
  title: string;
  content_type: ContentType;
  original_content: string;
  url?: string;
  summary_text: string;
  key_actions: string[];
  key_topics: string[];
  word_count: number;
}

export interface CreateSourceResponse {
  source: Source;
  summary: Summary;
  tags: Tag[];
}

export type SearchMode = 'semantic' | 'keyword' | 'hybrid';
export type MatchType = 'semantic' | 'keyword' | 'hybrid';

export interface SearchRequest {
  query: string;
  mode?: SearchMode;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  source: Source;
  summary: Summary;
  relevance_score: number;
  match_type: MatchType;
  matched_content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  search_mode: SearchMode;
}

// UI component types
export interface SourceCardProps {
  source: Source;
  summary: Summary;
  tags: Tag[];
  onClick: () => void;
}

export interface SourceWithSummary extends Source {
  summary: Summary;
  tags: Tag[];
}

// Form types
export interface ContentIngestionForm {
  contentType: ContentType;
  content: string;
  url: string;
  file: File | null;
  title: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Filter types
export type TagLogic = 'OR' | 'AND';

export interface SourceFilters {
  contentType?: ContentType[];
  tags?: string[];
  tagLogic?: TagLogic;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface TagWithCount {
  tag_name: string;
  count: number;
  sources?: string[];
}

export interface GetTagsResponse {
  tags: TagWithCount[];
  total: number;
}

// Sort types
export type SortOption = 'newest' | 'oldest' | 'relevance';

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: ApiError | null;
}

// Embedding types (see src/lib/embeddings/types.ts for detailed types)
export type Embedding = number[];

export interface EmbeddingGenerateRequest {
  text: string;
  type: 'summary' | 'query';
}

export interface EmbeddingGenerateResponse {
  embedding: Embedding;
  model: string;
  tokens: number;
}

export interface BackfillRequest {
  batch_size?: number;
  dry_run?: boolean;
}

export interface BackfillResponse {
  processed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
}

// ============================================================================
// PILLAR 1: ACADEMIC FEATURES - Types
// ============================================================================

export type CitationFormat = 'bibtex' | 'ris' | 'apa' | 'mla' | 'chicago';

export interface CitationMetadata {
  authors: string[];
  year: number;
  title: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  abstract?: string;
}

export interface Citation {
  id: string;
  source_id: string;
  doi: string | null;
  isbn: string | null;
  pmid: string | null;
  arxiv_id: string | null;
  url: string | null;
  citation_metadata: CitationMetadata;
  bibtex: string | null;
  ris: string | null;
  apa: string | null;
  mla: string | null;
  chicago: string | null;
  created_at: string;
  updated_at: string;
}

export type AnnotationType = 'highlight' | 'note' | 'underline';

export interface AnnotationPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface Annotation {
  id: string;
  source_id: string;
  user_id: string;
  page_number: number | null;
  quote: string;
  comment: string | null;
  color: string;
  position: AnnotationPosition | null;
  annotation_type: AnnotationType;
  created_at: string;
  updated_at: string;
}

export type ResearchQuestionStatus = 'open' | 'partial' | 'answered';

export interface ResearchQuestion {
  id: string;
  user_id: string;
  question: string;
  description: string | null;
  status: ResearchQuestionStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionSource {
  question_id: string;
  source_id: string;
  relevance_note: string | null;
  answers_question: boolean;
  added_at: string;
}

export interface Methodology {
  id: string;
  source_id: string;
  method_type: string | null;
  sample_size: number | null;
  population: string | null;
  variables: {
    independent: string[];
    dependent: string[];
    control: string[];
  } | null;
  measures: {
    instrument: string;
    reliability: string;
    validity: string;
  } | null;
  analysis_methods: string[];
  limitations: string | null;
  extracted_at: string;
}

// ============================================================================
// PILLAR 2: AI-FIRST FEATURES - Types
// ============================================================================

export type ConnectionType = 'cites' | 'similar' | 'contradicts' | 'extends' | 'refutes';

export interface SourceConnection {
  id: string;
  source_a_id: string;
  source_b_id: string;
  connection_type: ConnectionType;
  strength: number;
  evidence: string | null;
  auto_generated: boolean;
  created_at: string;
}

export interface Concept {
  id: string;
  name: string;
  normalized_name: string;
  definition: string | null;
  embedding: number[] | null;
  frequency: number;
  created_at: string;
}

export interface SourceConcept {
  source_id: string;
  concept_id: string;
  relevance: number;
  mentions: number;
  context: string | null;
}

export type SynthesisReportType =
  | 'literature_review'
  | 'thematic_synthesis'
  | 'gap_analysis'
  | 'comparison'
  | 'timeline_analysis'
  | 'comparative'
  | 'thematic'
  | 'chronological';

export interface SynthesisReport {
  id: string;
  user_id: string;
  title: string;
  report_type: SynthesisReportType;
  content: string;
  source_ids: string[];
  metadata: {
    themes?: string[];
    gaps?: string[];
    contradictions?: string[];
    word_count?: number;
    key_findings?: string[];
  };
  created_at: string;
}

export type ContradictionSeverity = 'minor' | 'moderate' | 'major';
export type ResolutionStatus = 'unresolved' | 'noted' | 'resolved';

export interface Contradiction {
  id: string;
  source_a_id: string;
  source_b_id: string;
  topic: string;
  claim_a: string;
  claim_b: string;
  severity: ContradictionSeverity;
  resolution_status: ResolutionStatus;
  notes: string | null;
  detected_at: string;
}

// ============================================================================
// PILLAR 3: COLLABORATIVE FEATURES - Types
// ============================================================================

export type CollectionType = 'project' | 'reading_list' | 'literature_review' | 'course';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  collection_type: CollectionType;
  metadata: {
    color?: string;
    icon?: string;
    tags?: string[];
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionSource {
  collection_id: string;
  source_id: string;
  added_by: string | null;
  note: string | null;
  added_at: string;
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface CollectionCollaborator {
  collection_id: string;
  user_id: string;
  role: CollaboratorRole;
  added_at: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  research_interests: string[];
  affiliation: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  google_scholar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  source_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceLike {
  source_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================================
// PILLAR 4: PUBLISHING FEATURES - Types
// ============================================================================

export type PublishedOutputType =
  | 'blog_post'
  | 'newsletter'
  | 'paper'
  | 'book_outline'
  | 'presentation';

export type OutputFormat = 'markdown' | 'html' | 'latex' | 'docx';
export type OutputStatus = 'draft' | 'published' | 'archived';

export interface PublishedOutput {
  id: string;
  user_id: string;
  type: PublishedOutputType;
  title: string;
  content: string;
  format: OutputFormat;
  source_ids: string[];
  metadata: {
    word_count?: number;
    tone?: string;
    target_audience?: string;
    seo?: {
      keywords?: string[];
      meta_description?: string;
    };
  } | null;
  status: OutputStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishingTemplate {
  id: string;
  user_id: string | null;
  name: string;
  template_type: string;
  template_content: string;
  is_public: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES FOR NEW FEATURES
// ============================================================================

// Citations
export interface FetchCitationRequest {
  doi?: string;
  url?: string;
  source_id?: string;
}

export interface ExportCitationRequest {
  source_ids: string[];
  format: CitationFormat;
}

// Annotations
export interface CreateAnnotationRequest {
  source_id: string;
  page_number?: number;
  quote: string;
  comment?: string;
  color?: string;
  position?: AnnotationPosition;
  annotation_type?: AnnotationType;
}

// Connections
export interface DiscoverConnectionsRequest {
  source_id: string;
  limit?: number;
  connection_types?: ConnectionType[];
}

export interface ConnectionsResponse {
  connections: SourceConnection[];
  total: number;
}

// Concepts
export interface ExtractConceptsRequest {
  source_id: string;
  min_relevance?: number;
}

export interface ConceptsResponse {
  concepts: (Concept & { relevance: number })[];
  total: number;
}

// Synthesis
export interface GenerateSynthesisRequest {
  source_ids: string[];
  report_type?: SynthesisReportType;
  title?: string;
  focus?: string;
  options?: {
    max_length?: number;
    include_citations?: boolean;
    tone?: string;
  };
}

export interface SynthesisResponse {
  report: SynthesisReport;
}

// Collections
export interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  collection_type?: CollectionType;
  source_ids?: string[];
}

export interface AddToCollectionRequest {
  collection_id: string;
  source_id: string;
  note?: string;
}

// Publishing
export interface GenerateBlogPostRequest {
  source_ids: string[];
  title?: string;
  tone?: 'academic' | 'casual' | 'technical' | 'beginner-friendly';
  length?: 'short' | 'medium' | 'long';
  include_citations?: boolean;
}

export interface GenerateNewsletterRequest {
  source_ids: string[];
  title: string;
  intro?: string;
  sections?: {
    name: string;
    source_ids: string[];
  }[];
}

export interface PublishingResponse {
  output: PublishedOutput;
}

// Graph
export interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'concept' | 'user';
  data: Source | Concept | UserProfile;
  size?: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: ConnectionType | 'has_concept' | 'follows';
  strength?: number;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    total_sources: number;
    total_concepts: number;
    total_connections: number;
  };
}

// Timeline
export interface TimelineEvent {
  date: string;
  sources: Source[];
  concepts: string[];
  summary: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  range: {
    start: string;
    end: string;
  };
}

// Recommendations
export interface RecommendationRequest {
  user_id?: string;
  source_id?: string;
  limit?: number;
  diversify?: boolean;
}

export interface Recommendation {
  source: Source & { summary: Summary };
  score: number;
  reason: string;
  type: 'similar' | 'complementary' | 'trending' | 'classic';
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
}
