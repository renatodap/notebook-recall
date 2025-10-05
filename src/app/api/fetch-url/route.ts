import { NextRequest, NextResponse } from 'next/server'
import { fetchUrlContent } from '@/lib/content/url-fetcher'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'
import { getErrorMessage } from '@/types/api-types'

const FetchUrlSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.CONTENT_FETCH)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = FetchUrlSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    const result = await fetchUrlContent(validation.data.url)
    return NextResponse.json(result)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch URL' },
      { status: 500 }
    )
  }
}
