// Citation formatters for various academic styles
import type { CitationMetadata } from '@/types'

/**
 * Format author name for citations
 */
function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return 'Unknown'
  if (authors.length === 1) return formatLastFirst(authors[0])
  if (authors.length === 2) {
    return `${formatLastFirst(authors[0])}, & ${formatLastFirst(authors[1])}`
  }

  const formatted = authors.slice(0, -1).map(formatLastFirst)
  return `${formatted.join(', ')}, & ${formatLastFirst(authors[authors.length - 1])}`
}

function formatLastFirst(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]

  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).map(p => `${p.charAt(0)}.`).join(' ')
  return `${last}, ${first}`
}

function formatAuthorsFirstLast(authors: string[]): string {
  return authors.join(', ')
}

/**
 * Generate BibTeX citation
 */
export function formatBibTeX(metadata: CitationMetadata): string {
  const { authors, year, title, journal, volume, issue, pages, publisher, doi } = metadata

  // Generate citation key (FirstAuthorYear)
  const firstAuthor = authors[0]?.split(' ').pop()?.replace(/[^a-zA-Z]/g, '') || 'Unknown'
  const key = `${firstAuthor}${year}`

  const authorsStr = authors.join(' and ')

  let bibtex = `@article{${key},\n`
  bibtex += `  author = {${authorsStr}},\n`
  bibtex += `  title = {${title}},\n`

  if (journal) bibtex += `  journal = {${journal}},\n`
  bibtex += `  year = {${year}},\n`
  if (volume) bibtex += `  volume = {${volume}},\n`
  if (issue) bibtex += `  number = {${issue}},\n`
  if (pages) bibtex += `  pages = {${pages}},\n`
  if (publisher) bibtex += `  publisher = {${publisher}},\n`
  if (doi) bibtex += `  doi = {${doi}},\n`

  bibtex += `}`

  return bibtex
}

/**
 * Generate APA 7th edition citation
 */
export function formatAPA(metadata: CitationMetadata): string {
  const { authors, year, title, journal, volume, issue, pages, doi, url } = metadata

  let citation = formatAuthorsAPA(authors)
  citation += ` (${year}). `
  citation += `${title}. `

  if (journal) {
    citation += `*${journal}*`
    if (volume) {
      citation += `, *${volume}*`
      if (issue) citation += `(${issue})`
    }
    if (pages) citation += `, ${pages}`
    citation += '. '
  }

  if (doi) {
    citation += `https://doi.org/${doi}`
  } else if (url) {
    citation += url
  }

  return citation
}

/**
 * Generate MLA 9th edition citation
 */
export function formatMLA(metadata: CitationMetadata): string {
  const { authors, year, title, journal, volume, issue, pages } = metadata

  if (authors.length === 0) return `"${title}." ${year}.`

  let citation = ''

  // First author: Last, First
  const firstAuthor = authors[0]
  const parts = firstAuthor.trim().split(' ')
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    const first = parts.slice(0, -1).join(' ')
    citation += `${last}, ${first}`
  } else {
    citation += firstAuthor
  }

  // Additional authors
  if (authors.length === 2) {
    citation += `, and ${authors[1]}`
  } else if (authors.length > 2) {
    citation += ', et al'
  }

  citation += `. "${title}." `

  if (journal) {
    citation += `*${journal}*`
    if (volume) citation += `, vol. ${volume}`
    if (issue) citation += `, no. ${issue}`
    citation += `, ${year}`
    if (pages) citation += `, pp. ${pages}`
  } else {
    citation += year
  }

  citation += '.'

  return citation
}

/**
 * Generate Chicago 17th edition citation
 */
export function formatChicago(metadata: CitationMetadata): string {
  const { authors, year, title, journal, volume, issue, pages, doi, publisher } = metadata

  let citation = ''

  if (authors.length === 0) {
    citation = `"${title}."`
  } else if (authors.length === 1) {
    citation = formatLastFirst(authors[0])
  } else if (authors.length === 2) {
    citation = `${formatLastFirst(authors[0])}, and ${authors[1]}`
  } else {
    citation = `${formatLastFirst(authors[0])}, et al`
  }

  citation += `. ${year}. "${title}." `

  if (journal) {
    citation += `*${journal}*`
    if (volume) {
      citation += ` ${volume}`
      if (issue) citation += ` (${issue})`
    }
    if (pages) citation += `: ${pages}`
  } else if (publisher) {
    citation += publisher
  }

  citation += '.'

  if (doi) {
    citation += ` https://doi.org/${doi}.`
  }

  return citation
}

/**
 * Generate RIS format citation
 */
export function formatRIS(metadata: CitationMetadata): string {
  const { authors, year, title, journal, volume, issue, pages, doi, publisher } = metadata

  let ris = 'TY  - JOUR\n'

  authors.forEach(author => {
    ris += `AU  - ${author}\n`
  })

  ris += `TI  - ${title}\n`
  if (journal) ris += `JO  - ${journal}\n`
  ris += `PY  - ${year}\n`
  if (volume) ris += `VL  - ${volume}\n`
  if (issue) ris += `IS  - ${issue}\n`

  if (pages) {
    const [start, end] = pages.split('-')
    if (start) ris += `SP  - ${start}\n`
    if (end) ris += `EP  - ${end}\n`
  }

  if (publisher) ris += `PB  - ${publisher}\n`
  if (doi) ris += `DO  - ${doi}\n`

  ris += 'ER  - \n'

  return ris
}

/**
 * Generate all citation formats at once
 */
export function formatAllCitations(metadata: CitationMetadata) {
  return {
    bibtex: formatBibTeX(metadata),
    apa: formatAPA(metadata),
    mla: formatMLA(metadata),
    chicago: formatChicago(metadata),
    ris: formatRIS(metadata),
  }
}

/**
 * Generate formatted bibliography from multiple citations
 */
export function formatBibliography(
  citations: CitationMetadata[],
  format: 'apa' | 'mla' | 'chicago' | 'bibtex' | 'ris'
): string {
  const formatters = {
    apa: formatAPA,
    mla: formatMLA,
    chicago: formatChicago,
    bibtex: formatBibTeX,
    ris: formatRIS,
  }

  const formatter = formatters[format]

  if (format === 'bibtex') {
    // BibTeX: combine all entries
    return citations.map(formatter).join('\n\n')
  }

  if (format === 'ris') {
    // RIS: combine all entries
    return citations.map(formatter).join('\n')
  }

  // For narrative styles, add numbering or alphabetical sorting
  const sorted = [...citations].sort((a, b) => {
    const aAuthor = a.authors[0] || ''
    const bAuthor = b.authors[0] || ''
    return aAuthor.localeCompare(bAuthor)
  })

  return sorted.map(formatter).join('\n\n')
}
