import Anthropic from '@anthropic-ai/sdk'

export interface ParsedQuery {
  keywords: string[]
  timeRange?: {
    start?: Date
    end?: Date
    relative?: string // 'last week', 'last month', 'yesterday'
  }
  contentType?: string // 'pdf', 'url', 'note', etc.
  topics?: string[]
  intent: 'search' | 'recall' | 'summarize' | 'filter'
  originalQuery: string
}

/**
 * Parses conversational search queries into structured search parameters
 * Examples:
 * - "Show me AI podcasts from last month"
 * - "What did I learn about machine learning yesterday?"
 * - "Remind me about the research paper on neural networks"
 */
export async function parseConversationalQuery(query: string): Promise<ParsedQuery> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Parse this conversational search query into structured parameters:

Query: "${query}"

Extract:
1. Keywords (main search terms)
2. Time range (if mentioned: "yesterday", "last week", "in August", "from June", etc.)
3. Content type (if specified: PDF, article, video, note, etc.)
4. Topics/themes mentioned
5. Intent (search, recall, summarize, or filter)

Respond with JSON:
{
  "keywords": ["keyword1", "keyword2"],
  "timeRange": {
    "relative": "last week" (or null if not specified)
  },
  "contentType": "pdf" (or null if not specified),
  "topics": ["topic1", "topic2"],
  "intent": "search" | "recall" | "summarize" | "filter"
}

Important:
- Extract actual search keywords, not meta words like "show", "find", "remind"
- Time ranges should be natural language like "last week", "yesterday", "last month"
- Intent: "recall" = remembering something, "search" = finding something, "summarize" = wanting summary, "filter" = narrowing down
- Be concise and only include relevant terms`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const parsed = JSON.parse(text)

    // Convert relative time to actual dates
    const timeRange = parsed.timeRange?.relative
      ? parseRelativeTime(parsed.timeRange.relative)
      : undefined

    return {
      keywords: parsed.keywords || [],
      timeRange,
      contentType: parsed.contentType || undefined,
      topics: parsed.topics || [],
      intent: parsed.intent || 'search',
      originalQuery: query
    }

  } catch (error) {
    console.error('Query parsing error:', error)

    // Fallback: simple keyword extraction
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => !STOP_WORDS.includes(w))

    return {
      keywords: words,
      intent: 'search',
      originalQuery: query
    }
  }
}

function parseRelativeTime(relative: string): { start: Date; end: Date } | undefined {
  const now = new Date()
  const start = new Date()

  const lower = relative.toLowerCase()

  if (lower.includes('today')) {
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (lower.includes('yesterday')) {
    start.setDate(now.getDate() - 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (lower.includes('last week') || lower.includes('past week')) {
    start.setDate(now.getDate() - 7)
    return { start, end: now }
  }

  if (lower.includes('last month') || lower.includes('past month')) {
    start.setMonth(now.getMonth() - 1)
    return { start, end: now }
  }

  if (lower.includes('last year') || lower.includes('past year')) {
    start.setFullYear(now.getFullYear() - 1)
    return { start, end: now }
  }

  // Month names
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']

  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) {
      const monthStart = new Date(now.getFullYear(), i, 1)
      const monthEnd = new Date(now.getFullYear(), i + 1, 0)
      return { start: monthStart, end: monthEnd }
    }
  }

  return undefined
}

const STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'about', 'what', 'which', 'who', 'when',
  'where', 'why', 'how', 'show', 'find', 'get', 'tell', 'me', 'my', 'i',
  'you', 'your', 'it', 'its', 'that', 'this', 'these', 'those', 'all',
  'some', 'any', 'each', 'every', 'both', 'few', 'more', 'most', 'many',
  'remind'
]
