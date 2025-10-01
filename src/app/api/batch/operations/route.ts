import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 31: Advanced Batch Operations
 * Perform complex operations on multiple sources/outputs simultaneously
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { operation, target_ids, target_type = 'source', parameters = {} } = body

    if (!operation || !target_ids || target_ids.length === 0) {
      return NextResponse.json({
        error: 'operation and target_ids required'
      }, { status: 400 })
    }

    const results: any = {
      operation,
      totalTargets: target_ids.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: []
    }

    switch (operation) {
      case 'bulk_tag':
        // Add tags to multiple sources
        const { tags } = parameters
        if (!tags || tags.length === 0) {
          return NextResponse.json({ error: 'tags required' }, { status: 400 })
        }

        for (const id of target_ids) {
          try {
            const { data: source } = await (supabase as any)
              .from('sources')
              .select('tags')
              .eq('id', id)
              .eq('user_id', user.id)
              .single()

            if (source) {
              const updatedTags = Array.from(new Set([...(source.tags || []), ...tags]))
              await (supabase as any)
                .from('sources')
                .update({ tags: updatedTags })
                .eq('id', id)
                .eq('user_id', user.id)

              results.successful++
              results.results.push({ id, status: 'success', tags: updatedTags })
            }
          } catch (error) {
            results.failed++
            results.errors.push({ id, error: String(error) })
          }
        }
        break

      case 'bulk_add_to_collection':
        // Add multiple sources to a collection
        const { collection_id } = parameters
        if (!collection_id) {
          return NextResponse.json({ error: 'collection_id required' }, { status: 400 })
        }

        const sourceCollectionLinks = target_ids.map((sid: string) => ({
          collection_id,
          source_id: sid
        }))

        try {
          const { data, error } = await (supabase as any)
            .from('collection_sources')
            .insert(sourceCollectionLinks)
            .select()

          if (error) throw error

          results.successful = data?.length || 0
          results.results = data
        } catch (error) {
          results.failed = target_ids.length
          results.errors.push({ error: String(error) })
        }
        break

      case 'bulk_generate_summaries':
        // Generate summaries for multiple sources
        const { summary_type = 'general' } = parameters

        for (const id of target_ids) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/summarize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source_id: id, summary_type })
            })

            if (response.ok) {
              results.successful++
              results.results.push({ id, status: 'success' })
            } else {
              results.failed++
              results.errors.push({ id, error: 'Summary generation failed' })
            }
          } catch (error) {
            results.failed++
            results.errors.push({ id, error: String(error) })
          }
        }
        break

      case 'bulk_generate_embeddings':
        // Generate embeddings for multiple sources
        for (const id of target_ids) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source_id: id })
            })

            if (response.ok) {
              results.successful++
              results.results.push({ id, status: 'success' })
            } else {
              results.failed++
              results.errors.push({ id, error: 'Embedding generation failed' })
            }
          } catch (error) {
            results.failed++
            results.errors.push({ id, error: String(error) })
          }
        }
        break

      case 'bulk_export':
        // Export multiple sources in specified format
        const { export_format = 'json' } = parameters

        const { data: sources, error } = await (supabase as any)
          .from('sources')
          .select('*')
          .in('id', target_ids)
          .eq('user_id', user.id)

        if (error) throw error

        results.successful = sources?.length || 0
        results.results = sources

        if (export_format === 'json') {
          results.exportData = JSON.stringify(sources, null, 2)
        } else if (export_format === 'csv') {
          // Simple CSV conversion
          const headers = ['id', 'title', 'url', 'source_type', 'created_at']
          const csv = [
            headers.join(','),
            ...sources.map((s: any) =>
              headers.map(h => JSON.stringify(s[h] || '')).join(',')
            )
          ].join('\n')
          results.exportData = csv
        }
        break

      case 'bulk_delete':
        // Delete multiple sources
        const { data, error: deleteError } = await (supabase as any)
          .from('sources')
          .delete()
          .in('id', target_ids)
          .eq('user_id', user.id)
          .select()

        if (deleteError) throw deleteError

        results.successful = data?.length || 0
        results.results = data
        break

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
    }

    // Log batch operation
    await (supabase as any)
      .from('batch_operations_log')
      .insert({
        user_id: user.id,
        operation,
        target_type,
        target_count: target_ids.length,
        successful_count: results.successful,
        failed_count: results.failed,
        metadata: { parameters, results: results.results }
      })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Batch operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
