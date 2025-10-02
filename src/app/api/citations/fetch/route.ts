import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { fetchCitationMetadata } from '@/lib/citations/fetchers'
import { formatAllCitations } from '@/lib/citations/formatters'
import type { FetchCitationRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: FetchCitationRequest = await request.json()
    const { doi, url, source_id } = body

    if (!doi && !url && !source_id) {
      return NextResponse.json(
        { error: 'Provide doi, url, or source_id' },
        { status: 400 }
      )
    }

    // Fetch metadata from external APIs
    const metadata = await fetchCitationMetadata({ doi, url })

    if (!metadata) {
      return NextResponse.json(
        { error: 'Could not fetch citation metadata' },
        { status: 404 }
      )
    }

    // Generate all citation formats
    const formatted = formatAllCitations(metadata)

    // If source_id provided, save to database
    if (source_id) {
      // Verify user owns this source
      const { data: source } = await (supabase as any)
        .from('sources')
        .select('id')
        .eq('id', source_id)
        .eq('user_id', user.id)
        .single()

      if (!source) {
        return NextResponse.json(
          { error: 'Source not found or access denied' },
          { status: 404 }
        )
      }

      // Check if citation already exists
      const { data: existingCitation } = await (supabase as any)
        .from('citations')
        .select('id')
        .eq('source_id', source_id)
        .single()

      const citationData = {
        source_id,
        doi: metadata.doi || null,
        citation_metadata: metadata,
        bibtex: formatted.bibtex,
        ris: formatted.ris,
        apa: formatted.apa,
        mla: formatted.mla,
        chicago: formatted.chicago,
      }

      if (existingCitation) {
        // Update existing
        const { data: citation, error } = await (supabase as any)
          .from('citations')
          .update(citationData)
          .eq('id', existingCitation.id)
          .select()
          .single()

        if (error) {
          console.error('Citation update error:', error)
          return NextResponse.json({ error: 'Failed to update citation' }, { status: 500 })
        }

        return NextResponse.json({ citation, metadata, formatted })
      } else {
        // Create new
        const { data: citation, error } = await (supabase as any)
          .from('citations')
          .insert(citationData)
          .select()
          .single()

        if (error) {
          console.error('Citation creation error:', error)
          return NextResponse.json({ error: 'Failed to create citation' }, { status: 500 })
        }

        return NextResponse.json({ citation, metadata, formatted })
      }
    }

    // Return metadata and formatted citations without saving
    return NextResponse.json({ metadata, formatted })
  } catch (error) {
    console.error('Citation fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
