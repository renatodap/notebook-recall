import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * GET /api/sources/[id] - Get a single source with explicit return type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params

    // Validate ID parameter
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid source ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view this source')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Fetch source with summary and tags
    const { data, error } = await supabase
      .from('sources')
      .select(
        `
        *,
        summary:summaries(*),
        tags:tags(*)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Source not found or access denied')
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET source error:', error)
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/sources/[id] - Delete a source with explicit return type
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params

    // Validate ID parameter
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid source ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete this source')
    }

    // Rate limiting - DATA_MODIFICATION limit for DELETE
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Delete source (cascades to summaries and tags via foreign key constraints)
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE source error:', error)
    return handleAPIError(error)
  }
}
