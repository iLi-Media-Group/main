import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Globe, BookOpen, File, Trash2, Edit, Plus, X } from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';
import { useSecurity } from '../hooks/useSecurity';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'contracts' | 'websites' | 'books' | 'forms';
  file_url?: string;
  external_url?: string;
  created_at: string;
  updated_at: string;
}

interface CategoryInfo {
  id: 'contracts' | 'websites' | 'books' | 'forms';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const categories: CategoryInfo[] = [
  {
    id: 'contracts',
    title: 'Contracts & Legal',
    description: 'Professional contracts and legal templates',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-blue-500'
  },
  {
    id: 'websites',
    title: 'Website Resources',
    description: 'Tools and guides for online presence',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-green-500'
  },
  {
    id: 'books',
    title: 'Book Recommendations',
    description: 'Essential reading for producers',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-purple-500'
  },
  {
    id: 'forms',
    title: 'Forms & Templates',
    description: 'Split sheets, invoices, and forms',
    icon: <File className="w-5 h-5" />,
    color: 'bg-orange-500'
  }
];

export const AdminResourceManager: React.FC = () => {
  const { user, accountType } = useAuth();
  const { validateFile, secureFileUpload, logSecurityViolation } = useSecurity();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'contracts' as 'contracts' | 'websites' | 'books' | 'forms',
    external_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user && (accountType === 'admin' || accountType === 'producer')) {
      fetchResources();
    }
  }, [user, accountType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('producer_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }

      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('contracts-and-forms')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!selectedFile && !formData.external_url) {
      alert('Please provide either a file or external URL');
      return;
    }

    try {
      setUploading(true);
      let fileUrl: string | undefined;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }

      const resourceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        file_url: fileUrl,
        external_url: formData.external_url.trim() || null
      };

      if (editingResource) {
        // Update existing resource
        const { error } = await supabase
          .from('producer_resources')
          .update(resourceData)
          .eq('id', editingResource.id);

        if (error) throw error;
      } else {
        // Create new resource
        const { error } = await supabase
          .from('producer_resources')
          .insert([resourceData]);

        if (error) throw error;
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'contracts',
        external_url: ''
      });
      setSelectedFile(null);
      setShowUploadForm(false);
      setEditingResource(null);
      
      // Refresh resources
      await fetchResources();
      
    } catch (error) {
      console.error('Error saving resource:', error);
      logSecurityViolation(`Resource upload failed: ${error}`);
      alert('Error saving resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      external_url: resource.external_url || ''
    });
    setShowUploadForm(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('producer_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      await fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Error deleting resource. Please try again.');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  if (accountType !== 'admin' && accountType !== 'producer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only available for administrators and producers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Manager</h1>
            <p className="text-gray-600">
              Upload and manage resources for producers.
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setEditingResource(null);
                  setFormData({
                    title: '',
                    description: '',
                    category: 'forms',
                    external_url: ''
                  });
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the resource and its benefits for producers..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Upload
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.rtf,.odt,.ods,.odp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {editingResource ? 'Update Resource' : 'Add Resource'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading resources...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                All Resources ({resources.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {resources.map(resource => {
                const categoryInfo = getCategoryInfo(resource.category);
                return (
                  <div key={resource.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg ${categoryInfo?.color} flex items-center justify-center text-white`}>
                          {categoryInfo?.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{resource.title}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {categoryInfo?.title}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3" 
                             dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.description) }} />
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Added {new Date(resource.created_at).toLocaleDateString()}</span>
                            {resource.file_url && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                File attached
                              </span>
                            )}
                            {resource.external_url && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                External link
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit resource"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {resources.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600">Start by adding your first resource using the button above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResourceManager; 