/**
 * AI-powered research gap analysis
 */

export interface ResearchGap {
  title: string
  description: string
  category: 'methodological' | 'theoretical' | 'empirical' | 'practical'
  severity: 'minor' | 'moderate' | 'major'
  evidence: string[]
  potential_impact: string
  suggested_approaches?: string[]
}

export interface GapAnalysis {
  executive_summary: string
  total_gaps: number
  gaps_by_category: Record<string, number>
  identified_gaps: ResearchGap[]
  recommendations: string[]
  future_directions: string[]
}

/**
 * Analyze research gaps across multiple sources using Claude AI
 */
export async function analyzeResearchGaps(
  sources: Array<{
    id: string
    title: string
    summary: string
    key_topics?: string[]
  }>,
  apiKey: string,
  focus?: string
): Promise<GapAnalysis> {
  if (sources.length < 2) {
    throw new Error('At least 2 sources required for gap analysis')
  }

  // Build context from sources
  const sourceContext = sources
    .map((s, idx) => {
      return `
[Source ${idx + 1}: ${s.title}]
${s.summary}
${s.key_topics ? `Topics: ${s.key_topics.join(', ')}` : ''}
      `.trim()
    })
    .join('\n\n---\n\n')

  const prompt = `You are a research analyst conducting a gap analysis. Examine these sources and identify research gaps, limitations, and opportunities for future research.

${focus ? `Research Focus: ${focus}\n\n` : ''}Sources to analyze:

${sourceContext}

Conduct a comprehensive gap analysis:
1. Identify what questions remain unanswered
2. Point out methodological limitations
3. Note theoretical gaps or inconsistencies
4. Highlight areas lacking empirical evidence
5. Suggest practical applications not yet explored
6. Recommend future research directions

For each gap, categorize as:
- **methodological**: Research methods or approaches needed
- **theoretical**: Theory development or clarification needed
- **empirical**: Data or evidence needed
- **practical**: Real-world applications or implementations needed

Return a JSON object with this structure:
{
  "executive_summary": "2-3 paragraph overview of key gaps",
  "identified_gaps": [
    {
      "title": "Clear, specific gap title",
      "description": "Detailed explanation of the gap",
      "category": "methodological|theoretical|empirical|practical",
      "severity": "minor|moderate|major",
      "evidence": ["Quote or reference from sources showing this gap"],
      "potential_impact": "Why addressing this gap matters",
      "suggested_approaches": ["Potential ways to address this gap"]
    }
  ],
  "recommendations": ["Key recommendation 1", "Key recommendation 2"],
  "future_directions": ["Future direction 1", "Future direction 2"]
}

Be specific and actionable.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    const parsed = JSON.parse(jsonText)

    // Calculate statistics
    const gapsByCategory: Record<string, number> = {
      methodological: 0,
      theoretical: 0,
      empirical: 0,
      practical: 0,
    }

    parsed.identified_gaps?.forEach((gap: ResearchGap) => {
      gapsByCategory[gap.category] = (gapsByCategory[gap.category] || 0) + 1
    })

    const analysis: GapAnalysis = {
      executive_summary: parsed.executive_summary || '',
      total_gaps: parsed.identified_gaps?.length || 0,
      gaps_by_category: gapsByCategory,
      identified_gaps: parsed.identified_gaps || [],
      recommendations: parsed.recommendations || [],
      future_directions: parsed.future_directions || [],
    }

    return analysis
  } catch (e) {
    throw new Error('Failed to parse gap analysis results')
  }
}

/**
 * Prioritize gaps by severity and potential impact
 */
export function prioritizeGaps(gaps: ResearchGap[]): ResearchGap[] {
  const severityScore = { major: 3, moderate: 2, minor: 1 }

  return [...gaps].sort((a, b) => {
    return severityScore[b.severity] - severityScore[a.severity]
  })
}

/**
 * Get gaps by category
 */
export function getGapsByCategory(gaps: ResearchGap[]): Record<string, ResearchGap[]> {
  const grouped: Record<string, ResearchGap[]> = {
    methodological: [],
    theoretical: [],
    empirical: [],
    practical: [],
  }

  gaps.forEach(gap => {
    grouped[gap.category].push(gap)
  })

  return grouped
}
