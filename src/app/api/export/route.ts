/**
 * GET /api/export
 *
 * Export sources in markdown or JSON format with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { exportToMarkdown } from '@/lib/export/markdown';
import { exportToJSON } from '@/lib/export/json';
import { ExportSourcesQuerySchema, validateSourceIds } from '@/lib/validation/schemas';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import type { DatabaseSource } from '@/types/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to export sources');
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.EXPORT);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = ExportSourcesQuerySchema.safeParse(params);
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const { format, sources: sourcesParam } = validation.data;

    // Validate source IDs if provided
    let sourceIds: string[] | null = null;
    if (sourcesParam) {
      sourceIds = validateSourceIds(sourcesParam);
      if (sourceIds === null) {
        throw new ValidationError('Invalid source IDs provided. All IDs must be valid UUIDs.');
      }
    }

    // Build query
    let query = supabase
      .from('sources')
      .select(
        `
        *,
        summary:summaries(*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by specific source IDs if provided
    if (sourceIds) {
      query = query.in('id', sourceIds);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundError('No sources found to export');
    }

    // Transform data
    const sourcesWithSummaries = data.map((item: any) => ({
      source: {
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        content_type: item.content_type,
        original_content: item.original_content,
        url: item.url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
      summary: item.summary?.[0] || {
        summary_text: '',
        key_actions: [],
        key_topics: [],
        word_count: 0,
      },
    }));

    // Generate export
    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'markdown') {
      content = exportToMarkdown(sourcesWithSummaries);
      contentType = 'text/markdown';
      filename = `sources_export_${timestamp}.md`;
    } else {
      content = exportToJSON(sourcesWithSummaries);
      contentType = 'application/json';
      filename = `sources_export_${timestamp}.json`;
    }

    // Return file download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return handleAPIError(error);
  }
}
