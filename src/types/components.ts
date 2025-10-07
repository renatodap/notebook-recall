/**
 * Component Type Definitions
 * Type safety for React components and their props
 */

import { ReactNode } from 'react';
import {
  DatabaseSource,
  DatabaseCollection,
  DatabaseAnnotation,
  GraphData,
  GraphNode,
  GraphLink,
} from './api';

// ============================================================================
// Common Component Props
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// ============================================================================
// Source Components
// ============================================================================

export interface SourceCardProps {
  source: DatabaseSource;
  onDelete?: (id: string) => void;
  onUpdate?: (source: DatabaseSource) => void;
  showActions?: boolean;
}

export interface SourceListProps {
  sources: DatabaseSource[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (source: DatabaseSource) => void;
  emptyMessage?: string;
}

export interface SourceDetailProps {
  source: DatabaseSource;
  annotations?: DatabaseAnnotation[];
  onAnnotate?: (annotation: Partial<DatabaseAnnotation>) => void;
}

// ============================================================================
// Collection Components
// ============================================================================

export interface CollectionCardProps {
  collection: DatabaseCollection & { source_count?: number };
  onDelete?: (id: string) => void;
  onUpdate?: (collection: DatabaseCollection) => void;
}

export interface CollectionListProps {
  collections: Array<DatabaseCollection & { source_count?: number }>;
  loading?: boolean;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
}

// ============================================================================
// Visualization Components
// ============================================================================

export interface KnowledgeGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
}

export interface TimelineProps {
  events: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  onEventClick?: (eventId: string) => void;
}

// ============================================================================
// AI Components
// ============================================================================

export interface SynthesisReportProps {
  report: {
    id: string;
    title: string;
    content: string;
    sections?: Array<{
      title: string;
      content: string;
      sources?: string[];
    }>;
    sources?: DatabaseSource[];
    created_at: string;
  };
  onExport?: () => void;
}

export interface ChatInterfaceProps {
  initialMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  onSendMessage: (message: string) => Promise<string>;
  sourceIds?: string[];
  collectionId?: string;
}

export interface ConnectionsViewProps {
  connections: Array<{
    id: string;
    source_1: DatabaseSource;
    source_2: DatabaseSource;
    connection_type: string;
    explanation: string;
    strength: number;
  }>;
  onViewSource?: (sourceId: string) => void;
}

export interface ContradictionsViewProps {
  contradictions: Array<{
    id: string;
    source_1: DatabaseSource;
    source_2: DatabaseSource;
    statement_1: string;
    statement_2: string;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  onViewSource?: (sourceId: string) => void;
}

// ============================================================================
// Academic Components
// ============================================================================

export interface CitationListProps {
  citations: Array<{
    id: string;
    formatted_citation: string;
    style: string;
    source: DatabaseSource;
  }>;
  style?: 'apa' | 'mla' | 'chicago' | 'harvard';
  onCopy?: (citation: string) => void;
  onExport?: () => void;
}

export interface LiteratureReviewProps {
  review: {
    id: string;
    title: string;
    abstract: string;
    sections: Array<{
      title: string;
      content: string;
      citations: string[];
    }>;
    sources: DatabaseSource[];
    references: string[];
  };
  onExport?: () => void;
}

export interface MethodologyComparisonProps {
  methodologies: Array<{
    source_id: string;
    source_title: string;
    methodology: {
      approach: string;
      methods: string[];
      sample_size?: number;
      limitations: string[];
    };
  }>;
}

// ============================================================================
// Annotation Components
// ============================================================================

export interface AnnotationSidebarProps {
  annotations: DatabaseAnnotation[];
  sourceId: string;
  onAdd: (annotation: Partial<DatabaseAnnotation>) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export interface PDFViewerProps {
  url: string;
  sourceId: string;
  annotations?: DatabaseAnnotation[];
  onAnnotate?: (annotation: Partial<DatabaseAnnotation>) => void;
}

// ============================================================================
// Search Components
// ============================================================================

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
  initialValue?: string;
}

export interface SearchResultsProps {
  results: Array<{
    source: DatabaseSource;
    similarity?: number;
    highlights?: string[];
  }>;
  query: string;
  onResultClick?: (sourceId: string) => void;
}

export interface FilterPanelProps {
  tags: string[];
  collections: DatabaseCollection[];
  selectedTags?: string[];
  selectedCollections?: string[];
  onTagsChange?: (tags: string[]) => void;
  onCollectionsChange?: (collections: string[]) => void;
  onClear?: () => void;
}

// ============================================================================
// Publishing Components
// ============================================================================

export interface PublishingPreviewProps {
  content: {
    title: string;
    content: string;
    type: 'blog' | 'newsletter' | 'paper' | 'presentation' | 'book';
    metadata?: Record<string, unknown>;
  };
  onEdit?: () => void;
  onPublish?: () => void;
  onExport?: (format: string) => void;
}

export interface BlogEditorProps {
  initialContent?: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
  };
  onSave: (content: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
  }) => Promise<void>;
}

// ============================================================================
// Tag Components
// ============================================================================

export interface TagInputProps {
  tags: string[];
  suggestions?: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export interface TagCloudProps {
  tags: Array<{
    tag: string;
    count: number;
  }>;
  onTagClick?: (tag: string) => void;
  maxTags?: number;
}

// ============================================================================
// Social Components
// ============================================================================

export interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle: () => Promise<void>;
  disabled?: boolean;
}

export interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  platforms?: Array<'twitter' | 'facebook' | 'linkedin' | 'email'>;
}

export interface ProfileCardProps {
  profile: {
    id: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    stats?: {
      sources: number;
      collections: number;
      followers: number;
      following: number;
    };
  };
  isOwnProfile?: boolean;
  onFollow?: () => void;
}

// ============================================================================
// Analytics Components
// ============================================================================

export interface DashboardStatsProps {
  stats: {
    total_sources: number;
    total_collections: number;
    total_annotations: number;
    sources_by_type: Record<string, number>;
    recent_activity: Array<{
      type: string;
      count: number;
      date: string;
    }>;
  };
}

export interface ChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type: 'bar' | 'line' | 'pie' | 'donut';
  width?: number;
  height?: number;
}

// ============================================================================
// Form Components
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: (value: unknown) => string | undefined;
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

// ============================================================================
// Modal Components
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// ============================================================================
// Loading Components
// ============================================================================

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

// ============================================================================
// Toast/Notification Components
// ============================================================================

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export interface NotificationProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timestamp: string;
    read: boolean;
  }>;
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}
