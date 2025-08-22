import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DynamicGenre {
  id: string;
  name: string;
  display_name: string;
  sub_genres: DynamicSubGenre[];
}

export interface DynamicSubGenre {
  id: string;
  name: string;
  display_name: string;
  genre_id: string;
}

export interface DynamicMood {
  id: string;
  name: string;
  display_name: string;
  category: string;
}

export interface DynamicInstrument {
  id: string;
  name: string;
  display_name: string;
  category: string;
}

export interface DynamicMediaType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  parent_id: string | null;
  is_parent: boolean;
  display_order: number;
  full_name: string;
}

export interface DynamicSearchData {
  genres: DynamicGenre[];
  subGenres: DynamicSubGenre[];
  moods: DynamicMood[];
  instruments: DynamicInstrument[];
  mediaTypes: DynamicMediaType[];
  loading: boolean;
  error: string | null;
}

export function useDynamicSearchData(): DynamicSearchData {
  const [genres, setGenres] = useState<DynamicGenre[]>([]);
  const [subGenres, setSubGenres] = useState<DynamicSubGenre[]>([]);
  const [moods, setMoods] = useState<DynamicMood[]>([]);
  const [instruments, setInstruments] = useState<DynamicInstrument[]>([]);
  const [mediaTypes, setMediaTypes] = useState<DynamicMediaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDynamicSearchData();
  }, []);

  const fetchDynamicSearchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch genres with their sub-genres
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select(`
          id,
          name,
          display_name,
          sub_genres (
            id,
            name,
            display_name,
            genre_id
          )
        `)
        .order('display_name');

      if (genresError) throw genresError;

      // Fetch all sub-genres separately for easier access
      const { data: subGenresData, error: subGenresError } = await supabase
        .from('sub_genres')
        .select(`
          id,
          name,
          display_name,
          genre_id
        `)
        .order('display_name');

      if (subGenresError) throw subGenresError;

      // Fetch instruments with categories
      const { data: instrumentsData, error: instrumentsError } = await supabase
        .from('instruments')
        .select(`
          id,
          name,
          display_name,
          category
        `)
        .order('category, display_name');

      if (instrumentsError) throw instrumentsError;

      // Fetch media types with categories
      const { data: mediaTypesData, error: mediaTypesError } = await supabase
        .from('media_types')
        .select(`
          id,
          name,
          display_name,
          category,
          description,
          parent_id,
          display_order
        `)
        .order('category, display_order, name');

      if (mediaTypesError) throw mediaTypesError;

      // Build full_name manually for hierarchical display
      const mediaTypesWithFullName = mediaTypesData?.map(mt => ({
        ...mt,
        full_name: mt.parent_id 
          ? `${mediaTypesData.find(p => p.id === mt.parent_id)?.name || ''} > ${mt.name}`
          : mt.name
      })) || [];

      // Fetch moods from the database
      const { data: moodsData, error: moodsError } = await supabase
        .from('moods')
        .select(`
          id,
          name,
          display_name,
          category
        `)
        .order('category, display_name');

      if (moodsError) throw moodsError;

      setGenres(genresData || []);
      setSubGenres(subGenresData || []);
      setMoods(moodsData);
      setInstruments(instrumentsData || []);
      setMediaTypes(mediaTypesWithFullName);

    } catch (err) {
      console.error('Error fetching dynamic search data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch search data');
      
      // Set fallback data if database is not available
      setGenres([]);
      setSubGenres([]);
      setMoods([]);
      setInstruments([]);
      setMediaTypes([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    genres,
    subGenres,
    moods,
    instruments,
    mediaTypes,
    loading,
    error
  };
} 