/**
 * Concept Extraction - Extract key concepts from source content using AI
 *
 * COST OPTIMIZATION: Now uses Groq Llama 3.3 70B ($0.59/M tokens) instead of
 * Claude Haiku ($0.80/M tokens) for ~26% cost savings while maintaining quality.
 */

import { generateEmbedding } from '../embeddings/client'
import { quickChat } from '@/lib/ai-router/unified-client'
import { TaskType } from '@/lib/ai-router/index'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'

/**
 * Extracted concept with relevance score
 */
export interface ExtractedConcept {
  /** Concept name (1-3 words) */
  name: string
  /** Relevance score from 0-1 (how central is this concept) */
  relevance: number
  /** Brief context where this concept appears */
  context?: string
}

/**
 * Extracts key concepts from text using cost-optimized AI routing
 *
 * Uses Groq Llama 3.3 70B for concept extraction to reduce costs by 26%
 * compared to Claude Haiku while maintaining high quality results.
 *
 * @param text - Text content to analyze (truncated to 3000 chars)
 * @param apiKey - DEPRECATED: No longer needed, kept for backward compatibility
 * @param maxConcepts - Maximum number of concepts to extract (default: 10)
 * @returns Promise resolving to array of extracted concepts with relevance scores
 *
 * @example
 * const concepts = await extractConcepts(
 *   'Research paper about machine learning...',
 *   '', // apiKey no longer used
 *   10
 * )
 * // Returns: [{ name: 'machine learning', relevance: 0.95, context: '...' }, ...]
 */
export async function extractConcepts(
  text: string,
  apiKey: string, // Kept for backward compatibility but not used
  maxConcepts: number = 10
): Promise<ExtractedConcept[]> {
  try {
      const prompt = `Extract the ${maxConcepts} most important concepts, themes, or topics from this text.
Focus on:
- Key theoretical frameworks
- Important methodologies
- Main research topics
- Core ideas or themes
- Technical terms or jargon

Text:
${text.substring(0, 3000)} ${text.length > 3000 ? '...' : ''}

Respond in JSON format:
{
  "concepts": [
    {
      "name": "Concept Name",
      "relevance": 0.95,
      "context": "Brief context where this appears"
    }
  ]
}

Keep concept names concise (1-3 words). Relevance should be 0-1 (how central is this concept).`

      // Use unified AI router with SUMMARIZATION task type for cost optimization
      const response = await unifiedChatCompletion({
        messages: [
          { role: 'user', content: prompt }
        ],
        taskType: TaskType.SUMMARIZATION, // Uses Groq Llama 3.3 70B at $0.59/M
        max_tokens: 1000,
        temperature: 0.3,
        budget: 'low'
      })

      const content = response.content

      if (!content) {
        throw new Error('No content in response')
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not parse JSON')
      }

      const result = JSON.parse(jsonMatch[0])
      return result.concepts || []
  } catch (error) {
    console.error('Concept extraction error:', error)
    return []
  }
}

/**
 * Normalizes concept name to lowercase with cleaned whitespace
 *
 * Ensures consistent concept naming for deduplication and comparison.
 *
 * @param name - Concept name to normalize
 * @returns Normalized concept name
 *
 * @example
 * normalizeConcept(' Machine  Learning ') // 'machine learning'
 */
export function normalizeConcept(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Generates embedding vector for a concept name
 *
 * Uses OpenAI's text-embedding-3-small model for efficient vector generation.
 * Embeddings enable semantic similarity search across concepts.
 *
 * @param conceptName - Concept name to generate embedding for
 * @returns Promise resolving to embedding vector
 *
 * @example
 * const embedding = await generateConceptEmbedding('machine learning')
 */
export async function generateConceptEmbedding(
  conceptName: string
): Promise<number[]> {
  try {
    const result = await generateEmbedding({
      text: conceptName,
      type: 'query',
      normalize: true,
    })
    return result.embedding
  } catch (error) {
    console.error('Concept embedding error:', error)
    return []
  }
}

/**
 * Merges duplicate concepts based on normalized names
 *
 * When multiple concepts have the same normalized name, keeps the one
 * with the highest relevance score.
 *
 * @param concepts - Array of concepts to deduplicate
 * @returns Deduplicated array of concepts
 *
 * @example
 * const merged = mergeConcepts([
 *   { name: 'AI', relevance: 0.8 },
 *   { name: 'ai', relevance: 0.9 }
 * ])
 * // Returns: [{ name: 'ai', relevance: 0.9 }]
 */
export function mergeConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
  const conceptMap = new Map<string, ExtractedConcept>()

  for (const concept of concepts) {
    const normalized = normalizeConcept(concept.name)

    if (conceptMap.has(normalized)) {
      const existing = conceptMap.get(normalized)!
      // Keep higher relevance
      if (concept.relevance > existing.relevance) {
        conceptMap.set(normalized, concept)
      }
    } else {
      conceptMap.set(normalized, concept)
    }
  }

  return Array.from(conceptMap.values())
}

/**
 * Calculates frequency of concepts across multiple sources
 *
 * Returns a map of normalized concept names to their occurrence counts.
 * Useful for identifying common themes across a collection of sources.
 *
 * @param sourceConcepts - Array of source-concept pairs
 * @returns Map of concept names to frequency counts
 *
 * @example
 * const frequencies = calculateConceptFrequency([
 *   { source_id: '1', concept_name: 'AI' },
 *   { source_id: '2', concept_name: 'ai' },
 *   { source_id: '3', concept_name: 'machine learning' }
 * ])
 * // Returns: Map { 'ai' => 2, 'machine learning' => 1 }
 */
export function calculateConceptFrequency(
  sourceConcepts: Array<{ source_id: string; concept_name: string }>
): Map<string, number> {
  const frequencies = new Map<string, number>()

  for (const sc of sourceConcepts) {
    const normalized = normalizeConcept(sc.concept_name)
    frequencies.set(normalized, (frequencies.get(normalized) || 0) + 1)
  }

  return frequencies
}
