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
 * POST /api/youtube/transcript - Fetch YouTube video transcript and create source
 * Body: { url?: string, youtube_id?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to add YouTube videos')
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.IMPORT)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { url, youtube_id } = await request.json()

    if (!url && !youtube_id) {
      throw new ValidationError('URL or video ID is required')
    }

    // Extract video ID if not provided
    let videoId = youtube_id
    if (!videoId) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/i)
      videoId = match?.[1]
    }

    if (!videoId) {
      throw new ValidationError('Invalid YouTube URL. Please provide a valid YouTube video link.')
    }

    // Fetch video metadata using YouTube Data API
    let videoTitle = 'YouTube Video'
    let channelTitle = ''
    let transcript = ''

    try {
      // Get video details
      const ytApiKey = process.env.YOUTUBE_API_KEY
      if (ytApiKey) {
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytApiKey}`
        )
        const videoData = await videoResponse.json()

        if (videoData.items?.[0]) {
          videoTitle = videoData.items[0].snippet.title
          channelTitle = videoData.items[0].snippet.channelTitle
        }
      }

      // Fetch transcript using youtube-transcript library or scraping
      // For MVP, we'll create a placeholder
      // In production, use a proper YouTube transcript fetcher
      transcript = `[Transcript for: ${videoTitle}]\n\nThis is a YouTube video transcript placeholder. In production, this would contain the actual transcript fetched from YouTube captions.`

    } catch (err) {
      console.error('YouTube fetch error:', err)
      transcript = '[Transcript unavailable]'
    }

    // Create source entry
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: user.id,
        title: videoTitle,
        content_type: 'youtube',
        original_content: transcript,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        youtube_id: videoId,
        youtube_title: videoTitle,
        youtube_channel: channelTitle,
        metadata: {
          video_id: videoId,
          channel: channelTitle,
          source_type: 'youtube'
        }
      } as never)
      .select()
      .single()

    if (sourceError || !source) {
      console.error('Source creation error:', sourceError)
      throw new Error('Failed to create source from YouTube video')
    }

    const createdSource = source as any

    // Auto-summarize
    try {
      await fetch(`${request.nextUrl.origin}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: createdSource.id })
      })
    } catch (err) {
      console.error('Summarization error:', err)
    }

    return NextResponse.json({ source: createdSource }, { status: 201 })

  } catch (error) {
    console.error('YouTube transcript error:', error)
    return handleAPIError(error)
  }
}
