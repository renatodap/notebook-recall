import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { parseReferenceFile, referenceToSource } from '@/lib/import/reference-parser'
import { summarizeContent } from '@/lib/claude/client'
import { generateEmbedding } from '@/lib/embeddings/client'
import { backfillEmbeddings } from '@/lib/embeddings/backfill'
import { ContentType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const createSources = formData.get('create_sources') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Parse references
    const result = parseReferenceFile(content)

    if (result.totalParsed === 0) {
      return NextResponse.json({
        error: 'No references could be parsed',
        details: result.errors
      }, { status: 400 })
    }

    // Optionally create sources from references with summaries and embeddings
    let createdSources: any[] = []
    const errors: string[] = []

    if (createSources && result.references.length > 0) {
      // Process references one by one to generate summaries and embeddings
      for (const ref of result.references) {
        try {
          const sourceData = referenceToSource(ref)

          // Use abstract or notes as content, fallback to title
          const content = sourceData.original_content || sourceData.notes || sourceData.title

          // Create source first
          const { data: source, error: sourceError } = await (supabase as any)
            .from('sources')
            .insert({
              user_id: user.id,
              title: sourceData.title,
              content_type: 'text',
              original_content: content,
              url: sourceData.url || null,
            })
            .select()
            .single()

          if (sourceError) {
            errors.push(`Failed to create source "${sourceData.title}": ${sourceError.message}`)
            continue
          }

          // Generate summary using Claude
          let summaryData
          try {
            summaryData = await summarizeContent(content, 'text' as ContentType)
          } catch (summaryError) {
            // If summary generation fails, create a basic summary
            summaryData = {
              summary: content.slice(0, 500),
              keyActions: [],
              keyTopics: sourceData.tags || [],
              wordCount: content.split(/\s+/).length,
            }
          }

          // Generate embedding (MANDATORY)
          const textToEmbed = [summaryData.summary, ...summaryData.keyTopics].join(' ')
          const embeddingResult = await generateEmbedding({
            text: textToEmbed,
            type: 'summary',
            normalize: true,
          })

          // Create summary with embedding
          const { error: summaryError } = await (supabase as any)
            .from('summaries')
            .insert({
              source_id: source.id,
              summary_text: summaryData.summary,
              key_actions: summaryData.keyActions,
              key_topics: summaryData.keyTopics,
              word_count: summaryData.wordCount,
              embedding: embeddingResult.embedding,
            })

          if (summaryError) {
            errors.push(`Failed to create summary for "${sourceData.title}": ${summaryError.message}`)
            // Delete the orphaned source
            await (supabase as any).from('sources').delete().eq('id', source.id)
            continue
          }

          // Create tags if provided
          if (sourceData.tags && sourceData.tags.length > 0) {
            const tagsData = sourceData.tags.map((tag: string) => ({
              source_id: source.id,
              tag_name: tag.toLowerCase(),
            }))

            await (supabase as any).from('tags').insert(tagsData)
          }

          createdSources.push(source)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Failed to process reference: ${errorMsg}`)
          console.error('Reference processing error:', error)
        }
      }
    }

    // Run backfill for this user to catch any failed embeddings
    let backfillResult = null
    if (createSources && createdSources.length > 0) {
      try {
        backfillResult = await backfillEmbeddings({
          user_id: user.id,
          batch_size: 20,
          skipExisting: true,
        })
      } catch (backfillError) {
        console.error('Backfill error (non-critical):', backfillError)
        // Don't fail the request if backfill fails
      }
    }

    return NextResponse.json({
      result: {
        format: result.format,
        totalParsed: result.totalParsed,
        errors: [...result.errors, ...errors],
        references: result.references
      },
      createdSources: createdSources.length,
      failedSources: errors.length,
      backfillResult: backfillResult ? {
        processed: backfillResult.processed,
        failed: backfillResult.failed,
      } : null,
      sources: createSources ? createdSources : undefined
    }, { status: 201 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
