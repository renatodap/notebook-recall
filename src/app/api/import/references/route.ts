import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { parseReferenceFile, referenceToSource } from '@/lib/import/reference-parser'

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

    // Optionally create sources from references
    let createdSources: any[] = []

    if (createSources && result.references.length > 0) {
      const sourcesToCreate = result.references.map(ref => {
        const sourceData = referenceToSource(ref)
        return {
          user_id: user.id,
          ...sourceData
        }
      })

      // Insert sources in batches
      const batchSize = 50
      for (let i = 0; i < sourcesToCreate.length; i += batchSize) {
        const batch = sourcesToCreate.slice(i, i + batchSize)

        const { data: batchSources, error } = await (supabase as any)
          .from('sources')
          .insert(batch)
          .select()

        if (error) {
          console.error('Batch insert error:', error)
          continue
        }

        if (batchSources) {
          createdSources = [...createdSources, ...batchSources]
        }
      }
    }

    return NextResponse.json({
      result: {
        format: result.format,
        totalParsed: result.totalParsed,
        errors: result.errors,
        references: result.references
      },
      createdSources: createdSources.length,
      sources: createSources ? createdSources : undefined
    }, { status: 201 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
