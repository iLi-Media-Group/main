import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
  refreshInterval?: number; // milliseconds, default 5 minutes before expiry
  maxRetries?: number; // maximum retry attempts
}

export function useSignedUrl(
  bucket: string, 
  path: string | null, 
  options: UseSignedUrlOptions = {}
) {
  const { 
    expiresIn = 3600, 
    refreshInterval = 300000, 
    maxRetries = 3 
  } = options;
  
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const generateSignedUrl = useCallback(async (isRetry = false) => {
    if (!path) return;

    try {
      if (!isRetry) {
        setLoading(true);
      }
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
        
        // Retry on error with exponential backoff
        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        }
      } else if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        setRetryCount(0); // Reset retry count on success
        setError(null);
      } else {
        setError('Failed to generate signed URL');
        setSignedUrl(null);
      }
    } catch (err) {
      console.error('Unexpected error generating signed URL:', err);
      setError('Failed to generate signed URL');
      setSignedUrl(null);
      
      // Retry on error with exponential backoff
      if (retryCount < maxRetries) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
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

    // More frequent refresh to prevent expiry - refresh every 4 minutes instead of 5
    const refreshTime = Math.max(expiresIn * 1000 - (refreshInterval * 1.2), 240000); // 4 minutes minimum
    const refreshTimer = setTimeout(() => generateSignedUrl(true), refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [bucket, path, expiresIn, refreshInterval, generateSignedUrl]);

  // Retry when retryCount changes
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => {
        generateSignedUrl(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [retryCount, generateSignedUrl, maxRetries]);

  // Force refresh function for manual retries
  const refresh = useCallback(() => {
    setRetryCount(0);
    generateSignedUrl();
  }, [generateSignedUrl]);

  return { signedUrl, loading, error, refresh };
} 