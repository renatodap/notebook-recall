import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { analyzeResearchGaps } from '@/lib/analysis/gap-analyzer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_ids, focus } = body

    if (!source_ids || source_ids.length < 2) {
      return NextResponse.json({ error: 'At least 2 sources required' }, { status: 400 })
    }

    // Verify user owns all sources
    const { data: sources, error: sourcesError } = await (supabase as any)
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          summary_text,
          key_topics
        )
      `)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (sourcesError || !sources || sources.length < 2) {
      return NextResponse.json({ error: 'Sources not found or access denied' }, { status: 404 })
    }

    // Prepare sources for analysis
    const sourcesForAnalysis = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text || '',
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Analyze gaps using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const analysis = await analyzeResearchGaps(
      sourcesForAnalysis,
      anthropicKey,
      focus
    )

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await (supabase as any)
      .from('research_gap_analyses')
      .insert({
        user_id: user.id,
        source_ids: source_ids,
        focus: focus || null,
        executive_summary: analysis.executive_summary,
        total_gaps: analysis.total_gaps,
        gaps_by_category: analysis.gaps_by_category,
        identified_gaps: analysis.identified_gaps,
        recommendations: analysis.recommendations,
        future_directions: analysis.future_directions,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Save gap analysis error:', saveError)
      // Continue even if save fails
    }

    return NextResponse.json({
      analysis,
      saved_id: savedAnalysis?.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Gap analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: List all gap analyses for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: analyses, error } = await (supabase as any)
      .from('research_gap_analyses')
      .select('id, focus, total_gaps, created_at, source_ids')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Fetch gap analyses error:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    return NextResponse.json({
      analyses: analyses || [],
      total: analyses?.length || 0,
    })
  } catch (error) {
    console.error('GET gap analyses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
