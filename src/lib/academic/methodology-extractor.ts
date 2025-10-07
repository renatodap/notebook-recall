/**
 * Methodology Extraction - AI-powered methodology extraction from academic sources
 *
 * COST OPTIMIZATION: Now uses Groq Llama 3.3 70B ($0.59/M tokens) instead of
 * Claude Haiku ($0.80/M tokens) for ~26% cost savings while maintaining quality.
 */

import { TaskType } from '@/lib/ai-router/index'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'

/**
 * Extracted methodology information from academic source
 */
export interface ExtractedMethodology {
  /** Type of research design (experimental, qualitative, etc.) */
  research_design: string
  /** Data collection methods used */
  data_collection_methods: string[]
  /** Analysis techniques applied */
  analysis_techniques: string[]
  /** Description of sample or participants */
  sample_description?: string
  /** Limitations acknowledged by authors */
  limitations: string[]
  /** Validity/reliability considerations */
  validity_considerations?: string
  /** Direct quote of methodology section if found */
  extracted_text: string
}

/**
 * Extracts research methodology from academic source using cost-optimized AI
 *
 * Uses Groq Llama 3.3 70B for methodology extraction, reducing costs by 26%
 * compared to Claude Haiku while maintaining quality for academic analysis.
 *
 * @param sourceText - Full text of the academic source (truncated to 3000 chars)
 * @param sourceTitle - Title of the source
 * @param apiKey - DEPRECATED: No longer needed, kept for backward compatibility
 * @returns Promise resolving to extracted methodology information
 *
 * @example
 * const methodology = await extractMethodology(
 *   'Full research paper text...',
 *   'A Study on AI Ethics',
 *   '' // apiKey no longer used
 * )
 * console.log(methodology.research_design) // 'qualitative case study'
 */
export async function extractMethodology(
  sourceText: string,
  sourceTitle: string,
  apiKey: string // Kept for backward compatibility but not used
): Promise<ExtractedMethodology> {
  const prompt = `Extract the research methodology from this academic source.

Title: ${sourceTitle}
Content: ${sourceText.substring(0, 3000)}

Identify and extract:
1. Research Design (e.g., experimental, qualitative, mixed methods, case study)
2. Data Collection Methods (e.g., surveys, interviews, observations, archival)
3. Analysis Techniques (e.g., statistical tests, thematic analysis, regression)
4. Sample/Participants description
5. Limitations acknowledged by authors
6. Validity/reliability considerations

Return JSON:
{
  "research_design": "Type of research design",
  "data_collection_methods": ["Method 1", "Method 2"],
  "analysis_techniques": ["Technique 1", "Technique 2"],
  "sample_description": "Description of sample/participants",
  "limitations": ["Limitation 1", "Limitation 2"],
  "validity_considerations": "How validity/reliability was addressed",
  "extracted_text": "Direct quote of methodology section if found"
}

If methodology is not clearly stated, return best inference from available information.`

  // Use unified AI router with SUMMARIZATION task type for cost optimization
  const response = await unifiedChatCompletion({
    messages: [{ role: 'user', content: prompt }],
    taskType: TaskType.SUMMARIZATION, // Uses Groq Llama 3.3 70B at $0.59/M
    max_tokens: 2000,
    temperature: 0.3,
    budget: 'low'
  })

  const content = response.content

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch (_e) {
    return {
      research_design: 'Unknown',
      data_collection_methods: [],
      analysis_techniques: [],
      limitations: [],
      extracted_text: content,
    }
  }
}

/**
 * Compares methodologies across multiple sources to identify patterns
 *
 * Analyzes a collection of methodologies to find common research designs,
 * data collection methods, and analysis techniques. Calculates methodological
 * diversity as a metric of variety across studies.
 *
 * @param methodologies - Array of extracted methodologies to compare
 * @returns Comparison results with common patterns and diversity score
 *
 * @example
 * const comparison = compareMethodologies([
 *   { research_design: 'qualitative', ... },
 *   { research_design: 'qualitative', ... },
 *   { research_design: 'mixed methods', ... }
 * ])
 * console.log(comparison.common_designs) // ['qualitative']
 * console.log(comparison.methodological_diversity) // 12
 */
export function compareMethodologies(
  methodologies: ExtractedMethodology[]
): {
  common_designs: string[]
  common_methods: string[]
  common_analyses: string[]
  methodological_diversity: number
} {
  const allDesigns = methodologies.map(m => m.research_design)
  const allMethods = methodologies.flatMap(m => m.data_collection_methods)
  const allAnalyses = methodologies.flatMap(m => m.analysis_techniques)

  const countOccurrences = (arr: string[]) => {
    const counts: Record<string, number> = {}
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1
    })
    return counts
  }

  const designCounts = countOccurrences(allDesigns)
  const methodCounts = countOccurrences(allMethods)
  const analysisCounts = countOccurrences(allAnalyses)

  return {
    common_designs: Object.entries(designCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([design]) => design),
    common_methods: Object.entries(methodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([method]) => method),
    common_analyses: Object.entries(analysisCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([analysis]) => analysis),
    methodological_diversity: new Set([...allDesigns, ...allMethods, ...allAnalyses]).size,
  }
}
