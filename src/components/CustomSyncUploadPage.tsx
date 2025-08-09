import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Music, FileText, Archive, FileAudio } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadFile, validateAudioFile, validateArchiveFile } from '../lib/storage';
import { AudioPlayer } from './AudioPlayer';

interface CustomSyncUploadPageProps {
  requestId?: string;
}

export function CustomSyncUploadPage({ requestId }: CustomSyncUploadPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get request ID from URL params if not passed as prop
  const syncRequestId = requestId || searchParams.get('requestId');

  // File states
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);

  // Other states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [syncRequest, setSyncRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load sync request data
  useEffect(() => {
    const loadSyncRequest = async () => {
      if (!syncRequestId) {
        setError('No sync request ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('custom_sync_requests')
          .select(`
            *,
            client:profiles!custom_sync_requests_client_id_fkey(first_name, last_name, email)
          `)
          .eq('id', syncRequestId)
          .single();

        if (error) throw error;
        setSyncRequest(data);
      } catch (err) {
        console.error('Error loading sync request:', err);
        setError('Failed to load sync request details');
      } finally {
        setLoading(false);
      }
    };

    loadSyncRequest();
  }, [syncRequestId]);

  const handleMp3Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    const validationError = await validateAudioFile(selectedFile);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setMp3File(selectedFile);
  };

  const handleTrackoutsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validationError = await validateArchiveFile(file);
    
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    setTrackoutsFile(file);
  };

  const handleStemsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validationError = await validateArchiveFile(file);
    
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    setStemsFile(file);
  };

  const handleSplitSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file for the split sheet');
      e.target.value = '';
      return;
    }

    setSplitSheetFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !syncRequestId) {
      setError('User not authenticated or sync request not found');
      return;
    }

    if (!mp3File && !trackoutsFile && !stemsFile && !splitSheetFile) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setUploadProgress(0);

      const updates: any = {};

      // Upload MP3 file
      if (mp3File) {
        console.log('[DEBUG] Uploading MP3 file:', mp3File.name, mp3File.size);
        const mp3Url = await uploadFile(
          mp3File,
          'track-audio',
          (progress) => { setUploadProgress(progress); },
          `custom_syncs/${syncRequestId}`,
          'main.mp3'
        );
        updates.mp3_url = mp3Url;
        console.log('[DEBUG] Uploaded MP3 URL:', mp3Url);
      }

      // Upload Trackouts file
      if (trackoutsFile) {
        console.log('[DEBUG] Uploading trackouts file:', trackoutsFile.name, trackoutsFile.size);
        const trackoutsUrl = await uploadFile(
          trackoutsFile,
          'trackouts',
          undefined,
          `custom_syncs/${syncRequestId}`,
          'trackouts.zip'
        );
        updates.trackouts_url = trackoutsUrl;
        console.log('[DEBUG] Uploaded trackouts URL:', trackoutsUrl);
      }

      // Upload Stems file
      if (stemsFile) {
        console.log('[DEBUG] Uploading stems file:', stemsFile.name, stemsFile.size);
        const stemsUrl = await uploadFile(
          stemsFile,
          'stems',
          undefined,
          `custom_syncs/${syncRequestId}`,
          'stems.zip'
        );
        updates.stems_url = stemsUrl;
        console.log('[DEBUG] Uploaded stems URL:', stemsUrl);
      }

      // Upload Split Sheet file
      if (splitSheetFile) {
        console.log('[DEBUG] Uploading split sheet file:', splitSheetFile.name, splitSheetFile.size);
        const splitSheetUrl = await uploadFile(
          splitSheetFile,
          'split-sheets',
          undefined,
          `custom_syncs/${syncRequestId}`,
          'split_sheet.pdf'
        );
        updates.split_sheet_url = splitSheetUrl;
        console.log('[DEBUG] Uploaded split sheet URL:', splitSheetUrl);
      }

      // Update the custom sync request with the uploaded file URLs
      if (Object.keys(updates).length > 0) {
        console.log('[DEBUG] Updating custom_sync_requests with:', updates);
        const { error: updateError } = await supabase
          .from('custom_sync_requests')
          .update(updates)
          .eq('id', syncRequestId);
        
        if (updateError) throw updateError;
        console.log('[DEBUG] Successfully updated custom_sync_requests');
      }

      setSuccess(true);
      
      // Redirect back to producer dashboard after a short delay
      setTimeout(() => {
        navigate('/producer/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('[DEBUG] Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setMp3File(null);
    setTrackoutsFile(null);
    setStemsFile(null);
    setSplitSheetFile(null);
    setError('');
    setSuccess(false);
    
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading sync request...</p>
        </div>
      </div>
    );
  }

  if (!syncRequest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Sync request not found</p>
          <button
            onClick={() => navigate('/producer/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-xl p-8 max-w-md w-full mx-4 shadow-lg border border-blue-500/40">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Uploading Files</h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-800/60 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-400">
                {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}% complete` : 'Preparing upload...'}
              </p>
              
              <p className="text-xs text-gray-500 mt-4">
                Please don't close this page while uploading
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Upload Custom Sync Files</h1>
              <p className="text-gray-400">Upload files for your custom sync request</p>
            </div>
            <button
              onClick={() => navigate('/producer/dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Sync Request Info */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Sync Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <span className="font-medium">Client:</span> {syncRequest.client?.first_name} {syncRequest.client?.last_name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {syncRequest.client?.email}
              </div>
              <div>
                <span className="font-medium">Project Type:</span> {syncRequest.project_type}
              </div>
              <div>
                <span className="font-medium">Budget:</span> ${syncRequest.budget}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Description:</span> {syncRequest.description}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 font-medium">✓ Files uploaded successfully! Redirecting to dashboard...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* MP3 File Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileAudio className="w-5 h-5 mr-2" />
              MP3 File
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload MP3 File
                </label>
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg"
                  onChange={handleMp3Change}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported format: MP3 only (Max 50MB)
                </p>
              </div>

              {mp3File && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Preview</h3>
                  <AudioPlayer src={URL.createObjectURL(mp3File)} title={mp3File.name} />
                </div>
              )}
            </div>
          </div>

          {/* Trackouts Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Archive className="w-5 h-5 mr-2" />
              Trackouts (ZIP)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Trackouts ZIP File
                </label>
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleTrackoutsChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing trackouts (Max 500MB)
                </p>
              </div>

              {trackoutsFile && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Selected File</h3>
                  <p className="text-gray-400 text-sm">{trackoutsFile.name}</p>
                  <p className="text-gray-500 text-xs">{(trackoutsFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Stems Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Archive className="w-5 h-5 mr-2" />
              Stems (ZIP)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Stems ZIP File
                </label>
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleStemsChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing stems (Max 500MB)
                </p>
              </div>

              {stemsFile && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Selected File</h3>
                  <p className="text-gray-400 text-sm">{stemsFile.name}</p>
                  <p className="text-gray-500 text-xs">{(stemsFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Split Sheet Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Split Sheet (PDF)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Split Sheet PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleSplitSheetChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a PDF file containing the split sheet
                </p>
              </div>

              {splitSheetFile && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Selected File</h3>
                  <p className="text-gray-400 text-sm">{splitSheetFile.name}</p>
                  <p className="text-gray-500 text-xs">{(splitSheetFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg transition-all duration-200"
              disabled={isUploading}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl border-2 border-green-400/30 hover:border-green-300/50"
              disabled={isUploading || (!mp3File && !trackoutsFile && !stemsFile && !splitSheetFile)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Uploading...'}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Files</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
