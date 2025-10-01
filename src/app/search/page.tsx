'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SourceCard from '@/components/SourceCard'
import Loading from '@/components/ui/Loading'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Your Knowledge</h1>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What did I learn about AI in August?"
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" loading={loading}>
              Search
            </Button>
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
