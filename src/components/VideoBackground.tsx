import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

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

// Cache for background assets to avoid repeated database calls
const backgroundAssetCache = new Map<string, { data: BackgroundAsset | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to clear cache (can be called when background assets are updated)
export const clearBackgroundAssetCache = (page?: string) => {
  if (page) {
    backgroundAssetCache.delete(page);
  } else {
    backgroundAssetCache.clear();
  }
  console.log('Background asset cache cleared', page ? `for page: ${page}` : 'for all pages');
};

export function VideoBackground({ videoUrl, fallbackImage, page, alt = "Background video" }: VideoBackgroundProps) {
  const { user } = useUnifiedAuth();
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

      // Check cache first
      const cached = backgroundAssetCache.get(page);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('Using cached background asset for page:', page);
        setBackgroundAsset(cached.data);
        setLoading(false);
        return;
      }

      // Check if user is authenticated using unified auth
      if (!user) {
        console.log('No authenticated user, using default background');
        setBackgroundAsset(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('background_assets')
          .select('*')
          .eq('page', page)
          .eq('isActive', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching background asset:', error);
        } else if (data) {
          setBackgroundAsset(data);
          // Cache the result
          backgroundAssetCache.set(page, { data, timestamp: now });
        } else {
          // Cache null result to avoid repeated failed queries
          backgroundAssetCache.set(page, { data: null, timestamp: now });
        }
      } catch (err) {
        console.error('Error fetching background asset:', err);
        // Cache null result on error
        backgroundAssetCache.set(page, { data: null, timestamp: now });
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
  // Construct public URLs from file paths for background assets
  const constructPublicUrl = (url: string, bucket: string) => {
    if (url?.startsWith('https://')) {
      return url;
    }
    return `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/${bucket}/${url}`;
  };

  const finalVideoUrl = backgroundAsset?.type === 'video' 
    ? constructPublicUrl(backgroundAsset.url, 'background-videos')
    : videoUrl;
  const finalFallbackImage = backgroundAsset?.type === 'image' 
    ? constructPublicUrl(backgroundAsset.url, 'background-images')
    : fallbackImage;
  
  // For signup page, always use fallback image to ensure reliability
  const shouldUseFallback = page === 'signup' || !finalVideoUrl || finalVideoUrl.includes('vimeo.com');

  return (
    <div className="absolute inset-0 w-full h-full">
      {backgroundAsset?.type === 'video' && !isVideoError && !loading && !shouldUseFallback ? (
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
