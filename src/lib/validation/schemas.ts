/**
 * Comprehensive Zod Validation Schemas for Recall Notebook
 *
 * This file contains all validation schemas for API routes, organized by feature area.
 * All schemas follow production-level standards with:
 * - Strict type validation
 * - User-friendly error messages
 * - Input sanitization
 * - Length limits to prevent abuse
 *
 * @see CLAUDE.md Section 3: Security Standards
 */

import { z } from 'zod'
import { QUICK_WINS } from '@/lib/onboarding/quick-wins'

// ============================================================================
// BASE SCHEMAS & COMMON TYPES
// ============================================================================

/**
 * Common content types across the application
 */
export const ContentTypeSchema = z.enum(['text', 'url', 'pdf', 'note', 'image'], {
  message: 'Content type must be one of: text, url, pdf, note, image',
})

/**
 * UUID validation for all ID fields
 */
export const UUIDSchema = z.string().uuid({ message: 'Invalid ID format' })

/**
 * URL validation with protocol enforcement
 */
export const URLSchema = z
  .string()
  .url({ message: 'Invalid URL format' })
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must use http or https protocol',
  })

// ============================================================================
// SOURCES API SCHEMAS
// ============================================================================

/**
 * GET /api/sources - Query parameters
 */
export const GetSourcesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  contentType: ContentTypeSchema.optional(),
  sort: z.enum(['newest', 'oldest', 'relevance']).optional().default('newest'),
  tags: z.string().optional(), // Comma-separated
  tagLogic: z.enum(['OR', 'AND']).optional().default('OR'),
  collection_id: UUIDSchema.optional(),
})

/**
 * POST /api/sources - Create source (backward compatible name)
 */
export const createSourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').trim().optional(),
  content_type: ContentTypeSchema,
  original_content: z.string().min(1, 'Content is required').max(1000000),
  url: z.union([URLSchema, z.literal(''), z.null()]).optional(),
  summary_text: z.string().min(1, 'Summary is required').max(10000),
  key_actions: z.array(z.string().max(500)).max(20),
  key_topics: z.array(z.string().max(100)).max(50),
  word_count: z.number().int().positive().max(1000000),
})

/**
 * PUT /api/sources/[id] - Update source
 */
export const UpdateSourceSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  original_content: z.string().min(1).max(1000000).optional(),
  url: z.union([URLSchema, z.literal(''), z.null()]).optional(),
  archived: z.boolean().optional(),
})

// ============================================================================
// SUMMARIZE API SCHEMAS
// ============================================================================

/**
 * POST /api/summarize
 */
export const SummarizeRequestSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500000),
  contentType: ContentTypeSchema,
})

// ============================================================================
// SEARCH API SCHEMAS
// ============================================================================

/**
 * POST /api/search (backward compatible name)
 */
export const searchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000).trim(),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional().default('semantic'),
  limit: z.number().int().positive().max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  collection_id: UUIDSchema.optional(),
})

/**
 * POST /api/search/enhanced
 */
export const EnhancedSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000).trim(),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional().default('semantic'),
  limit: z.number().int().positive().max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  filters: z
    .object({
      contentType: z.array(ContentTypeSchema).optional(),
      tags: z.array(z.string().max(100)).max(50).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      collection_id: UUIDSchema.optional(),
    })
    .optional(),
})

// ============================================================================
// COLLECTIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/collections (backward compatible name)
 */
export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  is_public: z.boolean().default(false),
  collection_type: z
    .enum(['project', 'reading_list', 'literature_review', 'course'])
    .default('reading_list'),
  source_ids: z.array(UUIDSchema).max(1000).optional(),
  metadata: z
    .object({
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      icon: z.string().max(50).optional(),
      tags: z.array(z.string().max(100)).max(20).optional(),
    })
    .optional(),
})

/**
 * PUT /api/collections/[id]
 */
export const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  is_public: z.boolean().optional(),
  collection_type: z
    .enum(['project', 'reading_list', 'literature_review', 'course'])
    .optional(),
  metadata: z
    .object({
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      icon: z.string().max(50).optional(),
      tags: z.array(z.string().max(100)).max(20).optional(),
    })
    .optional(),
})

/**
 * POST /api/collections/[id]/sources
 */
export const AddToCollectionSchema = z.object({
  source_id: UUIDSchema,
  note: z.string().max(1000).trim().optional().nullable(),
})

/**
 * POST /api/collections/[id]/collaborate
 */
export const AddCollaboratorSchema = z.object({
  user_id: UUIDSchema,
  role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
})

// ============================================================================
// SYNTHESIS API SCHEMAS
// ============================================================================

/**
 * POST /api/synthesis/generate (backward compatible name)
 */
