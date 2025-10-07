import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { SubmitFeedbackSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * POST /api/feedback - Record user feedback for adaptive learning
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to submit feedback')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = SubmitFeedbackSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { message_id, was_helpful, rating, feedback_text } = validation.data

    // Record feedback
    const { data, error } = await supabase
      .from('message_feedback')
      .insert({
        message_id,
        user_id: user.id,
        rating: rating || (was_helpful ? 5 : 2),
        was_helpful: was_helpful ?? true,
        feedback_text,
        timestamp: new Date().toISOString()
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Feedback recording error:', error)
      throw new Error('Failed to record feedback')
    }

    return NextResponse.json({ success: true, feedback_id: (data as any)?.id })
  } catch (error) {
    console.error('Feedback API error:', error)
    return handleAPIError(error)
  }
}
