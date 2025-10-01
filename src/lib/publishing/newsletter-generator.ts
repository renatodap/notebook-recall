/**
 * AI-powered newsletter generation from research sources
 */

export interface NewsletterGenerationInput {
  sources: Array<{
    id: string
    title: string
    summary?: string
    key_topics?: string[]
  }>
  newsletter_name?: string
  theme?: string
  sections?: string[] // e.g., ['Top Picks', 'Quick Reads', 'Deep Dive']
  tone?: 'professional' | 'friendly' | 'educational'
  format?: 'html' | 'markdown' | 'plain'
}

export interface Newsletter {
  subject_line: string
  preview_text: string
  content: string // HTML or Markdown format
  sections: Array<{
    title: string
    content: string
  }>
  metadata: {
    source_count: number
    estimated_reading_time: number
    generated_at: string
  }
}

/**
 * Generate a newsletter using Claude AI
 */
export async function generateNewsletter(
  input: NewsletterGenerationInput,
  apiKey: string
): Promise<Newsletter> {
  const {
    sources,
    newsletter_name = 'Research Digest',
    theme,
    sections = ['Featured Research', 'Quick Reads', 'Worth Exploring'],
    tone = 'professional',
    format = 'html',
  } = input

  if (sources.length === 0) {
    throw new Error('At least one source required')
  }

  // Build context from sources
  const sourceContext = sources
    .map((s, idx) => {
      return `
[${idx + 1}] ${s.title}
${s.summary || ''}
${s.key_topics ? `Topics: ${s.key_topics.join(', ')}` : ''}
      `.trim()
    })
    .join('\n\n---\n\n')

  const prompt = `You are a newsletter writer. Create an engaging research newsletter from these sources.

Newsletter Name: ${newsletter_name}
${theme ? `Theme/Focus: ${theme}\n` : ''}Tone: ${tone}
Format: ${format}
Sections to include: ${sections.join(', ')}

Sources:

${sourceContext}

Create a newsletter that:
1. Has an engaging subject line (60 chars max) and preview text (100 chars)
2. Organizes content into the specified sections
3. Highlights the most interesting findings
4. Includes brief summaries for each source
5. Uses a ${tone} tone throughout
6. Is optimized for email reading (scannable, clear structure)
7. ${format === 'html' ? 'Uses simple, email-safe HTML formatting' : 'Uses markdown formatting'}

Return a JSON object:
{
  "subject_line": "Engaging subject line",
  "preview_text": "Preview text that entices readers to open",
  "sections": [
    {
      "title": "Section Name",
      "content": "${format === 'html' ? 'HTML' : 'Markdown'} formatted content for this section"
    }
  ]
}

Make it engaging and valuable for readers!`

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
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  let result: any

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    result = JSON.parse(jsonText)
  } catch (e) {
    result = {
      subject_line: `${newsletter_name} - Latest Research`,
      preview_text: `Curated insights from ${sources.length} sources`,
      sections: [{ title: 'Content', content }],
    }
  }

  // Combine sections into full content
  const fullContent = result.sections
    .map((section: any) => {
      if (format === 'html') {
        return `<h2>${section.title}</h2>\n${section.content}`
      } else {
        return `## ${section.title}\n\n${section.content}`
      }
    })
    .join('\n\n')

  // Calculate estimated reading time
  const wordCount = fullContent.split(/\s+/).length
  const estimatedReadingTime = Math.ceil(wordCount / 200)

  const newsletter: Newsletter = {
    subject_line: result.subject_line || `${newsletter_name} Newsletter`,
    preview_text: result.preview_text || '',
    content: fullContent,
    sections: result.sections || [],
    metadata: {
      source_count: sources.length,
      estimated_reading_time: estimatedReadingTime,
      generated_at: new Date().toISOString(),
    },
  }

  return newsletter
}

/**
 * Generate email-safe HTML wrapper for newsletter
 */
export function wrapNewsletterHTML(newsletter: Newsletter, newsletterName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsletter.subject_line}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1e40af; font-size: 28px; }
    .preview { color: #6b7280; font-size: 14px; margin-top: 10px; }
    h2 { color: #1f2937; font-size: 22px; margin-top: 30px; margin-bottom: 15px; }
    p { margin: 15px 0; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { text-align: center; padding-top: 30px; margin-top: 40px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${newsletterName}</h1>
      <div class="preview">${newsletter.preview_text}</div>
    </div>

    ${newsletter.content}

    <div class="footer">
      <p>Generated with Recall Notebook | ${newsletter.metadata.source_count} sources | ${newsletter.metadata.estimated_reading_time} min read</p>
    </div>
  </div>
</body>
</html>`
}
