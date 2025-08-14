import React, { useState, useEffect } from 'react';
import { Heart, HeartOff, Bell, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProducerFollowButtonProps {
  producerId: string;
  producerName: string;
  className?: string;
}

interface FollowStatus {
  isFollowing: boolean;
  emailNotificationsEnabled: boolean;
}

export function ProducerFollowButton({ producerId, producerName, className = '' }: ProducerFollowButtonProps) {
  const { user, accountType } = useAuth();
  const [followStatus, setFollowStatus] = useState<FollowStatus>({ isFollowing: false, emailNotificationsEnabled: false });
  const [loading, setLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (user && accountType === 'client') {
      checkFollowStatus();
    }
  }, [user, accountType, producerId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_following_producer', { p_producer_id: producerId });

      if (error) {
        console.error('Error checking follow status:', error);
        return;
      }

      if (data && data.length > 0) {
        setFollowStatus({
          isFollowing: data[0].is_following,
          emailNotificationsEnabled: data[0].email_notifications_enabled
        });
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async (enableEmailNotifications: boolean = false) => {
    if (!user || accountType !== 'client') {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('toggle_producer_follow', { 
          p_producer_id: producerId, 
          p_enable_email_notifications: enableEmailNotifications 
        });

      if (error) {
        console.error('Error following producer:', error);
        return;
      }

      // Update local state
      setFollowStatus({
        isFollowing: true,
        emailNotificationsEnabled: enableEmailNotifications
      });

      // Show success message
      // You can add a toast notification here if you have a toast system
      console.log(`Successfully followed ${producerName}`);
    } catch (error) {
      console.error('Error following producer:', error);
    } finally {
      setLoading(false);
      setShowEmailDialog(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || accountType !== 'client') {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('unfollow_producer', { p_producer_id: producerId });

      if (error) {
        console.error('Error unfollowing producer:', error);
        return;
      }

      // Update local state
      setFollowStatus({
        isFollowing: false,
        emailNotificationsEnabled: false
      });

      console.log(`Successfully unfollowed ${producerName}`);
    } catch (error) {
      console.error('Error unfollowing producer:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailNotifications = async () => {
    if (!user || accountType !== 'client') {
      return;
    }

    setLoading(true);
    try {
      const newEmailSetting = !followStatus.emailNotificationsEnabled;
      
      const { data, error } = await supabase
        .rpc('toggle_producer_follow', { 
          p_producer_id: producerId, 
          p_enable_email_notifications: newEmailSetting 
        });

      if (error) {
        console.error('Error updating email notifications:', error);
        return;
      }

      // Update local state
      setFollowStatus(prev => ({
        ...prev,
        emailNotificationsEnabled: newEmailSetting
      }));

      console.log(`Email notifications ${newEmailSetting ? 'enabled' : 'disabled'} for ${producerName}`);
    } catch (error) {
      console.error('Error updating email notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show follow button for non-clients or if user is the producer
  if (accountType !== 'client' || !user || user.id === producerId) {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {!followStatus.isFollowing ? (
        <button
          onClick={() => setShowEmailDialog(true)}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className="w-4 h-4" />
          <span>{loading ? 'Following...' : 'Follow Producer'}</span>
        </button>
      ) : (
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleUnfollow}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HeartOff className="w-4 h-4" />
            <span>{loading ? 'Unfollowing...' : 'Unfollow'}</span>
          </button>
          
          <button
            onClick={toggleEmailNotifications}
            disabled={loading}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              followStatus.emailNotificationsEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {followStatus.emailNotificationsEnabled ? (
              <>
                <Bell className="w-4 h-4" />
                <span>Email Notifications On</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Email Notifications Off</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Email Notification Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Follow {producerName}</h3>
            <p className="text-gray-300 mb-6">
              Would you like to receive email notifications when {producerName} uploads new tracks?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleFollow(true)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Following...' : 'Yes, notify me'}
              </button>
              
              <button
                onClick={() => handleFollow(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Following...' : 'No, just follow'}
              </button>
            </div>
            
            <button
              onClick={() => setShowEmailDialog(false)}
              disabled={loading}
              className="w-full mt-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
