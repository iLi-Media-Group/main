import { useState, useEffect } from 'react';
import { 
  fetchAllMusicData, 
  MusicData, 
  searchGenres, 
  searchSubGenres, 
  searchMoods, 
  searchInstruments,
  getInstrumentsByCategory,
  getUniqueCategories
} from '../lib/supabaseData';

export function useMusicData() {
  const [data, setData] = useState<MusicData>({
    genres: [],
    subGenres: [],
    moods: [],
    instrumentCategories: [],
    instruments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const musicData = await fetchAllMusicData();
        setData(musicData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load music data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Search functions
  const searchGenresData = (searchTerm: string) => searchGenres(data.genres, searchTerm);
  const searchSubGenresData = (searchTerm: string) => searchSubGenres(data.subGenres, searchTerm);
  const searchMoodsData = (searchTerm: string) => searchMoods(data.moods, searchTerm);
  const searchInstrumentsData = (searchTerm: string) => searchInstruments(data.instruments, searchTerm);

  // Utility functions
  const getInstrumentsByCategoryData = (categoryName: string) => 
    getInstrumentsByCategory(data.instruments, categoryName);
  
  const getUniqueCategoriesData = () => getUniqueCategories(data.instruments);

  return {
    // Data
    genres: data.genres,
    subGenres: data.subGenres,
    moods: data.moods,
    instrumentCategories: data.instrumentCategories,
    instruments: data.instruments,
    
    // State
    loading,
    error,
    
    // Search functions
    searchGenres: searchGenresData,
    searchSubGenres: searchSubGenresData,
    searchMoods: searchMoodsData,
    searchInstruments: searchInstrumentsData,
    
    // Utility functions
    getInstrumentsByCategory: getInstrumentsByCategoryData,
    getUniqueCategories: getUniqueCategoriesData,
    
    // Refresh function
    refresh: () => {
      setLoading(true);
      setError(null);
      fetchAllMusicData()
        .then(setData)
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to refresh data'))
        .finally(() => setLoading(false));
    }
  };
}
