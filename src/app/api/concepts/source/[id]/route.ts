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
    const { data: source } = await (supabase as any)
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

    // Fetch concepts for this source
    const { data: sourceConcepts, error } = await (supabase as any)
      .from('source_concepts')
      .select(`
        *,
        concept:concepts (*)
      `)
      .eq('source_id', sourceId)
      .order('relevance', { ascending: false })

    if (error) {
      console.error('Fetch concepts error:', error)
      return NextResponse.json({ error: 'Failed to fetch concepts' }, { status: 500 })
    }

    const concepts = sourceConcepts?.map((sc: any) => ({
      ...sc.concept,
      relevance: sc.relevance,
      context: sc.context,
    })) || []

    return NextResponse.json({
      concepts,
      total: concepts.length,
    })
  } catch (error) {
    console.error('Get concepts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
