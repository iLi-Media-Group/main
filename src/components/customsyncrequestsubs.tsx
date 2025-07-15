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

export default function CustomSyncRequestSubs() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomSyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setRequests(data || []);
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 