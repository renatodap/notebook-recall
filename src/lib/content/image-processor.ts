import Anthropic from '@anthropic-ai/sdk'

export interface ImageProcessResult {
  content: string
  title: string
  processingMethod: 'ocr'
  confidence: number
  mediaType: string
}

/**
 * Processes an image file and extracts text content using Claude's vision API
 */
export async function processImage(
  buffer: Buffer,
  mediaType: string
): Promise<ImageProcessResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  // Validate media type
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!supportedTypes.includes(mediaType)) {
    throw new Error(`Unsupported image type: ${mediaType}. Supported types: ${supportedTypes.join(', ')}`)
  }

  try {
    const base64 = buffer.toString('base64')
    const client = new Anthropic({ apiKey: anthropicKey })

    // Use Claude with vision to extract text and understand the image
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64
            }
          },
          {
            type: 'text',
            text: 'Extract all text from this image. If there is no text, describe what you see in detail. Preserve formatting and structure. Return the extracted text or description without any additional commentary.'
          }
        ]
      }]
    })

    const extractedContent = response.content.find((c) => c.type === 'text')
    if (!extractedContent || extractedContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    const content = extractedContent.text.trim()

    // Generate a title from the content
    const titleResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Generate a brief, descriptive title (5-10 words max) for content with this text/description: "${content.substring(0, 500)}". Return only the title with no additional text.`
      }]
    })

    const titleContent = titleResponse.content.find((c) => c.type === 'text')
    const title = titleContent && titleContent.type === 'text'
      ? titleContent.text.trim()
      : 'Untitled Image'

    return {
      content,
      title,
      processingMethod: 'ocr',
      confidence: 0.95,
      mediaType
    }
  } catch (error) {
    console.error('Image processing error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid image')) {
        throw new Error('Invalid image file format')
      }
      throw error
    }

    throw new Error('Failed to process image')
  }
}

/**
 * Converts a File object to Buffer (for client-side usage)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
