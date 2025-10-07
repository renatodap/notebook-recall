import { NextRequest, NextResponse } from 'next/server'
import { processPdf } from '@/lib/content/pdf-processor'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

const MAX_PDF_SIZE = 5 * 1024 * 1024 // 5MB (Vercel limit)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to process PDFs')
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.CONTENT_FETCH)
    if (!rateLimit.allowed) {
      throw new RateLimitError(`Too many requests. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new ValidationError('No file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new ValidationError('File must be a PDF')
    }

    if (file.size > MAX_PDF_SIZE) {
      throw new ValidationError('PDF file size must be less than 5MB')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await processPdf(buffer)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Process PDF error:', error)
    return handleAPIError(error)
  }
}
