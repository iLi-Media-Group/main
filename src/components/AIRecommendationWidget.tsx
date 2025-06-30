import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Search, TrendingUp, Clock, Heart, Zap, Lightbulb, ArrowRight, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Track {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  moods: string[];
  bpm: number;
  image: string;
  audioUrl: string;
  score?: number;
  reason?: string;
}

interface SearchSuggestion {
  type: 'genre' | 'mood' | 'bpm' | 'style' | 'use_case';
  value: string;
  confidence: number;
  description: string;
}

interface AIRecommendationWidgetProps {
  onTrackSelect?: (track: Track) => void;
  onSearchApply?: (filters: any) => void;
  className?: string;
}

const AIRecommendationWidget: React.FC<AIRecommendationWidgetProps> = ({ 
  onTrackSelect, 
  onSearchApply,
  className = "" 
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'suggestions' | 'trending'>('recommendations');

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
          producer:profiles!producer_id (
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
          producer:profiles!producer_id (
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
        artist: track.producer?.first_name || track.producer?.email?.split('@')[0] || 'Unknown Artist',
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
          producer:profiles!producer_id (
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
        artist: track.producer?.first_name || track.producer?.email?.split('@')[0] || 'Unknown Artist',
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
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    saveRecentSearch(query);

    try {
      // Parse natural language query
      const suggestions = await parseQuery(query);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
      setActiveTab('suggestions');

      // Apply the search if we have good suggestions
      if (suggestions.length > 0 && onSearchApply) {
        const filters = convertSuggestionsToFilters(suggestions);
        onSearchApply(filters);
      }

    } catch (err) {
      setError('Failed to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseQuery = async (query: string): Promise<SearchSuggestion[]> => {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Genre detection
    const genres = ['hip hop', 'electronic', 'pop', 'rock', 'jazz', 'classical', 'country', 'r&b', 'folk', 'reggae', 'blues', 'metal', 'punk', 'indie', 'ambient', 'techno', 'house', 'trance', 'dubstep', 'trap'];
    genres.forEach(genre => {
      if (lowerQuery.includes(genre)) {
        suggestions.push({
          type: 'genre',
          value: genre,
          confidence: 0.9,
          description: `Genre: ${genre}`
        });
      }
    });

    // Mood detection
    const moods = ['energetic', 'peaceful', 'uplifting', 'dramatic', 'romantic', 'mysterious', 'funky', 'aggressive', 'melancholic', 'happy', 'sad', 'excited', 'calm', 'intense', 'relaxed', 'powerful', 'gentle', 'dark', 'bright', 'emotional'];
    moods.forEach(mood => {
      if (lowerQuery.includes(mood)) {
        suggestions.push({
          type: 'mood',
          value: mood,
          confidence: 0.8,
          description: `Mood: ${mood}`
        });
      }
    });

    // BPM detection
    const bpmMatch = lowerQuery.match(/(\d+)\s*(?:bpm|tempo|speed)/);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1]);
      if (bpm >= 60 && bpm <= 200) {
        suggestions.push({
          type: 'bpm',
          value: bpm.toString(),
          confidence: 0.95,
          description: `Tempo: ${bpm} BPM`
        });
      }
    }

    // Use case detection
    const useCases = ['workout', 'meditation', 'commercial', 'trailer', 'restaurant', 'club', 'party', 'background', 'foreground', 'intro', 'outro', 'transition'];
    useCases.forEach(useCase => {
      if (lowerQuery.includes(useCase)) {
        suggestions.push({
          type: 'use_case',
          value: useCase,
          confidence: 0.7,
          description: `Use case: ${useCase}`
        });
      }
    });

    return suggestions;
  };

  const convertSuggestionsToFilters = (suggestions: SearchSuggestion[]) => {
    const filters: any = {
      query: '',
      genres: [],
      moods: [],
      minBpm: 0,
      maxBpm: 300
    };

    suggestions.forEach(suggestion => {
      switch (suggestion.type) {
        case 'genre':
          filters.genres.push(suggestion.value);
          break;
        case 'mood':
          filters.moods.push(suggestion.value);
          break;
        case 'bpm':
          const bpm = parseInt(suggestion.value);
          filters.minBpm = Math.max(0, bpm - 10);
          filters.maxBpm = Math.min(300, bpm + 10);
          break;
        case 'use_case':
          filters.query = suggestion.value;
          break;
      }
    });

    return filters;
  };

  const handleTrackClick = (track: Track) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (onSearchApply) {
      const filters = convertSuggestionsToFilters([suggestion]);
      onSearchApply(filters);
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-xl shadow-xl rounded-2xl border border-blue-400/30 p-8 max-w-xl mx-auto ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center justify-center bg-gradient-to-tr from-blue-500 via-purple-500 to-blue-400 rounded-full p-2 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            AI Search Assistant
          </h2>
        </div>
      </div>

      {/* Natural Language Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for... (e.g., 'energetic hip hop for workout')"
            className="w-full pl-6 pr-16 py-4 bg-white/20 border border-blue-400/30 rounded-full text-white placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 text-lg shadow-inner transition-all"
            onKeyPress={(e) => e.key === 'Enter' && processNaturalLanguageQuery(query)}
          />
          <button
            onClick={() => processNaturalLanguageQuery(query)}
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-tr from-blue-500 via-purple-500 to-blue-400 text-white rounded-full p-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'recommendations', label: 'For You', icon: <TrendingUp className="w-4 h-4 inline mr-1" /> },
          { key: 'suggestions', label: 'Suggestions', icon: <Lightbulb className="w-4 h-4 inline mr-1" /> },
          { key: 'trending', label: 'Trending', icon: <Zap className="w-4 h-4 inline mr-1" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all relative
              ${activeTab === tab.key
                ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-blue-400 text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/10'}
            `}
          >
            {tab.icon}{tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 rounded-full animate-fade-in"></span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {activeTab === 'recommendations' && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-white mb-2">Recommended for You</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.slice(0, 4).map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl cursor-pointer hover:scale-[1.03] hover:bg-white/20 transition-all shadow-md group"
                >
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-16 h-16 object-cover rounded-lg shadow group-hover:shadow-lg transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate text-lg">{track.title}</h4>
                    <p className="text-sm text-blue-200 truncate">{track.artist}</p>
                    {track.reason && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 text-xs text-white rounded-full shadow">
                        {track.reason}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-300 group-hover:text-white transition-all" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recommendations yet. Try searching for some tracks!</p>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-white mb-2">Search Suggestions</h3>
          {searchSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white text-sm flex items-center gap-2 shadow"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-300" />
                  {suggestion.description}
                  <span className="ml-2 text-xs text-blue-200">{(suggestion.confidence * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-blue-200 text-sm shadow"
                >
                  <TrendingUp className="w-4 h-4 mr-1 inline" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trending' && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-white mb-2">Recent Searches</h3>
          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-blue-200 text-sm flex items-center gap-2 shadow"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recent searches</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecommendationWidget;
