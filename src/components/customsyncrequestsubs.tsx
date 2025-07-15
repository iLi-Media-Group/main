import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
}

export default function CustomSyncRequestSubs() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomSyncRequest[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SyncSubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Map submissions by request id and fetch signed URLs for mp3s
        const subMap: Record<string, SyncSubmission[]> = {};
        for (const req of data || []) {
          const subs: SyncSubmission[] = req.sync_submissions || [];
          const updatedSubs = await Promise.all(subs.map(async (sub: SyncSubmission) => {
            if (sub.has_mp3 && sub.mp3_url) {
              // Extract the path from the public URL (after the bucket name)
              const match = sub.mp3_url.match(/sync-submissions\/(.+)$/);
              const filePath = match ? `sync-submissions/${match[1]}` : undefined;
              if (filePath) {
                const { data: signedUrlData } = await supabase.storage
                  .from('sync-submissions')
                  .createSignedUrl(filePath.replace('sync-submissions/', ''), 3600);
                if (signedUrlData?.signedUrl) {
                  return { ...sub, signed_mp3_url: signedUrlData.signedUrl };
                }
              }
            }
            return sub;
          }));
          subMap[req.id] = updatedSubs;
        }
        setSubmissions(subMap);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
                {submissions[req.id] && submissions[req.id].length > 0 && (
                  <div className="mt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-blue-200 mb-2">Producer Submissions</h3>
                    {submissions[req.id].map((sub) => (
                      <div key={sub.id} className="bg-blue-950/80 border border-blue-700/40 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          {sub.has_mp3 && sub.signed_mp3_url ? (
                            <audio controls src={sub.signed_mp3_url} className="w-full mb-2" />
                          ) : (
                            <span className="text-gray-400">No mp3 uploaded</span>
                          )}
                          <div className="flex space-x-4 mt-2">
                            <span className={sub.has_stems ? 'text-green-400' : 'text-gray-400'}>
                              {sub.has_stems ? '✓' : '✗'} Stems
                            </span>
                            <span className={sub.has_trackouts ? 'text-green-400' : 'text-gray-400'}>
                              {sub.has_trackouts ? '✓' : '✗'} Trackouts
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 md:mt-0 md:ml-6">
                          Submitted: {sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 