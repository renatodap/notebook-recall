/**
 * Tag Component Interfaces
 *
 * Props and type definitions for tag-related components
 */

import { TagWithCount, TagLogic } from '@/types';

/**
 * TagFilter Component Props
 */
export interface TagFilterProps {
  availableTags: TagWithCount[];
  selectedTags: string[];
  tagLogic: TagLogic;
  isLoading: boolean;
  onTagSelect: (tag: string) => void;
  onTagDeselect: (tag: string) => void;
  onClearAll: () => void;
  onLogicChange: (logic: TagLogic) => void;
  className?: string;
}

/**
 * TagPill Component Props
 */
export interface TagPillProps {
  tagName: string;
  count?: number;
  selected?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  variant?: 'default' | 'selected' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * TagList Component Props
 */
export interface TagListProps {
  tags: TagWithCount[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  maxVisible?: number;
  showCounts?: boolean;
  className?: string;
}

/**
 * SelectedTags Component Props
 */
export interface SelectedTagsProps {
  selectedTags: string[];
  onRemove: (tag: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * TagLogicToggle Component Props
 */
export interface TagLogicToggleProps {
  logic: TagLogic;
  onChange: (logic: TagLogic) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * UseTags Hook Return Type
 */
export interface UseTagsReturn {
  selectedTags: string[];
  tagLogic: TagLogic;
  availableTags: TagWithCount[];
  isLoading: boolean;
  error: string | null;
  selectTag: (tag: string) => void;
  deselectTag: (tag: string) => void;
  clearAll: () => void;
  setLogic: (logic: TagLogic) => void;
  toggleTag: (tag: string) => void;
  refreshTags: () => Promise<void>;
}

/**
 * Tag utility functions interface
 */
export interface ITagUtils {
  /**
   * Normalize tag name (lowercase, trim)
   */
  normalizeTagName(tagName: string): string;

  /**
   * Validate tag name
   */
  isValidTagName(tagName: string): boolean;

  /**
   * Filter sources by tags using OR logic
   */
  filterSourcesByTagsOR<T extends { tags: { tag_name: string }[] }>(
    sources: T[],
    tagNames: string[]
  ): T[];

  /**
   * Filter sources by tags using AND logic
   */
  filterSourcesByTagsAND<T extends { tags: { tag_name: string }[] }>(
    sources: T[],
    tagNames: string[]
  ): T[];

  /**
   * Get unique tag names from sources
   */
  getUniqueTagNames<T extends { tags: { tag_name: string }[] }>(
    sources: T[]
  ): string[];

  /**
   * Count sources per tag
   */
  countSourcesPerTag<T extends { tags: { tag_name: string }[] }>(
    sources: T[]
  ): Map<string, number>;
}
