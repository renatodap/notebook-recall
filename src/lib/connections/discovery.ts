// Auto-discover connections between sources
import type { SourceConnection, ConnectionType } from '@/types'
import { cosineSimilarity } from '@/lib/embeddings/utils'

interface Source {
  id: string
  title: string
  summary?: {
    embedding?: number[]
    summary_text?: string
  }[]
}

/**
 * Discover similar sources based on embedding similarity
 */
export async function discoverSimilarSources(
  sourceId: string,
  allSources: Source[],
  threshold: number = 0.7,
  limit: number = 10
): Promise<Array<{ source_id: string; strength: number; evidence: string }>> {
  const source = allSources.find((s) => s.id === sourceId)
  if (!source?.summary?.[0]?.embedding) {
    return []
  }

  const sourceEmbedding = source.summary[0].embedding
  const similarities: Array<{ source_id: string; strength: number; evidence: string }> = []

  for (const otherSource of allSources) {
    if (otherSource.id === sourceId) continue
    if (!otherSource.summary?.[0]?.embedding) continue

    const similarity = cosineSimilarity(sourceEmbedding, otherSource.summary[0].embedding)

    if (similarity >= threshold) {
      similarities.push({
        source_id: otherSource.id,
        strength: similarity,
        evidence: `${Math.round(similarity * 100)}% semantic similarity based on content analysis`,
      })
    }
  }

  // Sort by strength and limit
  return similarities.sort((a, b) => b.strength - a.strength).slice(0, limit)
}

/**
 * Detect contradictions between sources using LLM
 */
export async function detectContradictions(
  sourceA: { id: string; summary_text: string },
  sourceB: { id: string; summary_text: string },
  apiKey: string
): Promise<{ contradicts: boolean; topic: string; evidence: string } | null> {
  try {
    const prompt = `Compare these two research summaries and determine if they contradict each other:

Summary A: ${sourceA.summary_text}

Summary B: ${sourceB.summary_text}

Respond in JSON format:
{
  "contradicts": boolean,
  "topic": "the specific topic where they contradict",
  "claim_a": "what source A claims",
  "claim_b": "what source B claims",
  "severity": "minor" | "moderate" | "major"
}

Only mark as contradicting if there's a clear disagreement on facts or conclusions.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) return null

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])

    if (result.contradicts) {
      return {
        contradicts: true,
        topic: result.topic,
        evidence: `Source A: "${result.claim_a}" vs Source B: "${result.claim_b}"`,
      }
    }

    return null
  } catch (error) {
    console.error('Contradiction detection error:', error)
    return null
  }
}

/**
 * Analyze citation relationships from DOIs
 */
export function detectCitationRelationships(
  sourceA: { doi?: string; citation_metadata?: { doi?: string } },
  sourceB: { doi?: string; citation_metadata?: { doi?: string } }
): { cites: boolean; evidence: string } | null {
  const doiA = sourceA.doi || sourceA.citation_metadata?.doi
  const doiB = sourceB.doi || sourceB.citation_metadata?.doi

  if (!doiA || !doiB) return null

  // In a real implementation, we'd query citation databases
  // For now, return null (implement later with OpenAlex API)
  return null
}

/**
 * Generate connection evidence text
 */
export function generateConnectionEvidence(
  connectionType: ConnectionType,
  strength: number,
  details?: string
): string {
  switch (connectionType) {
    case 'similar':
      return `${Math.round(strength * 100)}% semantic similarity. ${details || ''}`
    case 'contradicts':
      return details || 'Sources present conflicting viewpoints'
    case 'cites':
      return details || 'Citation relationship detected'
    case 'extends':
      return details || 'This source builds upon or extends the other'
    case 'refutes':
      return details || 'This source challenges or refutes the other'
    default:
      return 'Related sources'
  }
}

/**
 * Score connection strength
 */
export function scoreConnectionStrength(
  connectionType: ConnectionType,
  semanticSimilarity?: number,
  hasSharedConcepts?: boolean,
  citationRelationship?: boolean
): number {
  let score = 0

  if (connectionType === 'similar') {
    score = semanticSimilarity || 0.5
  } else if (connectionType === 'cites') {
    score = 1.0 // Citation is definitive
  } else if (connectionType === 'contradicts') {
    score = 0.8 // High confidence in contradiction
  } else {
    score = 0.6 // Default for extends/refutes
  }

  // Boost score if multiple signals align
  if (hasSharedConcepts) score = Math.min(1.0, score + 0.1)
  if (citationRelationship) score = Math.min(1.0, score + 0.2)

  return score
}
