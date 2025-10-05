'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import type { DatabaseRecord } from '@/types/api-types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources_used?: string[]
  timestamp?: string
  reasoning_steps?: unknown[]
  insights?: unknown[]
  query_type?: string
  model_used?: string
  provider_used?: string
  estimated_cost?: number
  cost_savings_vs_claude?: string
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/research-assistant/chat')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/research-assistant/chat?session_id=${sessionId}`)
      const data = await res.json()
      setCurrentSession(sessionId)
      setMessages(data.session?.messages || [])
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch('/api/research-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: currentSession
        })
      })

      const data = await res.json()

      if (data.message) {
        // Add query_type, insights, and cost info to the assistant message
        const enhancedMessage = {
          ...data.message,
          query_type: data.query_type,
          insights: data.insights,
          model_used: data.model_used,
          provider_used: data.provider_used,
          estimated_cost: data.estimated_cost,
          cost_savings_vs_claude: data.cost_savings_vs_claude
        }
        setMessages(prev => [...prev, enhancedMessage])
        setCurrentSession(data.session_id)

        // Refresh sessions list if this was a new session
        if (!currentSession) {
          fetchSessions()
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const startNewSession = () => {
    setCurrentSession(null)
    setMessages([])
  }

  const handleFeedback = async (messageIndex: number, wasHelpful: boolean) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: `${currentSession}-${messageIndex}`,
          was_helpful: wasHelpful,
          rating: wasHelpful ? 5 : 2
        })
      })

      // Update UI to show feedback was recorded
      alert(wasHelpful ? 'Thanks for the positive feedback!' : 'Thanks for the feedback! We\'ll improve.')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Research Assistant Chat</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar - Sessions */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Chat History</h2>
            <button
              onClick={startNewSession}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + New
            </button>
          </div>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No sessions yet</p>
            ) : (
              sessions.map((session: DatabaseRecord) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm hover:bg-gray-100 ${
                    currentSession === session.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-3 bg-white rounded-lg shadow flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <h2 className="text-2xl font-bold mb-4">Research Assistant</h2>
                <p className="mb-4">Ask me anything about your sources!</p>
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    💡 &quot;Summarize my recent sources&quot;
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    🔍 &quot;Find connections between my papers&quot;
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    📊 &quot;Compare methodologies used&quot;
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    ✍️ &quot;Help me write an introduction&quot;
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {/* Query Type Badge (Feature 4) */}
                      {msg.query_type && msg.role === 'assistant' && (
                        <div className="mb-2 text-xs font-semibold opacity-70">
                          🎯 {msg.query_type.toUpperCase()} MODE
                        </div>
                      )}

                      {/* Proactive Insights (Feature 5) */}
                      {msg.insights && msg.insights.length > 0 && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <div className="font-semibold mb-2">💡 Insights</div>
                          {msg.insights.map((insight: any, i: number) => (
                            <div key={i} className="mb-1">
                              • {insight.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Content */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Reasoning Steps (Feature 7) */}
                      {msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-semibold opacity-70">
                            🧠 View Reasoning Steps
                          </summary>
                          <div className="mt-2 pl-3 border-l-2 border-gray-300">
                            {msg.reasoning_steps.map((step: any, i: number) => (
                              <div key={i} className="text-xs mb-2">
                                <span className="font-semibold">Step {step.step}:</span> {step.thought}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Sources Used (Feature 1 - Semantic Search) */}
                      {msg.sources_used && msg.sources_used.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                          📚 Used {msg.sources_used.length} source(s) via semantic search
                        </div>
                      )}

                      {/* Model & Cost Info */}
                      {msg.role === 'assistant' && (msg.model_used || msg.provider_used) && (
                        <div className="mt-3 pt-2 border-t border-gray-300 text-xs opacity-70 space-y-1">
                          {msg.provider_used && msg.model_used && (
                            <div>
                              🤖 <strong>{msg.provider_used}</strong>/{msg.model_used}
                            </div>
                          )}
                          {msg.estimated_cost !== undefined && (
                            <div>
                              💰 Cost: <strong>${msg.estimated_cost.toFixed(6)}</strong>
                              {msg.cost_savings_vs_claude && (
                                <span className="ml-2 text-green-600">
                                  (↓{msg.cost_savings_vs_claude} vs Claude)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback Buttons (Feature 8 - Adaptive Learning) */}
                      {msg.role === 'assistant' && (
                        <div className="mt-3 flex gap-2 text-xs">
                          <button
                            onClick={() => handleFeedback(idx, true)}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded"
                          >
                            👍 Helpful
                          </button>
                          <button
                            onClick={() => handleFeedback(idx, false)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded"
                          >
                            👎 Not Helpful
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about your research..."
                className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🚀 <strong>Smart Features:</strong> Semantic Search • Dynamic Personas • Proactive Insights • Multi-Step Reasoning • Tool Calling • Adaptive Learning
              <br />
              💰 <strong>Cost-Optimized AI:</strong> Auto-routes to Groq (98% cheaper), OpenRouter (diversity), or Claude (complex reasoning)
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
