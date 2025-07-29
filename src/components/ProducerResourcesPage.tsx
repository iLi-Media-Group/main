import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Download, FileText, Globe, BookOpen, File, ExternalLink } from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';

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
    description: 'Professional contracts and legal templates for music licensing',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'websites',
    title: 'Website Resources',
    description: 'Tools and guides for building your online presence',
    icon: <Globe className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'books',
    title: 'Book Recommendations',
    description: 'Essential reading for music producers and entrepreneurs',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'forms',
    title: 'Forms & Templates',
    description: 'Split sheets, invoices, and other essential forms',
    icon: <File className="w-6 h-6" />,
    color: 'bg-orange-500'
  }
];

export const ProducerResourcesPage: React.FC = () => {
  const { user, accountType } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && (accountType === 'producer' || accountType === 'admin,producer')) {
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

  const handleDownload = async (resource: Resource) => {
    if (!resource.file_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('contracts-and-forms')
        .download(resource.file_url);

      if (error) {
        console.error('Error downloading file:', error);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleExternalLink = (resource: Resource) => {
    if (resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  if (accountType !== 'producer' && accountType !== 'admin,producer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only available for producers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Producer Resources</h1>
          <p className="text-gray-600">
            Essential tools, templates, and resources to help you succeed in the music industry.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {categories.map(category => (
            <div
              key={category.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center text-white mb-4`}>
                {category.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>

        {/* Resources List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Resources will appear here once they are added by administrators.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => {
              const categoryInfo = getCategoryInfo(resource.category);
              return (
                <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${categoryInfo?.color} flex items-center justify-center text-white`}>
                      {categoryInfo?.icon}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {categoryInfo?.title}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4" 
                     dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.description) }} />
                  
                  <div className="flex gap-2">
                    {resource.file_url && (
                      <button
                        onClick={() => handleDownload(resource)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    {resource.external_url && (
                      <button
                        onClick={() => handleExternalLink(resource)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    Added {new Date(resource.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerResourcesPage; 