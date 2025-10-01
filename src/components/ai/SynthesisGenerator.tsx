'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SynthesisGeneratorProps {
  sourceIds: string[]
  onClose: () => void
}

export default function SynthesisGenerator({ sourceIds, onClose }: SynthesisGeneratorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [focus, setFocus] = useState('')
  const [reportType, setReportType] = useState<'literature_review' | 'comparative' | 'thematic' | 'chronological'>('literature_review')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (sourceIds.length === 0) {
      setError('Select at least one source')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/synthesis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: sourceIds,
          title: title.trim() || undefined,
          focus: focus.trim() || undefined,
          report_type: reportType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate synthesis')
      }

      // Redirect to view the report
      router.push(`/synthesis/${data.report.id}`)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Generate Synthesis Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Generate an AI-powered synthesis report combining {sourceIds.length} source{sourceIds.length !== 1 ? 's' : ''}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for auto-generated title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Focus (optional)
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g., 'machine learning applications in healthcare'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Helps AI focus on specific aspects of the sources
            </p>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="literature_review">Literature Review</option>
              <option value="comparative">Comparative Analysis</option>
              <option value="thematic">Thematic Analysis</option>
              <option value="chronological">Chronological Analysis</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'literature_review' && 'Comprehensive review with themes, findings, and gaps'}
              {reportType === 'comparative' && 'Compare and contrast sources'}
              {reportType === 'thematic' && 'Identify recurring themes across sources'}
              {reportType === 'chronological' && 'Show evolution of ideas over time'}
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>What you&apos;ll get:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Executive summary</li>
              <li>Key themes across sources</li>
              <li>Main findings and contributions</li>
              <li>Areas of agreement and disagreement</li>
              <li>Research gaps and future directions</li>
              <li>Full narrative synthesis (3-5 pages)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || sourceIds.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Synthesis'}
          </button>
        </div>
      </div>
    </div>
  )
}
