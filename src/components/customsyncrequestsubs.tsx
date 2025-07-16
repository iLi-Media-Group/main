import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star } from 'lucide-react';

interface CustomSyncRequest {
  id: string;
  project_title: string;
  project_description: string;
  sync_fee: number;
  end_date: string;
  genre: string;
  sub_genres: string[];
  status: string;
  created_at: string;
}

interface SyncSubmission {
  id: string;
  mp3_url?: string;
  has_mp3?: boolean;
  has_stems?: boolean;
  has_trackouts?: boolean;
  created_at?: string;
  signed_mp3_url?: string;
  producer_id?: string;
  producer_name?: string;
  producer_number?: string;
}

export default function CustomSyncRequestSubs() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomSyncRequest[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SyncSubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSelect, setConfirmSelect] = useState<{ reqId: string; subId: string } | null>(null);
  const [favorites, setFavorites] = useState<{ [subId: string]: SyncSubmission }>(() => ({}));
  const [selectedSubmission, setSelectedSubmission] = useState<{ reqId: string; sub: SyncSubmission } | null>(null);
  const [hiddenSubmissions, setHiddenSubmissions] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('custom_sync_requests')
        .select('*, sync_submissions(*)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else {
        setRequests(data || []);
        // Map submissions by request id and fetch signed URLs for mp3s and producer info
        const subMap: Record<string, SyncSubmission[]> = {};
        for (const req of data || []) {
          const subs: SyncSubmission[] = req.sync_submissions || [];
          const updatedSubs = await Promise.all(subs.map(async (sub: SyncSubmission) => {
            let producer_name = 'Unknown Producer';
            let producer_number = '';
            if (sub.producer_id) {
              const { data: producerProfile } = await supabase
                .from('profiles')
                .select('first_name, last_name, producer_number')
                .eq('id', sub.producer_id)
                .maybeSingle();
              if (producerProfile) {
                producer_name = `${producerProfile.first_name || ''} ${producerProfile.last_name || ''}`.trim() || 'Unknown Producer';
                producer_number = producerProfile.producer_number || '';
              }
            }
            if (sub.has_mp3 && sub.mp3_url) {
              const match = sub.mp3_url.match(/sync-submissions\/(.+)$/);
              const filePath = match ? `sync-submissions/${match[1]}` : undefined;
              if (filePath) {
                const { data: signedUrlData } = await supabase.storage
                  .from('sync-submissions')
                  .createSignedUrl(filePath.replace('sync-submissions/', ''), 3600);
                if (signedUrlData?.signedUrl) {
                  return { ...sub, signed_mp3_url: signedUrlData.signedUrl, producer_name, producer_number };
                }
              }
            }
            return { ...sub, producer_name, producer_number };
          }));
          subMap[req.id] = updatedSubs;
        }
        setSubmissions(subMap);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  const handleFavorite = (sub: SyncSubmission) => {
    setFavorites((prev) => {
      if (prev[sub.id]) {
        const copy = { ...prev };
        delete copy[sub.id];
        return copy;
      } else {
        return { ...prev, [sub.id]: sub };
      }
    });
  };

  const handleSelect = (reqId: string, subId: string) => {
    setConfirmSelect({ reqId, subId });
  };

  const confirmSelectSubmission = () => {
    if (!confirmSelect) return;
    const { reqId, subId } = confirmSelect;
    const sub = submissions[reqId]?.find(s => s.id === subId);
    setSelectedSubmission(sub ? { reqId, sub } : null);
    setConfirmSelect(null);
    alert('Track selected! All other submissions will be declined.');
  };

  const cancelSelect = () => setConfirmSelect(null);

  // Hide all non-favorited submissions for a request
  const handleDeleteAllExceptFavorites = (reqId: string) => {
    setHiddenSubmissions((prev) => {
      const favIds = new Set(Object.keys(favorites));
      const allSubIds = (submissions[reqId] || []).map(s => s.id);
      const toHide = allSubIds.filter(id => !favIds.has(id));
      return { ...prev, [reqId]: new Set(toHide) };
    });
  };

  // De-select the chosen submission
  const handleDeselect = () => {
    setSelectedSubmission(null);
  };

  // Placeholder for chat room creation and navigation
  const handleMessageProducer = async () => {
    if (!selectedSubmission || !user) return;
    // TODO: Implement chat room creation logic here
    alert(`Open chat with producer: ${selectedSubmission.sub.producer_name || ''}`);
    // Example: navigate(`/chat?room=...`)
  };

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-6">Your Custom Sync Requests</h1>
          {loading ? (
            <div className="text-center text-blue-300">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-400">You have not submitted any custom sync requests yet.</div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-blue-800/80 border border-blue-500/40 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <h2 className="text-xl font-semibold text-white mb-2 md:mb-0">{req.project_title}</h2>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-600 text-white font-medium">{req.status}</span>
                  </div>
                  <p className="text-gray-300 mb-2">{req.project_description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-2">
                    <span><strong>Sync Fee:</strong> ${req.sync_fee.toFixed(2)}</span>
                    <span><strong>End Date:</strong> {new Date(req.end_date).toLocaleDateString()}</span>
                    <span><strong>Genre:</strong> {req.genre}</span>
                    <span><strong>Sub-genres:</strong> {Array.isArray(req.sub_genres) ? req.sub_genres.join(', ') : req.sub_genres}</span>
                  </div>
                  <div className="text-right">
                    <a href={`/custom-sync-request/${req.id}`} className="text-blue-400 hover:underline font-medium">View Details</a>
                  </div>
                  {/* Delete all except favorites button */}
                  <div className="flex justify-end mb-2">
                    <button
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                      onClick={() => handleDeleteAllExceptFavorites(req.id)}
                      disabled={Object.keys(favorites).length === 0}
                    >
                      Delete all except Favorites
                    </button>
                  </div>
                  {submissions[req.id] && submissions[req.id].length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-blue-200 mb-4">Producer Submissions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        {submissions[req.id]
                          .filter(sub => !hiddenSubmissions[req.id]?.has(sub.id))
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className="relative bg-blue-950/80 border border-blue-700/40 rounded-2xl shadow-lg p-7 flex flex-col min-h-[340px] max-w-2xl w-full mx-auto transition-transform hover:-translate-y-1 hover:shadow-2xl"
                            >
                              {/* Top Row: Producer info and actions */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-white text-base">{sub.producer_name}</span>
                                  {sub.producer_number && (
                                    <span className="ml-2 text-xs text-blue-300">({sub.producer_number})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className={
                                      'rounded-full p-1 transition-colors ' +
                                      (favorites[sub.id] ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400')
                                    }
                                    title={favorites[sub.id] ? 'Unfavorite' : 'Favorite'}
                                    onClick={() => handleFavorite(sub)}
                                  >
                                    <Star className="w-6 h-6" fill={favorites[sub.id] ? 'currentColor' : 'none'} />
                                  </button>
                                  <button
                                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-colors disabled:opacity-50"
                                    onClick={() => handleSelect(req.id, sub.id)}
                                    disabled={!!selectedSubmission}
                                  >
                                    Select
                                  </button>
                                </div>
                              </div>
                              {/* Audio Player */}
                              <div className="flex-1 flex flex-col justify-center items-center my-4">
                                {sub.has_mp3 && sub.signed_mp3_url ? (
                                  <audio controls src={sub.signed_mp3_url} className="w-full max-w-sm" />
                                ) : (
                                  <span className="text-gray-400">No mp3 uploaded</span>
                                )}
                              </div>
                              {/* Badges */}
                              <div className="flex gap-3 mb-2">
                                <span className={
                                  'px-2 py-1 rounded-full text-xs font-medium ' +
                                  (sub.has_stems ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-400')
                                }>
                                  {sub.has_stems ? '✓ Stems' : '✗ Stems'}
                                </span>
                                <span className={
                                  'px-2 py-1 rounded-full text-xs font-medium ' +
                                  (sub.has_trackouts ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-400')
                                }>
                                  {sub.has_trackouts ? '✓ Trackouts' : '✗ Trackouts'}
                                </span>
                              </div>
                              {/* Submission Date/Time */}
                              <div className="absolute bottom-4 right-7 text-xs text-gray-400">
                                {sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Message Producer and De-select Buttons */}
                  {selectedSubmission && selectedSubmission.reqId === req.id && (
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
                        onClick={handleMessageProducer}
                      >
                        Message Producer
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow"
                        onClick={handleDeselect}
                      >
                        De-select
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Favorites Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-blue-950/80 border border-yellow-500/40 rounded-xl p-4 mb-8">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><Star className="w-5 h-5" fill="currentColor" /> Favorited Tracks</h3>
            {Object.keys(favorites).length === 0 ? (
              <div className="text-gray-400 text-sm">No favorites yet.</div>
            ) : (
              <div className="space-y-3">
                {Object.values(favorites).map((sub) => (
                  <div key={sub.id} className="bg-blue-900/80 rounded-lg p-3 flex flex-col gap-1">
                    <span className="font-semibold text-white">{sub.producer_name}</span>
                    {sub.producer_number && <span className="text-xs text-blue-300">({sub.producer_number})</span>}
                    {sub.has_mp3 && sub.signed_mp3_url && (
                      <audio controls src={sub.signed_mp3_url} className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {confirmSelect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Selection</h2>
            <p className="mb-6 text-gray-700">Selecting this track will decline all other submissions for this request. Are you sure you want to proceed?</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelSelect} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button onClick={confirmSelectSubmission} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Yes, Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 