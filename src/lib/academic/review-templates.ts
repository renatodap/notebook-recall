/**
 * Literature Review Templates
 * Pre-built structures for different types of academic literature reviews
 */

export type ReviewType = 'systematic' | 'narrative' | 'scoping' | 'meta-analysis' | 'critical' | 'integrative'

export interface ReviewTemplate {
  type: ReviewType
  title: string
  description: string
  sections: ReviewSection[]
  guidelines: string[]
  wordCount: { min: number; max: number }
}

export interface ReviewSection {
  title: string
  description: string
  prompts: string[]
  wordCount?: { min: number; max: number }
}

export const REVIEW_TEMPLATES: Record<ReviewType, ReviewTemplate> = {
  systematic: {
    type: 'systematic',
    title: 'Systematic Literature Review',
    description: 'A rigorous, protocol-driven review that aims to minimize bias through systematic search and appraisal methods.',
    wordCount: { min: 5000, max: 10000 },
    guidelines: [
      'Define clear research questions (PICO format recommended)',
      'Document comprehensive search strategy across multiple databases',
      'Establish inclusion/exclusion criteria',
      'Use quality assessment tools (CASP, Joanna Briggs, etc.)',
      'Follow PRISMA guidelines for reporting',
      'Consider pre-registration (PROSPERO)',
    ],
    sections: [
      {
        title: 'Introduction',
        description: 'Context and rationale for the review',
        wordCount: { min: 500, max: 1000 },
        prompts: [
          'What is the background and significance of this topic?',
          'What gaps exist in current systematic reviews?',
          'What are the specific review questions/objectives?',
        ]
      },
      {
        title: 'Methods',
        description: 'Detailed search and selection protocol',
        wordCount: { min: 1000, max: 2000 },
        prompts: [
          'What databases were searched and with what strategy?',
          'What were the inclusion/exclusion criteria?',
          'How was study quality assessed?',
          'What data extraction methods were used?',
          'How many reviewers were involved and how were disagreements resolved?',
        ]
      },
      {
        title: 'Results',
        description: 'Study characteristics and findings',
        wordCount: { min: 2000, max: 4000 },
        prompts: [
          'How many studies were included (PRISMA flowchart)?',
          'What are the characteristics of included studies?',
          'What are the quality assessment results?',
          'What are the main findings organized by research question?',
          'What is the strength of evidence?',
        ]
      },
      {
        title: 'Discussion',
        description: 'Synthesis and implications',
        wordCount: { min: 1000, max: 2000 },
        prompts: [
          'How do findings address the research questions?',
          'What are the limitations of included studies?',
          'What are the implications for practice/policy?',
          'What future research is needed?',
        ]
      },
      {
        title: 'Conclusion',
        description: 'Summary of key findings',
        wordCount: { min: 500, max: 1000 },
        prompts: [
          'What are the main takeaways?',
          'How does this review contribute to the field?',
        ]
      }
    ]
  },

  narrative: {
    type: 'narrative',
    title: 'Narrative Literature Review',
    description: 'A comprehensive overview providing broad perspective on a topic, synthesizing published research.',
    wordCount: { min: 3000, max: 8000 },
    guidelines: [
      'Provide comprehensive coverage of the topic',
      'Organize thematically or chronologically',
      'Critical analysis rather than just description',
      'Identify patterns, themes, and trends',
      'Acknowledge limitations of selection method',
    ],
    sections: [
      {
        title: 'Introduction',
        description: 'Scope and purpose of the review',
        prompts: [
          'What is the topic and its importance?',
          'What is the scope of this review?',
          'How is the review organized?',
        ]
      },
      {
        title: 'Thematic Analysis',
        description: 'Main themes and findings organized by topic',
        prompts: [
          'What are the major themes in the literature?',
          'How do different researchers approach this topic?',
          'What are the key debates and controversies?',
          'What methodological approaches are common?',
        ]
      },
      {
        title: 'Critical Evaluation',
        description: 'Assessment of the literature',
        prompts: [
          'What are the strengths and limitations of existing research?',
          'What gaps or inconsistencies exist?',
          'How has the field evolved over time?',
        ]
      },
      {
        title: 'Synthesis and Future Directions',
        description: 'Integration of findings and recommendations',
        prompts: [
          'What are the key conclusions from the literature?',
          'What are the implications for theory and practice?',
          'What research directions should be pursued?',
        ]
      }
    ]
  },

  scoping: {
    type: 'scoping',
    title: 'Scoping Review',
    description: 'A preliminary assessment to map the extent, range, and nature of research activity in a field.',
    wordCount: { min: 4000, max: 8000 },
    guidelines: [
      'Follow Arksey & O\'Malley framework or JBI methodology',
      'Clarify purpose: exploring breadth, identifying gaps, or clarifying concepts',
      'Be transparent about search process',
      'Consider stakeholder consultation',
      'Map rather than synthesize findings',
    ],
    sections: [
      {
        title: 'Introduction',
        description: 'Rationale and objectives',
        prompts: [
          'Why is a scoping review appropriate for this topic?',
          'What are the specific review objectives?',
          'What is the research question?',
        ]
      },
      {
        title: 'Methods',
        description: 'Search strategy and selection criteria',
        prompts: [
          'What search strategy was employed?',
          'What sources were searched?',
          'What were the selection criteria?',
          'How were studies charted?',
        ]
      },
      {
        title: 'Results',
        description: 'Descriptive overview of literature',
        prompts: [
          'How many and what types of studies were identified?',
          'What is the distribution by year, geography, methodology?',
          'What are the main research areas identified?',
          'What conceptual frameworks are being used?',
        ]
      },
      {
        title: 'Discussion',
        description: 'Implications of the mapping',
        prompts: [
          'What does the map of literature reveal?',
          'What gaps or opportunities exist?',
          'What are the implications for future systematic reviews or research?',
        ]
      }
    ]
  },

  'meta-analysis': {
    type: 'meta-analysis',
    title: 'Meta-Analysis',
    description: 'Statistical synthesis of quantitative data from multiple studies to produce a single estimate of effect.',
    wordCount: { min: 5000, max: 12000 },
    guidelines: [
      'Require quantitative outcome data from comparable studies',
      'Address heterogeneity (I² statistic)',
      'Consider publication bias (funnel plots, Egger\'s test)',
      'Choose appropriate effect size measure',
      'Use fixed or random effects models as appropriate',
      'Conduct sensitivity analyses',
    ],
    sections: [
      {
        title: 'Introduction',
        description: 'Research question and hypotheses',
        prompts: [
          'What specific effect or relationship is being examined?',
          'What is the theoretical rationale?',
          'What are the hypotheses?',
        ]
      },
      {
        title: 'Methods',
        description: 'Search strategy and statistical approach',
        prompts: [
          'What was the search strategy?',
          'What inclusion criteria were applied?',
          'What effect size measures were used?',
          'What meta-analytic model was employed?',
          'How were heterogeneity and publication bias assessed?',
        ]
      },
      {
        title: 'Results',
        description: 'Statistical findings and heterogeneity analysis',
        prompts: [
          'How many studies and participants were included?',
          'What is the overall effect size and confidence interval?',
          'What is the level of heterogeneity?',
          'Were there signs of publication bias?',
          'What do subgroup analyses reveal?',
        ]
      },
      {
        title: 'Discussion',
        description: 'Interpretation and limitations',
        prompts: [
          'How should the pooled effect size be interpreted?',
          'What explains the heterogeneity?',
          'What are the limitations?',
          'What are the implications?',
        ]
      }
    ]
  },

  critical: {
    type: 'critical',
    title: 'Critical Review',
    description: 'Analytical examination that evaluates and critiques the literature, often from a theoretical perspective.',
    wordCount: { min: 3000, max: 7000 },
    guidelines: [
      'Focus on analysis and critique rather than description',
      'Evaluate theoretical frameworks and assumptions',
      'Identify paradigmatic biases',
      'Challenge dominant narratives',
      'Propose alternative interpretations',
    ],
    sections: [
      {
        title: 'Introduction',
        description: 'Critical perspective and aims',
        prompts: [
          'What is the critical lens being applied?',
          'What assumptions or paradigms are being questioned?',
          'What are the aims of this critical analysis?',
        ]
      },
      {
        title: 'Theoretical Framework',
        description: 'Conceptual approach to the critique',
        prompts: [
          'What theoretical framework guides this critique?',
          'How does this framework challenge existing literature?',
        ]
      },
      {
        title: 'Critical Analysis',
        description: 'Detailed critique of the literature',
        prompts: [
          'What are the dominant theoretical perspectives?',
          'What assumptions underlie the existing research?',
          'What voices or perspectives are marginalized?',
          'What methodological limitations affect the field?',
          'What contradictions or tensions exist?',
        ]
      },
      {
        title: 'Reconceptualization',
        description: 'Alternative frameworks or approaches',
        prompts: [
          'What alternative conceptualizations are possible?',
          'How might the field benefit from different approaches?',
          'What new research directions emerge from this critique?',
        ]
      }
    ]
  },

  integrative: {
    type: 'integrative',
    title: 'Integrative Review',
    description: 'Comprehensive review that includes diverse methodologies to provide holistic understanding.',
    wordCount: { min: 4000, max: 9000 },
    guidelines: [
      'Include diverse research designs (experimental, non-experimental, theoretical)',
      'Follow Whittemore & Knafl framework',
      'Develop clear data analysis strategy',
      'Maintain rigor in synthesis',
      'Generate new frameworks or perspectives',
    ],
    sections: [
      {
        title: 'Problem Identification',
        description: 'Defining the review focus',
        prompts: [
          'What is the problem or phenomenon of interest?',
          'Why is an integrative approach needed?',
          'What are the review questions?',
        ]
      },
      {
        title: 'Literature Search',
        description: 'Comprehensive search strategy',
        prompts: [
          'What search strategies were used?',
          'What types of literature were included?',
          'How were studies selected?',
        ]
      },
      {
        title: 'Data Evaluation',
        description: 'Quality assessment across diverse designs',
        prompts: [
          'How was quality assessed across different study types?',
          'What were the characteristics of included studies?',
        ]
      },
      {
        title: 'Data Analysis',
        description: 'Synthesis and pattern identification',
        prompts: [
          'How were data from diverse sources synthesized?',
          'What patterns and themes emerged?',
          'How were conflicting findings reconciled?',
        ]
      },
      {
        title: 'Presentation',
        description: 'Integrated findings and new frameworks',
        prompts: [
          'What is the integrated understanding of the phenomenon?',
          'What new frameworks or models emerge?',
          'What are the implications for practice and future research?',
        ]
      }
    ]
  }
}

