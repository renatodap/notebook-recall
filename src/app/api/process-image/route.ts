import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { processImage } from '@/lib/content/image-processor'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL: Add authentication check (was missing!)
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to process images')
    }

    // Rate limiting (using PDF_UPLOAD limit for image uploads)
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.PDF_UPLOAD)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your hourly limit of 20 image uploads. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new ValidationError('No file provided')
    }

    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      throw new ValidationError(
        `File must be an image. Supported types: ${SUPPORTED_TYPES.join(', ')}`
      )
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      throw new ValidationError(`Image file size must be less than 10MB`)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await processImage(buffer, file.type)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Process image error:', error)
    return handleAPIError(error)
  }
}
