/**
 * Zod validation schemas for API requests
 * CLAUDE.md requirement: All API inputs must be validated with Zod
 */

import { z } from 'zod'
import { QUICK_WINS } from '@/lib/onboarding/quick-wins'

// ============================================================================
// ONBOARDING & QUICK WINS
// ============================================================================

/**
 * Valid quick win IDs from configuration
 */
const validQuickWinIds = QUICK_WINS.map((win) => win.id)

/**
 * Schema for marking a quick win as completed
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
 * Schema for creating a source
 */
export const createSourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  content_type: z.enum(['text', 'url', 'pdf', 'note', 'image'], {
    errorMap: () => ({ message: 'Invalid content type' }),
  }),
  original_content: z.string().min(1, 'Content is required'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  summary_text: z.string().min(10, 'Summary too short').max(5000, 'Summary too long'),
  key_actions: z.array(z.string().min(1).max(500)).max(20, 'Too many actions'),
  key_topics: z.array(z.string().min(1).max(100)).max(50, 'Too many topics'),
  word_count: z.number().int().min(0).max(1000000),
})

/**
 * Schema for search requests
 */
export const searchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional().default('semantic'),
  limit: z.number().int().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  collection_id: z.string().uuid('Invalid collection ID').optional(),
})

/**
 * Schema for annotation creation
 */
export const createAnnotationSchema = z.object({
  source_id: z.string().uuid('Invalid source ID'),
  page_number: z.number().int().min(1).optional(),
  quote: z.string().min(1, 'Quote is required').max(5000, 'Quote too long'),
  comment: z.string().max(2000, 'Comment too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex)')
    .optional()
    .default('#FFF176'),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
      pageIndex: z.number().int().min(0),
    })
    .optional(),
  annotation_type: z.enum(['highlight', 'note', 'underline']).optional().default('highlight'),
})

/**
 * Schema for citation fetch requests
 */
export const fetchCitationSchema = z
  .object({
    doi: z.string().min(1).optional(),
    url: z.string().url('Invalid URL').optional(),
    source_id: z.string().uuid('Invalid source ID').optional(),
  })
  .refine((data) => data.doi || data.url || data.source_id, {
    message: 'At least one of doi, url, or source_id is required',
  })

/**
 * Schema for synthesis report generation
 */
export const generateSynthesisSchema = z.object({
  source_ids: z
    .array(z.string().uuid('Invalid source ID'))
    .min(2, 'At least 2 sources required')
    .max(50, 'Too many sources (max 50)'),
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
    .optional()
    .default('thematic_synthesis'),
  title: z.string().min(1).max(500).optional(),
  focus: z.string().max(1000).optional(),
  options: z
    .object({
      max_length: z.number().int().min(500).max(10000).optional(),
      include_citations: z.boolean().optional().default(true),
      tone: z.enum(['academic', 'casual', 'technical', 'beginner-friendly']).optional(),
    })
    .optional(),
})

/**
 * Schema for collection creation
 */
export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  is_public: z.boolean().optional().default(false),
  collection_type: z
    .enum(['project', 'reading_list', 'literature_review', 'course'])
    .optional()
    .default('reading_list'),
  source_ids: z.array(z.string().uuid('Invalid source ID')).optional(),
})

/**
 * Schema for publishing blog posts
 */
export const generateBlogPostSchema = z.object({
  source_ids: z
    .array(z.string().uuid('Invalid source ID'))
    .min(1, 'At least 1 source required')
    .max(20, 'Too many sources (max 20)'),
  title: z.string().min(1).max(500).optional(),
  tone: z.enum(['academic', 'casual', 'technical', 'beginner-friendly']).optional().default('casual'),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  include_citations: z.boolean().optional().default(true),
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
