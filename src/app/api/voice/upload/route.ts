import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const duration = parseInt(formData.get('duration') as string) || 0

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Upload audio to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
    const { data: uploadData, error: uploadError } = await (supabase as any).storage
      .from('voice-notes')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = (supabase as any).storage
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
    const { data: source, error: sourceError } = await (supabase as any)
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
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Source creation error:', sourceError)
      return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
    }

    // Auto-summarize the transcript if available
    if (transcript && transcript !== '[Voice note transcription will be available soon]') {
      try {
        await fetch(`${request.nextUrl.origin}/api/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_id: source.id })
        })
      } catch (err) {
        console.error('Summarization error:', err)
      }
    }

    return NextResponse.json({ source }, { status: 201 })

  } catch (error) {
    console.error('Voice upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
