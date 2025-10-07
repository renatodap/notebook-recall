import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createAnnotationSchema, UUIDSchema } from '@/lib/validation/schemas'
import { validateRequestBody, validateQueryParams } from '@/lib/validation/middleware'
import {
  AuthenticationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  handleAPIError
} from '@/lib/errors/custom-errors'
import { z } from 'zod'
import { DatabaseSource } from '@/types/api'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const GetQuerySchema = z.object({
  source_id: UUIDSchema.optional(),
})

/**
 * GET /api/annotations - List annotations for current user
 * @query source_id - Optional source ID to filter by
 * @returns Array of annotations
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as import('@/types/supabase-helpers').TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view your annotations')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate query params
    const { source_id } = validateQueryParams(request, GetQuerySchema)

    let query = supabase
      .from('pdf_annotations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (source_id) {
      query = query.eq('source_id', source_id as never)
    }

    const { data: annotations, error } = await query

    if (error) {
      console.error('Get annotations error:', error)
      throw new DatabaseError('Failed to retrieve annotations. Please try again')
    }

    return NextResponse.json({ annotations: annotations || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/annotations - Create new annotation
 * @body CreateAnnotationSchema - Annotation data
 * @returns Created annotation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as import('@/types/supabase-helpers').TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create annotations')
    }

    // Rate limiting - DATA_MODIFICATION limit for POST
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const validatedData = await validateRequestBody(request, createAnnotationSchema)
    const {
      source_id,
      page_number,
      annotation_type,
      quote,
      selected_text, // backward compatibility
      comment,
      note, // backward compatibility
      color,
      position,
    } = validatedData

    // Verify user owns the source
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      throw new NotFoundError('Source not found or you do not have permission to access it')
    }

    // Create annotation (support both old and new field names)
    const { data: annotation, error } = await supabase
      .from('pdf_annotations')
      .insert({
        user_id: user.id,
        source_id,
        page_number: page_number || null,
        annotation_type: annotation_type || 'highlight',
        selected_text: selected_text || quote || '',
        note: note || comment || '',
        color: color || '#FFFF00',
        position: position || {},
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Create annotation error:', error)
      throw new DatabaseError('Failed to create annotation. Please try again')
    }

    return NextResponse.json({ annotation }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}
