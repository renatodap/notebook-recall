'use client';

import { useState, useEffect } from 'react';

interface RelationshipModalProps {
  itemId: string;
  itemName: string;
  itemType: 'project' | 'area' | 'resource';
  onClose: () => void;
  onSuccess: () => void;
}

interface AvailableItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function RelationshipModal({
  itemId,
  itemName,
  itemType,
  onClose,
  onSuccess,
}: RelationshipModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<AvailableItem[]>([]);
  const [availableResources, setAvailableResources] = useState<AvailableItem[]>([]);
  const [availableProjects, setAvailableProjects] = useState<AvailableItem[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [currentAreas, setCurrentAreas] = useState<string[]>([]);
  const [currentResources, setCurrentResources] = useState<string[]>([]);
  const [currentProjects, setCurrentProjects] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises: Promise<Response>[] = [];

      // Fetch available items based on item type
      if (itemType === 'project') {
        // Projects can link to areas and resources
        promises.push(
          fetch('/api/para/areas'),
          fetch('/api/para/resources'),
          fetch(`/api/para/projects/${itemId}`)
        );
      } else if (itemType === 'area') {
        // Areas can link to projects and resources
        promises.push(
          fetch('/api/para/projects'),
          fetch('/api/para/resources'),
          fetch(`/api/para/areas/${itemId}`)
        );
      } else if (itemType === 'resource') {
        // Resources can link to projects and areas
        promises.push(
          fetch('/api/para/projects'),
          fetch('/api/para/areas'),
          fetch(`/api/para/resources/${itemId}`)
        );
      }

      const responses = await Promise.all(promises);
      const [firstData, secondData, currentData] = await Promise.all(
        responses.map(r => r.json())
      );

      if (itemType === 'project') {
        setAvailableAreas(firstData.areas || []);
        setAvailableResources(secondData.resources || []);
        // Extract current relationships from project data
        const project = currentData.project;
        const newCurrentAreas = project?.project_areas?.map((pa: any) => pa.area_id) || [];
        const newCurrentResources = project?.project_resources?.map((pr: any) => pr.resource_id) || [];
        setCurrentAreas(newCurrentAreas);
        setCurrentResources(newCurrentResources);
        setSelectedAreas(newCurrentAreas);
        setSelectedResources(newCurrentResources);
      } else if (itemType === 'area') {
        setAvailableProjects(firstData.projects || []);
        setAvailableResources(secondData.resources || []);
        const area = currentData.area;
        const newCurrentProjects = area?.project_areas?.map((pa: any) => pa.project_id) || [];
        const newCurrentResources = area?.area_resources?.map((ar: any) => ar.resource_id) || [];
        setCurrentProjects(newCurrentProjects);
        setCurrentResources(newCurrentResources);
        setSelectedProjects(newCurrentProjects);
        setSelectedResources(newCurrentResources);
      } else if (itemType === 'resource') {
        setAvailableProjects(firstData.projects || []);
        setAvailableAreas(secondData.areas || []);
        const resource = currentData.resource;
        const newCurrentProjects = resource?.project_resources?.map((pr: any) => pr.project_id) || [];
        const newCurrentAreas = resource?.area_resources?.map((ar: any) => ar.area_id) || [];
        setCurrentProjects(newCurrentProjects);
        setCurrentAreas(newCurrentAreas);
        setSelectedProjects(newCurrentProjects);
        setSelectedAreas(newCurrentAreas);
      }
    } catch (error) {
      console.error('Error fetching relationship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const operations: Promise<Response>[] = [];

      // Determine what relationships to add and remove
      if (itemType === 'project') {
        // Handle project-area relationships
        const areasToAdd = selectedAreas.filter(id => !currentAreas.includes(id));
        const areasToRemove = currentAreas.filter(id => !selectedAreas.includes(id));

        areasToAdd.forEach(areaId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'project-area',
                from_id: itemId,
                to_id: areaId,
              }),
            })
          );
        });

        areasToRemove.forEach(areaId => {
          operations.push(
            fetch(`/api/para/relationships?type=project-area&from_id=${itemId}&to_id=${areaId}`, {
              method: 'DELETE',
            })
          );
        });

        // Handle project-resource relationships
        const resourcesToAdd = selectedResources.filter(id => !currentResources.includes(id));
        const resourcesToRemove = currentResources.filter(id => !selectedResources.includes(id));

        resourcesToAdd.forEach(resourceId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'project-resource',
                from_id: itemId,
                to_id: resourceId,
              }),
            })
          );
        });

        resourcesToRemove.forEach(resourceId => {
          operations.push(
            fetch(`/api/para/relationships?type=project-resource&from_id=${itemId}&to_id=${resourceId}`, {
              method: 'DELETE',
            })
          );
        });
      } else if (itemType === 'area') {
        // Handle area-project relationships
        const projectsToAdd = selectedProjects.filter(id => !currentProjects.includes(id));
        const projectsToRemove = currentProjects.filter(id => !selectedProjects.includes(id));

        projectsToAdd.forEach(projectId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'project-area',
                from_id: projectId,
                to_id: itemId,
              }),
            })
          );
        });

        projectsToRemove.forEach(projectId => {
          operations.push(
            fetch(`/api/para/relationships?type=project-area&from_id=${projectId}&to_id=${itemId}`, {
              method: 'DELETE',
            })
          );
        });

        // Handle area-resource relationships
        const resourcesToAdd = selectedResources.filter(id => !currentResources.includes(id));
        const resourcesToRemove = currentResources.filter(id => !selectedResources.includes(id));

        resourcesToAdd.forEach(resourceId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'area-resource',
                from_id: itemId,
                to_id: resourceId,
              }),
            })
          );
        });

        resourcesToRemove.forEach(resourceId => {
          operations.push(
            fetch(`/api/para/relationships?type=area-resource&from_id=${itemId}&to_id=${resourceId}`, {
              method: 'DELETE',
            })
          );
        });
      } else if (itemType === 'resource') {
        // Handle resource-project relationships
        const projectsToAdd = selectedProjects.filter(id => !currentProjects.includes(id));
        const projectsToRemove = currentProjects.filter(id => !selectedProjects.includes(id));

        projectsToAdd.forEach(projectId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'project-resource',
                from_id: projectId,
                to_id: itemId,
              }),
            })
          );
        });

        projectsToRemove.forEach(projectId => {
          operations.push(
            fetch(`/api/para/relationships?type=project-resource&from_id=${projectId}&to_id=${itemId}`, {
              method: 'DELETE',
            })
          );
        });

        // Handle resource-area relationships
        const areasToAdd = selectedAreas.filter(id => !currentAreas.includes(id));
        const areasToRemove = currentAreas.filter(id => !selectedAreas.includes(id));

        areasToAdd.forEach(areaId => {
          operations.push(
            fetch('/api/para/relationships', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'area-resource',
                from_id: areaId,
                to_id: itemId,
              }),
            })
          );
        });

        areasToRemove.forEach(areaId => {
          operations.push(
            fetch(`/api/para/relationships?type=area-resource&from_id=${areaId}&to_id=${itemId}`, {
              method: 'DELETE',
            })
          );
        });
      }

      await Promise.all(operations);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving relationships:', error);
      alert('Failed to save relationships');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (id: string, list: string[], setList: (ids: string[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(itemId => itemId !== id));
    } else {
      setList([...list, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔗</span>
            <span>Manage Relationships for {itemName}</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Link this {itemType} to related {itemType === 'project' ? 'areas and resources' : itemType === 'area' ? 'projects and resources' : 'projects and areas'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">⚡</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects (for areas and resources) */}
              {itemType !== 'project' && availableProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🎯</span>
                    <span>Projects</span>
                  </h3>
                  <div className="space-y-2">
                    {availableProjects.map((project) => (
                      <label
                        key={project.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={() => toggleSelection(project.id, selectedProjects, setSelectedProjects)}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{project.icon || '🎯'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-600">{project.description}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas (for projects and resources) */}
              {itemType !== 'area' && availableAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🌳</span>
                    <span>Areas</span>
                  </h3>
                  <div className="space-y-2">
                    {availableAreas.map((area) => (
                      <label
                        key={area.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAreas.includes(area.id)}
                          onChange={() => toggleSelection(area.id, selectedAreas, setSelectedAreas)}
                          className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{area.icon || '🌳'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{area.name}</div>
                            {area.description && (
                              <div className="text-sm text-gray-600">{area.description}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources (for projects and areas) */}
              {itemType !== 'resource' && availableResources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💎</span>
                    <span>Resources</span>
                  </h3>
                  <div className="space-y-2">
                    {availableResources.map((resource) => (
                      <label
                        key={resource.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => toggleSelection(resource.id, selectedResources, setSelectedResources)}
                          className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{resource.icon || '💎'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{resource.name}</div>
                            {resource.description && (
                              <div className="text-sm text-gray-600">{resource.description}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Relationships'}
          </button>
        </div>
      </div>
    </div>
  );
}
