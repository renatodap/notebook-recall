'use client'

import { User, Bot } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

export default function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className="w-full py-6 px-4"
      style={{
        backgroundColor: isUser ? 'var(--chat-bg-message-user)' : 'var(--chat-bg-message-ai)'
      }}
    >
      <div className="max-w-3xl mx-auto flex gap-6">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center"
          style={{
            backgroundColor: isUser ? 'var(--chat-accent)' : 'var(--chat-border)'
          }}
        >
          {isUser ? (
            <User className="h-5 w-5" style={{ color: 'var(--chat-text-primary)' }} />
          ) : (
            <Bot className="h-5 w-5" style={{ color: 'var(--chat-text-primary)' }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div
            className="prose prose-invert max-w-none"
            style={{ color: 'var(--chat-text-primary)' }}
          >
            <p className="whitespace-pre-wrap leading-7">{content}</p>
          </div>

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div
              className="text-sm pt-3 border-t"
              style={{
                borderColor: 'var(--chat-border)',
                color: 'var(--chat-text-secondary)'
              }}
            >
              <div className="font-medium mb-1">Sources used:</div>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: 'var(--chat-border)',
                      color: 'var(--chat-text-primary)'
                    }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
