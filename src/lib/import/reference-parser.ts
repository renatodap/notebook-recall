/**
 * Reference Manager Import
 * Parses Zotero, Mendeley, EndNote exports (BibTeX, RIS, EndNote XML)
 */

export interface ImportedReference {
  title: string
  authors?: string[]
  year?: number
  abstract?: string
  doi?: string
  isbn?: string
  url?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  type?: string
  tags?: string[]
  notes?: string
}

export interface ImportResult {
  references: ImportedReference[]
  format: 'bibtex' | 'ris' | 'endnote' | 'unknown'
  totalParsed: number
  errors: string[]
}

/**
 * Auto-detect format and parse reference file
 */
export function parseReferenceFile(content: string): ImportResult {
  const trimmed = content.trim()

  // Detect format
  if (trimmed.startsWith('@') || trimmed.includes('@article') || trimmed.includes('@book')) {
    return parseBibTeX(content)
  }

  if (trimmed.startsWith('TY  -') || trimmed.includes('TY  - ')) {
    return parseRIS(content)
  }

  if (trimmed.startsWith('<?xml') && trimmed.includes('<records')) {
    return parseEndNoteXML(content)
  }

  return {
    references: [],
    format: 'unknown',
    totalParsed: 0,
    errors: ['Unknown file format. Supported: BibTeX, RIS, EndNote XML']
  }
}

/**
 * Parse BibTeX format (Zotero, Mendeley)
 */
function parseBibTeX(content: string): ImportResult {
  const references: ImportedReference[] = []
  const errors: string[] = []

  // Match @type{key, field = {value}, ...}
  const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]*?)\n\}/g
  const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g

  let match
  while ((match = entryRegex.exec(content)) !== null) {
    try {
      const type = match[1].toLowerCase()
      const fieldsText = match[3]

      const ref: ImportedReference = { title: '', type }

      let fieldMatch
      while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
        const key = fieldMatch[1].toLowerCase()
        const value = fieldMatch[2].trim()

        switch (key) {
          case 'title':
            ref.title = value
            break
          case 'author':
            ref.authors = value.split(' and ').map(a => a.trim())
            break
          case 'year':
            ref.year = parseInt(value) || undefined
            break
          case 'abstract':
            ref.abstract = value
            break
          case 'doi':
            ref.doi = value
            break
          case 'isbn':
            ref.isbn = value
            break
          case 'url':
            ref.url = value
            break
          case 'journal':
            ref.journal = value
            break
          case 'volume':
            ref.volume = value
            break
          case 'number':
            ref.issue = value
            break
          case 'pages':
            ref.pages = value
            break
          case 'publisher':
            ref.publisher = value
            break
          case 'keywords':
            ref.tags = value.split(/[,;]/).map(t => t.trim())
            break
          case 'note':
            ref.notes = value
            break
        }
      }

      if (ref.title) {
        references.push(ref)
      }
    } catch (error) {
      errors.push(`Failed to parse entry: ${error}`)
    }
  }

  return {
    references,
    format: 'bibtex',
    totalParsed: references.length,
    errors
  }
}

/**
 * Parse RIS format (Zotero, Mendeley, EndNote)
 */
