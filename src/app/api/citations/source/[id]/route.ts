import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sourceId } = await params

    // Verify user owns this source
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch citation
    const { data: citation, error } = await supabase
      .from('citations')
      .select('*')
      .eq('source_id', sourceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      console.error('Citation fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch citation' }, { status: 500 })
    }

    return NextResponse.json({ citation: citation || null })
  } catch (error) {
    console.error('Citation GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
