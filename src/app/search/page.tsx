'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SourceCard from '@/components/SourceCard'
import Loading from '@/components/ui/Loading'
import MobileNav from '@/components/MobileNav'

type SearchMode = 'semantic' | 'keyword' | 'hybrid'

interface ParsedQueryInfo {
  keywords: string[]
  timeRange?: { start: Date; end: Date; relative?: string }
  contentType?: string
  topics?: string[]
  intent: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid')
  const [parsedQuery, setParsedQuery] = useState<ParsedQueryInfo | null>(null)
  const [useConversational, setUseConversational] = useState(true)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      let searchQuery = query
      let parsedInfo: ParsedQueryInfo | null = null

      // Use conversational parsing for natural language queries
      if (useConversational && query.length > 10) {
        try {
          const parseResponse = await fetch('/api/search/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          })

          if (parseResponse.ok) {
            const parsed = await parseResponse.json()
            parsedInfo = parsed
            setParsedQuery(parsed)

            // Use extracted keywords for better search
            if (parsed.keywords && parsed.keywords.length > 0) {
              searchQuery = parsed.keywords.join(' ')
            }
          }
        } catch (err) {
          console.log('Conversational parsing failed, using raw query')
        }
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          mode: searchMode,
        }),
      })

      const data = await response.json()
      let finalResults = data.results || []

      // Apply additional filters from parsed query
      if (parsedInfo) {
        if (parsedInfo.timeRange) {
          finalResults = finalResults.filter((r: any) => {
            const created = new Date(r.source?.created_at || r.created_at)
            return created >= parsedInfo.timeRange!.start && created <= parsedInfo.timeRange!.end
          })
        }

        if (parsedInfo.contentType) {
          finalResults = finalResults.filter((r: any) =>
            (r.source?.content_type || r.content_type) === parsedInfo.contentType
          )
        }
      }

      setResults(finalResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Search Your Knowledge</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              ← Dashboard
            </Link>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What did I learn about AI last month?"
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" loading={loading}>
                  Search
                </Button>
              </div>

              {/* Conversational toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useConversational}
                  onChange={(e) => setUseConversational(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">
                  🗣️ Use conversational search (understands time, topics, intent)
                </span>
              </label>

              {/* Show parsed query info */}
              {parsedQuery && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-indigo-900 mb-2">🤖 Query understood as:</p>
                  <div className="space-y-1 text-indigo-800">
                    {parsedQuery.keywords.length > 0 && (
                      <p><strong>Keywords:</strong> {parsedQuery.keywords.join(', ')}</p>
                    )}
                    {parsedQuery.timeRange?.relative && (
                      <p><strong>Time:</strong> {parsedQuery.timeRange.relative}</p>
                    )}
                    {parsedQuery.topics && parsedQuery.topics.length > 0 && (
                      <p><strong>Topics:</strong> {parsedQuery.topics.join(', ')}</p>
                    )}
                    {parsedQuery.intent && (
                      <p><strong>Intent:</strong> {parsedQuery.intent}</p>
                    )}
                    {parsedQuery.contentType && (
                      <p><strong>Type:</strong> {parsedQuery.contentType}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Search Mode Selector */}
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-700 font-medium">Search mode:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="hybrid"
                  checked={searchMode === 'hybrid'}
                  onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                  className="text-blue-600"
                />
                <span>🔀 Hybrid (Best)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="semantic"
                  checked={searchMode === 'semantic'}
                  onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                  className="text-blue-600"
                />
                <span>🧠 Semantic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="keyword"
                  checked={searchMode === 'keyword'}
                  onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                  className="text-blue-600"
                />
                <span>🔤 Keyword</span>
              </label>
            </div>

            {/* Mode explanation */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
              {searchMode === 'hybrid' && (
                <p>🔀 <strong>Hybrid:</strong> Combines semantic understanding with keyword matching for best results</p>
              )}
              {searchMode === 'semantic' && (
                <p>🧠 <strong>Semantic:</strong> Finds results based on meaning and context, even if words don&apos;t match exactly</p>
              )}
              {searchMode === 'keyword' && (
                <p>🔤 <strong>Keyword:</strong> Matches exact words and phrases in your sources</p>
              )}
            </div>
          </form>
        </div>

        {loading && (
          <div className="py-12 flex justify-center">
            <Loading text="Searching..." />
          </div>
        )}

        {!loading && searched && (
          <>
            {results.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
                <div className="grid gap-4">
                  {results.map((result: any) => (
                    <SourceCard key={result.id} source={result} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start searching
            </h3>
            <p className="text-gray-600">
              Use natural language to find anything in your knowledge base
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
