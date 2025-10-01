/**
 * AI-powered contradiction detection across sources
 */

export interface ContradictionAnalysis {
  source_a_id: string
  source_b_id: string
  claim_a: string
  claim_b: string
  severity: 'minor' | 'moderate' | 'major'
  confidence: number
  explanation: string
  topic: string
}

/**
 * Detect contradictions between two sources using Claude AI
 */
export async function detectContradictions(
  sourceA: { id: string; title: string; summary: string },
  sourceB: { id: string; title: string; summary: string },
  apiKey: string
): Promise<ContradictionAnalysis[]> {
  const prompt = `You are a research analyst. Compare these two sources and identify any contradictions, conflicting findings, or disagreements.

Source A: ${sourceA.title}
${sourceA.summary}

Source B: ${sourceB.title}
${sourceB.summary}

Identify ALL contradictions, conflicts, or disagreements between these sources. For each contradiction, provide:
1. The specific claim from Source A
2. The conflicting claim from Source B
3. Severity: minor (methodological differences), moderate (different interpretations), major (directly contradictory findings)
4. Confidence: 0.0-1.0 (how certain you are this is a real contradiction)
5. Brief explanation of the conflict
6. The topic/area where the contradiction occurs

Return a JSON array:
[
  {
    "claim_a": "Specific claim from Source A",
    "claim_b": "Conflicting claim from Source B",
    "severity": "major",
    "confidence": 0.9,
    "explanation": "These claims directly contradict each other regarding...",
    "topic": "Topic area"
  }
]

Return an empty array [] if no contradictions found.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const contradictions = JSON.parse(jsonMatch ? jsonMatch[0] : content)

    return contradictions.map((c: any) => ({
      source_a_id: sourceA.id,
      source_b_id: sourceB.id,
      claim_a: c.claim_a,
      claim_b: c.claim_b,
      severity: c.severity || 'moderate',
      confidence: c.confidence || 0.5,
      explanation: c.explanation,
      topic: c.topic,
    }))
  } catch (e) {
    return []
  }
}

/**
 * Batch detect contradictions across multiple sources
 */
export async function detectAllContradictions(
  sources: Array<{ id: string; title: string; summary: string }>,
  apiKey: string,
  minConfidence: number = 0.6
): Promise<ContradictionAnalysis[]> {
  const allContradictions: ContradictionAnalysis[] = []

  // Compare each pair of sources
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      try {
        const contradictions = await detectContradictions(
          sources[i],
          sources[j],
          apiKey
        )

        // Filter by confidence threshold
        const filtered = contradictions.filter(c => c.confidence >= minConfidence)
        allContradictions.push(...filtered)

        // Rate limiting - wait 1s between API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error comparing ${sources[i].id} and ${sources[j].id}:`, error)
      }
    }
  }

  return allContradictions
}

/**
 * Group contradictions by topic
 */
export function groupContradictionsByTopic(
  contradictions: ContradictionAnalysis[]
): Record<string, ContradictionAnalysis[]> {
  const grouped: Record<string, ContradictionAnalysis[]> = {}

  for (const contradiction of contradictions) {
    const topic = contradiction.topic || 'General'
    if (!grouped[topic]) {
      grouped[topic] = []
    }
    grouped[topic].push(contradiction)
  }

  return grouped
}

/**
 * Get severity statistics
 */
export function getContradictionStats(contradictions: ContradictionAnalysis[]) {
  const stats = {
    total: contradictions.length,
    major: contradictions.filter(c => c.severity === 'major').length,
    moderate: contradictions.filter(c => c.severity === 'moderate').length,
    minor: contradictions.filter(c => c.severity === 'minor').length,
    avgConfidence: contradictions.reduce((sum, c) => sum + c.confidence, 0) / contradictions.length || 0,
  }

  return stats
}
