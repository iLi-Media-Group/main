import { supabase } from './supabase';

// Types for the music data
export interface Genre {
  id: string;
  name: string;
}

export interface SubGenre {
  id: string;
  name: string;
}

export interface Mood {
  id: string;
  name: string;
}

export interface InstrumentCategory {
  id: string;
  name: string;
}

export interface Instrument {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
}

export interface MusicData {
  genres: Genre[];
  subGenres: SubGenre[];
  moods: Mood[];
  instrumentCategories: InstrumentCategory[];
  instruments: Instrument[];
}

// Fetch all genres
export async function fetchGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
  
  return data || [];
}

// Fetch all sub-genres
export async function fetchSubGenres(): Promise<SubGenre[]> {
  const { data, error } = await supabase
    .from('sub_genres')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Error fetching sub-genres:', error);
    return [];
  }
  
  return data || [];
}

// Fetch all moods
export async function fetchMoods(): Promise<Mood[]> {
  const { data, error } = await supabase
    .from('moods')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Error fetching moods:', error);
    return [];
  }
  
  return data || [];
}

// Fetch all instrument categories
export async function fetchInstrumentCategories(): Promise<InstrumentCategory[]> {
  const { data, error } = await supabase
    .from('instrument_categories')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Error fetching instrument categories:', error);
    return [];
  }
  
  return data || [];
}

// Fetch all instruments with their categories
export async function fetchInstruments(): Promise<Instrument[]> {
  const { data, error } = await supabase
    .from('instruments')
    .select(`
      id,
      name,
      category_id,
      instrument_categories!inner(name)
    `)
    .order('instrument_categories(name), name');
  
  if (error) {
    console.error('Error fetching instruments:', error);
    return [];
  }
  
  return (data || []).map(instrument => ({
    id: instrument.id,
    name: instrument.name,
    category_id: instrument.category_id,
    category_name: instrument.instrument_categories.name
  }));
}

// Fetch all music data at once
export async function fetchAllMusicData(): Promise<MusicData> {
  try {
    const [genres, subGenres, moods, instrumentCategories, instruments] = await Promise.all([
      fetchGenres(),
      fetchSubGenres(),
      fetchMoods(),
      fetchInstrumentCategories(),
      fetchInstruments()
    ]);

    return {
      genres,
      subGenres,
      moods,
      instrumentCategories,
      instruments
    };
  } catch (error) {
    console.error('Error fetching all music data:', error);
    return {
      genres: [],
      subGenres: [],
      moods: [],
      instrumentCategories: [],
      instruments: []
    };
  }
}

// Search functions for filtering
export function searchGenres(genres: Genre[], searchTerm: string): Genre[] {
  return genres.filter(genre => 
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function searchSubGenres(subGenres: SubGenre[], searchTerm: string): SubGenre[] {
  return subGenres.filter(subGenre => 
    subGenre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function searchMoods(moods: Mood[], searchTerm: string): Mood[] {
  return moods.filter(mood => 
    mood.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function searchInstruments(instruments: Instrument[], searchTerm: string): Instrument[] {
  return instruments.filter(instrument => 
    instrument.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrument.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// Get instruments by category
export function getInstrumentsByCategory(instruments: Instrument[], categoryName: string): Instrument[] {
  return instruments.filter(instrument => 
    instrument.category_name === categoryName
  );
}

// Get unique category names
export function getUniqueCategories(instruments: Instrument[]): string[] {
  return [...new Set(instruments.map(instrument => instrument.category_name))].sort();
}
