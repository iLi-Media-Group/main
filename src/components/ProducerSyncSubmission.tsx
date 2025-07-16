import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, BadgeCheck, Hourglass, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Dialog } from './ui/dialog';

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
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [trackName, setTrackName] = useState('');
  const [trackBpm, setTrackBpm] = useState('');
  const [trackKey, setTrackKey] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmission, setEditSubmission] = useState<any>(null);
  const [editTrackName, setEditTrackName] = useState('');
  const [editTrackBpm, setEditTrackBpm] = useState('');
  const [editTrackKey, setEditTrackKey] = useState('');
  const [editHasStems, setEditHasStems] = useState(false);
  const [editHasTrackouts, setEditHasTrackouts] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

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

  // Fetch current producer's submissions for this sync request
  useEffect(() => {
    if (!user || !requestId) return;
    const fetchMySubs = async () => {
      const { data, error } = await supabase
        .from('sync_submissions')
        .select('*')
        .eq('producer_id', user.id)
        .eq('sync_request_id', requestId)
        .order('created_at', { ascending: false });
      if (!error && data) setMySubmissions(data);
    };
    fetchMySubs();
  }, [user, requestId, success]);

  // Fetch favorite submission IDs for this sync request
  useEffect(() => {
    if (!mySubmissions.length) return;
    const fetchFavorites = async () => {
      const submissionIds = mySubmissions.map(sub => sub.id);
      if (submissionIds.length === 0) return;
      const { data, error } = await supabase
        .from('sync_submission_favorites')
        .select('sync_submission_id')
        .in('sync_submission_id', submissionIds);
      if (!error && data) setFavoritedIds(new Set(data.map((f: any) => f.sync_submission_id)));
    };
    fetchFavorites();
  }, [mySubmissions, success, editModalOpen]);

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
    if (!trackName.trim()) {
      setError('Please enter a track name.');
      return;
    }
    if (!trackBpm.trim() || isNaN(Number(trackBpm))) {
      setError('Please enter a valid BPM (number).');
      return;
    }
    if (!trackKey.trim()) {
      setError('Please enter a track key.');
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
        sync_request_id: requestId,
        track_url: mp3Url,
        track_name: trackName,
        track_bpm: Number(trackBpm),
        track_key: trackKey,
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
      setTrackName('');
      setTrackBpm('');
      setTrackKey('');
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setUploading(false);
    }
  };

  // Open edit modal with current submission data
  const handleEditClick = (sub: any) => {
    setEditSubmission(sub);
    setEditTrackName(sub.track_name || '');
    setEditTrackBpm(sub.track_bpm?.toString() || '');
    setEditTrackKey(sub.track_key || '');
    setEditHasStems(!!sub.has_stems);
    setEditHasTrackouts(!!sub.has_trackouts);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Save changes after confirmation
  const handleEditSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const { error } = await supabase.from('sync_submissions').update({
        track_name: editTrackName,
        track_bpm: Number(editTrackBpm),
        track_key: editTrackKey,
        has_stems: editHasStems,
        has_trackouts: editHasTrackouts,
      }).eq('id', editSubmission.id);
      if (error) throw error;
      setEditModalOpen(false);
      setEditSubmission(null);
      setShowConfirm(false);
      // Refresh submissions
      const { data, error: fetchError } = await supabase
        .from('sync_submissions')
        .select('*')
        .eq('producer_id', user.id)
        .eq('sync_request_id', requestId)
        .order('created_at', { ascending: false });
      if (!fetchError && data) setMySubmissions(data);
    } catch (err: any) {
      setEditError(err.message || 'Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="max-w-xl mx-auto bg-blue-800/80 border border-blue-500/40 rounded-xl p-8">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Track Name</label>
                <input type="text" value={trackName} onChange={e => setTrackName(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Track BPM</label>
                  <input type="number" value={trackBpm} onChange={e => setTrackBpm(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Track Key</label>
                  <input type="text" value={trackKey} onChange={e => setTrackKey(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
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
        {/* Active Submissions Sidebar */}
        {mySubmissions.length > 0 && (
          <div className="w-full lg:w-[25rem] flex-shrink-0">
            <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-4 mb-8">
              <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><Hourglass className="w-5 h-5" /> Active Submissions</h3>
              <div className="mb-2 text-blue-200 font-semibold truncate" title={requestInfo?.project_title}>{requestInfo?.project_title || ''}</div>
              <div className="space-y-2">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="flex flex-col bg-blue-900/80 rounded-lg p-2 mb-2 cursor-pointer hover:bg-blue-800/80" onClick={() => handleEditClick(sub)}>
                    <span className="font-semibold text-white truncate max-w-[120px] flex items-center gap-2">
                      {sub.track_name || sub.track_url?.split('/').pop() || 'Track'}
                      {favoritedIds.has(sub.id) && (
                        <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs flex items-center gap-1"><Star className="w-3 h-3" fill="currentColor" /> Favorited</span>
                      )}
                    </span>
                    <div className="flex gap-2 text-xs text-blue-200 mt-1">
                      <span>BPM: {sub.track_bpm || '-'}</span>
                      <span>Key: {sub.track_key || '-'}</span>
                    </div>
                    <span className="mt-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs flex items-center gap-1 w-max"><Hourglass className="w-3 h-3" /> In Consideration</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Edit Submission Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-blue-900/90 rounded-xl p-8 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-white">Edit Submission</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Track Name</label>
                  <input type="text" value={editTrackName} onChange={e => setEditTrackName(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-1">Track BPM</label>
                    <input type="number" value={editTrackBpm} onChange={e => setEditTrackBpm(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-1">Track Key</label>
                    <input type="text" value={editTrackKey} onChange={e => setEditTrackKey(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editHasStems} onChange={e => setEditHasStems(e.target.checked)} />
                    <span className="text-blue-200">Stems Available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editHasTrackouts} onChange={e => setEditHasTrackouts(e.target.checked)} />
                    <span className="text-blue-200">Trackouts Available</span>
                  </label>
                </div>
                {editError && <div className="text-red-400 text-sm">{editError}</div>}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded bg-blue-800 hover:bg-blue-700 text-white">Cancel</button>
                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={editLoading}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Changes</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to save these changes to your submission?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={editLoading}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 