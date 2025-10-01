/**
 * PDF Processing with OCR support
 * Handles both text-based PDFs and scanned documents
 */

export interface PDFProcessingResult {
  text: string
  pages: number
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: string
  }
  processingMethod: 'text' | 'ocr' | 'hybrid'
  confidence?: number
}

export interface OCRResult {
  text: string
  confidence: number
  language: string
}

/**
 * Process PDF using browser-based extraction
 * Falls back to OCR if text extraction yields minimal content
 */
export async function processPDF(
  buffer: Buffer | ArrayBuffer,
  options: {
    useOCR?: boolean
    language?: string
    minTextThreshold?: number
  } = {}
): Promise<PDFProcessingResult> {
  const {
    useOCR = true,
    language = 'eng',
    minTextThreshold = 100
  } = options

  try {
    // Try text extraction first (requires pdf-parse package)
    const textResult = await extractTextFromPDF(buffer)

    // If text extraction successful and meets threshold, return it
    if (textResult.text.length >= minTextThreshold) {
      return {
        ...textResult,
        processingMethod: 'text'
      }
    }

    // If text extraction failed or insufficient, try OCR
    if (useOCR) {
      const ocrResult = await performOCR(buffer, language)
      return {
        text: ocrResult.text,
        pages: textResult.pages || 0,
        metadata: textResult.metadata,
        processingMethod: 'ocr',
        confidence: ocrResult.confidence
      }
    }

    // Return whatever we got
    return textResult
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Extract text from PDF using pdf-parse
 * This handles text-based PDFs efficiently
 */
async function extractTextFromPDF(buffer: Buffer | ArrayBuffer): Promise<PDFProcessingResult> {
  // Note: This requires pdf-parse npm package
  // For now, using placeholder that works with pdfjs-dist (already in package.json)

  // Convert ArrayBuffer to Buffer if needed
  const pdfBuffer = buffer instanceof ArrayBuffer
    ? Buffer.from(buffer)
    : buffer

  try {
    // Use pdf-parse if available
    // In production, install: npm install pdf-parse
    const pdfParse = await import('pdf-parse').catch(() => null)

    if (pdfParse) {
      const data = await pdfParse.default(pdfBuffer)
      return {
        text: data.text,
        pages: data.numpages,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          keywords: data.info?.Keywords,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate,
        },
        processingMethod: 'text'
      }
    }

    // Fallback: Basic extraction
    return {
      text: '',
      pages: 0,
      processingMethod: 'text'
    }
  } catch (error) {
    return {
      text: '',
      pages: 0,
      processingMethod: 'text'
    }
  }
}

/**
 * Perform OCR on PDF using external service or Tesseract
 * For production: Use OCR.space, Google Cloud Vision, or Tesseract.js
 */
async function performOCR(buffer: Buffer | ArrayBuffer, language: string): Promise<OCRResult> {
  // Option 1: Use OCR.space API (free tier available)
  const ocrSpaceKey = process.env.OCR_SPACE_API_KEY

  if (ocrSpaceKey) {
    try {
      const formData = new FormData()
      const uint8Array = buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : new Uint8Array(buffer)
      const blob = new Blob([uint8Array], { type: 'application/pdf' })

      formData.append('file', blob, 'document.pdf')
      formData.append('language', language)
      formData.append('isOverlayRequired', 'false')
      formData.append('detectOrientation', 'true')
      formData.append('scale', 'true')

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': ocrSpaceKey,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.ParsedResults && result.ParsedResults[0]) {
        return {
          text: result.ParsedResults[0].ParsedText || '',
          confidence: result.ParsedResults[0].TextOverlay?.Lines?.reduce(
            (acc: number, line: any) => acc + (line.MaxHeight || 0),
            0
          ) / (result.ParsedResults[0].TextOverlay?.Lines?.length || 1) || 0.8,
          language
        }
      }
    } catch (error) {
      console.error('OCR.space error:', error)
    }
  }

  // Option 2: Use Claude's vision capabilities for OCR
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (anthropicKey) {
    try {
      // Convert PDF to images first (simplified - would need pdf-to-png in production)
      const base64 = (buffer instanceof ArrayBuffer
        ? Buffer.from(buffer)
        : buffer
      ).toString('base64')

      // Use Claude with vision to extract text
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
                text: 'Extract all text from this PDF document. Preserve formatting, paragraphs, and structure. Return only the extracted text.'
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

      const data = await response.json()
      const extractedText = data.content?.[0]?.text || ''

      return {
        text: extractedText,
        confidence: 0.9, // Claude is highly accurate
        language
      }
    } catch (error) {
      console.error('Claude OCR error:', error)
    }
  }

  // Fallback: Return empty result
  return {
    text: '',
    confidence: 0,
    language
  }
}

/**
 * Extract metadata from PDF without full text extraction
 */
export async function extractPDFMetadata(buffer: Buffer | ArrayBuffer): Promise<PDFProcessingResult['metadata']> {
  try {
    const result = await extractTextFromPDF(buffer)
    return result.metadata
  } catch {
    return undefined
  }
}

/**
 * Validate if a buffer is a valid PDF
 */
export function isValidPDF(buffer: Buffer | ArrayBuffer): boolean {
  const pdfHeader = '%PDF-'
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer)

  const headerString = String.fromCharCode(...bytes.slice(0, 5))
  return headerString === pdfHeader
}
