/**
 * AI-powered synthesis report generation
 * Combines multiple sources into cohesive literature reviews
 */

import type { Source, SynthesisReport } from '@/types'

export interface SynthesisInput {
  sources: Array<{
    id: string
    title: string
    summary?: string
    key_topics?: string[]
    content?: string
  }>
  focus?: string
  report_type?: 'literature_review' | 'comparative' | 'thematic' | 'chronological'
}

export interface SynthesisResult {
  title: string
  executive_summary: string
  themes: Array<{
    name: string
    description: string
    sources: string[] // source IDs
  }>
  key_findings: string[]
  agreements: string[]
  disagreements: string[]
  gaps: string[]
  full_report: string
  metadata: {
    source_count: number
    generated_at: string
    focus: string
    report_type: string
  }
}

/**
 * Generate a synthesis report using Claude AI
 */
export async function generateSynthesisReport(
  input: SynthesisInput,
  apiKey: string
): Promise<SynthesisResult> {
  const { sources, focus, report_type = 'literature_review' } = input

  if (sources.length === 0) {
    throw new Error('At least one source required for synthesis')
  }

  // Build context from sources
  const sourceContext = sources
    .map((s, idx) => {
      return `
[Source ${idx + 1}: ${s.title}]
${s.summary || s.content || 'No content available'}
${s.key_topics ? `Key Topics: ${s.key_topics.join(', ')}` : ''}
      `.trim()
    })
    .join('\n\n---\n\n')

  // Build prompt based on report type
  let prompt = ''

  switch (report_type) {
    case 'literature_review':
      prompt = `You are a research assistant tasked with synthesizing a literature review from multiple sources.

${focus ? `Focus: ${focus}\n\n` : ''}Sources to synthesize:

${sourceContext}

Generate a comprehensive literature review that:
1. Identifies major themes across the sources
2. Highlights key findings and contributions
3. Points out areas of agreement among sources
4. Notes any disagreements or conflicting findings
5. Identifies research gaps or future directions

Return your analysis as a JSON object with this exact structure:
{
  "title": "A clear title for the synthesis",
  "executive_summary": "2-3 paragraph overview",
  "themes": [
    {
      "name": "Theme name",
      "description": "Detailed description of this theme",
      "sources": ["0", "1", "2"] // indices of relevant sources
    }
  ],
  "key_findings": ["Finding 1", "Finding 2", ...],
  "agreements": ["Area of agreement 1", ...],
  "disagreements": ["Area of disagreement 1", ...],
  "gaps": ["Research gap 1", ...],
  "full_report": "A complete narrative synthesis in markdown format (3-5 pages)"
}

Be thorough and scholarly. Cite sources by their index number when making claims.`
      break

    case 'comparative':
      prompt = `Compare and contrast the following sources, identifying similarities, differences, and unique contributions of each:

${sourceContext}

Return a JSON analysis with themes, agreements, disagreements, and a full comparative report.`
      break

    case 'thematic':
      prompt = `Conduct a thematic analysis of these sources, identifying recurring themes and patterns:

${sourceContext}

Return a JSON analysis emphasizing themes and their manifestations across sources.`
      break

    case 'chronological':
      prompt = `Analyze these sources in chronological context, showing the evolution of ideas and research:

${sourceContext}

Return a JSON analysis showing how ideas have developed over time.`
      break
  }

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  let result: SynthesisResult

  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content

    const parsed = JSON.parse(jsonText)

    result = {
      title: parsed.title || 'Synthesis Report',
      executive_summary: parsed.executive_summary || '',
      themes: parsed.themes || [],
      key_findings: parsed.key_findings || [],
      agreements: parsed.agreements || [],
      disagreements: parsed.disagreements || [],
      gaps: parsed.gaps || [],
      full_report: parsed.full_report || content,
      metadata: {
        source_count: sources.length,
        generated_at: new Date().toISOString(),
        focus: focus || '',
        report_type,
      },
    }
  } catch (e) {
    // If JSON parsing fails, use the raw text as full_report
    result = {
      title: 'Synthesis Report',
      executive_summary: 'See full report below',
      themes: [],
      key_findings: [],
      agreements: [],
      disagreements: [],
      gaps: [],
      full_report: content,
      metadata: {
        source_count: sources.length,
        generated_at: new Date().toISOString(),
        focus: focus || '',
        report_type,
      },
    }
  }

  return result
}

/**
 * Extract key themes from multiple sources
 */
export async function extractThemes(
  sources: SynthesisInput['sources'],
  apiKey: string
): Promise<Array<{ name: string; description: string; sources: string[] }>> {
  const sourceContext = sources
    .map((s, idx) => `[${idx}] ${s.title}: ${s.summary || s.content || ''}`)
    .join('\n\n')

  const prompt = `Identify the 5-8 major themes across these sources:

${sourceContext}

Return a JSON array of themes:
[
  {
    "name": "Theme name",
    "description": "What this theme is about",
    "sources": ["0", "2", "3"]
  }
]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const themes = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    return themes
  } catch (e) {
    return []
  }
}
