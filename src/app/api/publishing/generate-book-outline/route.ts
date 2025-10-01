import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 30: Book Outline Generator
 * Generate comprehensive book outlines from research sources
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      source_ids,
      book_title,
      book_type = 'academic',
      target_audience = 'academic',
      chapter_count = 12
    } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    const { data: sources } = await (supabase as any)
      .from('sources')
      .select('id, title, summaries (summary_text, key_topics)')
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found' }, { status: 404 })
    }

    const sourceContext = sources.map((s: any, idx: number) =>
      `[${idx + 1}] ${s.title}\nTopics: ${s.summaries?.[0]?.key_topics?.join(', ') || 'N/A'}\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n')

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const prompt = `Create a comprehensive book outline based on these research sources.

Book Type: ${book_type}
Target Audience: ${target_audience}
Desired Chapter Count: ${chapter_count}
${book_title ? `Proposed Title: ${book_title}\n` : ''}
Sources:
${sourceContext}

Generate a complete book outline with:
- Compelling book title (if not provided)
- Subtitle that captures the scope
- Front matter (preface, acknowledgments, how to use this book)
- Part divisions (if applicable, group chapters into 3-5 parts)
- Chapter breakdown with:
  - Chapter number and title
  - Chapter synopsis (2-3 sentences)
  - Key concepts to cover
  - Learning objectives or key takeaways
  - Suggested length (pages)
- Back matter (appendices, glossary, references, index)
- Target word count and timeline estimate

Return JSON:
{
  "title": "Book title",
  "subtitle": "Subtitle",
  "frontMatter": ["Preface", "Acknowledgments", "How to Use This Book"],
  "parts": [
    {
      "number": 1,
      "title": "Part Title",
      "description": "Part description",
      "chapters": [1, 2, 3]
    }
  ],
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "synopsis": "What this chapter covers",
      "keyConcepts": ["Concept 1", "Concept 2"],
      "learningObjectives": ["Objective 1", "Objective 2"],
      "suggestedPages": 20
    }
  ],
  "backMatter": ["Appendix A: ...", "Glossary", "References", "Index"],
  "targetWordCount": 80000,
  "estimatedTimeline": "12-18 months"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text

    let outline: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      outline = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      outline = { title: book_title || 'Book Outline', chapters: [] }
    }

    // Build markdown outline
    const markdownContent = `# ${outline.title}\n\n` +
      `## ${outline.subtitle}\n\n` +
      `**Target Word Count**: ${outline.targetWordCount?.toLocaleString() || 'TBD'}\n` +
      `**Estimated Timeline**: ${outline.estimatedTimeline || 'TBD'}\n\n` +
      `---\n\n` +
      `## Front Matter\n${outline.frontMatter?.map((fm: string) => `- ${fm}`).join('\n') || ''}\n\n` +
      `## Main Content\n\n` +
      (outline.parts?.map((part: any) =>
        `### Part ${part.number}: ${part.title}\n${part.description}\n\n` +
        outline.chapters
          .filter((ch: any) => part.chapters?.includes(ch.number))
          .map((ch: any) =>
            `#### Chapter ${ch.number}: ${ch.title}\n\n` +
            `${ch.synopsis}\n\n` +
            `**Key Concepts**: ${ch.keyConcepts?.join(', ') || 'TBD'}\n\n` +
            `**Learning Objectives**:\n${ch.learningObjectives?.map((lo: string) => `- ${lo}`).join('\n') || 'TBD'}\n\n` +
            `**Suggested Length**: ${ch.suggestedPages || 'TBD'} pages\n`
          ).join('\n')
      ).join('\n---\n\n') || '') +
      `\n## Back Matter\n${outline.backMatter?.map((bm: string) => `- ${bm}`).join('\n') || ''}`

    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'book_outline',
        title: outline.title,
        content: markdownContent,
        metadata: {
          book_type,
          target_audience,
          chapter_count: outline.chapters?.length || chapter_count,
          target_word_count: outline.targetWordCount,
          estimated_timeline: outline.estimatedTimeline,
          parts_count: outline.parts?.length || 0,
          source_count: sources.length
        },
        status: 'draft'
      })
      .select()
      .single()

    const links = source_ids.map((sid: string) => ({
      output_id: output.id,
      source_id: sid
    }))
    await (supabase as any).from('output_sources').insert(links)

    return NextResponse.json({ output, outline }, { status: 201 })
  } catch (error) {
    console.error('Book outline generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
