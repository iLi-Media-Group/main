import { useState, useCallback } from 'react';

export interface SearchPayload {
  query?: string;
  genres?: string[];
  subgenres?: string[];
  moods?: string[];
  usageTypes?: string[];
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  subGenres: string[];
  moods: string[];
  instruments: string[];
  mediaUsage: string[];
  duration: string;
  bpm: number;
  audioUrl: string;
  image: string;
  relevance: number;
  producer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarPath?: string;
  };
}

export interface SearchResponse {
  ok: boolean;
  results: SearchResult[];
  meta: {
    count: number;
    popularSearches: Array<{ query: string; hits: number }>;
    recentSearches: string[];
  };
}

export interface UseSearchAPI {
  search: (payload: SearchPayload) => Promise<SearchResponse>;
  loading: boolean;
  error: string | null;
  lastResults: SearchResponse | null;
}

const SEARCH_API_URL = process.env.REACT_APP_SEARCH_API_URL || 'http://localhost:4001';

export function useSearchAPI(): UseSearchAPI {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SearchResponse | null>(null);

  const search = useCallback(async (payload: SearchPayload): Promise<SearchResponse> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SEARCH_API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, limit: payload.limit || 40 })
      });

      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setLastResults(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    error,
    lastResults
  };
}

// Convenience function for direct API calls (similar to ChatGPT's example)
export async function querySearch(payload: SearchPayload): Promise<SearchResponse> {
  const res = await fetch(`${SEARCH_API_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, limit: payload.limit || 40 })
  });
  
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Search failed');
  return data;
}
