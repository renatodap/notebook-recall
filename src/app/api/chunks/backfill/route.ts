/**
 * POST /api/chunks/backfill
 *
 * Backfill chunks for existing sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { backfillChunks } from '@/lib/chunking/embeddings';
import { z } from 'zod';
import type { ChunkBackfillRequest, ChunkBackfillResponse } from '@/types/chunks';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for backfill operations

const BackfillRequestSchema = z.object({
  source_id: z.string().uuid().optional(),
  batch_size: z.number().int().positive().max(100).optional(),
  dry_run: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validation = BackfillRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      source_id,
      batch_size = 10,
      dry_run = false,
    } = validation.data as ChunkBackfillRequest;

    if (dry_run) {
      // Dry run: just count sources that need chunking
      const { data: sources } = await supabase
        .from('sources')
        .select('id, original_content, content_type')
        .eq('user_id', user.id)
        .not('content_type', 'eq', 'image');

      let needsChunking = 0;

      if (sources) {
        for (const source of sources) {
          const { count } = await supabase
            .from('content_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('source_id', source.id);

          if (count === 0 && source.original_content.length > 1000) {
            needsChunking++;
          }
        }
      }

      const response: ChunkBackfillResponse = {
        sources_processed: 0,
        chunks_created: 0,
        chunks_embedded: 0,
        failed: 0,
        duration_ms: 0,
      };

      return NextResponse.json({
        ...response,
        dry_run: true,
        sources_needing_chunks: needsChunking,
      });
    }

    // Execute backfill
    const result = await backfillChunks(user.id, batch_size);

    const response: ChunkBackfillResponse = result;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chunk backfill error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to backfill chunks',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chunks/backfill
 *
 * Get backfill statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count sources
    const { count: totalSources } = await supabase
      .from('sources')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count sources with chunks
    const { data: sourcesWithChunks } = await supabase
      .from('content_chunks')
      .select('source_id')
      .neq('source_id', '00000000-0000-0000-0000-000000000000');

    const uniqueSourcesWithChunks = new Set(
      sourcesWithChunks?.map(c => c.source_id) || []
    ).size;

    // Count total chunks
    const { count: totalChunks } = await supabase
      .from('content_chunks')
      .select('*', { count: 'exact', head: true });

    // Count chunks with embeddings
    const { count: chunksWithEmbeddings } = await supabase
      .from('content_chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    return NextResponse.json({
      total_sources: totalSources || 0,
      sources_with_chunks: uniqueSourcesWithChunks,
      sources_without_chunks: (totalSources || 0) - uniqueSourcesWithChunks,
      total_chunks: totalChunks || 0,
      chunks_with_embeddings: chunksWithEmbeddings || 0,
      chunks_without_embeddings: (totalChunks || 0) - (chunksWithEmbeddings || 0),
    });
  } catch (error) {
    console.error('Chunk stats error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get chunk statistics',
      },
      { status: 500 }
    );
  }
}
