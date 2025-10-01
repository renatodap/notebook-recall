import { ContentType } from '@/types'

/**
 * Gets the summarization prompt for Claude
 */
export function getSummarizationPrompt(
  content: string,
  contentType: ContentType
): string {
  const contentTypeLabel = {
    text: 'text content',
    url: 'web page content',
    pdf: 'PDF document',
    note: 'note',
  }[contentType]

  return `You are a helpful assistant that analyzes content and provides structured summaries.

Analyze the following ${contentTypeLabel} and provide:

1. A concise summary (2-3 paragraphs maximum) that captures the main ideas and key points
2. Key action items or takeaways (3-5 bullet points) - if no clear actions exist, provide key insights or learnings
3. Main topics/themes (3-5 tags, lowercase, single words or short phrases)

Content:
${content}

Provide your response in the following JSON format:
{
  "summary": "Your concise summary here...",
  "actions": ["Action item 1", "Action item 2", ...],
  "topics": ["topic1", "topic2", ...]
}

Important:
- Keep the summary concise but informative (2-3 paragraphs max)
- Extract actionable items when present, or provide key insights if no actions
- Topics should be single words or short phrases (lowercase)
- Respond ONLY with valid JSON, no additional text
- Ensure all strings are properly escaped for JSON`
}

/**
 * Gets the system prompt for Claude
 */
export function getSystemPrompt(): string {
  return 'You are an expert content analyst specializing in creating concise, structured summaries. You extract key information and present it in a clear, actionable format.'
}
