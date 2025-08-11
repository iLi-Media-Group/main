import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Video, X, Save, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Folder, File } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaType {
  id: string;
  name: string;
  description: string | null;
  category: 'video' | 'audio' | 'digital' | 'other';
  parent_id: string | null;
  is_parent: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface MediaTypeWithSubtypes {
  id: string;
  name: string;
  description: string | null;
  category: 'video' | 'audio' | 'digital' | 'other';
  parent_id: string | null;
  is_parent: boolean;
  display_order: number;
  sub_types: MediaType[];
}

interface MediaTypeFormData {
  name: string;
  description: string;
  category: 'video' | 'audio' | 'digital' | 'other';
  parent_id: string | null;
  is_parent: boolean;
  display_order: number;
}

const CATEGORIES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Video },
  { value: 'digital', label: 'Digital', icon: Video },
  { value: 'other', label: 'Other', icon: Video },
];

export function MediaTypeManagement() {
  const [mediaTypes, setMediaTypes] = useState<MediaTypeWithSubtypes[]>([]);
  const [allMediaTypes, setAllMediaTypes] = useState<MediaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMediaType, setEditingMediaType] = useState<MediaType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingMediaType, setDeletingMediaType] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<MediaTypeFormData>({
    name: '',
    description: '',
    category: 'video',
    parent_id: null,
    is_parent: false,
    display_order: 0,
  });

  useEffect(() => {
    fetchMediaTypes();
  }, []);

  const fetchMediaTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch media types with their sub-types using the new function
      const { data: hierarchicalData, error: hierarchicalError } = await supabase
        .rpc('get_media_types_with_subtypes');

      if (hierarchicalError) throw hierarchicalError;

      // Also fetch all media types for the dropdown
      const { data: allData, error: allError } = await supabase
        .from('media_types')
        .select('*')
        .order('display_order, name');

      if (allError) throw allError;

      setMediaTypes(hierarchicalData || []);
      setAllMediaTypes(allData || []);
    } catch (err) {
      console.error('Error fetching media types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch media types');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMediaType(null);
    setFormData({
      name: '',
      description: '',
      category: 'video',
      parent_id: null,
      is_parent: false,
      display_order: 0,
    });
    setShowForm(true);
  };

  const handleAddSubType = (parentMediaType: MediaType) => {
    setEditingMediaType(null);
    setFormData({
      name: '',
      description: '',
      category: parentMediaType.category,
      parent_id: parentMediaType.id,
      is_parent: false,
      display_order: 0,
    });
    setShowForm(true);
  };

  const handleEdit = (mediaType: MediaType) => {
    setEditingMediaType(mediaType);
    setFormData({
      name: mediaType.name,
      description: mediaType.description || '',
      category: mediaType.category,
      parent_id: mediaType.parent_id,
      is_parent: mediaType.is_parent,
      display_order: mediaType.display_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (mediaType: MediaType) => {
    const message = mediaType.is_parent 
      ? `Are you sure you want to delete "${mediaType.name}"? This will also delete all its sub-types and remove them from any tracks that use them.`
      : `Are you sure you want to delete "${mediaType.name}"? This will also remove it from any tracks that use it.`;

    if (!confirm(message)) {
      return;
    }

    try {
      setDeletingMediaType(mediaType.id);
      setError(null);

      // First delete any track associations
      const { error: trackError } = await supabase
        .from('track_media_types')
        .delete()
        .eq('media_type_id', mediaType.id);

      if (trackError) throw trackError;

      // Then delete the media type (cascade will handle sub-types if it's a parent)
      const { error } = await supabase
        .from('media_types')
        .delete()
        .eq('id', mediaType.id);

      if (error) throw error;

      setSuccess(`Media type "${mediaType.name}" deleted successfully`);
      fetchMediaTypes();
    } catch (err) {
      console.error('Error deleting media type:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete media type');
    } finally {
      setDeletingMediaType(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Media type name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const mediaTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        parent_id: formData.parent_id,
        is_parent: formData.is_parent,
        display_order: formData.display_order,
        updated_at: new Date().toISOString(),
      };

      if (editingMediaType) {
        // Update existing media type
        const { error } = await supabase
          .from('media_types')
          .update(mediaTypeData)
          .eq('id', editingMediaType.id);

        if (error) throw error;

        setSuccess(`Media type "${formData.name}" updated successfully`);
      } else {
        // Create new media type
        const { error } = await supabase
          .from('media_types')
          .insert(mediaTypeData);

        if (error) throw error;

        setSuccess(`Media type "${formData.name}" created successfully`);
      }

      setShowForm(false);
      fetchMediaTypes();
    } catch (err) {
      console.error('Error saving media type:', err);
      setError(err instanceof Error ? err.message : 'Failed to save media type');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'video',
      parent_id: null,
      is_parent: false,
      display_order: 0,
    });
    setEditingMediaType(null);
    setShowForm(false);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    return categoryData ? categoryData.icon : Video;
  };

  const getCategoryLabel = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    return categoryData ? categoryData.label : category;
  };

  const toggleExpanded = (mediaTypeId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(mediaTypeId)) {
      newExpanded.delete(mediaTypeId);
    } else {
      newExpanded.add(mediaTypeId);
    }
    setExpandedParents(newExpanded);
  };

  const getParentOptions = () => {
    return allMediaTypes.filter(mt => mt.is_parent || mt.parent_id === null);
  };

  const groupedMediaTypes = mediaTypes.reduce((groups, mediaType) => {
    if (!groups[mediaType.category]) {
      groups[mediaType.category] = [];
    }
    groups[mediaType.category].push(mediaType);
    return groups;
  }, {} as Record<string, MediaTypeWithSubtypes[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Media Types Management</h2>
          <p className="text-gray-400">Manage media types and sub-types for Deep Media Search feature</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media Type</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Media Type Form */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingMediaType ? 'Edit Media Type' : 'Add New Media Type'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Media Type Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NFL, Reality TV, Action Games"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this media type"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Media Type
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Parent (Main Media Type)</option>
                  {getParentOptions().map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_parent}
                    onChange={(e) => setFormData({ ...formData, is_parent: e.target.checked })}
                    className="rounded border-blue-500/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Can have sub-types</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : (editingMediaType ? 'Update' : 'Create')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Media Types List */}
      <div className="space-y-6">
        {Object.entries(groupedMediaTypes).map(([category, types]) => (
          <div key={category} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              {React.createElement(getCategoryIcon(category), { className: "w-5 h-5 text-blue-400" })}
              <h3 className="text-lg font-semibold text-white">{getCategoryLabel(category)}</h3>
              <span className="text-sm text-gray-400">({types.length})</span>
            </div>

            <div className="space-y-4">
              {types.map((mediaType) => (
                <div key={mediaType.id} className="space-y-2">
                  {/* Parent Media Type */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-blue-500/10">
                    <div className="flex items-center space-x-3 flex-1">
                      {mediaType.is_parent ? (
                        <button
                          onClick={() => toggleExpanded(mediaType.id)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          {expandedParents.has(mediaType.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : null}
                      <Folder className="w-4 h-4 text-blue-400" />
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{mediaType.name}</h4>
                        {mediaType.description && (
                          <p className="text-sm text-gray-400 mt-1">{mediaType.description}</p>
                        )}
                        {mediaType.is_parent && (
                          <p className="text-xs text-blue-400 mt-1">
                            {mediaType.sub_types.length} sub-type{mediaType.sub_types.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {mediaType.is_parent && (
                        <button
                          onClick={() => handleAddSubType(mediaType)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors"
                          title="Add sub-type"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(mediaType)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit media type"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mediaType)}
                        disabled={deletingMediaType === mediaType.id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                        title="Delete media type"
                      >
                        {deletingMediaType === mediaType.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sub-types */}
                  {mediaType.is_parent && expandedParents.has(mediaType.id) && (
                    <div className="ml-8 space-y-2">
                      {mediaType.sub_types.map((subType) => (
                        <div
                          key={subType.id}
                          className="flex items-center justify-between p-3 bg-white/3 rounded-lg border border-blue-500/5"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <File className="w-4 h-4 text-gray-400" />
                            <div>
                              <h5 className="font-medium text-white">{subType.name}</h5>
                              {subType.description && (
                                <p className="text-sm text-gray-400">{subType.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(subType)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit sub-type"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(subType)}
                              disabled={deletingMediaType === subType.id}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                              title="Delete sub-type"
                            >
                              {deletingMediaType === subType.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {mediaTypes.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No media types found</p>
            <p className="text-sm text-gray-500 mt-2">Click "Add Media Type" to create your first media type</p>
          </div>
        )}
      </div>
    </div>
  );
}
