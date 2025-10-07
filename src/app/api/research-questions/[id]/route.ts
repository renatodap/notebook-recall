import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema, UpdateResearchQuestionSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid research question ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update research questions')
    }

    // Rate limiting - DATA_MODIFICATION limit for PATCH
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const bodyValidation = UpdateResearchQuestionSchema.safeParse(body)
    if (!bodyValidation.success) {
      throw new ValidationError(bodyValidation.error.issues[0].message)
    }

    const validatedData = bodyValidation.data

    // Build update object
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (validatedData.question_text !== undefined) updates.question_text = validatedData.question_text
    if (validatedData.category !== undefined) updates.category = validatedData.category
    if (validatedData.status !== undefined) updates.status = validatedData.status
    if (validatedData.priority !== undefined) updates.priority = validatedData.priority
    if (validatedData.answer !== undefined) updates.answer = validatedData.answer

    const { data: researchQuestion, error } = await supabase
      .from('research_questions')
      .update(updates as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    if (!researchQuestion) {
      throw new NotFoundError('Research question not found or access denied')
    }

    return NextResponse.json({ question: researchQuestion })
  } catch (error) {
    console.error('Update research question error:', error)
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
      throw new ValidationError('Invalid research question ID format')
    }

    const { id } = validation.data
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete research questions')
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
      .from('research_questions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete research question error:', error)
    return handleAPIError(error)
  }
}
