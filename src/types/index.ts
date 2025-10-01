// Database types
export type ContentType = 'text' | 'url' | 'pdf' | 'note';

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

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResult {
  source: Source;
  summary: Summary;
  relevance_score: number;
  matched_content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
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
export interface SourceFilters {
  contentType?: ContentType[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
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

// Embedding types
export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingResponse {
  embedding: number[];
}
