'use client'

import { useState } from 'react'
import type { Citation } from '@/types'

interface CitationPreviewProps {
  citation: Citation | null
  compact?: boolean
}

export default function CitationPreview({ citation, compact = false }: CitationPreviewProps) {
  const [copied, setCopied] = useState(false)

  if (!citation) return null

  const handleCopy = async () => {
    if (!citation.apa) return

    try {
      await navigator.clipboard.writeText(citation.apa)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
        <span className="flex-1 truncate">{citation.apa}</span>
        <button
          onClick={handleCopy}
          className="text-blue-600 hover:text-blue-700 flex-shrink-0"
          title="Copy APA citation"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold text-blue-900 mb-1">APA Citation:</div>
          <div className="text-sm text-blue-800">{citation.apa}</div>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
    </div>
  )
}
