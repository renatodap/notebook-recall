/**
 * Regenerate All Embeddings Endpoint
 *
 * Forces regeneration of ALL embeddings for the authenticated user
 * using the current embedding provider (Gemini).
 *
 * This is useful when switching providers (OpenAI → Gemini) to ensure
 * all embeddings are in the same vector space for accurate search.
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';

export const maxDuration = 300; // 5 minutes for large collections

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[RegenerateAll] Starting regeneration for user ${user.id}`);

    // Get all sources with their summaries for this user
    const { data: sources, error: fetchError } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          id,
          summary_text,
          key_topics
        )
      `)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('[RegenerateAll] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sources found to regenerate',
        total: 0,
        updated: 0,
        failed: 0
      });
    }

    console.log(`[RegenerateAll] Found ${sources.length} sources with summaries`);

    let updated = 0;
    let failed = 0;
    const errors: Array<{ sourceId: string; title: string; error: string }> = [];

    for (const source of sources) {
      const sourceData = source as any;
      const summaries = sourceData.summaries as any[];

      if (!summaries || summaries.length === 0) {
        console.log(`[RegenerateAll] Skipping source ${sourceData.id} - no summary`);
        continue;
      }

      const summary = summaries[0];

      try {
        console.log(`[RegenerateAll] Processing "${sourceData.title}"...`);

        // Generate new embedding with current provider (Gemini)
        const textToEmbed = [
          summary.summary_text,
          ...(summary.key_topics || [])
        ].join(' ');

        const embeddingResult = await generateEmbedding({
          text: textToEmbed,
          type: 'summary',
          normalize: true,
        });

        console.log(`[RegenerateAll] ✅ Generated embedding:`, {
          provider: embeddingResult.provider,
          model: embeddingResult.model,
          dimension: embeddingResult.embedding.length,
          cost: embeddingResult.cost || 0,
        });

        // Update the embedding in database
        const { error: updateError } = await supabase
          .from('summaries')
          .update({
            embedding: embeddingResult.embedding
          } as never)
          .eq('id', summary.id);

        if (updateError) {
          throw updateError;
        }

        updated++;
        console.log(`[RegenerateAll] Progress: ${updated}/${sources.length} updated`);

        // Small delay to respect rate limits (Gemini: 15 RPM)
        if (embeddingResult.provider === 'gemini' && updated % 15 === 0) {
          console.log(`[RegenerateAll] Rate limit protection: waiting 60s...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
        }

      } catch (error) {
        console.error(`[RegenerateAll] Failed for "${sourceData.title}":`, error);
        failed++;
        errors.push({
          sourceId: sourceData.id,
          title: sourceData.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`[RegenerateAll] Complete! Updated: ${updated}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      total: sources.length,
      updated,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      message: failed === 0
        ? `Successfully regenerated all ${updated} embeddings using Gemini!`
        : `Regenerated ${updated} embeddings, ${failed} failed.`
    });

  } catch (error) {
    console.error('[RegenerateAll] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate embeddings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Check regeneration status
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count sources with summaries
    const { count: totalCount } = await supabase
      .from('sources')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count summaries with embeddings
    const { data: summariesData } = await supabase
      .from('summaries')
      .select(`
        id,
        embedding,
        sources!inner(user_id)
      `)
      .eq('sources.user_id', user.id);

    const withEmbeddings = summariesData?.filter(s => (s as any).embedding != null).length || 0;

    return NextResponse.json({
      total_sources: totalCount || 0,
      with_embeddings: withEmbeddings,
      without_embeddings: (totalCount || 0) - withEmbeddings,
      ready_to_regenerate: true
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
