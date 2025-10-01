import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateSynthesisReport } from '@/lib/synthesis/generator'
import type { GenerateSynthesisRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateSynthesisRequest = await request.json()
    const { source_ids, title, focus, report_type = 'literature_review' } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
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

    if (sourcesError || !sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found or access denied' }, { status: 404 })
    }

    if (sources.length !== source_ids.length) {
      return NextResponse.json({ error: 'Some sources not found or not owned by user' }, { status: 403 })
    }

    // Prepare sources for synthesis
    const synthesisInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate synthesis using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const synthesis = await generateSynthesisReport(
      {
        sources: synthesisInput,
        focus,
        report_type: report_type as any,
      },
      anthropicKey
    )

    // Save synthesis report to database
    const { data: report, error: reportError } = await (supabase as any)
      .from('synthesis_reports')
      .insert({
        user_id: user.id,
        title: title || synthesis.title,
        focus: focus || null,
        report_type,
        executive_summary: synthesis.executive_summary,
        themes: synthesis.themes,
        key_findings: synthesis.key_findings,
        agreements: synthesis.agreements,
        disagreements: synthesis.disagreements,
        gaps: synthesis.gaps,
        full_report: synthesis.full_report,
        source_count: sources.length,
        metadata: synthesis.metadata,
      })
      .select()
      .single()

    if (reportError) {
      console.error('Save synthesis report error:', reportError)
      return NextResponse.json({ error: 'Failed to save synthesis report' }, { status: 500 })
    }

    // Link sources to report
    const links = source_ids.map(sid => ({
      synthesis_id: report.id,
      source_id: sid,
    }))

    await (supabase as any)
      .from('synthesis_sources')
      .insert(links)

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Synthesis generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
