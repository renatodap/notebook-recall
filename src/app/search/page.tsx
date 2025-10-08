'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import SourceCard from '@/components/SourceCard'
import { X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

interface Collection {
  id: string
  name: string
  source_count: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const collectionParam = searchParams.get('collection')

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(collectionParam)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [results, setResults] = useState<any[]>([])

  // Update selectedCategoryId when URL param changes
  useEffect(() => {
    if (collectionParam) {
      setSelectedCategoryId(collectionParam)
      // Clear chat when switching from URL
      setMessages([])
      setResults([])
    }
  }, [collectionParam])

  // Fetch collection details when selectedCategoryId changes
  useEffect(() => {
    const fetchCollection = async () => {
      if (!selectedCategoryId) {
        setSelectedCollection(null)
        return
      }

      try {
        const res = await fetch(`/api/collections/${selectedCategoryId}`)
        const data = await res.json()
        if (data.success && data.data) {
          setSelectedCollection(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch collection details:', error)
      }
    }

    fetchCollection()
  }, [selectedCategoryId])

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
    // Clear chat when switching categories
    setMessages([])
    setResults([])
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      // Perform search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          mode: 'hybrid',
          collection_id: selectedCategoryId
        }),
      })

      const data = await response.json()
      const searchResults = data.results || []
      setResults(searchResults)

      // Format AI response
      let aiResponse = ''
      if (searchResults.length > 0) {
        aiResponse = `I found ${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} for "${message}":\n\n`

        searchResults.slice(0, 3).forEach((result: any, idx: number) => {
          const source = result.source || result
          aiResponse += `${idx + 1}. **${source.title || 'Untitled'}**\n`
          if (source.summary) {
            aiResponse += `   ${source.summary.substring(0, 150)}${source.summary.length > 150 ? '...' : ''}\n`
          }
          aiResponse += '\n'
        })

        if (searchResults.length > 3) {
          aiResponse += `_...and ${searchResults.length - 3} more results shown below_`
        }
      } else {
        aiResponse = `I couldn't find any results for "${message}". Try:\n• Using different keywords\n• Checking your spelling\n• Searching in a different category`
      }

      // Extract source titles for display
      const sourceTitles = searchResults.slice(0, 5).map((r: any) =>
        (r.source?.title || r.title || 'Untitled').substring(0, 50)
      )

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        sources: sourceTitles.length > 0 ? sourceTitles : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Search error:', error)

      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while searching. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: 'var(--chat-bg-main)' }}
    >
      <ChatSidebar
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
      />
      <MobileSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Collection Badge */}
        {selectedCollection && (
          <div
            className="sticky top-0 z-10 px-4 py-3 border-b"
            style={{
              backgroundColor: 'var(--chat-bg-sidebar)',
              borderColor: 'var(--chat-border)'
            }}
          >
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'var(--chat-accent)',
                  color: 'var(--chat-text-primary)'
                }}
              >
                <span>📁</span>
                <span>Searching in: {selectedCollection.name}</span>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                  aria-label="Clear collection filter"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                {selectedCollection.source_count || 0} sources
              </span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-2xl">
                <h1
                  className="text-4xl font-bold mb-4"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  {selectedCollection ? `Search in ${selectedCollection.name}` : 'Search Your Knowledge'}
                </h1>
                <p
                  className="text-lg mb-8"
                  style={{ color: 'var(--chat-text-secondary)' }}
                >
                  Ask me anything about your saved sources. I&apos;ll search through your knowledge base and provide relevant results.
                </p>
                <div
                  className="grid gap-3 text-left"
                  style={{ color: 'var(--chat-text-secondary)' }}
                >
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'var(--chat-border)',
                      backgroundColor: 'var(--chat-bg-message-ai)'
                    }}
                  >
                    💡 &quot;What did I learn about React hooks?&quot;
                  </div>
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'var(--chat-border)',
                      backgroundColor: 'var(--chat-bg-message-ai)'
                    }}
                  >
                    📚 &quot;Show me articles about machine learning&quot;
                  </div>
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'var(--chat-border)',
                      backgroundColor: 'var(--chat-bg-message-ai)'
                    }}
                  >
                    🔍 &quot;Find my notes from last week&quot;
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <ChatMessage
                  key={idx}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                />
              ))}
              {loading && (
                <div
                  className="w-full py-6 px-4"
                  style={{ backgroundColor: 'var(--chat-bg-message-ai)' }}
                >
                  <div className="max-w-3xl mx-auto flex gap-6">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: 'var(--chat-border)' }}
                    >
                      <div className="animate-pulse">🤖</div>
                    </div>
                    <div style={{ color: 'var(--chat-text-secondary)' }}>
                      Searching...
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div
              className="border-t p-6"
              style={{
                borderColor: 'var(--chat-border)',
                backgroundColor: 'var(--chat-bg-main)'
              }}
            >
              <div className="max-w-3xl mx-auto">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  Source Details:
                </h3>
                <div className="space-y-4">
                  {results.map((result: any) => (
                    <SourceCard key={result.id} source={result as any} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={loading}
          placeholder={selectedCategoryId ? "Search in this category..." : "Search your knowledge..."}
        />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
        <ChatSidebar />
        <MobileSidebar />
        <div className="flex-1 flex items-center justify-center md:ml-64">
          <div className="animate-pulse" style={{ color: 'var(--chat-text-secondary)' }}>
            Loading...
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
