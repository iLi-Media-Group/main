import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
  refreshInterval?: number; // milliseconds, default 5 minutes before expiry
}

export function useSignedUrl(
  bucket: string, 
  path: string | null, 
  options: UseSignedUrlOptions = {}
) {
  const { expiresIn = 3600, refreshInterval = 300000 } = options; // 1 hour default, 5 min refresh
  
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      setError(null);
      return;
    }

    // Check if the path is already a full URL (starts with http/https)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      setSignedUrl(path);
      setError(null);
      setLoading(false);
      return;
    }

    const generateSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always decode the path to handle spaces and special characters
        const decodedPath = decodeURIComponent(path);
        const { data, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(decodedPath, expiresIn);

        if (urlError) {
          console.error('Error generating signed URL:', urlError);
          setError(urlError.message);
          setSignedUrl(null);
        } else if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        } else {
          setError('Failed to generate signed URL');
          setSignedUrl(null);
        }
      } catch (err) {
        console.error('Unexpected error generating signed URL:', err);
        setError('Failed to generate signed URL');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();

    // More frequent refresh to prevent expiry - refresh every 4 minutes instead of 5
    const refreshTime = Math.max(expiresIn * 1000 - (refreshInterval * 1.2), 240000); // 4 minutes minimum
    const refreshTimer = setTimeout(generateSignedUrl, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [bucket, path, expiresIn, refreshInterval]);

  return { signedUrl, loading, error };
} 