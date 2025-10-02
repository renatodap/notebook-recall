'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  action: () => void
  category: string
}

export default function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View all your sources',
      icon: '🏠',
      category: 'Navigation',
      action: () => router.push('/dashboard')
    },
    {
      id: 'nav-tools',
      label: 'Go to Tools',
      description: 'Access AI tools',
      icon: '🛠️',
      category: 'Navigation',
      action: () => router.push('/tools')
    },
    {
      id: 'nav-search',
      label: 'Search',
      description: 'Semantic search',
      icon: '🔍',
      category: 'Navigation',
      action: () => router.push('/search')
    },
    {
      id: 'nav-chat',
      label: 'AI Assistant',
      description: 'Chat with your knowledge base',
      icon: '💬',
      category: 'Navigation',
      action: () => router.push('/chat')
    },
    {
      id: 'nav-synthesis',
      label: 'Synthesis & Reviews',
      description: 'Generate research reports',
      icon: '📝',
      category: 'Navigation',
      action: () => router.push('/synthesis')
    },
    {
      id: 'nav-graph',
      label: 'Knowledge Graph',
      description: 'Visualize connections',
      icon: '🕸️',
      category: 'Navigation',
      action: () => router.push('/graph')
    },
    {
      id: 'nav-timeline',
      label: 'Timeline',
      description: 'Chronological view',
      icon: '📅',
      category: 'Navigation',
      action: () => router.push('/timeline')
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      description: 'Usage insights',
      icon: '📊',
      category: 'Navigation',
      action: () => router.push('/analytics')
    },
    // Actions
    {
      id: 'action-add',
      label: 'Add Source',
      description: 'Add new content',
      icon: '➕',
      category: 'Actions',
      action: () => router.push('/add')
    },
    {
      id: 'action-import',
      label: 'Import',
      description: 'Bulk import references',
      icon: '📥',
      category: 'Actions',
      action: () => router.push('/import')
    },
    {
      id: 'action-collections',
      label: 'Collections',
      description: 'Organize sources',
      icon: '📚',
      category: 'Actions',
      action: () => router.push('/collections')
    },
    {
      id: 'action-workspaces',
      label: 'Workspaces',
      description: 'Team collaboration',
      icon: '👥',
      category: 'Actions',
      action: () => router.push('/workspaces')
    },
  ]

  const filteredCommands = query.trim()
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsOpen(prev => !prev)
      setQuery('')
      setSelectedIndex(0)
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selectedCommand = filteredCommands[selectedIndex]
      if (selectedCommand) {
        selectedCommand.action()
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(0)
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    // Reset selected index when query changes
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <span className="text-2xl">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for commands, tools, or pages..."
              className="flex-1 text-lg outline-none bg-transparent"
            />
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {category}
                  </div>
                  {items.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const isSelected = globalIndex === selectedIndex

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          setIsOpen(false)
                          setQuery('')
                          setSelectedIndex(0)
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-l-4 border-indigo-600'
                            : 'border-l-4 border-transparent hover:bg-gray-50'
                        }`}
                      >
                        {cmd.icon && (
                          <span className="text-2xl">{cmd.icon}</span>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div className="text-sm text-gray-600">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                            ↵
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded font-mono border border-gray-300">↑</kbd>
                <kbd className="px-2 py-1 bg-white rounded font-mono border border-gray-300">↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded font-mono border border-gray-300">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white rounded font-mono border border-gray-300">⌘</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white rounded font-mono border border-gray-300">K</kbd>
              <span className="ml-1">to toggle</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
