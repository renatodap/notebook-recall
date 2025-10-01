/**
 * Backfill Service
 *
 * Batch process to generate embeddings for existing summaries
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateEmbedding } from './client';
import type {
  BackfillConfig,
  BackfillResult,
  BackfillProgress,
} from './types';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Backfill embeddings for summaries without them
 */
export async function backfillEmbeddings(
  config?: BackfillConfig & { user_id?: string }
): Promise<BackfillResult> {
  const startTime = Date.now();
  const dryRun = config?.dry_run || false;
  const skipExisting = config?.skipExisting !== false;
  const maxRetries = config?.maxRetries || DEFAULT_MAX_RETRIES;
  const userId = config?.user_id;

  const supabase = createServiceRoleClient();

  try {
    // Get summaries without embeddings
    let query: any = supabase
      .from('summaries')
      .select('id, summary_text, key_topics, source_id');

    if (skipExisting) {
      query = query.isNull('embedding');
    }

    // Filter by user if specified
    if (userId) {
      const { data: summaries, error } = await query.limit(1000);

      if (error) throw error;

      // Filter summaries by user ownership through sources
      const { data: userSources } = await supabase
        .from('sources')
        .select('id')
        .eq('user_id', userId);

      const userSourceIds = new Set(userSources?.map((s: any) => s.id) || []);
      const filteredSummaries = summaries?.filter((s: any) => userSourceIds.has(s.source_id)) || [];

      return await processSummaries(filteredSummaries, supabase, maxRetries, dryRun, startTime);
    }

    const { data: summaries, error } = await query.limit(1000); // Process max 1000 at a time

    if (error) {
      throw error;
    }

    return await processSummaries(summaries, supabase, maxRetries, dryRun, startTime);
  } catch (error) {
    throw new Error(
      `Backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process a batch of summaries to generate embeddings
 */
async function processSummaries(
  summaries: any[] | null,
  supabase: any,
  maxRetries: number,
  dryRun: boolean,
  startTime: number
): Promise<BackfillResult> {
  let processed = 0;
  let failed = 0;
  const skipped = 0;
  const failures: Array<{ summary_id: string; error: string }> = [];

  if (!summaries || summaries.length === 0) {
    return {
      processed: 0,
      failed: 0,
      skipped: 0,
      duration_ms: Date.now() - startTime,
      failures: [],
    };
  }

  if (dryRun) {
    return {
      processed: summaries.length,
      failed: 0,
      skipped: 0,
      duration_ms: Date.now() - startTime,
      failures: [],
    };
  }

  // Process summaries
  for (const summary of summaries) {
    let attempts = 0;
    let success = false;

    while (attempts < maxRetries && !success) {
      try {
        // Combine summary text and topics for embedding
        const textToEmbed = [
          summary.summary_text,
          ...(summary.key_topics || []),
        ].join(' ');

        // Generate embedding
        const result = await generateEmbedding({
          text: textToEmbed,
          type: 'summary',
          normalize: true,
        });

        // Store in database
        const { error: updateError } = await supabase
          .from('summaries')
          .update({ embedding: result.embedding })
          .eq('id', summary.id);

        if (updateError) {
          throw updateError;
        }

        processed++;
        success = true;
      } catch (error) {
        attempts++;

        if (attempts >= maxRetries) {
          failed++;
          failures.push({
            summary_id: summary.id,
            error:
              error instanceof Error
                ? error.message
                : 'Unknown error occurred',
          });
        } else {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempts))
          );
        }
      }
    }
  }

  return {
    processed,
    failed,
    skipped,
    duration_ms: Date.now() - startTime,
    failures,
  };
}

/**
 * Get count of summaries needing embeddings
 */
export async function getPendingCount(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await (supabase as any)
    .from('summaries')
    .select('*', { count: 'exact', head: true })
    .isNull('embedding');

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Get count of summaries with embeddings
 */
export async function getCompletedCount(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await (supabase as any)
    .from('summaries')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Process a single batch of summaries
 */
export async function processBatch(batchSize: number): Promise<number> {
  const result = await backfillEmbeddings({
    batch_size: batchSize,
    dry_run: false,
    skipExisting: true,
  });

  return result.processed;
}
