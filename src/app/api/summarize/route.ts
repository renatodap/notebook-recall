import { NextRequest, NextResponse } from 'next/server'
import { summarizeContent } from '@/lib/claude/client'
import { ContentType } from '@/types'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import {
  RateLimitError,
  AuthenticationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import {
  SummarizeRequestSchema,
  validateRequestBody,
} from '@/lib/validation'

/**
 * POST /api/summarize - Summarize content using AI
 * @returns Promise<NextResponse> - Summary with actions and topics
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to use AI summarization')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_SUMMARY)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_SUMMARY.maxRequests} summaries. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const { content, contentType } = await validateRequestBody(
      request,
      SummarizeRequestSchema
    )

    // Summarize content
    const result = await summarizeContent(content, contentType as ContentType)

    // Add rate limit headers to response
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_SUMMARY.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Summarize API error:', error)
    return handleAPIError(error)
  }
}
