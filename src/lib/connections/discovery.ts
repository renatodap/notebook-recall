/**
 * Connection Discovery - Auto-discover connections between sources
 *
 * COST OPTIMIZATION: Now uses Groq Llama 3.3 70B ($0.59/M tokens) instead of
 * Claude Haiku ($0.80/M tokens) for contradiction detection and analysis.
 */

import type { ConnectionType } from '@/types'
import { cosineSimilarity } from '@/lib/embeddings/utils'
import { TaskType } from '@/lib/ai-router/index'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'

interface Source {
  id: string
  title: string
  summary?: {
    embedding?: number[]
    summary_text?: string
  }[]
}

/**
 * Discovers similar sources based on embedding similarity
 *
 * Uses cosine similarity between source embeddings to find related content.
 * No AI API calls involved, purely mathematical comparison.
 *
 * @param sourceId - ID of the source to find similarities for
 * @param allSources - Array of all available sources with embeddings
 * @param threshold - Minimum similarity score (0-1, default: 0.7)
 * @param limit - Maximum number of similar sources to return (default: 10)
 * @returns Promise resolving to array of similar sources with strength scores
 *
 * @example
 * const similar = await discoverSimilarSources(
 *   'source-123',
 *   allSources,
 *   0.7,
 *   10
 * )
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
 * Detects contradictions between sources using cost-optimized AI
 *
 * Uses Groq Llama 3.3 70B for contradiction detection, reducing costs by 26%
 * compared to Claude Haiku while maintaining quality.
 *
 * @param sourceA - First source with summary text
 * @param sourceB - Second source with summary text
 * @param apiKey - DEPRECATED: No longer needed, kept for backward compatibility
 * @returns Promise resolving to contradiction details or null if none found
 *
 * @example
 * const contradiction = await detectContradictions(
 *   { id: '1', summary_text: 'AI is deterministic' },
 *   { id: '2', summary_text: 'AI uses randomness' },
 *   '' // apiKey no longer used
 * )
 */
export async function detectContradictions(
  sourceA: { id: string; summary_text: string },
  sourceB: { id: string; summary_text: string },
  apiKey: string // Kept for backward compatibility but not used
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

      // Use unified AI router with SUMMARIZATION task type for cost optimization
      const response = await unifiedChatCompletion({
        messages: [{ role: 'user', content: prompt }],
        taskType: TaskType.SUMMARIZATION, // Uses Groq Llama 3.3 70B at $0.59/M
        max_tokens: 500,
        temperature: 0.3,
        budget: 'low'
      })

      const content = response.content

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
 * Analyzes citation relationships from DOIs
 *
 * NOTE: Currently returns null. Implement with OpenAlex API or similar
 * citation database in the future.
 *
 * @param sourceA - First source with DOI metadata
 * @param sourceB - Second source with DOI metadata
 * @returns Citation relationship details or null
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
 * Generates human-readable evidence text for a connection
 *
 * @param connectionType - Type of connection (similar, contradicts, cites, etc.)
 * @param strength - Connection strength score (0-1)
 * @param details - Optional additional details
 * @returns Evidence description string
 *
 * @example
 * const evidence = generateConnectionEvidence('similar', 0.85)
 * // Returns: "85% semantic similarity. "
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
 * Calculates connection strength score with boosting for multiple signals
 *
 * @param connectionType - Type of connection
 * @param semanticSimilarity - Optional similarity score (0-1)
 * @param hasSharedConcepts - Whether sources share concepts
 * @param citationRelationship - Whether citation relationship exists
 * @returns Strength score from 0-1
 *
 * @example
 * const strength = scoreConnectionStrength(
 *   'similar',
 *   0.75,
 *   true,
 *   false
 * )
 * // Returns: 0.85 (0.75 + 0.1 boost for shared concepts)
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
