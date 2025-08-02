import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Upload, X } from 'lucide-react';
import { FilePersistenceManager } from '../utils/filePersistence';

interface CustomSyncTrackUploadFormProps {
  request: any;
  onClose: () => void;
  onUploaded: () => void;
}

const FORM_KEY = 'customSyncUpload';

export function CustomSyncTrackUploadForm({ request, onClose, onUploaded }: CustomSyncTrackUploadFormProps) {
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load saved files on mount
  useEffect(() => {
    const loadSavedFiles = () => {
      const savedMp3File = FilePersistenceManager.restoreFile(FORM_KEY, 'mp3File');
      if (savedMp3File) {
        setMp3File(savedMp3File);
      }

      const savedTrackoutsFile = FilePersistenceManager.restoreFile(FORM_KEY, 'trackoutsFile');
      if (savedTrackoutsFile) {
        setTrackoutsFile(savedTrackoutsFile);
      }

      const savedStemsFile = FilePersistenceManager.restoreFile(FORM_KEY, 'stemsFile');
      if (savedStemsFile) {
        setStemsFile(savedStemsFile);
      }

      const savedSplitSheetFile = FilePersistenceManager.restoreFile(FORM_KEY, 'splitSheetFile');
      if (savedSplitSheetFile) {
        setSplitSheetFile(savedSplitSheetFile);
      }
    };

    loadSavedFiles();
  }, []);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, fileKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setter(file);
      FilePersistenceManager.saveFileMetadata(file, FORM_KEY, fileKey);
    } else {
      setter(null);
      FilePersistenceManager.clearFile(FORM_KEY, fileKey);
    }
  };

  const uploadFile = async (bucket: string, file: File, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return data.path;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Clear saved files after successful upload
      FilePersistenceManager.clearAllFiles(FORM_KEY);
      
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
    FilePersistenceManager.clearAllFiles(FORM_KEY);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl w-full max-w-md border border-purple-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Upload Files for Custom Sync</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">MP3 File</label>
            <input 
              type="file" 
              accept="audio/mp3,audio/mpeg" 
              onChange={handleFileChange(setMp3File, 'mp3File')} 
              className="w-full" 
            />
            {mp3File && (
              <p className="text-xs text-gray-400 mt-1">Selected: {mp3File.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Trackouts (ZIP)</label>
            <input 
              type="file" 
              accept="application/zip" 
              onChange={handleFileChange(setTrackoutsFile, 'trackoutsFile')} 
              className="w-full" 
            />
            {trackoutsFile && (
              <p className="text-xs text-gray-400 mt-1">Selected: {trackoutsFile.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Stems (ZIP)</label>
            <input 
              type="file" 
              accept="application/zip" 
              onChange={handleFileChange(setStemsFile, 'stemsFile')} 
              className="w-full" 
            />
            {stemsFile && (
              <p className="text-xs text-gray-400 mt-1">Selected: {stemsFile.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Split Sheet (PDF)</label>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange(setSplitSheetFile, 'splitSheetFile')} 
              className="w-full" 
            />
            {splitSheetFile && (
              <p className="text-xs text-gray-400 mt-1">Selected: {splitSheetFile.name}</p>
            )}
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">Upload successful!</div>}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={clearAllFiles}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
            >
              Clear All
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 