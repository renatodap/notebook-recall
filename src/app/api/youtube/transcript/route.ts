import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, youtube_id } = await request.json()

    if (!url && !youtube_id) {
      return NextResponse.json({ error: 'URL or video ID required' }, { status: 400 })
    }

    // Extract video ID if not provided
    let videoId = youtube_id
    if (!videoId) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/i)
      videoId = match?.[1]
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
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
      const transcriptResponse = await fetch(
        `https://www.youtube.com/watch?v=${videoId}`
      )

      // In production, use a proper YouTube transcript fetcher
      // For now, placeholder
      transcript = `[Transcript for: ${videoTitle}]\n\nThis is a YouTube video transcript placeholder. In production, this would contain the actual transcript fetched from YouTube captions.`

    } catch (err) {
      console.error('YouTube fetch error:', err)
      transcript = '[Transcript unavailable]'
    }

    // Create source entry
    const { data: source, error: sourceError } = await (supabase as any)
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
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Source creation error:', sourceError)
      return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
    }

    // Auto-summarize
    try {
      await fetch(`${request.nextUrl.origin}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: source.id })
      })
    } catch (err) {
      console.error('Summarization error:', err)
    }

    return NextResponse.json({ source }, { status: 201 })

  } catch (error) {
    console.error('YouTube transcript error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
