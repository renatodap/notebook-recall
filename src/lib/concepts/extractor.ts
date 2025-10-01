// Extract key concepts from source content using AI
import { generateEmbedding } from '../embeddings/client'

export interface ExtractedConcept {
  name: string
  relevance: number // 0-1
  context?: string
}

/**
 * Extract concepts from text using Claude
 */
export async function extractConcepts(
  text: string,
  apiKey: string,
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to extract concepts')
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

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
 * Normalize concept name (lowercase, trim, remove extra spaces)
 */
export function normalizeConcept(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Generate embedding for a concept
 */
export async function generateConceptEmbedding(
  conceptName: string,
  openaiKey: string
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
 * Merge duplicate concepts (same normalized name)
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
 * Calculate concept frequency across multiple sources
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
