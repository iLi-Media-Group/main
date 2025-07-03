import React, { useState } from 'react';

type Track = {
  id: string;
  title: string;
  description: string;
  score: number;
};

const AIRecommendationWidget: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

<<<<<<< HEAD
  // Popular search examples
  const popularExamples = [
    'energetic hip hop for workout',
    'peaceful ambient for meditation',
    'uplifting pop for commercials',
    'dramatic orchestral for trailers',
    'funky jazz for restaurants',
    'electronic dance for clubs'
  ];

  useEffect(() => {
    loadRecentSearches();
    loadPopularSearches();
    generateSmartRecommendations();
  }, [user]);

  const loadRecentSearches = async () => {
    if (!user) return;
    
    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      if (recent) {
        setRecentSearches(JSON.parse(recent).slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  };

  const loadPopularSearches = async () => {
    try {
      // In a real app, this would come from analytics
      setPopularSearches(popularExamples.slice(0, 6));
    } catch (err) {
      console.error('Error loading popular searches:', err);
    }
  };

  const saveRecentSearch = (search: string) => {
    if (!user) return;
    
    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      const searches = recent ? JSON.parse(recent) : [];
      const updated = [search, ...searches.filter((s: string) => s !== search)].slice(0, 10);
      localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch (err) {
      console.error('Error saving recent search:', err);
    }
  };

  const generateSmartRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user's recent activity
      const { data: recentActivity } = await supabase
        .from('user_activity')
        .select('track_id, action_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user's favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('track_id')
        .eq('user_id', user.id);

      // Generate recommendations based on user behavior
      const recommendations = await generateRecommendationsFromBehavior(recentActivity, favorites);
      setRecommendations(recommendations);
      
    } catch (err) {
      console.error('Error generating recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendationsFromBehavior = async (activity: any[] | null, favorites: any[] | null): Promise<Track[]> => {
    try {
      // Get track IDs from activity and favorites
      const trackIds = [
        ...(activity?.map(a => a.track_id) || []),
        ...(favorites?.map(f => f.track_id) || [])
      ];

      if (trackIds.length === 0) {
        // If no user data, return trending tracks
        return await getTrendingTracks();
      }

      // Get the tracks
      const { data: tracks } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          moods,
          bpm,
          audio_url,
          image_url,
          track_producer:profiles!track_producer_id (
            first_name,
            last_name,
            email
          )
        `)
        .in('id', trackIds.slice(0, 10))
        .is('deleted_at', null);

      if (!tracks || tracks.length === 0) {
        return await getTrendingTracks();
      }

      // Analyze patterns and find similar tracks
      const patterns = analyzeTrackPatterns(tracks);
      const similarTracks = await findSimilarTracks(patterns);

      return similarTracks.map(track => ({
        ...track,
        score: Math.random() * 0.3 + 0.7, // Simulate AI score
        reason: getRecommendationReason(track, patterns)
      }));

    } catch (err) {
      console.error('Error generating recommendations from behavior:', err);
      return [];
    }
  };

  const analyzeTrackPatterns = (tracks: any[]) => {
    const patterns = {
      genres: new Map<string, number>(),
      moods: new Map<string, number>(),
      bpmRange: { min: 300, max: 0 },
      hasVocals: 0,
      totalTracks: tracks.length
    };

    tracks.forEach(track => {
      // Analyze genres
      const genres = Array.isArray(track.genres) ? track.genres : track.genres?.split(',') || [];
      genres.forEach((genre: string) => {
        patterns.genres.set(genre, (patterns.genres.get(genre) || 0) + 1);
      });

      // Analyze moods
      const moods = Array.isArray(track.moods) ? track.moods : track.moods?.split(',') || [];
      moods.forEach((mood: string) => {
        patterns.moods.set(mood, (patterns.moods.get(mood) || 0) + 1);
      });

      // Analyze BPM
      if (track.bpm) {
        patterns.bpmRange.min = Math.min(patterns.bpmRange.min, track.bpm);
        patterns.bpmRange.max = Math.max(patterns.bpmRange.max, track.bpm);
      }
    });

    return patterns;
  };

  const findSimilarTracks = async (patterns: any): Promise<Track[]> => {
    try {
      // Build query based on patterns
      const topGenres = Array.from(patterns.genres.entries())
        .sort((a, b) => (b as [string, number])[1] - (a as [string, number])[1])
        .slice(0, 3)
        .map((g) => (g as [string, number])[0]);

      const topMoods = Array.from(patterns.moods.entries())
        .sort((a, b) => (b as [string, number])[1] - (a as [string, number])[1])
        .slice(0, 3)
        .map((m) => (m as [string, number])[0]);

      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          moods,
          bpm,
          audio_url,
          image_url,
          track_producer:profiles!track_producer_id (
            first_name,
            last_name,
            email
          )
        `)
        .is('deleted_at', null)
        .limit(10);

      // Add filters based on patterns
      const conditions: string[] = [];
      
      if (topGenres.length > 0) {
        topGenres.forEach(genre => {
          conditions.push(`genres.ilike.%${genre}%`);
        });
      }

      if (topMoods.length > 0) {
        topMoods.forEach(mood => {
          conditions.push(`moods.ilike.%${mood}%`);
        });
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      // Add BPM range if we have data
      if (patterns.bpmRange.min < patterns.bpmRange.max) {
        const bpmRange = patterns.bpmRange.max - patterns.bpmRange.min;
        const minBpm = Math.max(0, patterns.bpmRange.min - bpmRange * 0.2);
        const maxBpm = Math.min(300, patterns.bpmRange.max + bpmRange * 0.2);
        query = query.gte('bpm', minBpm).lte('bpm', maxBpm);
      }

      const { data } = await query;
      
      return data?.map(track => ({
        id: track.id,
        title: track.title || 'Untitled',
        artist: track.track_producer?.first_name || track.track_producer?.email?.split('@')[0] || 'Unknown Artist',
        genres: Array.isArray(track.genres) ? track.genres : track.genres?.split(',').map((g: string) => g.trim()) || [],
        moods: Array.isArray(track.moods) ? track.moods : track.moods?.split(',').map((m: string) => m.trim()) || [],
        bpm: track.bpm,
        image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
        audioUrl: track.audio_url
      })) || [];

    } catch (err) {
      console.error('Error finding similar tracks:', err);
      return [];
    }
  };

  const getTrendingTracks = async (): Promise<Track[]> => {
    try {
      const { data } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          moods,
          bpm,
          audio_url,
          image_url,
          track_producer:profiles!track_producer_id (
            first_name,
            last_name,
            email
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(6);

      return data?.map(track => ({
        id: track.id,
        title: track.title || 'Untitled',
        artist: track.track_producer?.first_name || track.track_producer?.email?.split('@')[0] || 'Unknown Artist',
        genres: Array.isArray(track.genres) ? track.genres : track.genres?.split(',').map(g => g.trim()) || [],
        moods: Array.isArray(track.moods) ? track.moods : track.moods?.split(',').map(m => m.trim()) || [],
        bpm: track.bpm,
        image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
        audioUrl: track.audio_url,
        score: Math.random() * 0.2 + 0.8,
        reason: 'Trending track'
      })) || [];

    } catch (err) {
      console.error('Error getting trending tracks:', err);
      return [];
    }
  };

  const getRecommendationReason = (track: Track, patterns: any): string => {
    const reasons = [];
    
    if (patterns.genres.size > 0) {
      const topGenre = Array.from(patterns.genres.entries())[0][0];
      if (track.genres.some((g: string) => g.toLowerCase().includes(topGenre.toLowerCase()))) {
        reasons.push(`Similar to your ${topGenre} preferences`);
      }
    }
    
    if (patterns.moods.size > 0) {
      const topMood = Array.from(patterns.moods.entries())[0][0];
      if (track.moods.some((m: string) => m.toLowerCase().includes(topMood.toLowerCase()))) {
        reasons.push(`Matches your ${topMood} mood preference`);
      }
    }
    
    if (patterns.bpmRange.min < patterns.bpmRange.max) {
      const avgBpm = (patterns.bpmRange.min + patterns.bpmRange.max) / 2;
      if (Math.abs(track.bpm - avgBpm) < 20) {
        reasons.push('Similar tempo to your favorites');
      }
    }
    
    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  };

  const processNaturalLanguageQuery = async (query: string) => {
=======
  const fetchRecommendations = async () => {
>>>>>>> 135be3a40cdbfaf3865278285725f99c9d9343fc
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error('Failed to fetch recommendations');

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4 border rounded shadow">
      <h2 className="text-xl font-semibold mb-3">AI Music Recommendations</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for mood, genre, etc."
        className="w-full border p-2 rounded mb-3"
      />

      <button
        onClick={fetchRecommendations}
        disabled={loading || !query.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Get Recommendations'}
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      <ul className="mt-4 space-y-2">
        {results.length === 0 && !loading && <li>No recommendations yet.</li>}
        {results.map(track => (
          <li key={track.id} className="border p-3 rounded hover:bg-gray-100">
            <h3 className="font-semibold">{track.title}</h3>
            <p className="text-sm text-gray-600">{track.description}</p>
            <p className="text-xs text-gray-400">Score: {track.score.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIRecommendationWidget;
