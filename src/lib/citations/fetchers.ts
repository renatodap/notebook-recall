// Citation metadata fetchers from external APIs
import type { CitationMetadata } from '@/types'

interface CrossRefWork {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string; family?: string }>
  published?: { 'date-parts'?: number[][] }
  'container-title'?: string[]
  volume?: string
  issue?: string
  page?: string
  publisher?: string
  abstract?: string
}

interface OpenAlexWork {
  doi?: string
  title?: string
  authorships?: Array<{ author?: { display_name?: string } }>
  publication_year?: number
  host_venue?: {
    display_name?: string
    volume?: string
    issue?: string
  }
  primary_location?: {
    source?: {
      display_name?: string
    }
  }
  biblio?: {
    volume?: string
    issue?: string
    first_page?: string
    last_page?: string
  }
  abstract_inverted_index?: Record<string, number[]>
}

/**
 * Extract DOI from URL or text
 */
export function extractDOI(text: string): string | null {
  // DOI regex pattern
  const doiPattern = /10\.\d{4,}(?:\.\d+)*\/(?:(?!["&\'<>])\S)+/g
  const match = text.match(doiPattern)
  return match ? match[0] : null
}

/**
 * Fetch citation metadata from CrossRef API
 */
export async function fetchFromCrossRef(doi: string): Promise<CitationMetadata | null> {
  try {
    const cleanDOI = doi.trim()
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Recall-Notebook/1.0 (mailto:support@recall-notebook.com)',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const work: CrossRefWork = data.message

    if (!work) return null

    // Parse authors
    const authors = work.author?.map((a) => {
      const given = a.given || ''
      const family = a.family || ''
      return `${given} ${family}`.trim()
    }) || []

    // Parse year
    const year = work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear()

    // Parse title
    const title = work.title?.[0] || 'Untitled'

    // Parse journal
    const journal = work['container-title']?.[0] || undefined

    // Parse pages
    const pages = work.page || undefined

    return {
      authors,
      year,
      title,
      journal,
      volume: work.volume,
      issue: work.issue,
      pages,
      publisher: work.publisher,
      doi: work.DOI || doi,
      abstract: work.abstract,
    }
  } catch (error) {
    console.error('CrossRef fetch error:', error)
    return null
  }
}

/**
 * Fetch citation metadata from OpenAlex API
 */
export async function fetchFromOpenAlex(doi: string): Promise<CitationMetadata | null> {
  try {
    const cleanDOI = doi.trim()
    const url = `https://api.openalex.org/works/doi:${encodeURIComponent(cleanDOI)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Recall-Notebook/1.0 (mailto:support@recall-notebook.com)',
      },
    })

    if (!response.ok) {
      return null
    }

    const work: OpenAlexWork = await response.json()

    if (!work) return null

    // Parse authors
    const authors = work.authorships?.map((a) => a.author?.display_name || 'Unknown') || []

    // Parse year
    const year = work.publication_year || new Date().getFullYear()

    // Parse title
    const title = work.title || 'Untitled'

    // Parse journal
    const journal =
      work.host_venue?.display_name ||
      work.primary_location?.source?.display_name ||
      undefined

    // Parse volume, issue, pages
    const volume = work.biblio?.volume || work.host_venue?.volume
    const issue = work.biblio?.issue || work.host_venue?.issue
    const pages =
      work.biblio?.first_page && work.biblio?.last_page
        ? `${work.biblio.first_page}-${work.biblio.last_page}`
        : undefined

    // Parse abstract from inverted index
    let abstract: string | undefined
    if (work.abstract_inverted_index) {
      const words: Array<{ word: string; pos: number }> = []
      for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
        positions.forEach((pos) => {
          words.push({ word, pos })
        })
      }
      words.sort((a, b) => a.pos - b.pos)
      abstract = words.map((w) => w.word).join(' ')
    }

    return {
      authors,
      year,
      title,
      journal,
      volume,
      issue,
      pages,
      doi: work.doi || doi,
      abstract,
    }
  } catch (error) {
    console.error('OpenAlex fetch error:', error)
    return null
  }
}

/**
 * Fetch citation from arXiv API
 */
export async function fetchFromArxiv(arxivId: string): Promise<CitationMetadata | null> {
  try {
    const cleanId = arxivId.replace('arXiv:', '').trim()
    const url = `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`

    const response = await fetch(url)
    if (!response.ok) return null

    const xml = await response.text()

    // Parse XML (simple parser - in production use proper XML parser)
    const titleMatch = xml.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled'

    const publishedMatch = xml.match(/<published>(\d{4})-/)
    const year = publishedMatch ? parseInt(publishedMatch[1]) : new Date().getFullYear()

    const authorMatches = xml.matchAll(/<name>([^<]+)<\/name>/g)
    const authors = Array.from(authorMatches).map(m => m[1].trim())

    const summaryMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/)
    const abstract = summaryMatch ? summaryMatch[1].trim() : undefined

    return {
      authors: authors.length > 0 ? authors : ['Unknown'],
      year,
      title,
      publisher: 'arXiv',
      abstract,
      url: `https://arxiv.org/abs/${cleanId}`,
    }
  } catch (error) {
    console.error('arXiv fetch error:', error)
    return null
  }
}

/**
 * Main function: fetch citation metadata from any source
 */
export async function fetchCitationMetadata(params: {
  doi?: string
  url?: string
  arxiv_id?: string
}): Promise<CitationMetadata | null> {
  // Try DOI first
  if (params.doi) {
    const metadata = await fetchFromCrossRef(params.doi)
    if (metadata) return metadata

    // Fallback to OpenAlex
    const openalexData = await fetchFromOpenAlex(params.doi)
    if (openalexData) return openalexData
  }

  // Try extracting DOI from URL
  if (params.url) {
    const doi = extractDOI(params.url)
    if (doi) {
      const metadata = await fetchFromCrossRef(doi)
      if (metadata) return metadata
    }
  }

  // Try arXiv
  if (params.arxiv_id) {
    const metadata = await fetchFromArxiv(params.arxiv_id)
    if (metadata) return metadata
  }

  return null
}
