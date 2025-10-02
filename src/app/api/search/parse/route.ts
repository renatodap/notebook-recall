import { NextRequest, NextResponse } from 'next/server'
import { parseConversationalQuery } from '@/lib/search/conversational'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Parse the conversational query using Claude
    const parsed = await parseConversationalQuery(query)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Parse query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse query' },
      { status: 500 }
    )
  }
}