function parseRIS(content: string): ImportResult {
  const references: ImportedReference[] = []
  const errors: string[] = []

  const entries = content.split(/\n\s*\n/)

  for (const entry of entries) {
    try {
      const lines = entry.split('\n').filter(l => l.trim())

      if (lines.length === 0) continue

      const ref: ImportedReference = { title: '', authors: [] }

      for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z0-9])\s*-\s*(.*)$/)
        if (!match) continue

        const tag = match[1]
        const value = match[2].trim()

        switch (tag) {
          case 'TY': // Type
            ref.type = value
            break
          case 'TI': // Title
          case 'T1':
            ref.title = value
            break
          case 'AU': // Author
          case 'A1':
            ref.authors?.push(value)
            break
          case 'PY': // Year
          case 'Y1':
            ref.year = parseInt(value) || undefined
            break
          case 'AB': // Abstract
          case 'N2':
            ref.abstract = value
            break
          case 'DO': // DOI
            ref.doi = value
            break
          case 'SN': // ISBN/ISSN
            ref.isbn = value
            break
          case 'UR': // URL
          case 'L1':
            ref.url = value
            break
          case 'JO': // Journal
          case 'T2':
            ref.journal = value
            break
          case 'VL': // Volume
            ref.volume = value
            break
          case 'IS': // Issue
            ref.issue = value
            break
          case 'SP': // Start page
            ref.pages = value
            break
          case 'EP': // End page
            if (ref.pages) ref.pages += `-${value}`
            else ref.pages = value
            break
          case 'PB': // Publisher
            ref.publisher = value
            break
          case 'KW': // Keywords
            if (!ref.tags) ref.tags = []
            ref.tags.push(value)
            break
          case 'N1': // Notes
            ref.notes = value
            break
        }
      }

      if (ref.title) {
        references.push(ref)
      }
    } catch (error) {
      errors.push(`Failed to parse RIS entry: ${error}`)
    }
  }

  return {
    references,
    format: 'ris',
    totalParsed: references.length,
    errors
  }
}

/**
 * Parse EndNote XML format
 */
function parseEndNoteXML(content: string): ImportResult {
  const references: ImportedReference[] = []
  const errors: string[] = []

  try {
    // Simple XML parsing (in production, use a proper XML parser)
    const recordRegex = /<record>([\s\S]*?)<\/record>/g
    let match

    while ((match = recordRegex.exec(content)) !== null) {
      try {
        const recordXml = match[1]

        const getTag = (tag: string): string | undefined => {
          const tagMatch = recordXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))
          return tagMatch ? tagMatch[1].trim() : undefined
        }

        const getAuthors = (): string[] => {
          const authorsMatch = recordXml.match(/<authors>([\s\S]*?)<\/authors>/)
          if (!authorsMatch) return []

          const authorMatches = authorsMatch[1].matchAll(/<author>([^<]+)<\/author>/g)
          return Array.from(authorMatches).map(m => m[1].trim())
        }

        const ref: ImportedReference = {
          title: getTag('title') || '',
          authors: getAuthors(),
          year: parseInt(getTag('year') || '') || undefined,
          abstract: getTag('abstract'),
          doi: getTag('doi'),
          isbn: getTag('isbn'),
          url: getTag('url'),
          journal: getTag('periodical'),
          volume: getTag('volume'),
          issue: getTag('number'),
          pages: getTag('pages'),
          publisher: getTag('publisher'),
          type: getTag('ref-type'),
        }

        if (ref.title) {
          references.push(ref)
        }
      } catch (error) {
        errors.push(`Failed to parse XML record: ${error}`)
      }
    }
  } catch (error) {
    errors.push(`Failed to parse EndNote XML: ${error}`)
  }

  return {
    references,
    format: 'endnote',
    totalParsed: references.length,
    errors
  }
}

/**
 * Convert imported reference to source creation data
 */
export function referenceToSource(ref: ImportedReference) {
  return {
    title: ref.title,
    url: ref.url || ref.doi ? `https://doi.org/${ref.doi}` : undefined,
    source_type: determineSourceType(ref.type),
    tags: ref.tags || [],
    metadata: {
      authors: ref.authors,
      year: ref.year,
      journal: ref.journal,
      volume: ref.volume,
      issue: ref.issue,
      pages: ref.pages,
      publisher: ref.publisher,
      doi: ref.doi,
      isbn: ref.isbn,
    },
    original_content: ref.abstract || '',
    notes: ref.notes,
  }
}

function determineSourceType(type?: string): string {
  if (!type) return 'article'

  const normalized = type.toLowerCase()

  if (normalized.includes('article') || normalized.includes('jour')) return 'article'
  if (normalized.includes('book')) return 'book'
  if (normalized.includes('conf') || normalized.includes('inproceedings')) return 'conference'
  if (normalized.includes('thesis') || normalized.includes('phdthesis')) return 'thesis'
  if (normalized.includes('web') || normalized.includes('electronic')) return 'webpage'

  return 'article'
}
