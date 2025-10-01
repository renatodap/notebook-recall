'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BlogGeneratorProps {
  sourceIds: string[]
  onClose: () => void
}

export default function BlogGenerator({ sourceIds, onClose }: BlogGeneratorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [focus, setFocus] = useState('')
  const [targetAudience, setTargetAudience] = useState<'general' | 'technical' | 'academic' | 'business'>('general')
  const [tone, setTone] = useState<'formal' | 'casual' | 'professional' | 'conversational'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [customInstructions, setCustomInstructions] = useState('')
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
      const response = await fetch('/api/publishing/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: sourceIds,
          title: title.trim() || undefined,
          focus: focus.trim() || undefined,
          target_audience: targetAudience,
          tone,
          length,
          custom_instructions: customInstructions.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post')
      }

      // Redirect to view the output
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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Generate Blog Post</h2>
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
              Generate an AI-powered blog post from {sourceIds.length} source{sourceIds.length !== 1 ? 's' : ''}
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
              Post Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for AI-generated title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic/Focus (optional)
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g., 'Best practices for remote work'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Grid for settings */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General Public</option>
                <option value="technical">Technical/Developers</option>
                <option value="academic">Academic/Researchers</option>
                <option value="business">Business/Enterprise</option>
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLength('short')}
                className={`flex-1 px-4 py-2 border rounded-md ${
                  length === 'short'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Short<br />
                <span className="text-xs">500-800 words</span>
              </button>
              <button
                onClick={() => setLength('medium')}
                className={`flex-1 px-4 py-2 border rounded-md ${
                  length === 'medium'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Medium<br />
                <span className="text-xs">1000-1500 words</span>
              </button>
              <button
                onClick={() => setLength('long')}
                className={`flex-1 px-4 py-2 border rounded-md ${
                  length === 'long'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Long<br />
                <span className="text-xs">2000+ words</span>
              </button>
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions (optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Any specific requirements, style preferences, or topics to emphasize..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              <strong>What you&apos;ll get:</strong>
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
              <li>Engaging title and subtitle</li>
              <li>Well-structured content with headers</li>
              <li>SEO-optimized title and description</li>
              <li>Relevant tags</li>
              <li>Markdown format for easy publishing</li>
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : '✨ Generate Blog Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
