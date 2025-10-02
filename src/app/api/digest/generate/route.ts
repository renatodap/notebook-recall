import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { period = 'week' } = await request.json()

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    // Fetch sources from period
    const { data: sources } = await (supabase as any)
      .from('sources')
      .select(`
        id,
        title,
        content_type,
        created_at,
        summaries (summary_text, key_actions, key_topics)
      `)
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        message: 'No sources found in this period',
        digest: null
      })
    }

    // Generate digest using Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const sourcesText = sources.map((s: any) => {
      const summary = s.summaries?.[0]
      return `
**${s.title}** (${s.content_type})
- Added: ${new Date(s.created_at).toLocaleDateString()}
${summary ? `- Summary: ${summary.summary_text}` : ''}
${summary?.key_actions ? `- Actions: ${summary.key_actions.join(', ')}` : ''}
${summary?.key_topics ? `- Topics: ${summary.key_topics.join(', ')}` : ''}
`
    }).join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a digest email for this ${period}'s knowledge captures. Here are the sources:

${sourcesText}

Please create:
1. A brief overview (2-3 sentences)
2. Key highlights (top 3-5 insights)
3. Important action items to review
4. Emerging themes or patterns

Format as HTML for an email.`
      }]
    })

    const digestContent = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save digest to database
    const { data: digest } = await (supabase as any)
      .from('digest_emails')
      .insert({
        user_id: user.id,
        digest_type: period,
        period_start: startDate.toISOString(),
        period_end: now.toISOString(),
        content: digestContent,
        source_count: sources.length
      })
      .select()
      .single()

    return NextResponse.json({
      digest,
      content: digestContent,
      source_count: sources.length
    })

  } catch (error) {
    console.error('Digest generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
