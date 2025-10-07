import { NextRequest, NextResponse } from 'next/server'
import { parseConversationalQuery } from '@/lib/search/conversational'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to parse queries')
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string')
    }

    // Parse the conversational query using Claude
    const parsed = await parseConversationalQuery(query)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Parse query error:', error)
    return handleAPIError(error)
  }
}
