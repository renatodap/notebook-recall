/**
 * Tag Types
 *
 * Type definitions for tag filtering functionality
 */

/**
 * Tag with source count
 */
export interface TagWithCount {
  tag_name: string;
  count: number;
  sources: string[];
}

/**
 * Tag filter logic
 */
export type TagLogic = 'OR' | 'AND';

/**
 * Tag filter state
 */
export interface TagFilterState {
  selectedTags: string[];
  tagLogic: TagLogic;
  availableTags: TagWithCount[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Tag filter options
 */
export interface TagFilterOptions {
  tags: string[];
  logic: TagLogic;
}

/**
 * Response from GET /api/tags
 */
export interface GetTagsResponse {
  tags: TagWithCount[];
  total: number;
}

/**
 * Enhanced source filters with tags
 */
export interface SourceFiltersWithTags {
  tags?: string[];
  tagLogic?: TagLogic;
  contentType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

/**
 * Tag validation result
 */
export interface TagValidationResult {
  valid: boolean;
  error?: string;
}
