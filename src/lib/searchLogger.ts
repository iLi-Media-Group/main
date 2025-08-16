import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';

export interface SearchQuery {
  query: string;
  genres?: string[];
  subgenres?: string[];
  moods?: string[];
  instruments?: string[];
  media_usage_types?: string[];
  syncOnly?: boolean;
  hasVocals?: boolean;
}

export const logSearchQuery = async (searchData: SearchQuery) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('search_queries')
      .insert({
        user_id: user?.id || null,
        query: searchData.query,
        genres: searchData.genres || [],
        subgenres: searchData.subgenres || [],
        moods: searchData.moods || [],
        media_usage_types: searchData.media_usage_types || []
      });

    if (error) {
      console.error('Error logging search query:', error);
    }
  } catch (error) {
    console.error('Error logging search query:', error);
  }
};

export const logSearchFromFilters = async (filters: any) => {
  // Only log if there's an actual search query
  if (!filters?.query && !filters?.genres?.length && !filters?.moods?.length && 
      !filters?.instruments?.length && !filters?.mediaTypes?.length) {
    return;
  }

  const searchData: SearchQuery = {
    query: filters.query || '',
    genres: filters.genres || [],
    subgenres: filters.subGenres || [],
    moods: filters.moods || [],
    instruments: filters.instruments || [],
    media_usage_types: filters.mediaTypes || []
  };

  await logSearchQuery(searchData);
};
