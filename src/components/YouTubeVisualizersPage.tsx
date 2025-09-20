import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface YouTubeVisualizer {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  track_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  track?: {
    id: string;
    title: string;
    producer: {
      firstName: string;
    };
  };
}

const ITEMS_PER_PAGE = 10; // 2 columns x 5 rows

export function YouTubeVisualizersPage() {
  const navigate = useNavigate();
  const [visualizers, setVisualizers] = useState<YouTubeVisualizer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchVisualizers();
  }, []);

  const fetchVisualizers = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_visualizers')
        .select(`
          *,
          track:tracks(
            id,
            title,
            producer:profiles(
              id,
              first_name,
              last_name,
              display_name
            )
          )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        // If table doesn't exist yet, show empty state instead of error
        if (error.message.includes('relation "youtube_visualizers" does not exist') || 
            error.message.includes('relation "public.youtube_visualizers" does not exist')) {
          console.log('YouTube visualizers table not found - showing empty state');
          setVisualizers([]);
          setError(null);
          return;
        }
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        track: item.track ? {
          id: item.track.id,
          title: item.track.title,
          producer: {
            firstName: item.track.producer?.display_name || item.track.producer?.first_name || 'Unknown Producer'
          }
        } : undefined
      })) || [];

      setVisualizers(transformedData);
      
      // If no visualizers exist, redirect to home page
      if (!transformedData || transformedData.length === 0) {
        navigate('/');
        return;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const handleVideoClick = (videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  const handleTrackClick = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };

  const totalPages = Math.ceil(visualizers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVisualizers = visualizers.slice(startIndex, endIndex);

  // Group visualizers into pairs for 2-column layout
  const visualizerPairs = [];
  for (let i = 0; i < currentVisualizers.length; i += 2) {
    visualizerPairs.push(currentVisualizers.slice(i, i + 2));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            YouTube Visualizers
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how our tracks are designed to be used with stunning visual effects. 
            Each video showcases our music with professional visualizers.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {visualizerPairs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No visualizers available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Visualizers Grid */}
            <div className="space-y-8 mb-12">
              {visualizerPairs.map((pair, pairIndex) => (
                <div key={pairIndex} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {pair.map((visualizer) => {
                    const videoId = getYouTubeVideoId(visualizer.youtube_url);
                    const thumbnail = getYouTubeThumbnail(visualizer.youtube_url);
                    const isPlaying = playingVideo === visualizer.id;

                    return (
                      <div key={visualizer.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 overflow-hidden">
                        {/* Video Container */}
                        <div className="relative aspect-video bg-gray-900">
                          {isPlaying && videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                              title={visualizer.title}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <>
                              {/* Thumbnail */}
                              <img
                                src={thumbnail || visualizer.thumbnail_url || '/placeholder-video.jpg'}
                                alt={visualizer.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-video.jpg';
                                }}
                              />
                              
                              {/* Play Button Overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <button
                                  onClick={() => handleVideoClick(visualizer.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-all duration-300 transform hover:scale-110"
                                >
                                  <Play className="w-8 h-8 ml-1" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2">{visualizer.title}</h3>
                          {visualizer.description && (
                            <p className="text-gray-300 text-sm mb-4">{visualizer.description}</p>
                          )}
                          
                          {/* Track Link */}
                          {visualizer.track && (
                            <button
                              onClick={() => handleTrackClick(visualizer.track!.id)}
                              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Track: {visualizer.track.title}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="text-white">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
