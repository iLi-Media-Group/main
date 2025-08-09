import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

interface InlineCustomSyncUploadFormProps {
  request: any;
  onUploaded: () => void;
}

export function InlineCustomSyncUploadForm({ request, onUploaded }: InlineCustomSyncUploadFormProps) {
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // File change handlers based on working TrackUploadForm
  const handleMp3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return;
    }
    
    setMp3File(file);
    setError('');
  };

  const handleTrackoutsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/zip') {
      setError('Please upload a ZIP file for trackouts');
      return;
    }
    
    setTrackoutsFile(file);
    setError('');
  };

  const handleStemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/zip') {
      setError('Please upload a ZIP file for stems');
      return;
    }
    
    setStemsFile(file);
    setError('');
  };

  const handleSplitSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file for split sheet');
      return;
    }
    
    setSplitSheetFile(file);
    setError('');
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updates: any = {};
      
      // Upload MP3 using the same pattern as TrackUploadForm
      if (mp3File) {
        console.log('[DEBUG] Uploading MP3 file:', mp3File.name, mp3File.size);
        const mp3Url = await uploadFile(
          mp3File,
          'track-audio',
          undefined,
          `custom_syncs/${request.id}`,
          'main.mp3'
        );
        updates.mp3_url = mp3Url;
        console.log('[DEBUG] Uploaded MP3 URL:', mp3Url);
      }
      
      // Upload Trackouts
      if (trackoutsFile) {
        console.log('[DEBUG] Uploading trackouts file:', trackoutsFile.name, trackoutsFile.size);
        const trackoutsUrl = await uploadFile(
          trackoutsFile,
          'trackouts',
          undefined,
          `custom_syncs/${request.id}`,
          'trackouts.zip'
        );
        updates.trackouts_url = trackoutsUrl;
        console.log('[DEBUG] Uploaded trackouts URL:', trackoutsUrl);
      }
      
      // Upload Stems
      if (stemsFile) {
        console.log('[DEBUG] Uploading stems file:', stemsFile.name, stemsFile.size);
        const stemsUrl = await uploadFile(
          stemsFile,
          'stems',
          undefined,
          `custom_syncs/${request.id}`,
          'stems.zip'
        );
        updates.stems_url = stemsUrl;
        console.log('[DEBUG] Uploaded stems URL:', stemsUrl);
      }
      
      // Upload Split Sheet
      if (splitSheetFile) {
        console.log('[DEBUG] Uploading split sheet file:', splitSheetFile.name, splitSheetFile.size);
        const splitSheetUrl = await uploadFile(
          splitSheetFile,
          'split-sheets',
          undefined,
          `custom_syncs/${request.id}`,
          'split_sheet.pdf'
        );
        updates.split_sheet_url = splitSheetUrl;
        console.log('[DEBUG] Uploaded split sheet URL:', splitSheetUrl);
      }
      
      // Update custom_sync_requests table
      if (Object.keys(updates).length > 0) {
        console.log('[DEBUG] Updating custom_sync_requests with:', updates);
        const { error: updateError } = await supabase
          .from('custom_sync_requests')
          .update(updates)
          .eq('id', request.id);
        if (updateError) throw updateError;
        console.log('[DEBUG] Successfully updated custom_sync_requests');
      }
      
      setSuccess(true);
      onUploaded();
    } catch (err: any) {
      console.error('[DEBUG] Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAllFiles = () => {
    setMp3File(null);
    setTrackoutsFile(null);
    setStemsFile(null);
    setSplitSheetFile(null);
    setError(null);
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  return (
    <div className="mt-4 p-4 bg-purple-800/20 border border-purple-500/20 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Files</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">MP3 File</label>
          <div className="relative">
            <input 
              type="file" 
              accept="audio/mp3,audio/mpeg" 
              onChange={handleMp3Change} 
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer file:transition-colors
                bg-gray-800/50 border border-gray-700 rounded-lg p-2" 
            />
          </div>
          {mp3File && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium">✓ MP3 Selected</p>
              <p className="text-xs text-gray-400">{mp3File.name}</p>
              <p className="text-xs text-gray-400">{(mp3File.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Trackouts (ZIP)</label>
          <div className="relative">
            <input 
              type="file" 
              accept="application/zip" 
              onChange={handleTrackoutsChange} 
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer file:transition-colors
                bg-gray-800/50 border border-gray-700 rounded-lg p-2" 
            />
          </div>
          {trackoutsFile && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium">✓ Trackouts Selected</p>
              <p className="text-xs text-gray-400">{trackoutsFile.name}</p>
              <p className="text-xs text-gray-400">{(trackoutsFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Stems (ZIP)</label>
          <div className="relative">
            <input 
              type="file" 
              accept="application/zip" 
              onChange={handleStemsChange} 
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer file:transition-colors
                bg-gray-800/50 border border-gray-700 rounded-lg p-2" 
            />
          </div>
          {stemsFile && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium">✓ Stems Selected</p>
              <p className="text-xs text-gray-400">{stemsFile.name}</p>
              <p className="text-xs text-gray-400">{(stemsFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Split Sheet (PDF)</label>
          <div className="relative">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleSplitSheetChange} 
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer file:transition-colors
                bg-gray-800/50 border border-gray-700 rounded-lg p-2" 
            />
          </div>
          {splitSheetFile && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium">✓ Split Sheet Selected</p>
              <p className="text-xs text-gray-400">{splitSheetFile.name}</p>
              <p className="text-xs text-gray-400">{(splitSheetFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium">✓ Upload successful!</p>
        </div>
      )}
      
      <div className="flex space-x-2 mt-4">
        <button
          type="button"
          onClick={clearAllFiles}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || (!mp3File && !trackoutsFile && !stemsFile && !splitSheetFile)}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>
    </div>
  );
}
