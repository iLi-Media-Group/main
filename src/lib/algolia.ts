// Client-side Algolia search functions that call the server-side function
import { supabase } from './supabase';

// Search function for tracks
export const searchTracks = async (query: string, filters?: any) => {
  try {
    console.log('Calling algolia-search function with query:', query);
    
    const { data, error } = await supabase.functions.invoke('algolia-search', {
      body: { query, filters }
    });

    console.log('Algolia search response:', { data, error });

    if (error) {
      console.error('Algolia search error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Algolia search error:', error);
    throw error;
  }
};

// Get search suggestions
export const getSearchSuggestions = async (query: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('algolia-search', {
      body: { query, filters: {}, hitsPerPage: 5 }
    });

    if (error) {
      throw error;
    }

    return data?.tracks || [];
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};

// Note: Indexing functions are server-side only and should be called from server-side code
export const indexTrack = async (track: any) => {
  console.warn('indexTrack should be called from server-side code');
  throw new Error('indexTrack should be called from server-side code');
};

export const removeTrackFromIndex = async (trackId: string) => {
  console.warn('removeTrackFromIndex should be called from server-side code');
  throw new Error('removeTrackFromIndex should be called from server-side code');
};

export const updateTrackInIndex = async (track: any) => {
  console.warn('updateTrackInIndex should be called from server-side code');
  throw new Error('updateTrackInIndex should be called from server-side code');
};
