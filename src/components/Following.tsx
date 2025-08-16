import React, { useState, useEffect } from 'react';
import { Heart, User, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

interface FollowedProducer {
  producer_id: string;
  producer_name: string;
  company_name: string | null;
  avatar_path: string | null;
  total_tracks: number;
  followed_at: string;
  email_notifications_enabled: boolean;
}

export function Following() {
  const { user, accountType } = useAuth();
  const [followedProducers, setFollowedProducers] = useState<FollowedProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && accountType === 'client') {
      fetchFollowedProducers();
    }
  }, [user, accountType]);

  const fetchFollowedProducers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_user_followed_producers', { p_limit: 5 });

      if (error) {
        console.error('Error fetching followed producers:', error);
        setError('Failed to load followed producers');
        return;
      }

      setFollowedProducers(data || []);
    } catch (err) {
      console.error('Error fetching followed producers:', err);
      setError('Failed to load followed producers');
    } finally {
      setLoading(false);
    }
  };

  // Don't show for non-clients
  if (accountType !== 'client') {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Heart className="w-5 h-5 mr-2 text-purple-400" />
          Following
        </h3>
        <Link
          to="/following"
          className="text-purple-400 hover:text-purple-300 text-sm font-medium"
        >
          View all →
        </Link>
      </div>

      {error ? (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : followedProducers.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-4">No followed producers yet</p>
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
          >
            <Music className="w-4 h-4" />
            <span>Browse Producers</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {followedProducers.map((producer) => (
            <div
              key={producer.producer_id}
              className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <ProfilePhotoUpload
                  currentPhotoUrl={producer.avatar_path}
                  onPhotoUpdate={() => {}}
                  size="sm"
                  userId={producer.producer_id}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <Link
                  to={`/producer/${producer.producer_id}/tracks`}
                  className="text-sm font-semibold text-white hover:text-blue-400 transition-colors block truncate"
                >
                  {producer.producer_name}
                </Link>
                {producer.company_name && (
                  <p className="text-xs text-gray-400 truncate">
                    {producer.company_name}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1">
                    <Music className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{producer.total_tracks} tracks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Producer</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Link
                  to={`/producer/${producer.producer_id}/tracks`}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
          
          {followedProducers.length > 5 && (
            <Link
              to="/following"
              className="block text-center text-purple-400 hover:text-purple-300 text-sm mt-4"
            >
              View all followed producers ({followedProducers.length})
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
