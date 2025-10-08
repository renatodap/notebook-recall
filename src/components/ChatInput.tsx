'use client'

import { useState, FormEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Send a message...'
}: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return

    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className="border-t py-4 px-4"
      style={{
        borderColor: 'var(--chat-border)',
        backgroundColor: 'var(--chat-bg-main)'
      }}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div
          className="relative rounded-lg shadow-lg"
          style={{ backgroundColor: 'var(--chat-bg-input)' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none"
            style={{
              color: 'var(--chat-text-primary)',
              minHeight: '52px',
              maxHeight: '200px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 200) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="absolute right-2 bottom-2 p-2 rounded-md transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: disabled || !input.trim() ? 'var(--chat-border)' : 'var(--chat-accent)',
              color: 'var(--chat-text-primary)'
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p
          className="text-xs text-center mt-3"
          style={{ color: 'var(--chat-text-secondary)' }}
        >
          ChatGPT-style interface • Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
