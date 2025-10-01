/**
 * AI-powered blog post generation from research sources
 */

export interface BlogGenerationInput {
  sources: Array<{
    id: string
    title: string
    summary?: string
    key_topics?: string[]
  }>
  target_audience?: 'general' | 'technical' | 'academic' | 'business'
  tone?: 'formal' | 'casual' | 'professional' | 'conversational'
  length?: 'short' | 'medium' | 'long' // 500, 1000, 2000+ words
  focus?: string
  custom_instructions?: string
}

export interface BlogPost {
  title: string
  subtitle: string | null
  content: string // markdown format
  seo_title: string
  seo_description: string
  tags: string[]
  estimated_reading_time: number
  metadata: {
    word_count: number
    source_count: number
    generated_at: string
  }
}

/**
 * Generate a blog post using Claude AI
 */
export async function generateBlogPost(
  input: BlogGenerationInput,
  apiKey: string
): Promise<BlogPost> {
  const {
    sources,
    target_audience = 'general',
    tone = 'professional',
    length = 'medium',
    focus,
    custom_instructions,
  } = input

  if (sources.length === 0) {
    throw new Error('At least one source required')
  }

  // Build context from sources
  const sourceContext = sources
    .map((s, idx) => {
      return `
[Source ${idx + 1}: ${s.title}]
${s.summary || ''}
${s.key_topics ? `Topics: ${s.key_topics.join(', ')}` : ''}
      `.trim()
    })
    .join('\n\n---\n\n')

  const lengthMap = {
    short: '500-800 words',
    medium: '1000-1500 words',
    long: '2000-2500 words',
  }

  const targetWordCount = lengthMap[length]

  // Build prompt
  const prompt = `You are a professional content writer. Transform the following research sources into an engaging, well-structured blog post.

${focus ? `Topic/Focus: ${focus}\n` : ''}Target Audience: ${target_audience}
Tone: ${tone}
Target Length: ${targetWordCount}
${custom_instructions ? `Additional Instructions: ${custom_instructions}\n` : ''}
Sources:

${sourceContext}

Generate a complete blog post that:
1. Has an attention-grabbing title and subtitle
2. Starts with a compelling hook
3. Explains key concepts clearly for the target audience
4. Uses examples and storytelling where appropriate
5. Has proper structure with headers (H2, H3)
6. Includes actionable takeaways or conclusions
7. Is optimized for SEO

Return your response as a JSON object with this structure:
{
  "title": "Main blog post title",
  "subtitle": "Optional subtitle or tagline",
  "content": "Full blog post in markdown format",
  "seo_title": "SEO-optimized title (60 chars max)",
  "seo_description": "SEO meta description (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}

Write the content in markdown format with proper headings, lists, and formatting.`

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
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  let result: any

  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content

    result = JSON.parse(jsonText)
  } catch (e) {
    // If JSON parsing fails, create structured output from raw text
    result = {
      title: 'Generated Blog Post',
      subtitle: null,
      content,
      seo_title: 'Generated Blog Post',
      seo_description: 'A blog post generated from research sources',
      tags: [],
    }
  }

  // Calculate metadata
  const wordCount = result.content.split(/\s+/).length
  const estimatedReadingTime = Math.ceil(wordCount / 200) // avg 200 words per minute

  const blogPost: BlogPost = {
    title: result.title || 'Untitled Post',
    subtitle: result.subtitle || null,
    content: result.content,
    seo_title: result.seo_title || result.title || 'Untitled Post',
    seo_description: result.seo_description || '',
    tags: result.tags || [],
    estimated_reading_time: estimatedReadingTime,
    metadata: {
      word_count: wordCount,
      source_count: sources.length,
      generated_at: new Date().toISOString(),
    },
  }

  return blogPost
}

/**
 * Generate social media posts from a blog post
 */
export async function generateSocialPosts(
  blogPost: { title: string; content: string },
  apiKey: string
): Promise<{
  twitter: string
  linkedin: string
  facebook: string
}> {
  const prompt = `Given this blog post, generate engaging social media posts for Twitter, LinkedIn, and Facebook.

Title: ${blogPost.title}
Content snippet: ${blogPost.content.substring(0, 500)}...

Return a JSON object:
{
  "twitter": "Thread or single tweet (280 chars)",
  "linkedin": "Professional post (1-2 paragraphs)",
  "facebook": "Engaging post (2-3 sentences)"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch (e) {
    return {
      twitter: `New blog post: ${blogPost.title}`,
      linkedin: `I just published a new article: ${blogPost.title}`,
      facebook: `Check out my latest post: ${blogPost.title}`,
    }
  }
}
