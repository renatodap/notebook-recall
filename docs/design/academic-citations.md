# Feature Design: Academic Citation System

## Overview

**Feature:** Comprehensive citation management system for academic sources
**Pillar:** Academic Niche Features
**Priority:** HIGH - Core differentiator for academic users

## Problem Statement

Researchers need to:
- Properly cite papers in their work
- Export citations in multiple formats (BibTeX, APA, MLA, etc.)
- Automatically fetch citation metadata from DOIs/URLs
- Manage bibliographies across multiple projects
- Copy formatted citations quickly

Current tools (Zotero, Mendeley) are separate apps. We integrate citation management directly into the knowledge base.

## Goals

1. Auto-fetch citation metadata from DOI, URL, arXiv ID, PubMed ID
2. Generate citations in 5 formats: BibTeX, RIS, APA, MLA, Chicago
3. One-click copy to clipboard
4. Batch export for bibliographies
5. Manual citation editing
6. Citation preview in source cards

## Non-Goals

- Citation graph visualization (separate feature)
- Reference management (importing BibTeX files - separate feature)
- Citation recommendation engine (separate feature)

## Architecture

### Data Model

```typescript
interface Citation {
  id: string
  source_id: string
  doi: string | null
  isbn: string | null
  pmid: string | null
  arxiv_id: string | null
  url: string | null
  citation_metadata: CitationMetadata
  bibtex: string | null
  ris: string | null
  apa: string | null
  mla: string | null
  chicago: string | null
  created_at: string
  updated_at: string
}

interface CitationMetadata {
  authors: string[]
  year: number
  title: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  doi?: string
  url?: string
  abstract?: string
}
```

### API Endpoints

#### 1. Fetch Citation Metadata
**POST `/api/citations/fetch`**

Fetches metadata from external APIs:
- CrossRef API for DOIs
- OpenAlex API for papers
- arXiv API for preprints
- PubMed API for biomedical papers

```typescript
Request:
{
  doi?: string
  url?: string
  pmid?: string
  arxiv_id?: string
}

Response:
{
  citation: Citation
  metadata: CitationMetadata
}
```

#### 2. Generate Citation Formats
**POST `/api/citations/generate`**

Generates formatted citations from metadata.

```typescript
Request:
{
  source_id: string
  formats: CitationFormat[] // ['bibtex', 'apa', 'mla', 'chicago', 'ris']
}

Response:
{
  bibtex?: string
  apa?: string
  mla?: string
  chicago?: string
  ris?: string
}
```

#### 3. Create/Update Citation
**POST `/api/citations`**
**PUT `/api/citations/:id`**

```typescript
Request:
{
  source_id: string
  citation_metadata: CitationMetadata
  doi?: string
  // ... other identifiers
}

Response:
{
  citation: Citation
}
```

#### 4. Batch Export Citations
**POST `/api/citations/export`**

```typescript
Request:
{
  source_ids: string[]
  format: CitationFormat
  style?: string // For specific APA/MLA variants
}

Response:
{
  content: string // Formatted bibliography
  filename: string
}
```

#### 5. Get Citation by Source
**GET `/api/citations/source/:source_id`**

```typescript
Response:
{
  citation: Citation | null
}
```

### External APIs

#### CrossRef API (free, no key)
- Endpoint: `https://api.crossref.org/works/{doi}`
- Rate limit: polite pool (50 req/sec with email in User-Agent)
- Coverage: 130M+ works with DOIs

#### OpenAlex API (free, no key)
- Endpoint: `https://api.openalex.org/works/doi:{doi}`
- Rate limit: 100,000 calls/day
- Coverage: 250M+ papers

#### arXiv API (free, no key)
- Endpoint: `http://export.arxiv.org/api/query?id_list={arxiv_id}`
- Rate limit: 3 seconds between requests
- Coverage: 2M+ preprints

#### PubMed E-utilities (free, no key for <3 req/sec)
- Endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={pmid}`
- Rate limit: 3 req/sec without key
- Coverage: 35M+ biomedical papers

### Citation Formatters

#### BibTeX
```
@article{AuthorYear,
  author = {Author1 and Author2},
  title = {Title},
  journal = {Journal},
  year = {2024},
  volume = {1},
  pages = {1--10},
  doi = {10.1234/doi}
}
```

#### APA 7th Edition
```
Author1, A., & Author2, B. (2024). Title of paper.
Journal Name, 1(1), 1-10. https://doi.org/10.1234/doi
```

#### MLA 9th Edition
```
Author1, FirstName, and FirstName Author2. "Title of Paper."
Journal Name, vol. 1, no. 1, 2024, pp. 1-10.
```

#### Chicago 17th Edition
```
Author1, FirstName, and FirstName Author2. 2024. "Title of Paper."
Journal Name 1 (1): 1-10. https://doi.org/10.1234/doi
```

#### RIS Format
```
TY  - JOUR
AU  - Author1
AU  - Author2
TI  - Title
JO  - Journal
PY  - 2024
VL  - 1
SP  - 1
EP  - 10
DO  - 10.1234/doi
ER  -
```

### Implementation Libraries

**Citation Formatting:**
- `citation-js` (npm) - Handles BibTeX, RIS, APA, MLA, Chicago
- Supports 5000+ citation styles via CSL
- Input: metadata JSON → Output: formatted citation

**DOI Parsing:**
- `doi-regex` (npm) - Extract DOIs from text/URLs
- Validates DOI format

**Author Name Parsing:**
- `human-name` (npm) - Parse "Last, First" ↔ "First Last"

## User Interface

### 1. Citation Display on Source Card

```tsx
<SourceCard>
  {/* existing content */}
  <CitationPreview citation={source.citation} />
</SourceCard>

