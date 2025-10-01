import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().positive().max(50).optional(),
})

/**
 * POST /api/search - Search sources by keyword or semantic similarity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request
    const validation = SearchRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { query, limit = 20 } = validation.data

    // For now, implement keyword search
    // In future, integrate vector similarity search
    const searchPattern = `%${query}%`

    const { data, error } = await supabase
      .from('sources')
      .select(
        `
        *,
        summary:summaries(*),
        tags:tags(*)
      `
      )
      .eq('user_id', user.id)
      .or(
        `title.ilike.${searchPattern},original_content.ilike.${searchPattern},summaries.summary_text.ilike.${searchPattern}`
      )
      .limit(limit)

    if (error) {
      console.error('Search error:', error)
      // Try alternative search if the OR query fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('sources')
        .select(
          `
          *,
          summary:summaries(*),
          tags:tags(*)
        `
        )
        .eq('user_id', user.id)
        .ilike('title', searchPattern)
        .limit(limit)

      if (fallbackError) {
        throw fallbackError
      }

      return NextResponse.json({
        results: fallbackData || [],
        total: fallbackData?.length || 0,
      })
    }

    // Calculate relevance scores (simple: count of matches)
    const results = (data || []).map((item: any) => {
      let relevanceScore = 0
      const lowerQuery = query.toLowerCase()

      if (item.title?.toLowerCase().includes(lowerQuery)) relevanceScore += 3
      if (item.original_content?.toLowerCase().includes(lowerQuery))
        relevanceScore += 2
      if (item.summary?.[0]?.summary_text?.toLowerCase().includes(lowerQuery))
        relevanceScore += 2

      return {
        ...item,
        relevance_score: relevanceScore,
      }
    })

    // Sort by relevance
    results.sort((a: any, b: any) => b.relevance_score - a.relevance_score)

    return NextResponse.json({
      results,
      total: results.length,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search sources' },
      { status: 500 }
    )
  }
}
