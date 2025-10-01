'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewsletterGeneratorProps {
  sourceIds: string[]
  onClose: () => void
}

export default function NewsletterGenerator({ sourceIds, onClose }: NewsletterGeneratorProps) {
  const router = useRouter()
  const [newsletterName, setNewsletterName] = useState('Research Digest')
  const [theme, setTheme] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'educational'>('professional')
  const [format, setFormat] = useState<'html' | 'markdown'>('html')
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
      const response = await fetch('/api/publishing/generate-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: sourceIds,
          newsletter_name: newsletterName.trim(),
          theme: theme.trim() || undefined,
          tone,
          format,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate newsletter')
      }

      router.push(`/publishing/${data.output.id}`)
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
        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Generate Newsletter</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Create an email newsletter from {sourceIds.length} source{sourceIds.length !== 1 ? 's' : ''}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter Name</label>
            <input
              type="text"
              value={newsletterName}
              onChange={(e) => setNewsletterName(e.target.value)}
              placeholder="e.g., Weekly Research Digest"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme (optional)</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., AI & Machine Learning This Week"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="html">HTML (Email-ready)</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800"><strong>Newsletter includes:</strong></p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Engaging subject line & preview text</li>
              <li>Curated highlights from your sources</li>
              <li>Organized into scannable sections</li>
              <li>Email-optimized formatting</li>
              <li>Ready to send or customize</li>
            </ul>
          </div>
        </div>

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
            {isGenerating ? 'Generating...' : '📧 Generate Newsletter'}
          </button>
        </div>
      </div>
    </div>
  )
}