export const generateSynthesisSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(100),
  report_type: z
    .enum([
      'literature_review',
      'thematic_synthesis',
      'gap_analysis',
      'comparison',
      'timeline_analysis',
      'comparative',
      'thematic',
      'chronological',
    ])
    .default('literature_review'),
  title: z.string().min(1).max(500).trim().optional(),
  focus: z.string().max(2000).trim().optional(),
  options: z
    .object({
      max_length: z.number().int().positive().max(50000).optional(),
      include_citations: z.boolean().optional(),
      tone: z.enum(['academic', 'professional', 'casual']).optional(),
    })
    .optional(),
})

/**
 * PUT /api/synthesis/[id]
 */
export const UpdateSynthesisSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  focus: z.string().max(2000).trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ============================================================================
// PUBLISHING API SCHEMAS
// ============================================================================

/**
 * POST /api/publishing/generate-blog (backward compatible name)
 */
export const generateBlogPostSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(50),
  title: z.string().min(1).max(500).trim().optional(),
  target_audience: z.string().max(200).default('general'),
  tone: z
    .enum(['academic', 'casual', 'technical', 'professional', 'beginner-friendly'])
    .default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  focus: z.string().max(2000).trim().optional(),
  custom_instructions: z.string().max(2000).trim().optional(),
  include_citations: z.boolean().default(true),
})

/**
 * POST /api/publishing/generate-newsletter
 */
export const GenerateNewsletterSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1).max(100),
  title: z.string().min(1, 'Title is required').max(500).trim(),
  intro: z.string().max(2000).trim().optional(),
  sections: z
    .array(
      z.object({
        name: z.string().min(1).max(200).trim(),
        source_ids: z.array(UUIDSchema).min(1).max(20),
      })
    )
    .max(10)
    .optional(),
})

/**
 * POST /api/publishing/generate-paper
 */
export const GeneratePaperSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1).max(100),
  title: z.string().min(1).max(500).trim().optional(),
  abstract: z.string().max(2000).trim().optional(),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(200).trim(),
        focus: z.string().max(1000).trim().optional(),
      })
    )
    .max(20)
    .optional(),
  citation_style: z.enum(['apa', 'mla', 'chicago', 'ieee']).default('apa'),
})

/**
 * POST /api/publishing/generate-presentation
 */
export const GeneratePresentationSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1).max(50),
  title: z.string().min(1).max(200).trim().optional(),
  num_slides: z.number().int().positive().min(5).max(50).default(10),
  include_speaker_notes: z.boolean().default(true),
  theme: z.enum(['professional', 'academic', 'minimal', 'creative']).default('professional'),
})

/**
 * POST /api/publishing/generate-book-outline
 */
export const GenerateBookOutlineSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1).max(200),
  title: z.string().min(1).max(500).trim().optional(),
  num_chapters: z.number().int().positive().min(3).max(50).default(10),
  target_audience: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
})

// ============================================================================
// CONNECTIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/connections/discover
 */
export const DiscoverConnectionsSchema = z.object({
  source_id: UUIDSchema,
  limit: z.number().int().positive().max(50).default(10),
  connection_types: z
    .array(z.enum(['cites', 'similar', 'contradicts', 'extends', 'refutes']))
    .optional(),
})

// ============================================================================
// CONTRADICTIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/contradictions/detect
 */
export const DetectContradictionsSchema = z.object({
  source_ids: z.array(UUIDSchema).min(2, 'At least two sources required').max(50),
  threshold: z.number().min(0).max(1).default(0.7),
})

// ============================================================================
// CONCEPTS API SCHEMAS
// ============================================================================

/**
 * POST /api/concepts/extract
 */
export const ExtractConceptsSchema = z.object({
  source_id: UUIDSchema,
  min_relevance: z.number().min(0).max(1).default(0.5),
})

// ============================================================================
// ANNOTATIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/annotations (backward compatible name)
 */
export const createAnnotationSchema = z.object({
  source_id: UUIDSchema,
  page_number: z.number().int().positive().optional().nullable(),
  quote: z.string().min(1, 'Quote is required').max(10000),
  comment: z.string().max(5000).trim().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#FFFF00'),
  position: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().positive(),
      height: z.number().positive(),
      pageIndex: z.number().int().nonnegative(),
    })
    .optional()
    .nullable(),
  annotation_type: z.enum(['highlight', 'note', 'underline']).default('highlight'),
  selected_text: z.string().max(10000).optional(), // Backward compatibility
  note: z.string().max(5000).trim().optional().nullable(), // Backward compatibility
})

/**
 * PUT /api/annotations/[id]
 */
