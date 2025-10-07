/**
 * Embeddings Diagnostic Endpoint
 *
 * Checks the health of the embeddings system:
 * - Whether embeddings exist for sources
 * - Which provider is being used
 * - Whether search is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { getGlobalEmbeddingProvider } from '@/lib/embeddings/provider';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      user_id: user.id,
      checks: {},
      recommendations: []
    };

    // 1. Check if sources have embeddings
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        created_at,
        summaries (
          id,
          embedding,
          summary_text,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sourcesError) {
      diagnostics.checks.sources = { status: 'error', error: sourcesError.message };
    } else {
      // Type assertion for sources with summaries
      const sourcesData = sources as Array<{
        id: string;
        title: string;
        created_at: string;
        summaries: Array<{
          id: string;
          embedding: any;
          summary_text: string;
          created_at: string;
        }> | null;
      }>;

      const sourcesWithEmbeddings = sourcesData?.filter(s =>
        s.summaries?.[0]?.embedding != null
      ).length || 0;

      const sourcesWithoutEmbeddings = sourcesData?.filter(s =>
        !s.summaries || s.summaries[0]?.embedding == null
      ).length || 0;

      diagnostics.checks.sources = {
        status: 'ok',
        total: sourcesData?.length || 0,
        with_embeddings: sourcesWithEmbeddings,
        without_embeddings: sourcesWithoutEmbeddings,
        sources: sourcesData?.map(s => ({
          id: s.id,
          title: s.title,
          has_embedding: s.summaries?.[0]?.embedding != null,
          summary_exists: (s.summaries?.length || 0) > 0,
          created_at: s.created_at
        }))
      };

      if (sourcesWithoutEmbeddings > 0) {
        diagnostics.recommendations.push({
          issue: `${sourcesWithoutEmbeddings} source(s) missing embeddings`,
          solution: 'Run backfill: POST /api/embeddings/backfill',
          severity: 'high'
        });
      }
    }

    // 2. Check embedding provider configuration
    try {
      const provider = getGlobalEmbeddingProvider();
      const config = provider.getConfig();
      const rateLimitStatus = await provider.getRateLimitStatus();

      diagnostics.checks.provider = {
        status: 'ok',
        strategy: config.strategy,
        preferred_dimension: config.preferredDimension,
        fallback_enabled: config.fallbackEnabled,
        gemini_available: !!process.env.GOOGLE_GEMINI_API_KEY,
        openai_available: !!process.env.OPENAI_API_KEY,
        rate_limit: {
          allowed: rateLimitStatus.allowed,
          reason: rateLimitStatus.reason,
          current_rpm: rateLimitStatus.currentUsage.rpm,
          current_daily: rateLimitStatus.currentUsage.daily,
          retry_after: rateLimitStatus.retryAfter
        }
      };

      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
        diagnostics.recommendations.push({
          issue: 'No embedding provider configured',
          solution: 'Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY in .env',
          severity: 'critical'
        });
      }
    } catch (error) {
      diagnostics.checks.provider = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 3. Test embedding generation
    try {
      const testResult = await generateEmbedding({
        text: 'Test embedding generation',
        type: 'query',
        normalize: true
      });

      diagnostics.checks.embedding_generation = {
        status: 'ok',
        provider: testResult.provider,
        model: testResult.model,
        dimension: testResult.embedding.length,
        cost: testResult.cost,
        latency_ms: testResult.latency_ms,
        fallback_used: testResult.fallbackUsed
      };

      if (testResult.cost && testResult.cost > 0) {
        diagnostics.recommendations.push({
          issue: `Embeddings are costing $${testResult.cost} per request (using ${testResult.provider})`,
          solution: 'Consider switching to Gemini (FREE) if not already using it',
          severity: 'medium'
        });
      }
    } catch (error) {
      diagnostics.checks.embedding_generation = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push({
        issue: 'Embedding generation failed',
        solution: 'Check API keys and network connection',
        severity: 'critical'
      });
    }

    // 4. Test semantic search
    if (sources && sources.length > 0) {
      try {
        const testQuery = 'test search';
        const queryEmbedding = await generateEmbedding({
          text: testQuery,
          type: 'query',
          normalize: true
        });

        const { data: searchData, error: searchError } = await supabase.rpc(
          'match_summaries',
          {
            query_embedding: queryEmbedding.embedding,
            match_threshold: 0.1, // Very low threshold for testing
            match_count: 5,
            p_user_id: user.id,
            p_collection_id: null,
          } as never
        );

        if (searchError) {
          diagnostics.checks.semantic_search = {
            status: 'error',
            error: searchError.message
          };
          diagnostics.recommendations.push({
            issue: 'Semantic search database function failed',
            solution: 'Check if match_summaries function exists in database',
            severity: 'critical'
          });
        } else {
          diagnostics.checks.semantic_search = {
            status: 'ok',
            results_count: (searchData as any[])?.length || 0,
            top_similarity: (searchData as any[])?.[0]?.similarity || 0
          };

          if (!(searchData as any[])?.length) {
            diagnostics.recommendations.push({
              issue: 'Semantic search returned no results (even with low threshold)',
              solution: 'Check if embeddings are properly indexed in database',
              severity: 'high'
            });
          }
        }
      } catch (error) {
        diagnostics.checks.semantic_search = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      diagnostics.checks.semantic_search = {
        status: 'skipped',
        reason: 'No sources available for testing'
      };
    }

    // 5. Overall health status
    const failedChecks = Object.values(diagnostics.checks).filter(
      (check: any) => check.status === 'error'
    ).length;

    diagnostics.overall_status = failedChecks === 0 ? 'healthy' : 'degraded';
    diagnostics.failed_checks = failedChecks;

    return NextResponse.json(diagnostics, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
