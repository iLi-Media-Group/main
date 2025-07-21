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
  const { expiresIn = 3600, refreshInterval = 5 * 60 * 1000 } = options;
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      setError(null);
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

    // Set up refresh interval to regenerate URL before it expires
    const refreshTime = Math.max(expiresIn * 1000 - refreshInterval, 60000); // At least 1 minute
    const refreshTimer = setTimeout(generateSignedUrl, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [bucket, path, expiresIn, refreshInterval]);

  return { signedUrl, loading, error };
} 