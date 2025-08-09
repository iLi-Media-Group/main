import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CustomSyncTrackUploadFormProps {
  request: any;
  onClose: () => void;
  onUploaded: () => void;
}

export function CustomSyncTrackUploadForm({ request, onClose, onUploaded }: CustomSyncTrackUploadFormProps) {
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setter(file);
  };

  const uploadFile = async (bucket: string, file: File, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return data.path;
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updates: any = {};
      
      // MP3
      if (mp3File) {
        const mp3Path = `custom_syncs/${request.id}/main.mp3`;
        updates.mp3_url = await uploadFile('track-audio', mp3File, mp3Path);
      }
      
      // Trackouts
      if (trackoutsFile) {
        const trackoutsPath = `custom_syncs/${request.id}/trackouts.zip`;
        updates.trackouts_url = await uploadFile('trackouts', trackoutsFile, trackoutsPath);
      }
      
      // Stems
      if (stemsFile) {
        const stemsPath = `custom_syncs/${request.id}/stems.zip`;
        updates.stems_url = await uploadFile('stems', stemsFile, stemsPath);
      }
      
      // Split Sheet
      if (splitSheetFile) {
        const splitSheetPath = `custom_syncs/${request.id}/split_sheet.pdf`;
        updates.split_sheet_url = await uploadFile('split-sheets', splitSheetFile, splitSheetPath);
      }
      
      // Update custom_sync_requests table
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('custom_sync_requests')
          .update(updates)
          .eq('id', request.id);
        if (updateError) throw updateError;
      }
      
      setSuccess(true);
      onUploaded();
    } catch (err: any) {
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
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-blue-900/90 backdrop-blur-lg p-8 rounded-xl w-full max-w-md border border-purple-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Upload Files for Custom Sync</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">MP3 File</label>
            <div className="relative">
              <input 
                type="file" 
                accept="audio/mp3,audio/mpeg" 
                onChange={handleFileChange(setMp3File)} 
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
                onChange={handleFileChange(setTrackoutsFile)} 
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
                onChange={handleFileChange(setStemsFile)} 
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
                onChange={handleFileChange(setSplitSheetFile)} 
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
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm font-medium">✓ Upload successful!</p>
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={clearAllFiles}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
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
      </div>
    </div>
  );
}
