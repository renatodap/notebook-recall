import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export interface WritingSuggestion {
  type: 'grammar' | 'clarity' | 'academic_tone' | 'structure' | 'citation' | 'wordiness'
  severity: 'error' | 'warning' | 'suggestion'
  message: string
  original: string
  suggested: string
  position?: { start: number; end: number }
}

export interface WritingAnalysis {
  suggestions: WritingSuggestion[]
  improvedText: string
  statistics: {
    wordCount: number
    sentenceCount: number
    avgSentenceLength: number
    readabilityScore: number
    academicToneScore: number
  }
  strengths: string[]
  weaknesses: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, context, focus } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Analyze and improve text using Claude
    const prompt = `You are an expert academic writing assistant. Analyze this text and provide detailed feedback.

${context ? `Context: ${context}\n\n` : ''}${focus ? `Focus Areas: ${focus.join(', ')}\n\n` : ''}Text to Analyze:
${text}

Provide comprehensive academic writing feedback:

1. **Suggestions**: Identify specific issues with:
   - Grammar and punctuation errors
   - Clarity and precision issues
   - Academic tone violations (too casual, too verbose)
   - Structural problems (transitions, flow, paragraph organization)
   - Missing or improperly formatted citations
   - Wordiness and redundancy

2. **Improved Version**: Rewrite the text incorporating all improvements

3. **Statistics**: Calculate:
   - Word count
   - Sentence count
   - Average sentence length
   - Readability score (0-100, higher = easier to read)
   - Academic tone score (0-100, higher = more academic)

4. **Strengths**: What is done well
5. **Weaknesses**: Major areas for improvement

Return JSON:
{
  "suggestions": [
    {
      "type": "grammar|clarity|academic_tone|structure|citation|wordiness",
      "severity": "error|warning|suggestion",
      "message": "Explanation of the issue",
      "original": "Original text",
      "suggested": "Improved text",
      "position": {"start": 0, "end": 10}
    }
  ],
  "improvedText": "Complete improved version",
  "statistics": {
    "wordCount": 0,
    "sentenceCount": 0,
    "avgSentenceLength": 0,
    "readabilityScore": 0,
    "academicToneScore": 0
  },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`

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
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text

    let analysis: WritingAnalysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      // Fallback if parsing fails
      analysis = {
        suggestions: [],
        improvedText: text,
        statistics: {
          wordCount: text.split(/\s+/).length,
          sentenceCount: text.split(/[.!?]+/).length,
          avgSentenceLength: text.split(/\s+/).length / text.split(/[.!?]+/).length,
          readabilityScore: 50,
          academicToneScore: 50,
        },
        strengths: [],
        weaknesses: ['Unable to parse AI response']
      }
    }

    // Save to history
    await (supabase as any)
      .from('writing_assistance_history')
      .insert({
        user_id: user.id,
        original_text: text,
        improved_text: analysis.improvedText,
        suggestions_count: analysis.suggestions.length,
        context,
        metadata: {
          statistics: analysis.statistics,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses
        }
      })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Writing assistant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
