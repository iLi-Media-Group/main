import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, User, Plus, Settings, Bell } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useEffect, useRef } from 'react';
import { fetchNotifications } from '../api/renewal';
import { supabase } from '../lib/supabase';

export function NavigationMenu() {
  const { accountType, user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id).then(({ data }) => {
        setNotifications(data || []);
        setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
      });
      // Set up real-time subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          // Refetch notifications on any change
          fetchNotifications(user.id).then(({ data }) => {
            setNotifications(data || []);
            setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
          });
        })
        .subscribe();
      channelRef.current = channel;
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    // Optionally, mark all as read here (or on click of each notification)
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    // Expanded click actions by type
    switch (notification.type) {
      case 'renewal_request':
      case 'renewal_approved':
      case 'renewal_rejected':
      case 'renewal_complete':
        if (notification.data && notification.data.licenseId) {
          navigate(`/license-agreement/${notification.data.licenseId}`);
        }
        break;
      case 'proposal_update':
        if (notification.data && notification.data.proposalId) {
          navigate(`/sync-proposal/${notification.data.proposalId}`);
        }
        break;
      case 'payout':
        navigate('/payouts');
        break;
      // Add more types as needed
      default:
        // Fallback: show details or do nothing
        break;
    }
  };

  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 h-full w-64 fixed left-0 top-0 p-4 overflow-y-auto max-h-screen">
      <div className="flex flex-col space-y-6">
        <div className="relative flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-white">Menu</span>
          <button type="button" className="relative" onClick={handleBellClick}>
            <Bell className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-10 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 p-4">
              <div className="font-semibold text-white mb-2">Notifications</div>
              {notifications.length === 0 ? (
                <div className="text-gray-400 text-sm">No notifications</div>
              ) : (
                <ul className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`py-2 cursor-pointer ${!n.is_read ? 'bg-blue-900/20' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="text-white font-medium">{n.title}</div>
                      <div className="text-gray-300 text-sm">{n.message}</div>
                      <div className="text-gray-500 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <Link 
          to="/" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link 
          to="/pricing" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Pricing</span>
        </Link>

        <Link 
          to="/custom-sync-request" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Custom Sync Request</span>
        </Link>

        <Link 
          to="/services" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Services</span>
        </Link>
        {accountType === 'admin' && (
          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 text-blue-400 hover:text-white transition-colors font-semibold border-t border-blue-500/20 pt-4 mt-2"
          >
            <Settings className="w-5 h-5" />
            <span>Services Admin</span>
          </Link>
        )}
        <Link 
          to="/profile" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
      {/* Add Services Directory link at the very bottom */}
      <div className="mt-10 pt-4 border-t border-gray-800">
        <Link 
          to="/services" 
          className="flex items-center space-x-3 text-purple-400 hover:text-white transition-colors font-semibold"
        >
          <Settings className="w-5 h-5" />
          <span>Services Directory</span>
        </Link>
      </div>
    </nav>
  );
}
