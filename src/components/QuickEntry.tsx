'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from './ui/Button'
import { Card, CardBody } from './ui/Card'
import { ContentType } from '@/types'

type DetectedType = 'text' | 'url' | 'pdf' | 'image' | 'unknown'

export default function QuickEntry() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [detectedType, setDetectedType] = useState<DetectedType>('unknown')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect content type
  const detectContentType = (text: string, file: File | null): DetectedType => {
    if (file) {
      if (file.type === 'application/pdf') return 'pdf'
      if (file.type.startsWith('image/')) return 'image'
    }

    if (!text.trim()) return 'unknown'

    // Check if it's a URL
    try {
      const url = new URL(text.trim())
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return 'url'
      }
    } catch {
      // Not a URL
    }

    return 'text'
  }

  // Update detected type when input changes
  const handleInputChange = (value: string) => {
    setInput(value)
    setFile(null)
    setDetectedType(detectContentType(value, null))
  }

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setInput('')
    setDetectedType(detectContentType('', selectedFile))
  }

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items

    // Check for files first
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const pastedFile = items[i].getAsFile()
        if (pastedFile) {
          e.preventDefault()
          handleFileSelect(pastedFile)
          return
        }
      }
    }
  }

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let content = ''
      let contentType: ContentType = 'text'
      let url: string | undefined

      const type = detectContentType(input, file)

      if (type === 'url') {
        // Fetch URL content
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input.trim() }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        url = input.trim()
        contentType = 'url'
      } else if (type === 'pdf' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        contentType = 'pdf'
      } else if (type === 'image' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/process-image', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        contentType = 'image'
      } else if (type === 'text') {
        content = input
        contentType = 'text'
      } else {
        throw new Error('Unable to detect content type. Please use the regular form above.')
      }

      // Summarize content
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType }),
      })
      const summaryData = await summarizeRes.json()
      if (!summarizeRes.ok) throw new Error(summaryData.error)

      // Save source (title will be auto-generated)
      const saveRes = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '', // Empty title triggers auto-generation
          content_type: contentType,
          original_content: content,
          url,
          summary_text: summaryData.summary,
          key_actions: summaryData.actions,
          key_topics: summaryData.topics,
          word_count: summaryData.summary.split(' ').length,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save source')

      // Reset form
      setInput('')
      setFile(null)
      setDetectedType('unknown')
      router.refresh()
      alert('Content saved successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIndicator = () => {
    if (detectedType === 'unknown') return null

    const icons: Record<DetectedType, string> = {
      text: '📝',
      url: '🔗',
      pdf: '📄',
      image: '🖼️',
      unknown: ''
    }

    const labels: Record<DetectedType, string> = {
      text: 'Text',
      url: 'URL',
      pdf: 'PDF',
      image: 'Image',
      unknown: ''
    }

    return (
      <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
        {icons[detectedType]} {labels[detectedType]}
      </div>
    )
  }

  return (
    <Card>
      <CardBody>
        <h2 className="text-xl font-semibold mb-2">⚡ Quick Entry</h2>
        <p className="text-sm text-gray-600 mb-4">
          Paste text, drop a file, or enter a URL. We&apos;ll figure out what to do with it.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {getTypeIndicator()}

            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste text, URL, or drop a file here..."
              className="w-full p-4 border-0 rounded-lg focus:outline-none focus:ring-0 resize-none"
              rows={6}
              disabled={loading || !!file}
            />

            {file && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {file.type === 'application/pdf' ? '📄' : '🖼️'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setDetectedType('unknown')
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              📎 Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) handleFileSelect(selectedFile)
              }}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-3"
            disabled={!input.trim() && !file}
          >
            {loading ? 'Processing...' : '⚡ Quick Add'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
