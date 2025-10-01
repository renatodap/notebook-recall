/**
 * AI-powered methodology extraction from academic sources
 */

export interface ExtractedMethodology {
  research_design: string
  data_collection_methods: string[]
  analysis_techniques: string[]
  sample_description?: string
  limitations: string[]
  validity_considerations?: string
  extracted_text: string
}

export async function extractMethodology(
  sourceText: string,
  sourceTitle: string,
  apiKey: string
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

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch (e) {
    return {
      research_design: 'Unknown',
      data_collection_methods: [],
      analysis_techniques: [],
      limitations: [],
      extracted_text: content,
    }
  }
}

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
