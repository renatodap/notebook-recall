'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SpotlightPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'source' | 'project' | 'area' | 'resource' | 'action';
  title: string;
  description?: string;
  icon: string;
  url?: string;
  action?: () => void;
}

export default function SpotlightPalette({ isOpen, onClose }: SpotlightPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 200);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults(getDefaultActions());
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults(getDefaultActions());
    }
  }, [debouncedQuery]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const getDefaultActions = (): SearchResult[] => {
    return [
      {
        id: 'add-source',
        type: 'action',
        title: 'Add New Source',
        description: 'Quick entry for new content',
        icon: '➕',
        url: '/add',
      },
      {
        id: 'search-all',
        type: 'action',
        title: 'Search All Knowledge',
        description: 'Semantic search across everything',
        icon: '🔍',
        url: '/search',
      },
      {
        id: 'view-graph',
        type: 'action',
        title: 'Knowledge Graph',
        description: 'Visualize connections',
        icon: '🕸️',
        url: '/graph',
      },
      {
        id: 'para-dashboard',
        type: 'action',
        title: 'PARA Dashboard',
        description: 'View all projects, areas, and resources',
        icon: '📊',
        url: '/para',
      },
    ];
  };

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search sources
      const sourcesResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, mode: 'hybrid', limit: 5 }),
      });

      let searchResults: SearchResult[] = [];

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        searchResults = sourcesData.results?.map((result: any) => ({
          id: result.id || result.source?.id,
          type: 'source',
          title: result.title || result.source?.title || 'Untitled',
          description:
            result.summary?.summary_text ||
            result.source?.summary?.[0]?.summary_text ||
            'No summary',
          icon: getContentIcon(result.content_type || result.source?.content_type || 'text'),
          url: `/source/${result.id || result.source?.id}`,
        })) || [];
      }

      // Add action shortcuts if query matches
      const actions = getDefaultActions().filter(
        (action) =>
          action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults([...actions, ...searchResults]);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (contentType: string): string => {
    const icons: Record<string, string> = {
      text: '📝',
      url: '🔗',
      pdf: '📄',
      note: '📋',
      image: '🖼️',
    };
    return icons[contentType] || '📄';
  };

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.url) {
      router.push(result.url);
    }
    onClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'source':
        return 'bg-blue-100 text-blue-700';
      case 'project':
        return 'bg-indigo-100 text-indigo-700';
      case 'area':
        return 'bg-green-100 text-green-700';
      case 'resource':
        return 'bg-purple-100 text-purple-700';
      case 'action':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Spotlight Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <span className="text-2xl">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a command..."
            className="flex-1 text-lg outline-none placeholder-gray-400"
          />
          {loading && (
            <div className="animate-spin text-xl">⚡</div>
          )}
          <kbd className="px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                    selectedIndex === index
                      ? 'bg-indigo-50 border-l-4 border-indigo-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {result.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                          result.type
                        )}`}
                      >
                        {result.type}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {result.description}
                      </p>
                    )}
                  </div>
                  {selectedIndex === index && (
                    <div className="flex-shrink-0">
                      <kbd className="px-2 py-1 text-xs bg-white rounded border border-gray-300">
                        ↵
                      </kbd>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <div className="text-4xl mb-3">💡</div>
              <p>Type to search your knowledge base</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↑</kbd>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="text-gray-500">
              Powered by AI • {results.length} results
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
