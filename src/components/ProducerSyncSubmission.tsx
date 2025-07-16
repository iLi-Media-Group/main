import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ProducerSyncSubmission() {
  const { user } = useAuth();
  const location = useLocation();
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [hasStems, setHasStems] = useState(false);
  const [hasTrackouts, setHasTrackouts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);

  // Get requestId from query string
  const searchParams = new URLSearchParams(location.search);
  const requestId = searchParams.get('requestId');

  // Fetch custom sync request info if requestId is present
  useEffect(() => {
    if (!requestId) return;
    setLoadingRequest(true);
    supabase
      .from('custom_sync_requests')
      .select('*')
      .eq('id', requestId)
      .single()
      .then(({ data, error }) => {
        if (!error) setRequestInfo(data);
        setLoadingRequest(false);
      });
  }, [requestId]);

  const handleMp3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
      setMp3File(file);
      setError(null);
    } else {
      setError('Please upload a valid mp3 file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!mp3File) {
      setError('Please upload an mp3 file.');
      return;
    }
    if (!requestId) {
      setError('No custom sync request selected.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Upload mp3 to Supabase storage
      const filePath = `${user.id}/${Date.now()}_${mp3File.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('sync-submissions')
        .upload(filePath, mp3File, { upsert: false });
      if (storageError) throw storageError;
      const { data: publicUrlData } = supabase.storage
        .from('sync-submissions')
        .getPublicUrl(filePath);
      const mp3Url = publicUrlData?.publicUrl;
      if (!mp3Url) throw new Error('Failed to get mp3 URL.');
      // Insert submission row
      const { error: dbError } = await supabase.from('sync_submissions').insert({
        producer_id: user.id,
        custom_sync_request_id: requestId,
        mp3_url: mp3Url,
        has_mp3: true,
        has_stems: hasStems,
        has_trackouts: hasTrackouts,
        created_at: new Date().toISOString(),
      });
      if (dbError) throw dbError;
      setSuccess(true);
      setMp3File(null);
      setHasStems(false);
      setHasTrackouts(false);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-xl mx-auto px-4 bg-blue-800/80 border border-blue-500/40 rounded-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Submit Track for Custom Sync</h1>
        {loadingRequest ? (
          <div className="mb-4 text-blue-200">Loading request details...</div>
        ) : requestInfo ? (
          <div className="mb-6 p-4 bg-blue-950/80 border border-blue-700/40 rounded-lg">
            <div className="text-lg font-semibold text-white mb-1">{requestInfo.project_title}</div>
            <div className="text-gray-300 mb-2">{requestInfo.project_description}</div>
            <div className="flex flex-wrap gap-4 text-sm text-blue-200 mb-1">
              <span><strong>Sync Fee:</strong> ${requestInfo.sync_fee?.toFixed(2)}</span>
              <span><strong>End Date:</strong> {new Date(requestInfo.end_date).toLocaleDateString()}</span>
              <span><strong>Genre:</strong> {requestInfo.genre}</span>
              <span><strong>Sub-genres:</strong> {Array.isArray(requestInfo.sub_genres) ? requestInfo.sub_genres.join(', ') : requestInfo.sub_genres}</span>
            </div>
          </div>
        ) : requestId ? (
          <div className="mb-4 text-red-300">Custom sync request not found.</div>
        ) : null}
        {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400">Submission successful!</div>}
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">MP3 File</label>
            <input type="file" accept="audio/mp3,audio/mpeg" onChange={handleMp3Change} className="w-full" />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={hasStems} onChange={e => setHasStems(e.target.checked)} />
              <span className="text-gray-300">Stems Available</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={hasTrackouts} onChange={e => setHasTrackouts(e.target.checked)} />
              <span className="text-gray-300">Trackouts Available</span>
            </label>
          </div>
          <button type="submit" disabled={uploading} className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center">
            {uploading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            {uploading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
} 