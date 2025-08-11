import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Video, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaType {
  id: string;
  name: string;
  description: string | null;
  category: 'video' | 'audio' | 'digital' | 'other';
  created_at: string;
  updated_at: string;
}

interface MediaTypeFormData {
  name: string;
  description: string;
  category: 'video' | 'audio' | 'digital' | 'other';
}

const CATEGORIES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Video },
  { value: 'digital', label: 'Digital', icon: Video },
  { value: 'other', label: 'Other', icon: Video },
];

export function MediaTypeManagement() {
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMediaType, setEditingMediaType] = useState<MediaType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingMediaType, setDeletingMediaType] = useState<string | null>(null);

  const [formData, setFormData] = useState<MediaTypeFormData>({
    name: '',
    description: '',
    category: 'video',
  });

  useEffect(() => {
    fetchMediaTypes();
  }, []);

  const fetchMediaTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('media_types')
        .select('*')
        .order('category, name');

      if (error) throw error;

      setMediaTypes(data || []);
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
    });
    setShowForm(true);
  };

  const handleEdit = (mediaType: MediaType) => {
    setEditingMediaType(mediaType);
    setFormData({
      name: mediaType.name,
      description: mediaType.description || '',
      category: mediaType.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (mediaType: MediaType) => {
    if (!confirm(`Are you sure you want to delete "${mediaType.name}"? This will also remove it from any tracks that use it.`)) {
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

      // Then delete the media type
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

      if (editingMediaType) {
        // Update existing media type
        const { error } = await supabase
          .from('media_types')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMediaType.id);

        if (error) throw error;

        setSuccess(`Media type "${formData.name}" updated successfully`);
      } else {
        // Create new media type
        const { error } = await supabase
          .from('media_types')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
          });

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

  const groupedMediaTypes = mediaTypes.reduce((groups, mediaType) => {
    if (!groups[mediaType.category]) {
      groups[mediaType.category] = [];
    }
    groups[mediaType.category].push(mediaType);
    return groups;
  }, {} as Record<string, MediaType[]>);

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
          <p className="text-gray-400">Manage media types for Deep Media Search feature</p>
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
                placeholder="e.g., TV Shows, Podcasts, Video Games"
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

            <div className="grid gap-4">
              {types.map((mediaType) => (
                <div
                  key={mediaType.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-blue-500/10"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{mediaType.name}</h4>
                    {mediaType.description && (
                      <p className="text-sm text-gray-400 mt-1">{mediaType.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
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
