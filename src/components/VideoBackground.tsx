import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VideoBackgroundProps {
  videoUrl: string;
  fallbackImage: string;
  page?: string; // The page this background is for (e.g., 'client-login', 'producer-login', etc.)
  alt?: string;
}

interface BackgroundAsset {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'image';
  page: string;
  isActive: boolean;
  created_at: string;
  file_size: number;
}

export function VideoBackground({ videoUrl, fallbackImage, page, alt = "Background video" }: VideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [backgroundAsset, setBackgroundAsset] = useState<BackgroundAsset | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active background asset for this page
  useEffect(() => {
    const fetchBackgroundAsset = async () => {
      if (!page) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('background_assets')
          .select('*')
          .eq('page', page)
          .eq('isActive', true)
          .eq('type', 'video')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching background asset:', error);
        } else if (data) {
          setBackgroundAsset(data);
        }
      } catch (err) {
        console.error('Error fetching background asset:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgroundAsset();
  }, [page]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoError(true);
  };

  // Use database asset if available, otherwise use provided props
  const finalVideoUrl = backgroundAsset?.url || videoUrl;
  const finalFallbackImage = backgroundAsset?.url || fallbackImage;

  return (
    <div className="absolute inset-0 w-full h-full">
      {!isVideoError && !loading ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={{ 
            opacity: isVideoLoaded ? 1 : 0, 
            transition: 'opacity 1.5s ease-in-out' 
          }}
        >
          <source src={finalVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${finalFallbackImage})`
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
    </div>
  );
}
