/**
 * GET /api/export
 *
 * Export sources in markdown or JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { exportToMarkdown } from '@/lib/export/markdown';
import { exportToJSON } from '@/lib/export/json';

export const dynamic = 'force-dynamic';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const sourcesParam = searchParams.get('sources');

    if (format !== 'markdown' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Use "markdown" or "json"' },
        { status: 400 }
      );
    }

    // Build query
    let query = (supabase as any)
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
    if (sourcesParam) {
      const sourceIds = sourcesParam.split(',').map((id) => id.trim());
      query = query.in('id', sourceIds);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No sources found to export' },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: 'Failed to export sources' },
      { status: 500 }
    );
  }
}
