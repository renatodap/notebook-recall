'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UnifiedDropZoneProps {
  onCapture?: (sourceId: string) => void
}

type CaptureMode = 'idle' | 'url' | 'text' | 'file' | 'voice' | 'youtube'

export default function UnifiedDropZone({ onCapture }: UnifiedDropZoneProps) {
  const router = useRouter()
  const [mode, setMode] = useState<CaptureMode>('idle')
  const [input, setInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const text = e.dataTransfer.getData('text')

    if (files.length > 0) {
      await processFiles(files)
    } else if (text) {
      await processText(text)
    }
  }, [])

  const processFiles = async (files: File[]) => {
    setIsProcessing(true)
    setError('')

    try {
      for (const file of files) {
        let content = ''
        let contentType = 'text'

        // Audio files
        if (file.type.startsWith('audio/')) {
          const formData = new FormData()
          formData.append('audio', file)
          formData.append('duration', '0')

          const response = await fetch('/api/voice/upload', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) throw new Error('Failed to upload audio')

          const data = await response.json()
          if (onCapture) onCapture(data.source.id)
          continue
        }

        // PDF files
        if (file.type === 'application/pdf') {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) throw new Error('Failed to process PDF')

          const data = await response.json()
          content = data.content
          contentType = 'pdf'
        }
        // Image files
        else if (file.type.startsWith('image/')) {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/process-image', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) throw new Error('Failed to process image')

          const data = await response.json()
          content = data.content
          contentType = 'image'
        }
        else {
          throw new Error('Unsupported file type')
        }

        // Summarize
        const summarizeRes = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, contentType })
        })

        if (!summarizeRes.ok) throw new Error('Failed to summarize')

        const summaryData = await summarizeRes.json()

        // Save source
        const saveRes = await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            content_type: contentType,
            original_content: content,
            summary_text: summaryData.summary,
            key_actions: summaryData.actions,
            key_topics: summaryData.topics,
            word_count: content.split(/\s+/).length
          })
        })

        if (!saveRes.ok) throw new Error('Failed to save source')

        const data = await saveRes.json()
        if (onCapture) onCapture(data.source.id)
      }

      setInput('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }

  const processText = async (text: string) => {
    setIsProcessing(true)
    setError('')

    try {
      const urlPattern = /^(https?:\/\/)/i
      const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/i

      let content = text
      let contentType = 'text'
      let url: string | undefined

      // YouTube handling
      if (youtubePattern.test(text)) {
        const response = await fetch('/api/youtube/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: text })
        })

        if (!response.ok) {
          throw new Error('Failed to process YouTube video')
        }

        const data = await response.json()
        if (onCapture) onCapture(data.source.id)
        setInput('')
        setMode('idle')
        router.refresh()
        return
      }

      // Regular URL handling
      if (urlPattern.test(text)) {
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: text.trim() })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch URL')
        }

        const data = await response.json()
        content = data.content
        url = text.trim()
        contentType = 'url'
      }

      // Summarize content
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType })
      })

      if (!summarizeRes.ok) {
        throw new Error('Failed to summarize content')
      }

      const summaryData = await summarizeRes.json()

      // Create source with summary
      const saveRes = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          content_type: contentType,
          original_content: content,
          url,
          summary_text: summaryData.summary,
          key_actions: summaryData.actions,
          key_topics: summaryData.topics,
          word_count: content.split(/\s+/).length
        })
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save source')
      }

      const data = await saveRes.json()
      if (onCapture) onCapture(data.source.id)

      setInput('')
      setMode('idle')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to process content')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await processText(input)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processFiles(Array.from(files))
    }
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Drop Anything Here
            </h3>
            <p className="text-gray-600">
              URLs, PDFs, images, audio, YouTube videos, or plain text
            </p>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a link, type some text, or drop files here..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Capture'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,image/*,audio/*"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              📁 Upload File
            </button>

            <button
              onClick={() => {
                setMode('voice')
                // This will be handled by voice recorder component
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              🎤 Voice Note
            </button>

            <button
              onClick={() => {
                setMode('url')
                setInput('')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              🌐 Web URL
            </button>

            <button
              onClick={() => {
                setMode('youtube')
                setInput('')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              🎥 YouTube
            </button>
          </div>

          {/* Mode Hints */}
          {mode === 'url' && (
            <div className="mt-4 text-center text-sm text-gray-600">
              💡 Paste any web URL to automatically fetch and summarize
            </div>
          )}
          {mode === 'youtube' && (
            <div className="mt-4 text-center text-sm text-gray-600">
              💡 Paste a YouTube link to extract transcript and insights
            </div>
          )}
          {mode === 'voice' && (
            <div className="mt-4 text-center text-sm text-gray-600">
              💡 Record a voice note - we&apos;ll transcribe and summarize it
            </div>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-semibold text-gray-900">Processing your content...</p>
              <p className="text-sm text-gray-600 mt-1">This may take a moment</p>
            </div>
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Supported: PDFs, Images (JPG, PNG), Audio (MP3, WAV), Documents, Web URLs, YouTube videos</p>
      </div>
    </div>
  )
}