export const UpdateAnnotationSchema = z.object({
  quote: z.string().min(1).max(10000).optional(),
  comment: z.string().max(5000).trim().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  annotation_type: z.enum(['highlight', 'note', 'underline']).optional(),
  selected_text: z.string().max(10000).optional(),
  note: z.string().max(5000).trim().optional().nullable(),
})

// ============================================================================
// CITATIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/citations/fetch (backward compatible name)
 */
export const fetchCitationSchema = z
  .object({
    doi: z.string().max(500).optional(),
    url: URLSchema.optional(),
    source_id: UUIDSchema.optional(),
  })
  .refine((data) => data.doi || data.url || data.source_id, {
    message: 'At least one of doi, url, or source_id is required',
  })

/**
 * POST /api/citations/export-citations
 */
export const ExportCitationsSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(1000),
  format: z.enum(['bibtex', 'ris', 'apa', 'mla', 'chicago']),
})

// ============================================================================
// ONBOARDING & QUICK WINS SCHEMAS
// ============================================================================

/**
 * Valid quick win IDs from configuration
 */
const validQuickWinIds = QUICK_WINS.map((win) => win.id)

/**
 * POST /api/quick-wins (backward compatible name)
 */
export const quickWinsPostSchema = z.object({
  winId: z
    .string()
    .min(1, 'Win ID is required')
    .refine((id) => validQuickWinIds.includes(id), {
      message: `Invalid win ID. Must be one of: ${validQuickWinIds.join(', ')}`,
    }),
})

/**
 * Helper function to safely parse and validate request bodies
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: errors }
    }

    return { success: true, data: result.data }
  } catch (_error) {
    return { success: false, error: 'Invalid JSON in request body' }
  }
}

/**
 * Helper function to validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const result = schema.safeParse(params)

    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: errors }
    }

    return { success: true, data: result.data }
  } catch (_error) {
    return { success: false, error: 'Invalid query parameters' }
  }
}

// ============================================================================
// RESEARCH QUESTIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/research-questions
 */
export const CreateResearchQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required').max(2000).trim(),
  category: z.enum(['general', 'methodology', 'theory', 'application', 'gap']).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  source_ids: z.array(UUIDSchema).max(100).optional(),
})

/**
 * PUT /api/research-questions/[id]
 */
export const UpdateResearchQuestionSchema = z.object({
  question_text: z.string().min(1).max(2000).trim().optional(),
  category: z.enum(['general', 'methodology', 'theory', 'application', 'gap']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['open', 'investigating', 'answered', 'closed']).optional(),
  answer: z.string().max(10000).trim().optional().nullable(),
})

// ============================================================================
// BULK OPERATIONS API SCHEMAS
// ============================================================================

/**
 * POST /api/bulk/delete
 */
export const BulkDeleteSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source ID is required').max(1000),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Confirmation required for bulk delete',
  }),
})

/**
 * POST /api/bulk/tag
 */
export const BulkTagSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source ID is required').max(1000),
  tags: z.array(z.string().min(1).max(100).trim()).min(1, 'At least one tag is required').max(50),
  action: z.enum(['add', 'remove', 'replace']).default('add'),
})

// ============================================================================
// WORKSPACES API SCHEMAS
// ============================================================================

/**
 * POST /api/workspaces
 */
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  is_public: z.boolean().default(false),
  settings: z
    .object({
      theme: z.string().max(50).optional(),
      default_view: z.enum(['grid', 'list', 'timeline']).optional(),
      sharing_enabled: z.boolean().optional(),
    })
    .optional(),
})

/**
 * PUT /api/workspaces/[id]
 */
export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  is_public: z.boolean().optional(),
  settings: z
    .object({
      theme: z.string().max(50).optional(),
      default_view: z.enum(['grid', 'list', 'timeline']).optional(),
      sharing_enabled: z.boolean().optional(),
    })
    .optional(),
})

/**
 * POST /api/workspaces/[id]/members
 */
export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
  message: z.string().max(1000).trim().optional(),
})

// ============================================================================
// ADDITIONAL SCHEMAS FOR REMAINING ROUTES
// ============================================================================

/**
 * POST /api/import/references
 */
export const ImportReferencesSchema = z.object({
  format: z.enum(['bibtex', 'ris', 'endnote', 'csv']),
  content: z.string().min(1, 'Content is required').max(10000000), // 10MB
  collection_id: UUIDSchema.optional(),
})

/**
 * POST /api/export/document
 */
export const ExportDocumentSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(500),
  format: z.enum(['pdf', 'docx', 'markdown', 'html']),
  include_annotations: z.boolean().default(false),
  include_metadata: z.boolean().default(true),
})

/**
 * POST /api/sharing - Share source with visibility controls
 */
