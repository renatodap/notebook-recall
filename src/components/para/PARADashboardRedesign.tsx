'use client';

import { useState } from 'react';
import type { Project, Area, Resource, PARAStats } from '@/types';
import PARACard from './PARACard';
import CreateNewPARACard from './CreateNewPARACard';
import IconPickerModal from './IconPickerModal';
import MobileNav from '../MobileNav';

type PARACategory = 'projects' | 'areas' | 'resources' | 'archive';

interface PARAItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  source_count: number;
  created_at?: string;
  user_id?: string;
}

interface PARADashboardRedesignProps {
  initialProjects: (Project & { source_count: number; icon?: string })[];
  initialAreas: (Area & { source_count: number; icon?: string })[];
  initialResources: (Resource & { source_count: number; icon?: string })[];
  stats: PARAStats;
}

export default function PARADashboardRedesign({
  initialProjects,
  initialAreas,
  initialResources,
  stats,
}: PARADashboardRedesignProps) {
  const [activeCategory, setActiveCategory] = useState<PARACategory>('projects');
  const [projects, setProjects] = useState(initialProjects);
  const [areas, setAreas] = useState(initialAreas);
  const [resources, setResources] = useState(initialResources);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerItem, setIconPickerItem] = useState<{ id: string; type: PARACategory; currentIcon: string } | null>(null);
  const [createType, setCreateType] = useState<'project' | 'area' | 'resource'>('project');
  const [creating, setCreating] = useState(false);

  const getCategoryButtonClass = (category: PARACategory, isActive: boolean) => {
    if (!isActive) return 'text-gray-700 hover:bg-gray-100';

    switch (category) {
      case 'projects': return 'bg-indigo-600 text-white shadow-md';
      case 'areas': return 'bg-green-600 text-white shadow-md';
      case 'resources': return 'bg-purple-600 text-white shadow-md';
      case 'archive': return 'bg-gray-600 text-white shadow-md';
    }
  };

  const getCategoryIcon = (category: PARACategory | 'project' | 'area' | 'resource') => {
    switch (category) {
      case 'projects':
      case 'project':
        return '🎯';
      case 'areas':
      case 'area':
        return '🌳';
      case 'resources':
      case 'resource':
        return '💎';
      case 'archive':
        return '📦';
      default:
        return '📄';
    }
  };

  const getCurrentItems = (): PARAItem[] => {
    switch (activeCategory) {
      case 'projects': return projects;
      case 'areas': return areas;
      case 'resources': return resources;
      case 'archive': return [];
    }
  };

  const convertToSingular = (category: PARACategory): 'project' | 'area' | 'resource' => {
    switch (category) {
      case 'projects': return 'project';
      case 'areas': return 'area';
      case 'resources': return 'resource';
      case 'archive': return 'project'; // fallback
    }
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
    const icon = formData.get('icon') as string || getCategoryIcon(createType);

    if (!name.trim()) return;

    setCreating(true);
    try {
      // Map singular to plural for API endpoint
      const pluralMap: Record<string, string> = {
        'project': 'projects',
        'area': 'areas',
        'resource': 'resources'
      };

      const pluralType = pluralMap[createType];
      if (!pluralType) {
        throw new Error(`Invalid type: ${createType}`);
      }

      const endpoint = `/api/para/${pluralType}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create ${createType}`);
      }

      const { [createType]: newItem } = await response.json();

      if (!newItem || !newItem.id) {
        throw new Error('Invalid response from server');
      }

      // Update local state with proper structure
      const itemWithCount = {
        ...newItem,
        source_count: 0,
        icon: newItem.icon || icon
      };

      if (createType === 'project') {
        setProjects([itemWithCount, ...projects]);
      } else if (createType === 'area') {
        setAreas([itemWithCount, ...areas]);
      } else {
        setResources([itemWithCount, ...resources]);
      }

      setShowCreateModal(false);
    } catch (error) {
      console.error(`Error creating ${createType}:`, error);
      alert(`Failed to create ${createType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleIconSelect = async (icon: string) => {
    if (!iconPickerItem) return;

    try {
      const response = await fetch(`/api/para/${iconPickerItem.type}s/${iconPickerItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon }),
      });

      if (!response.ok) throw new Error('Failed to update icon');

      // Update local state
      if (iconPickerItem.type === 'projects') {
        setProjects(projects.map(p => p.id === iconPickerItem.id ? { ...p, icon } : p));
      } else if (iconPickerItem.type === 'areas') {
        setAreas(areas.map(a => a.id === iconPickerItem.id ? { ...a, icon } : a));
      } else if (iconPickerItem.type === 'resources') {
        setResources(resources.map(r => r.id === iconPickerItem.id ? { ...r, icon } : r));
      }

      setShowIconPicker(false);
      setIconPickerItem(null);
    } catch (error) {
      console.error('Error updating icon:', error);
      alert('Failed to update icon');
    }
  };

  const currentItems = getCurrentItems();

  return (
    <>
      <MobileNav />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0 md:pl-64">
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
                        onClick={() => setActiveCategory(category)}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${getCategoryButtonClass(category, activeCategory === category)}`}
                      >
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}</span>
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[1920px] mx-auto px-6 py-8">
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl">{getCategoryIcon(activeCategory)}</span>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 capitalize">
                  {activeCategory}
                </h2>
                <p className="text-gray-600 text-lg">
                  {activeCategory === 'projects' && 'Short-term goals and active work'}
                  {activeCategory === 'areas' && 'Long-term responsibilities and domains'}
                  {activeCategory === 'resources' && 'Reference materials and useful information'}
                  {activeCategory === 'archive' && 'Inactive and completed work'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {activeCategory !== 'archive' && (
            <div className="mb-8 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentItems.length}</span>
                <span>{activeCategory}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {currentItems.reduce((sum, item) => sum + item.source_count, 0)}
                </span>
                <span>total sources</span>
              </div>
              {stats.unassigned_sources > 0 && (
                <div className="flex items-center gap-2 text-amber-600 font-medium">
                  <span>⚠️</span>
                  <span>{stats.unassigned_sources} unassigned sources</span>
                </div>
              )}
            </div>
          )}

          {/* PARA Items Grid */}
          {activeCategory === 'archive' ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Archive</h3>
              <p className="text-gray-600 mb-6">
                Archived sources are kept here for reference
              </p>
              <a
                href="/para/archive"
                className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                View Archive
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Create New Card */}
              <CreateNewPARACard
                type={convertToSingular(activeCategory)}
                onClick={() => openCreateModal(convertToSingular(activeCategory))}
              />

              {/* PARA Item Cards */}
              {currentItems.map((item) => (
                <PARACard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description || undefined}
                  icon={item.icon || getCategoryIcon(activeCategory)}
                  type={convertToSingular(activeCategory)}
                  sourceCount={item.source_count}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {currentItems.length === 0 && activeCategory !== 'archive' && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">No {activeCategory} yet</p>
              <p className="text-sm">Click the &ldquo;Create New&rdquo; card above to get started!</p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <div
              className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{getCategoryIcon(createType)}</div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Create {createType.charAt(0).toUpperCase() + createType.slice(1)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {createType === 'project' && 'Short-term goals with outcomes & deadlines'}
                        {createType === 'area' && 'Long-term responsibilities & standards'}
                        {createType === 'resource' && 'Reference materials & useful info'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreate} className="p-8">
                <input type="hidden" name="icon" value={getCategoryIcon(createType)} />

                <div className="mb-6">
                  <label htmlFor="name" className="block text-base font-semibold text-gray-900 mb-3">
                    {createType.charAt(0).toUpperCase() + createType.slice(1)} Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    autoFocus
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    placeholder={`e.g., ${
                      createType === 'project' ? 'Launch marketing campaign' :
                      createType === 'area' ? 'Health & Fitness' :
                      'Design resources'
                    }`}
                  />
                </div>

                <div className="mb-8">
                  <label htmlFor="description" className="block text-base font-semibold text-gray-900 mb-3">
                    Description <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white"
                    placeholder={`Add more details about this ${createType}...`}
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="flex-1 px-6 py-4 text-base border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className={`flex-1 px-6 py-4 text-base text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                      createType === 'project'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
                        : createType === 'area'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    }`}
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      `Create ${createType.charAt(0).toUpperCase() + createType.slice(1)}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Icon Picker Modal */}
        {showIconPicker && iconPickerItem && (
          <IconPickerModal
            currentIcon={iconPickerItem.currentIcon}
            onSelect={handleIconSelect}
            onClose={() => {
              setShowIconPicker(false);
              setIconPickerItem(null);
            }}
          />
        )}
      </div>
    </>
  );
}
