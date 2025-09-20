import React, { useState, useEffect } from 'react';
import { Calendar, Youtube, Sparkles, Bell, ExternalLink, ArrowRight, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Link } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitize';
import { isAdminEmail } from '../lib/adminConfig';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'feature' | 'event' | 'youtube' | 'general';
  published_at: string;
  expires_at: string | null;
  external_url: string | null;
  image_url: string | null;
  is_featured: boolean;
}

interface AnnouncementDetailProps {
  announcement: Announcement;
  onClose: () => void;
}

// Function to extract YouTube video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Function to generate YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string => {
  const qualities = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}`;
};

// Component for YouTube thumbnail with fallback
const YouTubeThumbnail = ({ url, title, className = "" }: { url: string; title: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <Youtube className="w-12 h-12 text-red-400" />
      </div>
    );
  }
  
  if (imageError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Youtube className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Thumbnail unavailable</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative group ${className}`}>
      <img
        src={getYouTubeThumbnail(videoId, 'medium')}
        alt={`${title} - YouTube Video`}
        className="w-full h-full object-cover rounded-lg"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
        <div className="bg-red-600 rounded-full p-3 group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
    </div>
  );
};

function AnnouncementDetail({ announcement, onClose }: AnnouncementDetailProps) {
  const { user } = useUnifiedAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return false;
    
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
      
    if (data && isAdminEmail(data.email)) {
      setIsAdmin(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">{announcement.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            &times;
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
          <span>Published: {new Date(announcement.published_at).toLocaleDateString()}</span>
          {announcement.expires_at && (
            <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-white/10">
            {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
          </span>
        </div>
        
        {/* Show YouTube thumbnail for YouTube announcements */}
        {announcement.type === 'youtube' && announcement.external_url && (
          <div className="mb-6">
            <YouTubeThumbnail 
              url={announcement.external_url} 
              title={announcement.title}
              className="w-full h-80"
            />
          </div>
        )}
        
        {/* Show regular image for non-YouTube announcements */}
        {announcement.type !== 'youtube' && announcement.image_url && (
          <div className="mb-6">
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-auto max-h-[600px] object-cover rounded-lg bg-black"
            />
          </div>
        )}

        <div 
          className="prose prose-invert max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
        />

        <div className="flex justify-between items-center">
          {announcement.external_url && (
            <a
              href={announcement.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {announcement.type === 'youtube' ? 'Watch on YouTube' : 'Visit Link'}
            </a>
          )}
          
          {isAdmin && (
            <Link
              to="/admin"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Edit in Admin Dashboard
            </Link>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'feature' | 'event' | 'youtube'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const { user } = useUnifiedAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return false;
    
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
      
    if (data && isAdminEmail(data.email)) {
      setIsAdmin(true);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'event':
        return <Calendar className="w-6 h-6 text-blue-400" />;
      case 'youtube':
        return <Youtube className="w-6 h-6 text-red-400" />;
      default:
        return <Bell className="w-6 h-6 text-gray-400" />;
    }
  };

  const filteredAnnouncements = announcements.filter(
    announcement => filter === 'all' || announcement.type === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('feature')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'feature'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setFilter('event')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'event'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setFilter('youtube')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'youtube'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              YouTube
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {isAdmin && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-blue-400">
                You have admin access to manage announcements.
              </p>
              <Link
                to="/admin"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                Manage Announcements
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white/5 backdrop-blur-sm rounded-xl border ${
                announcement.is_featured
                  ? 'border-purple-500/40'
                  : 'border-blue-500/20'
              } p-4 cursor-pointer hover:bg-white/10 transition-colors flex flex-col h-full`}
              onClick={() => setSelectedAnnouncement(announcement)}
            >
              <div className="flex items-center justify-between mb-3">
                {getAnnouncementIcon(announcement.type)}
                <span className="text-sm text-gray-400">
                  {new Date(announcement.published_at).toLocaleDateString()}
                </span>
              </div>
              
              <h2 className="text-lg font-semibold text-white mb-3 line-clamp-2">
                {announcement.title}
              </h2>
              
              {/* Show YouTube thumbnail for YouTube announcements */}
              {announcement.type === 'youtube' && announcement.external_url && (
                <div className="mb-4 flex-shrink-0">
                  <YouTubeThumbnail 
                    url={announcement.external_url} 
                    title={announcement.title}
                    className="w-full h-40"
                  />
                </div>
              )}
              
              {/* Show regular image for non-YouTube announcements */}
              {announcement.type !== 'youtube' && announcement.image_url && (
                <div className="mb-4 flex-shrink-0">
                  <img
                    src={announcement.image_url}
                    alt={announcement.title}
                    className="w-full h-40 object-cover rounded-lg bg-black cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnouncement(announcement);
                    }}
                  />
                </div>
              )}

              <div 
                className="prose prose-invert max-w-none line-clamp-3 flex-grow"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
              />

              <button
                className="inline-flex items-center mt-4 text-purple-400 hover:text-purple-300 transition-colors self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnouncement(announcement);
                }}
              >
                Read More
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No announcements found</p>
            </div>
          )}
        </div>
      </div>

      {selectedAnnouncement && (
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}


    </div>
  );
}
