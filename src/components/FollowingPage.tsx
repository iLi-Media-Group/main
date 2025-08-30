import React, { useState, useEffect } from 'react';
import { Heart, HeartOff, Bell, BellOff, User, Music, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

interface FollowedProducer {
  producer_id: string;
  producer_name: string;
  producer_email: string;
  company_name: string | null;
  avatar_path: string | null;
  total_tracks: number;
  followed_at: string;
  email_notifications_enabled: boolean;
}

export function FollowingPage() {
  const { user, accountType } = useUnifiedAuth();
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
        .rpc('get_user_followed_producers', { p_limit: 100 });

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

  const handleUnfollow = async (producerId: string, producerName: string) => {
    try {
      const { data, error } = await supabase
        .rpc('unfollow_producer', { p_producer_id: producerId });

      if (error) {
        console.error('Error unfollowing producer:', error);
        return;
      }

      // Update local state
      setFollowedProducers(prev => prev.filter(p => p.producer_id !== producerId));
      console.log(`Successfully unfollowed ${producerName}`);
    } catch (error) {
      console.error('Error unfollowing producer:', error);
    }
  };

  const toggleEmailNotifications = async (producerId: string, currentSetting: boolean) => {
    try {
      const newSetting = !currentSetting;
      
      const { data, error } = await supabase
        .rpc('toggle_producer_follow', { 
          p_producer_id: producerId, 
          p_enable_email_notifications: newSetting 
        });

      if (error) {
        console.error('Error updating email notifications:', error);
        return;
      }

      // Update local state
      setFollowedProducers(prev => prev.map(p => 
        p.producer_id === producerId 
          ? { ...p, email_notifications_enabled: newSetting }
          : p
      ));

      console.log(`Email notifications ${newSetting ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating email notifications:', error);
    }
  };

  // Redirect non-clients
  if (accountType !== 'client') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400">Only clients can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Following</h1>
          <p className="text-gray-400">Manage the producers you follow and their notification settings</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : followedProducers.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No followed producers yet</h2>
            <p className="text-gray-400 mb-6">
              Start following producers to get notified when they upload new tracks
            </p>
            <a
              href="/catalog"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              <Music className="w-4 h-4" />
              <span>Browse Catalog</span>
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {followedProducers.map((producer) => (
              <div
                key={producer.producer_id}
                className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all duration-200"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <ProfilePhotoUpload
                      currentPhotoUrl={producer.avatar_path}
                      onPhotoUpdate={() => {}}
                      size="md"
                      userId={producer.producer_id}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {producer.producer_name}
                    </h3>
                    {producer.company_name && (
                      <p className="text-sm text-gray-400 truncate">
                        {producer.company_name}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Music className="w-3 h-3" />
                        <span>{producer.total_tracks} tracks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Producer</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => toggleEmailNotifications(producer.producer_id, producer.email_notifications_enabled)}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      producer.email_notifications_enabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {producer.email_notifications_enabled ? (
                      <>
                        <Bell className="w-4 h-4" />
                        <span>Notifications On</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4" />
                        <span>Notifications Off</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleUnfollow(producer.producer_id, producer.producer_name)}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    <HeartOff className="w-4 h-4" />
                    <span>Unfollow</span>
                  </button>

                  <a
                    href={`/producer/${producer.producer_id}/tracks`}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    <Music className="w-4 h-4" />
                    <span>View Tracks</span>
                  </a>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Following since {new Date(producer.followed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
