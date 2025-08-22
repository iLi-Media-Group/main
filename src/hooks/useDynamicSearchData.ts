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

      // Fetch instruments (using existing columns until migration is applied)
      const { data: instrumentsData, error: instrumentsError } = await supabase
        .from('instruments')
        .select(`
          id,
          name
        `)
        .order('name');

      if (instrumentsError) throw instrumentsError;

      // Fetch media types (using existing columns until migration is applied)
      const { data: mediaTypesData, error: mediaTypesError } = await supabase
        .from('media_types')
        .select(`
          id,
          name,
          description,
          parent_id,
          display_order
        `)
        .order('display_order, name');

      if (mediaTypesError) throw mediaTypesError;

      // Build full_name manually for hierarchical display and add fallback category/display_name
      const mediaTypesWithFullName = mediaTypesData?.map(mt => ({
        ...mt,
        display_name: mt.name, // Use name as display_name until migration is applied
        category: 'Other', // Use fallback category until migration is applied
        full_name: mt.parent_id 
          ? `${mediaTypesData.find(p => p.id === mt.parent_id)?.name || ''} > ${mt.name}`
          : mt.name
      })) || [];

      // Fetch moods from the database (using existing columns until migration is applied)
      const { data: moodsData, error: moodsError } = await supabase
        .from('moods')
        .select(`
          id,
          name
        `)
        .order('name');

      if (moodsError) throw moodsError;

      setGenres(genresData || []);
      setSubGenres(subGenresData || []);
      // Add fallback category and display_name to moods until migration is applied
      const moodsWithFallbacks = moodsData?.map(mood => ({
        ...mood,
        display_name: mood.name, // Use name as display_name until migration is applied
        category: 'Other' // Use fallback category until migration is applied
      })) || [];
      
      setMoods(moodsWithFallbacks);
      // Add fallback category and display_name to instruments until migration is applied
      const instrumentsWithFallbacks = instrumentsData?.map(instrument => ({
        ...instrument,
        display_name: instrument.name, // Use name as display_name until migration is applied
        category: 'Other' // Use fallback category until migration is applied
      })) || [];
      
      setInstruments(instrumentsWithFallbacks);
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