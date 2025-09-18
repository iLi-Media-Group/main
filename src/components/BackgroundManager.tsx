import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, Play, Pause, Settings, Video, Image, FileVideo, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { clearBackgroundAssetCache } from './VideoBackground';

interface BackgroundAsset {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'image';
  page: string;
  isActive: boolean;
  created_at: string;
  file_size: number;
}

interface BackgroundManagerProps {
  onClose?: () => void;
}

export function BackgroundManager({ onClose }: BackgroundManagerProps) {
  const [assets, setAssets] = useState<BackgroundAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [previewAsset, setPreviewAsset] = useState<BackgroundAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pages = [
    { id: 'all', name: 'All Pages' },
    { id: 'hero', name: 'Hero Section' },
    { id: 'client-login', name: 'Client Login' },
    { id: 'producer-login', name: 'Producer Login' },
    { id: 'artist-login', name: 'Artist/Band Login' },
    { id: 'rights-holder-login', name: 'Rights Holder Login' },
    { id: 'white-label-login', name: 'White Label Login' },
    { id: 'signup', name: 'Create Account' },
    { id: 'about', name: 'About Us' },
    { id: 'contact', name: 'Contact Us' },
    { id: 'pitch', name: 'Pitch Service' }
  ];

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated before making database queries
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('You must be logged in to view background assets');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('background_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load background assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploading(true);

      // Validate file type
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        setError('Please upload a video or image file');
        return;
      }

      // Validate file size (50MB for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File size must be less than ${isVideo ? '50MB' : '10MB'}`);
        return;
      }

      // Upload to Supabase storage
      const bucket = isVideo ? 'background-videos' : 'background-images';
      const fileName = `${Date.now()}_${file.name}`;
      
      const uploadedUrl = await uploadFile(
        file,
        bucket,
        undefined,
        undefined,
        fileName
      );

      // Save to database
      const assetData = {
        name: file.name,
        url: uploadedUrl,
        type: isVideo ? 'video' : 'image',
        page: selectedPage === 'all' ? 'hero' : selectedPage,
        isActive: false,
        file_size: file.size
      };

      const { error: dbError } = await supabase
        .from('background_assets')
        .insert([assetData]);

      if (dbError) throw dbError;

      setSuccess('Background asset uploaded successfully!');
      // Clear cache for this page
      clearBackgroundAssetCache(assetData.page);
      await fetchAssets();
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload background asset');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: BackgroundAsset) => {
    if (!window.confirm('Are you sure you want to delete this background asset?')) return;

    try {
      setLoading(true);
      
      // Delete from storage
      const bucket = asset.type === 'video' ? 'background-videos' : 'background-images';
      const fileName = asset.url.split('/').pop();
      
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([fileName]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('background_assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) throw dbError;

      setSuccess('Background asset deleted successfully!');
      // Clear cache for this page
      clearBackgroundAssetCache(asset.page);
      await fetchAssets();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete background asset');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (asset: BackgroundAsset) => {
    try {
      // First, deactivate all assets for this page
      const { error: deactivateError } = await supabase
        .from('background_assets')
        .update({ isActive: false })
        .eq('page', asset.page);

      if (deactivateError) throw deactivateError;

      // Then activate the selected asset
      const { error: activateError } = await supabase
        .from('background_assets')
        .update({ isActive: true })
        .eq('id', asset.id);

      if (activateError) throw activateError;

      setSuccess('Background asset activated successfully!');
      // Clear cache for this page
      clearBackgroundAssetCache(asset.page);
      await fetchAssets();
    } catch (err: any) {
      console.error('Toggle active error:', err);
      setError(err.message || 'Failed to update background asset');
    }
  };

  const filteredAssets = selectedPage === 'all' 
    ? assets 
    : assets.filter(asset => asset.page === selectedPage);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Background Manager</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center">
          <Check className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      {/* Page Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Page
        </label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          {pages.map(page => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Upload New Background</h3>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Background
              </>
            )}
          </button>
          <span className="text-gray-400 text-sm">
            Supports video (MP4) and image (JPG, PNG) files
          </span>
        </div>
      </div>

      {/* Assets List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          Background Assets ({filteredAssets.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
            <button 
              onClick={fetchAssets}
              className="block mx-auto mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No background assets found for this page.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {asset.type === 'video' ? (
                      <Video className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Image className="w-5 h-5 text-green-400" />
                    )}
                    <div>
                      <h4 className="text-white font-medium">{asset.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {asset.page} • {formatFileSize(asset.file_size)} • {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(asset)}
                      className={`p-2 rounded transition-colors ${
                        asset.isActive 
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title={asset.isActive ? 'Active' : 'Set as Active'}
                    >
                      {asset.isActive ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAsset(asset)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Preview: {previewAsset.name}</h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {previewAsset.type === 'video' ? (
                <video
                  src={previewAsset.url}
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Video preview error:', e);
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-full flex items-center justify-center text-red-400';
                    errorDiv.innerHTML = '<div class="text-center"><AlertCircle className="w-12 h-12 mx-auto mb-2" /><p>Video failed to load</p><p class="text-sm text-gray-500 mt-1">Check if the signed URL is valid</p></div>';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image preview error:', e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.innerHTML = '<div class="text-center"><AlertCircle className="w-12 h-12 mx-auto mb-2" /><p>Image failed to load</p><p class="text-sm text-gray-500 mt-1">Check if the signed URL is valid</p></div>';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              )}
            </div>
            
            <div className="mt-4 text-gray-300 text-sm">
              <p><strong>Page:</strong> {previewAsset.page}</p>
              <p><strong>Type:</strong> {previewAsset.type}</p>
              <p><strong>Size:</strong> {formatFileSize(previewAsset.file_size)}</p>
              <p><strong>Uploaded:</strong> {new Date(previewAsset.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
