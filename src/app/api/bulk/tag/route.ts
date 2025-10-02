/**
 * POST /api/bulk/tag
 *
 * Add tags to multiple sources at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BulkTagSchema = z.object({
  source_ids: z.array(z.string().uuid()).min(1, 'At least one source ID required'),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
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

    // Parse and validate request
    const body = await request.json();
    const validation = BulkTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source_ids, tags } = validation.data;

    // Normalize tags
    const normalizedTags = tags.map((tag) => tag.toLowerCase().trim());

    // Verify all sources belong to the user
    const { data: sources, error: fetchError } = await (supabase as any)
      .from('sources')
      .select('id')
      .in('id', source_ids)
      .eq('user_id', user.id);

    if (fetchError) {
      throw fetchError;
    }

    const validSourceIds = sources?.map((s: any) => s.id) || [];

    if (validSourceIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found' },
        { status: 404 }
      );
    }

    // Get existing tags to avoid duplicates
    const { data: existingTags, error: existingError } = await (supabase as any)
      .from('tags')
      .select('source_id, tag_name')
      .in('source_id', validSourceIds);

    if (existingError) {
      throw existingError;
    }

    // Build set of existing tag combinations
    const existingSet = new Set(
      existingTags?.map((t: any) => `${t.source_id}:${t.tag_name.toLowerCase()}`) || []
    );

    // Create new tag entries (avoid duplicates)
    const newTags: Array<{ source_id: string; tag_name: string }> = [];

    validSourceIds.forEach((sourceId: string) => {
      normalizedTags.forEach((tag: string) => {
        const key = `${sourceId}:${tag}`;
        if (!existingSet.has(key)) {
          newTags.push({
            source_id: sourceId,
            tag_name: tag,
          });
        }
      });
    });

    if (newTags.length === 0) {
      return NextResponse.json({
        updated: validSourceIds.length,
        tags_added: 0,
        message: 'All tags already exist on selected sources',
      });
    }

    // Insert new tags
    const { error: insertError } = await (supabase as any)
      .from('tags')
      .insert(newTags as any);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      updated: validSourceIds.length,
      tags_added: newTags.length,
      failed: source_ids.length - validSourceIds.length,
    });
  } catch (error) {
    console.error('Bulk tag error:', error);
    return NextResponse.json(
      { error: 'Failed to add tags' },
      { status: 500 }
    );
  }
}
