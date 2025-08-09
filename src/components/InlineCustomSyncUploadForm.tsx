import React, { useState, useCallback } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

interface InlineCustomSyncUploadFormProps {
  request: any;
  onUploaded: () => void;
}

export function InlineCustomSyncUploadForm({ request, onUploaded }: InlineCustomSyncUploadFormProps) {
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [trackoutsFiles, setTrackoutsFiles] = useState<File[]>([]);
  const [stemsFiles, setStemsFiles] = useState<File[]>([]);
  const [splitSheetFiles, setSplitSheetFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Comprehensive event prevention
  const preventDefault = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const handleFileChange = useCallback((
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    validTypes: string[],
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log('[DEBUG] File change event triggered');
    preventDefault(e);
    
    const files = Array.from(e.target.files || []);
    console.log('[DEBUG] Files selected:', files.length);
    
    const invalid = files.find(file => !validTypes.some(type => file.type === type || file.type.startsWith(type)));
    if (invalid) {
      setError(`Invalid file: ${invalid.name}`);
      return;
    }
    setter(prev => [...prev, ...files]);
    setError(null);
  }, [preventDefault]);

  const removeFile = useCallback((setter: React.Dispatch<React.SetStateAction<File[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  }, []);

  const FilePreview = useCallback(({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) => (
    <>
      {files.length > 0 && (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          {files.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <button 
                type="button" 
                onClick={(e) => {
                  preventDefault(e);
                  onRemove(idx);
                }} 
                className="text-red-400 hover:text-red-600 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  ), [preventDefault]);

  // Track which files were successfully uploaded
  const [uploadedFiles, setUploadedFiles] = useState<{
    mp3: boolean;
    trackouts: boolean;
    stems: boolean;
    splitSheet: boolean;
  }>({
    mp3: false,
    trackouts: false,
    stems: false,
    splitSheet: false
  });

  const handleUpload = useCallback(async (e?: React.MouseEvent) => {
    console.log('[DEBUG] Upload button clicked');
    if (e) {
      preventDefault(e);
    }
    
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updates: any = {};
      const newUploadedFiles = { ...uploadedFiles };

      if (mp3Files.length > 0) {
        console.log('[DEBUG] Uploading MP3 file:', mp3Files[0].name, mp3Files[0].size);
        const mp3Url = await uploadFile(mp3Files[0], 'track-audio', undefined, `custom_syncs/${request.id}`, 'main.mp3');
        updates.mp3_url = mp3Url;
        newUploadedFiles.mp3 = true;
        console.log('[DEBUG] Uploaded MP3 URL:', mp3Url);
      }

      if (trackoutsFiles.length > 0) {
        console.log('[DEBUG] Uploading trackouts file:', trackoutsFiles[0].name, trackoutsFiles[0].size);
        const trackoutsUrl = await uploadFile(trackoutsFiles[0], 'trackouts', undefined, `custom_syncs/${request.id}`, 'trackouts.zip');
        updates.trackouts_url = trackoutsUrl;
        newUploadedFiles.trackouts = true;
        console.log('[DEBUG] Uploaded trackouts URL:', trackoutsUrl);
      }

      if (stemsFiles.length > 0) {
        console.log('[DEBUG] Uploading stems file:', stemsFiles[0].name, stemsFiles[0].size);
        const stemsUrl = await uploadFile(stemsFiles[0], 'stems', undefined, `custom_syncs/${request.id}`, 'stems.zip');
        updates.stems_url = stemsUrl;
        newUploadedFiles.stems = true;
        console.log('[DEBUG] Uploaded stems URL:', stemsUrl);
      }

      if (splitSheetFiles.length > 0) {
        console.log('[DEBUG] Uploading split sheet file:', splitSheetFiles[0].name, splitSheetFiles[0].size);
        const splitSheetUrl = await uploadFile(splitSheetFiles[0], 'split-sheets', undefined, `custom_syncs/${request.id}`, 'split_sheet.pdf');
        updates.split_sheet_url = splitSheetUrl;
        newUploadedFiles.splitSheet = true;
        console.log('[DEBUG] Uploaded split sheet URL:', splitSheetUrl);
      }

      if (Object.keys(updates).length > 0) {
        console.log('[DEBUG] Updating custom_sync_requests with:', updates);
        const { error: updateError } = await supabase
          .from('custom_sync_requests')
          .update(updates)
          .eq('id', request.id);
        if (updateError) throw updateError;
        console.log('[DEBUG] Successfully updated custom_sync_requests');
      }

      setUploadedFiles(newUploadedFiles);
      setSuccess(true);
      onUploaded();
      clearAllFiles();
    } catch (err: any) {
      console.error('[DEBUG] Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [mp3Files, trackoutsFiles, stemsFiles, splitSheetFiles, request.id, onUploaded, preventDefault, uploadedFiles]);

  const clearAllFiles = useCallback((e?: React.MouseEvent) => {
    console.log('[DEBUG] Clear all files clicked');
    if (e) {
      preventDefault(e);
    }
    setMp3Files([]);
    setTrackoutsFiles([]);
    setStemsFiles([]);
    setSplitSheetFiles([]);
    setError(null);
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  }, [preventDefault]);

  return (
    <div 
      className="mt-4 p-4 bg-purple-800/20 border border-purple-500/20 rounded-lg"
      onClick={preventDefault}
      onKeyDown={preventDefault}
      onKeyUp={preventDefault}
      onKeyPress={preventDefault}
      onMouseDown={preventDefault}
      onMouseUp={preventDefault}
      onMouseEnter={preventDefault}
      onMouseLeave={preventDefault}
      onFocus={preventDefault}
      onBlur={preventDefault}
      onSubmit={preventDefault}
      onReset={preventDefault}
      onInvalid={preventDefault}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Upload Files</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MP3 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">MP3 File(s)</label>
          <input
            type="file"
            accept="audio/mp3,audio/mpeg"
            multiple
            onChange={(e) => handleFileChange(setMp3Files, ['audio/'], e)}
            onClick={preventDefault}
            onKeyDown={preventDefault}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer bg-gray-800/50 border border-gray-700 rounded-lg p-2"
          />
          <FilePreview files={mp3Files} onRemove={(idx) => removeFile(setMp3Files, idx)} />
        </div>

        {/* Trackouts */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Trackouts (ZIP)</label>
          <input
            type="file"
            accept="application/zip"
            multiple
            onChange={(e) => handleFileChange(setTrackoutsFiles, ['application/zip'], e)}
            onClick={preventDefault}
            onKeyDown={preventDefault}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer bg-gray-800/50 border border-gray-700 rounded-lg p-2"
          />
          <FilePreview files={trackoutsFiles} onRemove={(idx) => removeFile(setTrackoutsFiles, idx)} />
        </div>

        {/* Stems */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Stems (ZIP)</label>
          <input
            type="file"
            accept="application/zip"
            multiple
            onChange={(e) => handleFileChange(setStemsFiles, ['application/zip'], e)}
            onClick={preventDefault}
            onKeyDown={preventDefault}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer bg-gray-800/50 border border-gray-700 rounded-lg p-2"
          />
          <FilePreview files={stemsFiles} onRemove={(idx) => removeFile(setStemsFiles, idx)} />
        </div>

        {/* Split Sheet */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Split Sheet (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFileChange(setSplitSheetFiles, ['application/pdf'], e)}
            onClick={preventDefault}
            onKeyDown={preventDefault}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer bg-gray-800/50 border border-gray-700 rounded-lg p-2"
          />
          <FilePreview files={splitSheetFiles} onRemove={(idx) => removeFile(setSplitSheetFiles, idx)} />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium mb-2">✓ Files uploaded successfully:</p>
          <div className="space-y-1 text-xs text-green-300">
            {uploadedFiles.mp3 && <div>✓ MP3 File</div>}
            {uploadedFiles.trackouts && <div>✓ Trackouts (ZIP)</div>}
            {uploadedFiles.stems && <div>✓ Stems (ZIP)</div>}
            {uploadedFiles.splitSheet && <div>✓ Split Sheet (PDF)</div>}
          </div>
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
          disabled={uploading || (!mp3Files.length && !trackoutsFiles.length && !stemsFiles.length && !splitSheetFiles.length)}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>
    </div>
  );
}
