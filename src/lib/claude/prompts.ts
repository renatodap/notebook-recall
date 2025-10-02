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
    image: 'image content',
  }[contentType]

  return `You are a helpful assistant that analyzes content and provides structured summaries with actionable insights.

Analyze the following ${contentTypeLabel} and provide:

1. **Summary**: A concise summary (2-3 paragraphs maximum) that captures the main ideas and key points
2. **Action Points**: Specific, actionable tasks or insights extracted from the content. Look for:
   - Explicit action items or tasks mentioned
   - Recommendations or suggestions
   - Next steps or follow-ups
   - Key decisions to be made
   - Important takeaways or learnings to apply
   - Things to remember or reference later
   (Provide 3-7 action points)

3. **Topics**: Main topics/themes (3-5 tags, lowercase, single words or short phrases)

Content:
${content}

Provide your response in the following JSON format:
{
  "summary": "Your concise summary here...",
  "actions": ["Action item 1", "Action item 2", "Key insight to remember", ...],
  "topics": ["topic1", "topic2", ...]
}

Important:
- Keep the summary concise but informative (2-3 paragraphs max)
- Action points should be specific and actionable (start with verbs when possible: "Review...", "Consider...", "Remember...")
- If no explicit actions exist, extract key insights, learnings, or important points to remember
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
