'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Project, Area, Resource, PARAStats, Source, Summary, Tag } from '@/types';
import EnhancedKnowledgeCard from './EnhancedKnowledgeCard';
import SemanticSidebar from './SemanticSidebar';
import SpotlightPalette from './SpotlightPalette';
import KnowledgeGraphPanel from './KnowledgeGraphPanel';

type PARACategory = 'projects' | 'areas' | 'resources' | 'archive';

interface SourceWithSummaryAndTags extends Source {
  summary: Summary[];
  tags: Tag[];
}

interface IdealPARADashboardProps {
  initialProjects: (Project & { source_count: number })[];
  initialAreas: (Area & { source_count: number })[];
  initialResources: (Resource & { source_count: number })[];
  stats: PARAStats;
}

export default function IdealPARADashboard({
  initialProjects,
  initialAreas,
  initialResources,
  stats,
}: IdealPARADashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [areas, setAreas] = useState(initialAreas);
  const [resources, setResources] = useState(initialResources);
  const [activeCategory, setActiveCategory] = useState<PARACategory>('projects');
  const [sources, setSources] = useState<SourceWithSummaryAndTags[]>([]);
  const [filteredSources, setFilteredSources] = useState<SourceWithSummaryAndTags[]>([]);
  const [pinnedSourceIds, setPinnedSourceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'project' | 'area' | 'resource'>('project');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'relevant' | 'alphabetical'>('recent');

  // Fetch sources for active category
  useEffect(() => {
    fetchCategorySources(activeCategory);
  }, [activeCategory]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...sources];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.summary?.[0]?.summary_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tags
    if (filterTags.length > 0) {
      filtered = filtered.filter((s) =>
        filterTags.some((tag) =>
          s.tags?.some((t) => t.tag_name.toLowerCase() === tag.toLowerCase())
        )
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredSources(filtered);
  }, [sources, searchQuery, filterTags, sortBy]);

  // Keyboard shortcut for spotlight (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSpotlight(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchCategorySources = async (category: PARACategory) => {
    setLoading(true);
    try {
      // Fetch sources and pinned items in parallel
      const [sourcesResponse, pinsResponse] = await Promise.all([
        fetch(`/api/para/category-sources?category=${category}`),
        category !== 'archive'
          ? fetch(`/api/pins?category=${category}`)
          : Promise.resolve({ ok: true, json: async () => ({ pinned_items: [] }) }),
      ]);

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setSources(sourcesData.sources || []);
      } else {
        console.error('Failed to fetch sources:', sourcesResponse.statusText);
        setSources([]);
      }

      if (pinsResponse.ok) {
        const pinsData = await pinsResponse.json();
        const pinnedIds = new Set<string>(
          pinsData.pinned_items?.map((item: any) => item.source_id as string) || []
        );
        setPinnedSourceIds(pinnedIds);
      } else {
        setPinnedSourceIds(new Set<string>());
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
      setSources([]);
      setPinnedSourceIds(new Set<string>());
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: PARACategory) => {
    setActiveCategory(category);
    setSearchQuery('');
    setFilterTags([]);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (tags: string[]) => {
    setFilterTags(tags);
  };

  const openCreateModal = (type: 'project' | 'area' | 'resource') => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name.trim()) return;

    setCreating(true);
    try {
      const endpoint = `/api/para/${createType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error(`Failed to create ${createType}`);

      const { [createType]: newItem } = await response.json();

      // Update local state
      if (createType === 'project') {
        setProjects([{ ...newItem, source_count: 0 }, ...projects]);
      } else if (createType === 'area') {
        setAreas([{ ...newItem, source_count: 0 }, ...areas]);
      } else {
        setResources([{ ...newItem, source_count: 0 }, ...resources]);
      }

      setShowCreateModal(false);
    } catch (error) {
      console.error(`Error creating ${createType}:`, error);
      alert(`Failed to create ${createType}`);
    } finally {
      setCreating(false);
    }
  };

  const getCategoryColor = (category: PARACategory) => {
    switch (category) {
      case 'projects':
        return 'indigo';
      case 'areas':
        return 'green';
      case 'resources':
        return 'purple';
      case 'archive':
        return 'gray';
    }
  };

  const getCategoryIcon = (category: PARACategory) => {
    switch (category) {
      case 'projects':
        return '🎯';
      case 'areas':
        return '🌳';
      case 'resources':
        return '💎';
      case 'archive':
        return '📦';
    }
  };

  const getCategoryDescription = (category: PARACategory) => {
    switch (category) {
      case 'projects':
        return 'Active knowledge work and ongoing research themes';
      case 'areas':
        return 'Stable domains and long-term responsibilities';
      case 'resources':
        return 'Reference materials, guides, and datasets';
      case 'archive':
        return 'Inactive knowledge and completed work';
    }
  };

  const currentColor = getCategoryColor(activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Spotlight Command Palette */}
      <SpotlightPalette
        isOpen={showSpotlight}
        onClose={() => setShowSpotlight(false)}
      />

      {/* Top Navigation Bar - Horizontal PARA */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* PARA Navigation */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 mr-4">PARA</h1>
              <nav className="flex gap-2">
                {(['projects', 'areas', 'resources', 'archive'] as PARACategory[]).map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeCategory === category
                          ? `bg-${getCategoryColor(category)}-600 text-white shadow-md`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="capitalize">{category}</span>
                    </button>
                  )
                )}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {activeCategory !== 'archive' && (
                <>
                  <button
                    onClick={() => openCreateModal(
                      activeCategory === 'projects' ? 'project' :
                      activeCategory === 'areas' ? 'area' : 'resource'
                    )}
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 text-white ${
                      activeCategory === 'projects'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : activeCategory === 'areas'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <span>+</span>
                    <span>New {activeCategory === 'projects' ? 'Project' : activeCategory === 'areas' ? 'Area' : 'Resource'}</span>
                  </button>
                  <Link
                    href="/add"
                    className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900"
                  >
                    <span>+</span>
                    <span>Add Source</span>
                  </Link>
                </>
              )}
              <button
                onClick={() => setShowSpotlight(true)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🔍</span>
                <span>Search</span>
                <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">⌘K</kbd>
              </button>
              <button
                onClick={() => setShowGraph(!showGraph)}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                  showGraph
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>🕸️</span>
                <span>Graph</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Semantic Search & Filters */}
          <aside className="w-80 flex-shrink-0">
            <SemanticSidebar
              category={activeCategory}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              searchQuery={searchQuery}
              filterTags={filterTags}
            />
          </aside>

          {/* Main Content - Knowledge Cards */}
          <main className="flex-1 min-w-0">
            {/* Unassigned Sources Warning */}
            {stats.unassigned_sources > 0 && (
              <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-amber-900">
                      {stats.unassigned_sources} unassigned {stats.unassigned_sources === 1 ? 'source' : 'sources'}
                    </h3>
                    <p className="text-sm text-amber-700">
                      Organize your knowledge by assigning sources to projects, areas, or resources
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <span>📂</span>
                  <span>Organize Now</span>
                </Link>
              </div>
            )}

            {/* Category Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{getCategoryIcon(activeCategory)}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 capitalize">
                    {activeCategory}
                  </h2>
                  <p className="text-gray-600">{getCategoryDescription(activeCategory)}</p>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredSources.length}{' '}
                  {filteredSources.length === 1 ? 'item' : 'items'}
                  {sources.length !== filteredSources.length &&
                    ` (filtered from ${sources.length})`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="relevant">Most Relevant</option>
                  <option value="alphabetical">A-Z</option>
                </select>

                {/* View Mode */}
                <div className="flex gap-1 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded text-sm ${
                      viewMode === 'grid'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⊞ Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded text-sm ${
                      viewMode === 'list'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ☰ List
                  </button>
                </div>
              </div>
            </div>

            {/* Knowledge Graph Panel (Optional) */}
            {showGraph && (
              <div className="mb-6">
                <KnowledgeGraphPanel category={activeCategory} sources={filteredSources} />
              </div>
            )}

            {/* Knowledge Cards Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-4">⚡</div>
                  <p className="text-gray-600">Loading knowledge...</p>
                </div>
              </div>
            ) : filteredSources.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'space-y-4'
                }
              >
                {filteredSources.map((source) => (
                  <EnhancedKnowledgeCard
                    key={source.id}
                    source={source}
                    category={activeCategory}
                    categoryColor={currentColor}
                    initialPinned={pinnedSourceIds.has(source.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No knowledge here yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeCategory === 'archive'
                    ? 'No archived sources found'
                    : `Add sources to your ${activeCategory} to get started`}
                </p>
                {activeCategory !== 'archive' && (
                  <Link
                    href="/add"
                    className={`inline-block px-6 py-3 bg-${currentColor}-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
                  >
                    + Add Knowledge
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New {createType.charAt(0).toUpperCase() + createType.slice(1)}
            </h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`My ${createType.charAt(0).toUpperCase() + createType.slice(1)}`}
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Describe your ${createType}...`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ${
                    createType === 'project'
                      ? 'bg-indigo-600'
                      : createType === 'area'
                      ? 'bg-green-600'
                      : 'bg-purple-600'
                  }`}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
