import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaVideo {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  media_type: 'television' | 'podcast' | 'youtube' | 'other';
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEMO_VIDEOS: MediaVideo[] = [
  {
    id: '1',
    title: 'Television Show Example',
    description: 'Example of our music being used in television programming',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_type: 'television',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Podcast Feature',
    description: 'Our music featured in a popular podcast',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_type: 'podcast',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'YouTube Creator',
    description: 'Content creator using our music in their videos',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_type: 'youtube',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function VideoCarousel() {
  const [videos, setVideos] = useState<MediaVideo[]>(DEMO_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchVideos = async () => {
      if (!supabase) {
        setError('Database connection not available');
        setVideos(DEMO_VIDEOS);
        setLoading(false);
        return;
      }

      try {
        const { data, error: supabaseError } = await supabase
          .from('media_videos')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(supabaseError.message);
        }

        if (!mounted) return;

        if (data && data.length > 0) {
          setVideos(data);
          setError(null);
        } else {
          setVideos(DEMO_VIDEOS);
          setError('Using demo video data');
        }
      } catch (err) {
        if (mounted) {
          setError('Using demo video data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchVideos();

    return () => {
      mounted = false;
    };
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + videos.length) % videos.length);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'television':
        return '📺';
      case 'podcast':
        return '🎙️';
      case 'youtube':
        return '📹';
      default:
        return '🎵';
    }
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'television':
        return 'Television Shows';
      case 'podcast':
        return 'Podcasts';
      case 'youtube':
        return 'YouTube Videos';
      default:
        return 'Other Media';
    }
  };

  const handleVideoClick = (videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No videos available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {error && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-center text-sm">{error}</p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {videos.map((video) => {
            const videoId = getYouTubeVideoId(video.youtube_url);
            const thumbnail = getYouTubeThumbnail(video.youtube_url);
            const isPlaying = playingVideo === video.id;

            return (
              <div key={video.id} className="w-full flex-shrink-0">
                <div className="relative group">
                  {/* Video Container */}
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    {isPlaying && videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={video.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        {/* Thumbnail */}
                        <img
                          src={thumbnail || video.thumbnail_url || '/placeholder-video.jpg'}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-video.jpg';
                          }}
                        />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <button
                            onClick={() => handleVideoClick(video.id)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-all duration-300 transform hover:scale-110"
                          >
                            <Play className="w-8 h-8 ml-1" />
                          </button>
                        </div>

                        {/* Media Type Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <span>{getMediaTypeIcon(video.media_type)}</span>
                            {getMediaTypeLabel(video.media_type)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-gray-300 text-sm">{video.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        {videos.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {videos.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
