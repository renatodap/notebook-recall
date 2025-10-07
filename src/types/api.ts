/**
 * API Type Definitions
 * Comprehensive type safety for API routes and responses
 */

import { NextResponse } from 'next/server';

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// ============================================================================
// Database Query Result Types
// ============================================================================

export interface DatabaseSource {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_type: 'text' | 'url' | 'pdf' | 'image';
  url?: string;
  tags: string[];
  summary?: string;
  key_actions?: string[];
  topics?: string[];
  created_at: string;
  updated_at: string;
  collection_id?: string;
  is_public?: boolean;
  view_count?: number;
  favorite_count?: number;
}

export interface DatabaseCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  source_count?: number;
}

export interface DatabaseAnnotation {
  id: string;
  source_id: string;
  user_id: string;
  page_number?: number;
  position_x?: number;
  position_y?: number;
  content: string;
  annotation_type: 'highlight' | 'note' | 'comment';
  created_at: string;
  updated_at: string;
}

export interface DatabaseEmbedding {
  id: string;
  source_id: string;
  content: string;
  embedding: number[];
  chunk_index?: number;
  created_at: string;
}

export interface DatabaseWorkspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProfile {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSynthesisReport {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_ids: string[];
  report_type: 'synthesis' | 'literature_review' | 'gap_analysis';
  created_at: string;
  updated_at: string;
}

export interface DatabaseConnection {
  id: string;
  source_id_1: string;
  source_id_2: string;
  user_id: string;
  connection_type: 'similar' | 'contradictory' | 'complementary' | 'related';
  explanation: string;
  strength: number;
  created_at: string;
}

export interface DatabaseContradiction {
  id: string;
  source_id_1: string;
  source_id_2: string;
  user_id: string;
  statement_1: string;
  statement_2: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface DatabaseConcept {
  id: string;
  source_id: string;
  user_id: string;
  name: string;
  definition: string;
  category?: string;
  importance: number;
  created_at: string;
}

export interface DatabaseResearchQuestion {
  id: string;
  user_id: string;
  question: string;
  context?: string;
  source_ids: string[];
  status: 'open' | 'in_progress' | 'answered';
  created_at: string;
  updated_at: string;
}

export interface DatabaseCitation {
  id: string;
  source_id: string;
  user_id: string;
  citation_style: 'apa' | 'mla' | 'chicago' | 'harvard';
  formatted_citation: string;
  metadata: Record<string, string>;
  created_at: string;
}

// ============================================================================
// API Request Body Types
// ============================================================================

export interface CreateSourceRequest {
  content: string;
  source_type: 'text' | 'url' | 'pdf' | 'image';
  title?: string;
  url?: string;
  tags?: string[];
  collection_id?: string;
}

export interface UpdateSourceRequest {
  title?: string;
  content?: string;
  tags?: string[];
  collection_id?: string;
  is_public?: boolean;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  collection_id?: string;
  tags?: string[];
}

export interface ChatRequest {
  message: string;
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  source_ids?: string[];
  collection_id?: string;
}

export interface SynthesisRequest {
  source_ids: string[];
  title?: string;
  report_type?: 'synthesis' | 'literature_review' | 'gap_analysis';
  focus_areas?: string[];
}

export interface AnnotationRequest {
  source_id: string;
  content: string;
  annotation_type: 'highlight' | 'note' | 'comment';
  page_number?: number;
  position_x?: number;
  position_y?: number;
}

export interface BulkOperationRequest {
  source_ids: string[];
  operation: 'delete' | 'tag' | 'move';
  tags?: string[];
  collection_id?: string;
}

export interface ExportRequest {
  source_ids?: string[];
  collection_id?: string;
  format: 'markdown' | 'pdf' | 'json' | 'csv';
  include_annotations?: boolean;
  include_tags?: boolean;
}

// ============================================================================
// AI Response Types
// ============================================================================

export interface SummaryResult {
  summary: string;
  keyActions: string[];
  topics: string[];
}

export interface ConceptExtractionResult {
  concepts: Array<{
    name: string;
    definition: string;
    category?: string;
    importance: number;
  }>;
}

export interface ConnectionResult {
  source_id_1: string;
  source_id_2: string;
  connection_type: 'similar' | 'contradictory' | 'complementary' | 'related';
  explanation: string;
  strength: number;
}

export interface ContradictionResult {
  source_id_1: string;
  source_id_2: string;
  statement_1: string;
  statement_2: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GapAnalysisResult {
  gaps: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;
  coverage_score: number;
}

export interface LiteratureReviewResult {
  title: string;
  abstract: string;
  sections: Array<{
    title: string;
    content: string;
    citations: string[];
  }>;
  references: string[];
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsSummary {
  total_sources: number;
  total_collections: number;
  total_annotations: number;
  sources_by_type: Record<string, number>;
  recent_activity: Array<{
    type: string;
    count: number;
    date: string;
  }>;
  top_tags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  type: 'source_created' | 'annotation_added' | 'collection_created' | 'synthesis_generated';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Graph Types
// ============================================================================

export interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'concept' | 'topic' | 'tag';
  size?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'connection' | 'citation' | 'tag' | 'concept';
  strength?: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats?: {
    nodeCount: number;
    linkCount: number;
    avgDegree: number;
    clusters?: number;
  };
}

// ============================================================================
// Publishing Types
// ============================================================================

export interface BlogPostResult {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
}

export interface NewsletterResult {
  subject: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
    sources: string[];
  }>;
}

export interface PresentationResult {
  title: string;
  slides: Array<{
    title: string;
    content: string[];
    notes?: string;
    layout: 'title' | 'content' | 'two-column' | 'image';
  }>;
}

export interface AcademicPaperResult {
  title: string;
  abstract: string;
  sections: Array<{
    heading: string;
    content: string;
    citations: string[];
  }>;
  references: string[];
  keywords: string[];
}

export interface BookOutlineResult {
  title: string;
  subtitle?: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    sections: Array<{
      title: string;
      topics: string[];
      estimated_pages: number;
    }>;
  }>;
  total_estimated_pages: number;
}

// ============================================================================
// Workspace Types
// ============================================================================

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  profile?: DatabaseProfile;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDatabaseSource(obj: unknown): obj is DatabaseSource {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_id' in obj &&
    'source_type' in obj
  );
}

export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return typeof obj === 'object' && obj !== null && 'error' in obj;
}

// ============================================================================
// Type Helpers
// ============================================================================

export type APIHandler<T = unknown> = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<NextResponse<APIResponse<T>>>;

export type StreamHandler = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<Response>;
