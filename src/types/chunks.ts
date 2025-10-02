/**
 * Types for Chunk-Based RAG System
 */

import type { Source, Summary } from './index';

export interface ContentChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  metadata: ChunkMetadata;
  created_at: string;
}

export interface ChunkMetadata {
  startChar: number;
  endChar: number;
  tokenCount: number;
  type: 'paragraph' | 'sentence' | 'arbitrary';
  heading?: string;
  pageNumber?: number;
}

export interface ChunkSearchResult {
  chunk: ContentChunk;
  source: Source;
  relevance_score: number;
  highlighted_content: string;
}

export interface HybridSearchResult {
  id: string;
  source_id: string;
  result_type: 'chunk' | 'summary';
  content: string;
  title: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface EnhancedSearchRequest {
  query: string;
  mode?: 'chunks' | 'summaries' | 'hybrid';
  limit?: number;
  threshold?: number;
  collection_id?: string;
}

export interface EnhancedSearchResponse {
  results: ChunkSearchResult[];
  total: number;
  search_mode: 'chunks' | 'summaries' | 'hybrid';
  grouped_by_source?: GroupedSearchResults[];
}

export interface GroupedSearchResults {
  source: Source;
  summary: Summary;
  chunks: ChunkSearchResult[];
  best_score: number;
  total_matches: number;
}

export interface ChunkBackfillRequest {
  source_id?: string;
  batch_size?: number;
  dry_run?: boolean;
}

export interface ChunkBackfillResponse {
  sources_processed: number;
  chunks_created: number;
  chunks_embedded: number;
  failed: number;
  duration_ms: number;
}
