import { NextRequest, NextResponse } from 'next/server'
import { summarizeContent } from '@/lib/claude/client'
import { ContentType } from '@/types'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

const SummarizeRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['text', 'url', 'pdf', 'note', 'image']),
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
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.SIMPLE_AI)
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

    // Validate request
    const validation = SummarizeRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { content, contentType } = validation.data

    // Summarize content
    const result = await summarizeContent(content, contentType as ContentType)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Summarize API error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to summarize content' },
      { status: 500 }
    )
  }
}
