import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_ids, type, item_name } = await request.json();

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    // Fetch sources with summaries
    const { data: sources } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          summary_text,
          key_topics,
          key_actions
        )
      `)
      .in('id', source_ids)
      .eq('user_id', session.user.id);

    if (!sources || sources.length === 0) {
      return NextResponse.json({ summary: 'No sources available to summarize.' });
    }

    // Build context from sources
    const sourceContext = sources
      .map((s: any, i: number) => {
        const summary = s.summaries?.[0];
        return `
Source ${i + 1}: ${s.title}
Summary: ${summary?.summary_text || 'No summary available'}
Key Topics: ${summary?.key_topics?.join(', ') || 'None'}
Key Actions: ${summary?.key_actions?.join(', ') || 'None'}
`.trim();
      })
      .join('\n\n');

    // Generate AI summary using Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are analyzing a ${type} called "${item_name}" in a PARA (Projects, Areas, Resources, Archives) knowledge management system.

Below are the ${sources.length} sources associated with this ${type}:

${sourceContext}

Please generate a comprehensive summary of this ${type} based on all the sources above. The summary should:
1. Provide an overview of what this ${type} is about
2. Identify common themes and key topics across all sources
3. Highlight important actions or next steps if applicable
4. Be concise but informative (3-5 paragraphs)

Generate the summary now:`,
        },
      ],
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
