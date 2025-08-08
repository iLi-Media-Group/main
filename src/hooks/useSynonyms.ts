import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Synonym {
  id: string;
  term: string;
  synonyms: string[];
  created_at: string;
}

export function useSynonyms() {
  const [synonyms, setSynonyms] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSynonyms();
  }, []);

  const fetchSynonyms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('search_synonyms')
        .select('*')
        .order('term');

      if (error) throw error;

      // Convert array of synonyms to the format expected by the search logic
      const synonymsMap: { [key: string]: string[] } = {};
      data?.forEach((synonym: Synonym) => {
        synonymsMap[synonym.term] = synonym.synonyms;
      });

      setSynonyms(synonymsMap);
    } catch (err) {
      console.error('Error fetching synonyms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch synonyms');
    } finally {
      setLoading(false);
    }
  };

  const refreshSynonyms = () => {
    fetchSynonyms();
  };

  return { synonyms, loading, error, refreshSynonyms };
}
