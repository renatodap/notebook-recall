// @ts-expect-error - pdf-parse doesn't have types
import pdf from 'pdf-parse/lib/pdf-parse.js'

export interface PdfProcessResult {
  content: string
  title: string
  numPages: number
  processingMethod?: 'text' | 'ocr' | 'hybrid'
  confidence?: number
  metadata?: {
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: string
  }
}

/**
 * Processes a PDF file and extracts text content
 * Enhanced with OCR fallback for scanned PDFs
 */
export async function processPdf(
  buffer: Buffer,
  options: {
    useOCR?: boolean
    language?: string
    minTextThreshold?: number
  } = {}
): Promise<PdfProcessResult> {
  const { useOCR = true, language = 'eng', minTextThreshold = 100 } = options

  try {
    const data = await pdf(buffer)

    let content = data.text

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim()

    // Extract title from metadata or use filename
    const title =
      data.info?.Title ||
      data.metadata?.get('dc:title') ||
      'PDF Document'

    const metadata = {
      author: data.info?.Author,
      subject: data.info?.Subject,
      keywords: data.info?.Keywords,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      creationDate: data.info?.CreationDate,
    }

    // If text extraction successful and meets threshold, return it
    if (content && content.length >= minTextThreshold) {
      return {
        content,
        title: title.trim(),
        numPages: data.numpages,
        processingMethod: 'text',
        metadata,
      }
    }

    // If text extraction failed or insufficient, try OCR
    if (useOCR && content.length < minTextThreshold) {
      const ocrResult = await performOCR(buffer, language)

      if (ocrResult.text.length > content.length) {
        return {
          content: ocrResult.text,
          title: title.trim(),
          numPages: data.numpages,
          processingMethod: 'ocr',
          confidence: ocrResult.confidence,
          metadata,
        }
      }
    }

    // Return text extraction result even if below threshold
    if (content) {
      return {
        content,
        title: title.trim(),
        numPages: data.numpages,
        processingMethod: 'text',
        metadata,
      }
    }

    throw new Error('PDF appears to be empty or contains no extractable text')
  } catch (error) {
    console.error('PDF processing error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file format')
      }
      if (error.message.includes('encrypted')) {
        throw new Error('PDF is password-protected')
      }
      throw error
    }

    throw new Error('Failed to process PDF')
  }
}

/**
 * Perform OCR on PDF using Claude's document understanding
 */
async function performOCR(buffer: Buffer, language: string): Promise<{ text: string; confidence: number }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return { text: '', confidence: 0 }
  }

  try {
    const base64 = buffer.toString('base64')

    // Use Claude with document understanding to extract text
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this PDF document. Preserve formatting, paragraphs, and structure. Return only the extracted text with no additional commentary.'
            },
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      console.error('Claude OCR API error:', await response.text())
      return { text: '', confidence: 0 }
    }

    const data = await response.json()
    const extractedText = data.content?.[0]?.text || ''

    return {
      text: extractedText.trim(),
      confidence: 0.9, // Claude is highly accurate
    }
  } catch (error) {
    console.error('Claude OCR error:', error)
    return { text: '', confidence: 0 }
  }
}

/**
 * Converts a File object to Buffer (for client-side usage)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
