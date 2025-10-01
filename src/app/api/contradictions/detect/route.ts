import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { detectAllContradictions, groupContradictionsByTopic, getContradictionStats } from '@/lib/contradictions/detector'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_ids, min_confidence = 0.6 } = body

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
          summary_text
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
    }))

    // Detect contradictions using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const contradictions = await detectAllContradictions(
      sourcesForAnalysis,
      anthropicKey,
      min_confidence
    )

    // Save contradictions to database
    if (contradictions.length > 0) {
      const contradictionsToInsert = contradictions.map(c => ({
        source_a_id: c.source_a_id,
        source_b_id: c.source_b_id,
        claim_a: c.claim_a,
        claim_b: c.claim_b,
        severity: c.severity,
        confidence: c.confidence,
        explanation: c.explanation,
        topic: c.topic,
        detected_by: user.id,
        auto_detected: true,
      }))

      await (supabase as any)
        .from('contradictions')
        .insert(contradictionsToInsert)
    }

    // Group and analyze
    const grouped = groupContradictionsByTopic(contradictions)
    const stats = getContradictionStats(contradictions)

    return NextResponse.json({
      contradictions,
      grouped,
      stats,
      total: contradictions.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Contradiction detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
