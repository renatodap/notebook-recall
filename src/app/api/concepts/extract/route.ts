import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { extractConcepts, normalizeConcept, generateConceptEmbedding } from '@/lib/concepts/extractor'
import type { ExtractConceptsRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ExtractConceptsRequest = await request.json()
    const { source_id, min_relevance = 0.5 } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Verify user owns this source
    const { data: source, error: sourceError } = await (supabase as any)
      .from('sources')
      .select(`
        id,
        original_content,
        summaries (
          summary_text,
          key_topics
        )
      `)
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !source) {
      return NextResponse.json(
        { error: 'Source not found or access denied' },
        { status: 404 }
      )
    }

    // Combine content for concept extraction
    const summary = source.summaries?.[0]
    const textToAnalyze = [
      summary?.summary_text || '',
      ...(summary?.key_topics || []),
    ].join('\n\n')

    if (!textToAnalyze.trim()) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })
    }

    // Extract concepts using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const extractedConcepts = await extractConcepts(textToAnalyze, anthropicKey, 15)

    // Filter by relevance
    const filteredConcepts = extractedConcepts.filter(c => c.relevance >= min_relevance)

    if (filteredConcepts.length === 0) {
      return NextResponse.json({ concepts: [], total: 0 })
    }

    // Get or create concepts in database
    const conceptData = []

    for (const extracted of filteredConcepts) {
      const normalizedName = normalizeConcept(extracted.name)

      // Check if concept exists
      let { data: existingConcept } = await (supabase as any)
        .from('concepts')
        .select('*')
        .eq('normalized_name', normalizedName)
        .single()

      if (!existingConcept) {
        // Create new concept with embedding
        const openaiKey = process.env.OPENAI_API_KEY
        const embedding = openaiKey ? await generateConceptEmbedding(extracted.name, openaiKey) : null

        const { data: newConcept, error } = await (supabase as any)
          .from('concepts')
          .insert({
            name: extracted.name,
            normalized_name: normalizedName,
            embedding,
            frequency: 1,
          })
          .select()
          .single()

        if (!error && newConcept) {
          existingConcept = newConcept
        }
      } else {
        // Increment frequency
        await (supabase as any)
          .from('concepts')
          .update({ frequency: existingConcept.frequency + 1 })
          .eq('id', existingConcept.id)
      }

      if (existingConcept) {
        conceptData.push({
          ...existingConcept,
          relevance: extracted.relevance,
          context: extracted.context,
        })

        // Link concept to source
        const { data: existingLink } = await (supabase as any)
          .from('source_concepts')
          .select('*')
          .eq('source_id', source_id)
          .eq('concept_id', existingConcept.id)
          .single()

        if (!existingLink) {
          await (supabase as any)
            .from('source_concepts')
            .insert({
              source_id,
              concept_id: existingConcept.id,
              relevance: extracted.relevance,
              mentions: 1,
              context: extracted.context,
            })
        }
      }
    }

    return NextResponse.json({
      concepts: conceptData,
      total: conceptData.length,
    })
  } catch (error) {
    console.error('Concept extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
