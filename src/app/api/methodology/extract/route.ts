import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { extractMethodology } from '@/lib/academic/methodology-extractor'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_id } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Get source
    const { data: source } = await supabase
      .from('sources')
      .select('id, title, original_content, summaries (summary_text)')
      .eq('id', source_id as never)
      .eq('user_id', user.id as never)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const text = (source as any).original_content || (source as any).summaries?.[0]?.summary_text || ''

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const methodology = await extractMethodology(text, (source as any).title, anthropicKey)

    // Save to database
    await supabase
      .from('methodologies')
      .upsert({
        source_id,
        research_design: methodology.research_design,
        data_collection_methods: methodology.data_collection_methods,
        analysis_techniques: methodology.analysis_techniques,
        sample_description: methodology.sample_description,
        limitations: methodology.limitations,
        validity_considerations: methodology.validity_considerations,
        extracted_text: methodology.extracted_text,
      } as any)

    return NextResponse.json({ methodology }, { status: 201 })
  } catch (error) {
    console.error('Methodology extraction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