export const ShareSourceSchema = z.object({
  source_id: UUIDSchema,
  visibility: z.enum(['private', 'public', 'specific']).default('private'),
  shared_with_user_ids: z.array(UUIDSchema).max(100).optional(),
})

/**
 * GET /api/sharing - Get share list
 */
export const GetSharesQuerySchema = z.object({
  type: z.enum(['owned', 'shared_with_me']).default('owned'),
})

/**
 * POST /api/sharing/create-link - Create shareable link (different from visibility)
 */
export const CreateShareLinkSchema = z.object({
  resource_type: z.enum(['source', 'collection', 'synthesis']),
  resource_id: UUIDSchema,
  expires_at: z.string().datetime().optional(),
  password: z.string().min(8).max(100).optional(),
  allow_comments: z.boolean().default(false),
})

/**
 * POST /api/social/follow
 */
export const FollowUserSchema = z.object({
  user_id: UUIDSchema,
  action: z.enum(['follow', 'unfollow']),
})

/**
 * POST /api/social/interactions
 */
export const CreateInteractionSchema = z.object({
  resource_type: z.enum(['source', 'collection', 'synthesis']),
  resource_id: UUIDSchema,
  interaction_type: z.enum(['like', 'bookmark', 'share', 'comment']),
  comment_text: z.string().max(2000).trim().optional(),
})

/**
 * POST /api/tags
 */
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100).trim(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(500).trim().optional(),
})

/**
 * POST /api/feedback
 */
export const SubmitFeedbackSchema = z.object({
  message_id: z.string().min(1, 'Message ID is required'),
  was_helpful: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback_text: z.string().max(5000).trim().optional(),
})

/**
 * GET /api/publishing - Query parameters for listing published outputs
 */
export const GetPublishedOutputsQuerySchema = z.object({
  type: z.enum(['presentation', 'blog-post', 'research-paper', 'social-media', 'book-outline']).optional(),
})

/**
 * PUT /api/publishing/[id] - Update published output
 */
export const UpdatePublishedOutputSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  content: z.string().max(1000000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/writing-assistant/improve
 */
export const ImproveTextSchema = z.object({
  text: z.string().min(1, 'Text is required').max(50000),
  improvement_type: z.enum(['clarity', 'conciseness', 'tone', 'grammar', 'academic']),
  target_audience: z.string().max(200).optional(),
})

// ============================================================================
// EXPORT & IMPORT API SCHEMAS
// ============================================================================

/**
 * GET /api/export - Query parameters for exporting sources
 */
export const ExportSourcesQuerySchema = z.object({
  format: z.enum(['markdown', 'json'], { message: 'Format must be markdown or json' }),
  sources: z.string().optional(), // Comma-separated UUIDs
})

/**
 * Helper to validate comma-separated source IDs
 */
export function validateSourceIds(sourcesParam: string | null): string[] | null {
  if (!sourcesParam) return null

  const ids = sourcesParam.split(',').map(id => id.trim())
  const schema = z.array(UUIDSchema)
  const result = schema.safeParse(ids)

  return result.success ? ids : null
}

// ============================================================================
// ADDITIONAL PUBLISHING SCHEMAS
// ============================================================================

/**
 * POST /api/publishing/generate-newsletter - Updated schema
 */
export const GenerateNewsletterRequestSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(100),
  newsletter_name: z.string().min(1).max(200).trim().default('Research Digest'),
  theme: z.string().max(100).trim().optional(),
  sections: z.array(z.object({
    name: z.string().min(1).max(200),
    source_ids: z.array(UUIDSchema).min(1).max(20),
  })).max(10).optional(),
  tone: z.enum(['professional', 'casual', 'academic']).default('professional'),
  format: z.enum(['html', 'markdown', 'plain']).default('html'),
})

/**
 * POST /api/publishing/generate-paper - Updated schema
 */
export const GeneratePaperRequestSchema = z.object({
  source_ids: z.array(UUIDSchema).min(1, 'At least one source is required').max(100),
  title: z.string().min(1).max(500).trim().optional(),
  research_question: z.string().max(2000).trim().optional(),
  paper_type: z.enum(['research_paper', 'literature_review', 'essay', 'technical_report']).default('research_paper'),
  citation_style: z.enum(['apa', 'mla', 'chicago', 'ieee']).default('apa'),
})

// ============================================================================
// PARAMETER VALIDATION SCHEMAS
// ============================================================================

/**
 * Path parameter validation for resource IDs
 */
export const ResourceIdParamSchema = z.object({
  id: UUIDSchema,
})

/**
 * User ID parameter validation
 */
export const UserIdParamSchema = z.object({
  userId: UUIDSchema,
})
