import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateReviewFromTemplate, ReviewType, REVIEW_TEMPLATES } from '@/lib/academic/review-templates'
import { DatabaseSource } from '@/types/api'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { RateLimitError } from '@/lib/errors/custom-errors'

/**
 * Automated Literature Review
 * Generates a complete literature review from user's existing sources matching a topic
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_LITERATURE_REVIEW)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const { topic, template_type = 'narrative', max_sources = 20, min_relevance = 0.3 } = body

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic required' }, { status: 400 })
    }

    if (!REVIEW_TEMPLATES[template_type as ReviewType]) {
      return NextResponse.json({ error: 'Invalid template_type' }, { status: 400 })
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!anthropicKey || !openaiKey) {
      return NextResponse.json({ error: 'AI services not configured' }, { status: 500 })
    }

    // Step 1: Generate embedding for the topic
    const topicEmbedding = await generateEmbedding(topic, openaiKey)

    // Step 2: Find relevant sources using vector similarity
    const { data: matchedSources } = await supabase
      .rpc('match_sources', {
        query_embedding: topicEmbedding,
        match_threshold: min_relevance,
        match_count: max_sources,
        filter_user_id: user.id
      } as never) as { data: any[] | null }

    if (!matchedSources || (matchedSources as any[]).length === 0) {
      return NextResponse.json({
        error: 'No relevant sources found',
        suggestion: 'Try adding more sources on this topic first'
      }, { status: 404 })
    }

    // Step 3: Get full source details with summaries
    const sourceIds = matchedSources.map((s: any) => s.id)

    const { data: sources } = await supabase
      .from('sources')
      .select('id, title, summaries (summary_text)')
      .in('id', sourceIds)

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        error: 'No sources found',
        suggestion: 'Try adding more sources on this topic first'
      }, { status: 404 })
    }

    const sourcesForReview = sources.map((s: any) => ({
      title: s.title,
      summary_text: s.summaries?.[0]?.summary_text || ''
    }))

    // Step 4: Generate the literature review using the template
    const review = await generateReviewFromTemplate(
      template_type as ReviewType,
      sourcesForReview,
      anthropicKey,
      [
        `Focus the review on: ${topic}`,
        `Emphasize how sources relate to this specific topic`,
        `Organize findings thematically around ${topic}`
      ]
    )

    const template = REVIEW_TEMPLATES[template_type as ReviewType]

    // Build markdown content
    const markdownContent = `# ${review.title}\n\n` +
      `*Automated ${template.title} on "${topic}"*\n\n` +
      `*Generated from ${sources.length} relevant sources*\n\n` +
      review.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')

    // Step 5: Save to database
    const { data: output } = await supabase
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'literature_review',
        title: review.title,
        content: markdownContent,
        metadata: {
          template_type,
          topic,
          source_count: sources.length,
          auto_generated: true,
          avg_relevance: matchedSources.reduce((acc: number, s: any) => acc + (s.similarity || 0), 0) / matchedSources.length,
          word_count: markdownContent.split(/\s+/).length,
          sections: review.sections.map((s: any) => s.title)
        },
        status: 'draft'
      } as never)
      .select()
      .single()

    // Link sources
    if (output && 'id' in output) {
      const links = sourceIds.map((sid: string) => ({
        output_id: (output as { id: string }).id,
        source_id: sid
      }))
      await supabase.from('output_sources').insert(links as never)

      return NextResponse.json({
        output,
        review,
        metadata: {
          sourcesFound: sources.length,
          template: template.title,
          topic,
          relevanceScores: matchedSources.map((s: any) => ({
            source_id: s.id,
            similarity: s.similarity
          }))
        }
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'Failed to create output' }, { status: 500 })
  } catch (error) {
    console.error('Automated literature review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  const data = await response.json()
  return data.data[0].embedding
}
