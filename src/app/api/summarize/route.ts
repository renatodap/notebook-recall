import { NextRequest, NextResponse } from 'next/server'
import { summarizeContent } from '@/lib/claude/client'
import { ContentType } from '@/types'
import { z } from 'zod'

const SummarizeRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['text', 'url', 'pdf', 'note', 'image']),
})

export async function POST(request: NextRequest) {
  try {
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