<CitationPreview>
  <div className="citation-preview">
    <span className="citation-format">APA:</span>
    <span className="citation-text">{apa}</span>
    <CopyButton text={apa} />
  </div>
</CitationPreview>
```

### 2. Citation Manager Modal

Button on source detail page: "Manage Citation"

```tsx
<CitationManager source={source}>
  <Tabs>
    <Tab label="Fetch Metadata">
      <DOIInput onFetch={handleFetchDOI} />
      <URLInput onFetch={handleFetchURL} />
      <ManualEntry onSave={handleManualSave} />
    </Tab>

    <Tab label="Formatted Citations">
      <CitationFormat
        format="BibTeX"
        content={bibtex}
        onCopy={() => copy(bibtex)}
      />
      <CitationFormat format="APA" content={apa} />
      <CitationFormat format="MLA" content={mla} />
      <CitationFormat format="Chicago" content={chicago} />
      <CitationFormat format="RIS" content={ris} />
    </Tab>

    <Tab label="Edit Metadata">
      <MetadataEditor
        metadata={citation.citation_metadata}
        onSave={handleSaveMetadata}
      />
    </Tab>
  </Tabs>
</CitationManager>
```

### 3. Batch Export UI

On dashboard, when sources selected:

```tsx
<BulkActions>
  {/* existing actions */}
  <ExportCitationsButton
    sourceIds={selectedSourceIds}
    onExport={handleExportCitations}
  />
</BulkActions>

<ExportCitationsModal>
  <FormatSelector
    formats={['BibTeX', 'RIS', 'APA', 'MLA', 'Chicago']}
    selected={format}
    onChange={setFormat}
  />
  <PreviewPane content={previewContent} />
  <DownloadButton onClick={handleDownload} />
</ExportCitationsModal>
```

### 4. Auto-Fetch on Source Creation

When user adds a source with URL/DOI:

```tsx
<ContentIngestion>
  {/* If URL contains DOI or is academic paper */}
  <CitationAutoFetch
    url={url}
    onFetched={(citation) => setSourceCitation(citation)}
  />

  {citation && (
    <CitationPreview citation={citation} />
  )}
</ContentIngestion>
```

## API Client Library

```typescript
// src/lib/citations/client.ts

export async function fetchCitationFromDOI(doi: string): Promise<CitationMetadata> {
  // Try CrossRef first
  const crossrefData = await fetchFromCrossRef(doi)
  if (crossrefData) return crossrefData

  // Fallback to OpenAlex
  const openalexData = await fetchFromOpenAlex(doi)
  return openalexData
}

export async function fetchCitationFromURL(url: string): Promise<CitationMetadata> {
  // Extract DOI from URL if present
  const doi = extractDOI(url)
  if (doi) return fetchCitationFromDOI(doi)

  // Try OpenAlex API with URL
  return fetchFromOpenAlexURL(url)
}

export function generateBibTeX(metadata: CitationMetadata): string {
  // Use citation-js
  const cite = new Cite(metadata)
  return cite.format('bibtex')
}

export function generateAPA(metadata: CitationMetadata): string {
  const cite = new Cite(metadata)
  return cite.format('bibliography', {
    format: 'text',
    template: 'apa',
    lang: 'en-US'
  })
}

// Similar for MLA, Chicago, RIS
```

## Error Handling

### API Failures
- CrossRef down → try OpenAlex
- OpenAlex down → try arXiv/PubMed
- All APIs down → allow manual entry

### Invalid Identifiers
- Invalid DOI → show error, suggest manual entry
- URL with no metadata → show error, offer manual entry

### Rate Limiting
- Implement exponential backoff
- Queue requests if hitting rate limits
- Show progress indicator

## Performance Considerations

- Cache citation metadata for 24 hours
- Batch API requests when exporting multiple citations
- Generate formatted citations on-demand (not stored)
- Index citations table on source_id for fast lookup

## Security

- Sanitize DOI/URL inputs
- Rate limit API endpoints (10 req/min per user)
- Validate citation metadata before storing
- No user-provided URLs executed as code

## Testing Strategy

### Unit Tests
- Citation formatter functions
- Metadata extractor from API responses
- DOI extraction from URLs
- Author name parsing

### Integration Tests
- Fetch metadata from CrossRef
- Fetch metadata from OpenAlex
- Generate all citation formats
- Create/update citation via API

### E2E Tests
- User adds source with DOI → citation auto-fetched
- User clicks "Manage Citation" → modal opens
- User exports bibliography → file downloads
- User copies APA citation → clipboard contains text

## Rollout Plan

### Phase 1: Core Functionality
- API integration with CrossRef/OpenAlex
- Citation storage in database
- BibTeX generation

### Phase 2: Multiple Formats
- APA, MLA, Chicago formatters
- RIS export
- Citation preview on source cards

### Phase 3: UI Polish
- Citation manager modal
- Batch export
- Auto-fetch on source creation

### Phase 4: Advanced Features
- Manual editing
- Citation style variants
- Import from Zotero/Mendeley (separate feature)

## Success Metrics

- 80%+ of academic sources have citations
- Average time to copy citation: <5 seconds
- Citation fetch success rate: >90%
- User rating: "Very useful" for academic users

## Dependencies

### NPM Packages
- `citation-js` - Citation formatting
- `doi-regex` - DOI extraction
- `axios` - HTTP requests

### External APIs
- CrossRef API
- OpenAlex API
- arXiv API
- PubMed E-utilities

### Internal Dependencies
- Sources table
- Authentication
- File export system

## Future Enhancements

- Citation graph (who cites whom)
- Smart recommendations based on citations
- Automatic citation insertion in writing
- Integration with Google Scholar
- PDF citation extraction
- Citation conflict detection (different metadata for same source)
