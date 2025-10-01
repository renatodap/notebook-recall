// @ts-expect-error - pdf-parse doesn't have types
import pdf from 'pdf-parse/lib/pdf-parse.js'

export interface PdfProcessResult {
  content: string
  title: string
  numPages: number
}

/**
 * Processes a PDF file and extracts text content
 */
export async function processPdf(buffer: Buffer): Promise<PdfProcessResult> {
  try {
    const data = await pdf(buffer)

    let content = data.text

    if (!content || content.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text')
    }

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

    return {
      content,
      title: title.trim(),
      numPages: data.numpages,
    }
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
 * Converts a File object to Buffer (for client-side usage)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
