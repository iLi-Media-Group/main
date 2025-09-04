import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSignedUrlOptions {
  expiresIn?: number; // seconds, default 24 hours
  refreshInterval?: number; // milliseconds, default 1 hour before expiry
  maxRetries?: number; // number of retries, default 3
}

export function useSignedUrl(
  bucket: string, 
  path: string | null, 
  options: UseSignedUrlOptions = {}
) {
  const { 
    expiresIn = 86400, // 24 hours instead of 1 hour
    refreshInterval = 3600000, // 1 hour before expiry instead of 5 minutes
    maxRetries = 3
  } = options;
  
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const generateSignedUrl = useCallback(async (isRetry = false) => {
    if (!path) return;

    try {
      setLoading(true);
      setError(null);
      
      // Always decode the path to handle spaces and special characters
      const decodedPath = decodeURIComponent(path);
      
      const { data, error: urlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(decodedPath, expiresIn);

      if (urlError) {
        console.error('Signed URL error:', urlError);
        setError(urlError.message);
        setSignedUrl(null);
        
        // Handle retries
        if (!isRetry && retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => generateSignedUrl(true), delay);
        }
      } else if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } else {
        setError('Failed to generate signed URL');
        setSignedUrl(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to generate signed URL');
      setSignedUrl(null);
    } finally {
      setLoading(false);
    }
  }, [bucket, path, expiresIn, retryCount, maxRetries]);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      setError(null);
      setRetryCount(0);
      return;
    }

    // Check if the path is already a full URL (starts with http/https)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      setSignedUrl(path);
      setError(null);
      setLoading(false);
      setRetryCount(0);
      return;
    }

    // Initial URL generation
    generateSignedUrl();

    // Refresh URL much more aggressively to prevent expiration
    const refreshTime = Math.max(expiresIn * 1000 - refreshInterval, 1800000); // At least 30 minutes before expiry
    const refreshTimer = setTimeout(() => generateSignedUrl(), refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [bucket, path, expiresIn, refreshInterval, generateSignedUrl]);

  // Force refresh function for manual retries
  const refresh = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refresh
    generateSignedUrl();
  }, [generateSignedUrl]);

  return { signedUrl, loading, error, refresh };
} 