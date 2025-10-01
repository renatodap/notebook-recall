import * as cheerio from 'cheerio'

export interface UrlFetchResult {
  content: string
  title: string
  url: string
}

/**
 * Fetches and extracts content from a URL
 */
export async function fetchUrlContent(url: string): Promise<UrlFetchResult> {
  try {
    // Validate URL
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported')
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Parse HTML
    const $ = cheerio.load(html)

    // Remove script and style elements
    $('script, style, nav, header, footer, iframe, noscript').remove()

    // Extract title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      'Untitled'

    title = title.trim()

    // Extract main content
    // Try to find main content area
    let content = ''

    // Common content selectors
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content',
    ]

    for (const selector of contentSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        content = element.text()
        break
      }
    }

    // Fallback to body if no content found
    if (!content) {
      content = $('body').text()
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim()

    if (!content) {
      throw new Error('No content could be extracted from the URL')
    }

    return {
      content,
      title,
      url,
    }
  } catch (error) {
    console.error('URL fetch error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to URL')
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Request timed out')
      }
      if (error.message.includes('Invalid URL')) {
        throw new Error('Invalid URL format')
      }
      throw error
    }

    throw new Error('Failed to fetch URL content')
  }
}
