'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Contradiction {
  id: string
  source_a_id: string
  source_b_id: string
  claim_a: string
  claim_b: string
  severity: 'minor' | 'moderate' | 'major'
  confidence: number
  explanation: string
  topic: string
  source_a?: { id: string; title: string; content_type: string }
  source_b?: { id: string; title: string; content_type: string }
}

interface ContradictionsPanelProps {
  sourceId: string
}

export default function ContradictionsPanel({ sourceId }: ContradictionsPanelProps) {
  const [contradictions, setContradictions] = useState<Contradiction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchContradictions()
  }, [sourceId])

  const fetchContradictions = async () => {
    try {
      const response = await fetch(`/api/contradictions/source/${sourceId}`)
      const data = await response.json()
      setContradictions(data.contradictions || [])
    } catch (error) {
      console.error('Error fetching contradictions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">⚠️ Contradictions</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const displayedContradictions = showAll ? contradictions : contradictions.slice(0, 3)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">⚠️ Contradictions</h2>
        {contradictions.length > 0 && (
          <span className="text-sm text-gray-600">
            {contradictions.length} found
          </span>
        )}
      </div>

      {contradictions.length === 0 ? (
        <p className="text-gray-600 text-sm">
          No contradictions detected with other sources yet.
        </p>
      ) : (
        <div className="space-y-4">
          {displayedContradictions.map((contradiction) => {
            const otherSource = contradiction.source_a_id === sourceId
              ? contradiction.source_b
              : contradiction.source_a
            const thisClaim = contradiction.source_a_id === sourceId
              ? contradiction.claim_a
              : contradiction.claim_b
            const otherClaim = contradiction.source_a_id === sourceId
              ? contradiction.claim_b
              : contradiction.claim_a

            return (
              <div
                key={contradiction.id}
                className={`border rounded-lg p-4 ${getSeverityColor(contradiction.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium uppercase">
                    {contradiction.severity} Conflict
                  </span>
                  <span className="text-xs">
                    {Math.round(contradiction.confidence * 100)}% confidence
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">This source claims:</p>
                  <p className="text-sm italic">&quot;{thisClaim}&quot;</p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Contradicts:</p>
                  <p className="text-sm italic">&quot;{otherClaim}&quot;</p>
                  {otherSource && (
                    <Link
                      href={`/source/${otherSource.id}`}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      → {otherSource.title}
                    </Link>
                  )}
                </div>

                <div className="pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium mb-1">Topic: {contradiction.topic}</p>
                  <p className="text-xs">{contradiction.explanation}</p>
                </div>
              </div>
            )
          })}

          {contradictions.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showAll ? 'Show less' : `Show ${contradictions.length - 3} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
