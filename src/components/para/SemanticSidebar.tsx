'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SemanticSidebarProps {
  category: 'projects' | 'areas' | 'resources' | 'archive';
  onSearchChange: (query: string) => void;
  onFilterChange: (tags: string[]) => void;
  searchQuery: string;
  filterTags: string[];
}

export default function SemanticSidebar({
  category,
  onSearchChange,
  onFilterChange,
  searchQuery,
  filterTags,
}: SemanticSidebarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Propagate debounced search to parent
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Fetch available tags
  useEffect(() => {
    fetchAvailableTags();
  }, [category]);

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags?.map((t: any) => t.tag_name) || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filterTags.includes(tag)
      ? filterTags.filter((t) => t !== tag)
      : [...filterTags, tag];
    onFilterChange(newTags);
  };

  const clearFilters = () => {
    setLocalQuery('');
    onFilterChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Semantic Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            🔍 Search
          </h3>
          <div className="relative">
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Natural language search..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </div>
            {localQuery && (
              <button
                onClick={() => setLocalQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {localQuery && (
          <div className="text-xs text-gray-500 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <span className="font-medium text-indigo-700">AI Semantic Search Active</span>
            <p className="mt-1">Understanding meaning and context...</p>
          </div>
        )}
      </div>

      {/* Tag Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            🏷️ Filters
          </h3>
          {(filterTags.length > 0 || localQuery) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {availableTags.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableTags.slice(0, 10).map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filterTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">{tag}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No tags available</p>
        )}
      </div>

    </div>
  );
}
