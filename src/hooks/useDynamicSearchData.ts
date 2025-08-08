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
  description: string;
  category: string;
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

      // Fetch instruments
      const { data: instrumentsData, error: instrumentsError } = await supabase
        .from('instruments')
        .select(`
          id,
          name,
          display_name,
          category
        `)
        .order('display_name');

      if (instrumentsError) throw instrumentsError;

      // Fetch media types
      const { data: mediaTypesData, error: mediaTypesError } = await supabase
        .from('media_types')
        .select(`
          id,
          name,
          description,
          category
        `)
        .order('name');

      if (mediaTypesError) throw mediaTypesError;

      // Fetch moods from the moods_categories table or use a fallback
      // For now, we'll use a fallback since moods might not be in a separate table
      const moodsData: DynamicMood[] = [
        // These will be replaced with database data when available
        { id: '1', name: 'energetic', display_name: 'Energetic', category: 'Happy & Upbeat' },
        { id: '2', name: 'peaceful', display_name: 'Peaceful', category: 'Calm & Relaxing' },
        { id: '3', name: 'uplifting', display_name: 'Uplifting', category: 'Happy & Upbeat' },
        { id: '4', name: 'dramatic', display_name: 'Dramatic', category: 'Epic & Heroic' },
        { id: '5', name: 'romantic', display_name: 'Romantic', category: 'Romantic & Intimate' },
        { id: '6', name: 'mysterious', display_name: 'Mysterious', category: 'Dark & Mysterious' },
        { id: '7', name: 'funky', display_name: 'Funky', category: 'Groovy & Funky' },
        { id: '8', name: 'melancholic', display_name: 'Melancholic', category: 'Sad & Melancholic' }
      ];

      setGenres(genresData || []);
      setSubGenres(subGenresData || []);
      setMoods(moodsData);
      setInstruments(instrumentsData || []);
      setMediaTypes(mediaTypesData || []);

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