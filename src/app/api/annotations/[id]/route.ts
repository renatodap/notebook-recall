import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema, UpdateAnnotationSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid annotation ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view annotations')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { data: annotation, error } = await supabase
      .from('pdf_annotations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    if (!annotation) {
      throw new NotFoundError('Annotation not found or access denied')
    }

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error('Get annotation error:', error)
    return handleAPIError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid annotation ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update annotations')
    }

    // Rate limiting - DATA_MODIFICATION limit for PATCH
    const rateLimitPatch = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimitPatch.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimitPatch.retryAfter} seconds`,
        rateLimitPatch.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const bodyValidation = UpdateAnnotationSchema.safeParse(body)
    if (!bodyValidation.success) {
      throw new ValidationError(bodyValidation.error.issues[0].message)
    }

    const validatedData = bodyValidation.data

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validatedData.note !== undefined) updateData.note = validatedData.note
    if (validatedData.comment !== undefined) updateData.comment = validatedData.comment
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.annotation_type !== undefined) updateData.annotation_type = validatedData.annotation_type

    const { data: annotation, error } = await supabase
      .from('pdf_annotations')
      .update(updateData as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    if (!annotation) {
      throw new NotFoundError('Annotation not found or access denied')
    }

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error('Update annotation error:', error)
    return handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid annotation ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete annotations')
    }

    // Rate limiting - DATA_MODIFICATION limit for DELETE
    const rateLimitDel = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimitDel.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimitDel.retryAfter} seconds`,
        rateLimitDel.retryAfter
      )
    }

    const { error } = await supabase
      .from('pdf_annotations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete annotation error:', error)
    return handleAPIError(error)
  }
}
