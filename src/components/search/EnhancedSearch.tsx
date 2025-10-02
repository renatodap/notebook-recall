'use client';

import React, { useState } from 'react';
import { GroupedSearchResultsCard } from './GroupedSearchResults';
import { ChunkSearchResultCard } from './ChunkSearchResult';
import type { EnhancedSearchResponse } from '@/types/chunks';

interface EnhancedSearchProps {
  collectionId?: string;
  onSourceSelect?: (sourceId: string) => void;
}

type SearchMode = 'chunks' | 'summaries' | 'hybrid';

export function EnhancedSearch({ collectionId, onSourceSelect }: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [threshold, setThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EnhancedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          mode,
          threshold,
          limit: 20,
          collection_id: collectionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: EnhancedSearchResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for specific passages, concepts, or ideas..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Options */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SearchMode)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="hybrid">Hybrid (Best)</option>
              <option value="chunks">Passages Only</option>
              <option value="summaries">Summaries Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Min Relevance:
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600">{Math.round(threshold * 100)}%</span>
          </div>

          {results && results.grouped_by_source && (
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'grouped'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Grouped
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'flat'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Flat
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {results.total} {results.total === 1 ? 'Result' : 'Results'}
            </h2>
            <span className="text-sm text-gray-600 capitalize">
              {results.search_mode} search
            </span>
          </div>

          {results.total === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="mt-4 text-lg text-gray-600">No results found</p>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search terms or lowering the relevance threshold
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {viewMode === 'grouped' && results.grouped_by_source ? (
                results.grouped_by_source.map((group) => (
                  <GroupedSearchResultsCard
                    key={group.source.id}
                    group={group}
                  />
                ))
              ) : (
                results.results.map((result, idx) => (
                  <ChunkSearchResultCard
                    key={`${result.chunk.id}-${idx}`}
                    result={result}
                    onSourceClick={onSourceSelect}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-4 text-lg">Enter a query to search your sources</p>
          <p className="mt-2 text-sm">
            Find specific passages, quotes, and key information across all your content
          </p>
        </div>
      )}
    </div>
  );
}

export default EnhancedSearch;
