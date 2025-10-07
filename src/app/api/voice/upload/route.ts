import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * POST /api/voice/upload - Upload and transcribe voice note
 * Body (multipart/form-data):
 *   - audio: File (audio file)
 *   - duration: number (duration in seconds)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to upload voice notes')
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.IMPORT)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const duration = parseInt(formData.get('duration') as string) || 0

    if (!audioFile) {
      throw new ValidationError('No audio file provided')
    }

    if (audioFile.size > 10 * 1024 * 1024) { // 10MB limit
      throw new ValidationError('Audio file must be less than 10MB')
    }

    // Upload audio to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload audio file')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-notes')
      .getPublicUrl(fileName)

    const audioUrl = urlData.publicUrl

    // Transcribe audio (using Anthropic or Whisper API)
    let transcript = ''
    try {
      // For now, we'll create a placeholder. In production, use OpenAI Whisper API
      // const transcriptResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      //   },
      //   body: formData
      // })
      // transcript = (await transcriptResponse.json()).text

      // Placeholder for now
      transcript = '[Voice note transcription will be available soon]'
    } catch (err) {
      console.error('Transcription error:', err)
      transcript = '[Transcription unavailable]'
    }

    // Create source entry
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: user.id,
        title: `Voice Note - ${new Date().toLocaleString()}`,
        content_type: 'audio',
        original_content: transcript,
        audio_url: audioUrl,
        audio_duration: duration,
        transcript,
        metadata: {
          file_name: audioFile.name,
          file_size: audioFile.size,
          duration_seconds: duration
        }
      } as never)
      .select()
      .single()

    if (sourceError || !source) {
      console.error('Source creation error:', sourceError)
      throw new Error('Failed to create source from voice note')
    }

    const createdSource = source as any

    // Auto-summarize the transcript if available
    if (transcript && transcript !== '[Voice note transcription will be available soon]') {
      try {
        await fetch(`${request.nextUrl.origin}/api/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_id: createdSource.id })
        })
      } catch (err) {
        console.error('Summarization error:', err)
      }
    }

    return NextResponse.json({ source: createdSource }, { status: 201 })

  } catch (error) {
    console.error('Voice upload error:', error)
    return handleAPIError(error)
  }
}