/**
 * Generate a literature review structure based on sources and template
 */
export async function generateReviewFromTemplate(
  template: ReviewType,
  sources: Array<{ title: string; summary_text: string }>,
  apiKey: string,
  customPrompts?: string[]
): Promise<{
  title: string
  sections: Array<{
    title: string
    content: string
  }>
}> {
  const reviewTemplate = REVIEW_TEMPLATES[template]

  const sourceContext = sources.map((s, i) =>
    `[${i + 1}] ${s.title}\n${s.summary_text}`
  ).join('\n\n')

  const prompt = `Generate a ${reviewTemplate.title} based on these sources.

Template Guidelines:
${reviewTemplate.guidelines.map(g => `- ${g}`).join('\n')}

Expected Sections:
${reviewTemplate.sections.map(s =>
    `${s.title}: ${s.description}\nAddress: ${s.prompts.join(', ')}`
  ).join('\n\n')}

Sources:
${sourceContext}

${customPrompts ? `\nAdditional Focus:\n${customPrompts.join('\n')}` : ''}

Return JSON:
{
  "title": "Review title",
  "sections": [
    {"title": "Section Title", "content": "Section content in markdown"}
  ]
}`

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
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {
    return {
      title: reviewTemplate.title,
      sections: [{ title: 'Content', content }]
    }
  }
}
