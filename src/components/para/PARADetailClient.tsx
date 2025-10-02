'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SourceCard from '@/components/SourceCard';
import AddSourcesToPARAModal from './AddSourcesToPARAModal';
import type { Project, Area, Resource } from '@/types';

interface PARADetailClientProps {
  item: Project | Area | Resource;
  type: 'project' | 'area' | 'resource';
  initialSources: any[];
  icon: string;
  colorClass: 'indigo' | 'green' | 'purple';
}

export default function PARADetailClient({
  item,
  type,
  initialSources,
  icon,
  colorClass,
}: PARADetailClientProps) {
  const [sources, setSources] = useState(initialSources);
  const [filteredSources, setFilteredSources] = useState(initialSources);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddSourcesModal, setShowAddSourcesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'relevant'>('recent');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const router = useRouter();

  const bgColorClass = colorClass === 'indigo' ? 'bg-indigo-600' : colorClass === 'green' ? 'bg-green-600' : 'bg-purple-600';
  const textColorClass = colorClass === 'indigo' ? 'text-indigo-600' : colorClass === 'green' ? 'text-green-600' : 'text-purple-600';
  const borderColorClass = colorClass === 'indigo' ? 'border-indigo-300' : colorClass === 'green' ? 'border-green-300' : 'border-purple-300';

  // Filter and sort sources
  useEffect(() => {
    let filtered = [...sources];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((s) =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary?.[0]?.summary_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredSources(filtered);
  }, [sources, searchQuery, sortBy]);

  // Generate AI summary
  useEffect(() => {
    if (sources.length > 0) {
      generateAISummary();
    }
  }, [sources.length]);

  const generateAISummary = async () => {
    setLoadingSummary(true);
    try {
      // Get all source IDs
      const sourceIds = sources.map(s => s.id);

      const response = await fetch('/api/para/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: sourceIds,
          type,
          item_name: item.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary || '');
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/para/${type}s/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error(`Failed to update ${type}`);

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`Failed to update ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/para/${type}s/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Failed to delete ${type}`);

      router.push('/para');
      router.refresh();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}`);
      setDeleting(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    try {
      const payload: any = { source_id: sourceId };
      if (type === 'project') payload.project_id = item.id;
      if (type === 'area') payload.area_id = item.id;
      if (type === 'resource') payload.resource_id = item.id;

      const response = await fetch('/api/para/sources/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to remove source');

      setSources(sources.filter((s) => s.id !== sourceId));
      router.refresh();
    } catch (error) {
      console.error('Error removing source:', error);
      alert('Failed to remove source');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/para"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to PARA
        </Link>

        <div className={`bg-white rounded-2xl p-8 shadow-sm border-2 ${borderColorClass}`}>
          {!isEditing ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{icon}</div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider font-medium mb-1">
                      {type}
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">{item.name}</h1>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {item.description && (
                <p className="text-lg text-gray-600 mb-4">{item.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Created {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className={`flex items-center gap-2 font-medium ${textColorClass}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {sources.length} source{sources.length !== 1 ? 's' : ''}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(item.name);
                    setDescription(item.description || '');
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className={`px-4 py-2 ${bgColorClass} text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {sources.length > 0 && (
        <div className="mb-6">
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${borderColorClass}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🤖</span>
                <span>AI Summary</span>
              </h2>
              {!loadingSummary && (
                <button
                  onClick={generateAISummary}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Refresh
                </button>
              )}
            </div>
            {loadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin text-3xl">⚡</div>
                <span className="ml-3 text-gray-600">Generating summary from {sources.length} sources...</span>
              </div>
            ) : aiSummary ? (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No summary available. Click refresh to generate.</p>
            )}
          </div>
        </div>
      )}

      {/* Sources */}
      <div>
        {/* Filter & Sort Controls */}
        {sources.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Most Recent</option>
              <option value="alphabetical">A-Z</option>
              <option value="relevant">Most Relevant</option>
            </select>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {filteredSources.length} of {sources.length} sources
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Sources</h2>
          <button
            onClick={() => setShowAddSourcesModal(true)}
            className={`px-4 py-2 ${bgColorClass} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
          >
            + Add Sources
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sources yet</h3>
            <p className="text-gray-600 mb-4">
              Add sources to this {type} to start organizing your knowledge
            </p>
            <button
              onClick={() => setShowAddSourcesModal(true)}
              className={`inline-block px-6 py-3 ${bgColorClass} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
            >
              Add Your First Source
            </button>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sources match your search</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSources.map((source) => (
              <div key={source.id} className="relative">
                <SourceCard source={source} />
                <button
                  onClick={() => {
                    if (confirm(`Remove this source from ${item.name}?`)) {
                      handleRemoveSource(source.id);
                    }
                  }}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Remove from this project"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete {type}?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{item.name}</strong>? This will not delete the sources,
              only remove them from this {type}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sources Modal */}
      {showAddSourcesModal && (
        <AddSourcesToPARAModal
          paraType={type}
          paraId={item.id}
          paraName={item.name}
          onClose={() => setShowAddSourcesModal(false)}
          onSuccess={() => {
            setShowAddSourcesModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
