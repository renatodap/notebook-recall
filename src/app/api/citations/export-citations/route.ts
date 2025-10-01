import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { formatBibliography } from '@/lib/citations/formatters'
import type { CitationFormat } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_ids, format } = body as {
      source_ids: string[]
      format: CitationFormat
    }

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json(
        { error: 'source_ids required' },
        { status: 400 }
      )
    }

    if (!format) {
      return NextResponse.json(
        { error: 'format required (bibtex, ris, apa, mla, chicago)' },
        { status: 400 }
      )
    }

    // Fetch citations for these sources
    const { data: citations, error } = await (supabase as any)
      .from('citations')
      .select(`
        *,
        sources!inner(user_id)
      `)
      .in('source_id', source_ids)

    if (error) {
      console.error('Fetch citations error:', error)
      return NextResponse.json({ error: 'Failed to fetch citations' }, { status: 500 })
    }

    // Filter to only user's citations
    const userCitations = citations.filter((c: any) => c.sources.user_id === user.id)

    if (userCitations.length === 0) {
      return NextResponse.json(
        { error: 'No citations found for these sources' },
        { status: 404 }
      )
    }

    // Extract metadata
    const metadataList = userCitations.map((c: any) => c.citation_metadata)

    // Format bibliography
    const bibliography = formatBibliography(metadataList, format)

    // Determine file extension
    const extensions: Record<CitationFormat, string> = {
      bibtex: 'bib',
      ris: 'ris',
      apa: 'txt',
      mla: 'txt',
      chicago: 'txt',
    }

    const ext = extensions[format] || 'txt'
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `bibliography_${timestamp}.${ext}`

    // Return as downloadable file
    return new NextResponse(bibliography, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Citation export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
