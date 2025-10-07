import { NextRequest, NextResponse } from 'next/server'
import { fetchUrlContent } from '@/lib/content/url-fetcher'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

const FetchUrlSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to fetch URLs')
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.CONTENT_FETCH)
    if (!rateLimit.allowed) {
      throw new RateLimitError(`Too many requests. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`)
    }

    const body = await request.json()
    const validation = FetchUrlSchema.safeParse(body)

    if (!validation.success) {
      throw new ValidationError('Invalid URL format')
    }

    const result = await fetchUrlContent(validation.data.url)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Fetch URL error:', error)
    return handleAPIError(error)
  }
}
