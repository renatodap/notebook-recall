import { NextRequest, NextResponse } from 'next/server'
import { fetchUrlContent } from '@/lib/content/url-fetcher'
import { z } from 'zod'

const FetchUrlSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL' },
      { status: 500 }
    )
  }
}
