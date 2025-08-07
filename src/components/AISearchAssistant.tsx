import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Mic, Clock, Brain, X, Lightbulb, Loader2, ArrowRight, Zap, Star, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';
import { searchTracks, getSearchSuggestions } from '../lib/algolia';
import { supabase } from '../lib/supabase';
import { AudioPlayer } from './AudioPlayer';
import { useSignedUrl } from '../hooks/useSignedUrl';

interface SearchFilters {
  query: string;
  genres: string[];
  subGenres: string[];
  moods: string[];
  minBpm: number;
  maxBpm: number;
}

interface AISearchAssistantProps {
  onSearchApply?: (filters: SearchFilters) => void;
  className?: string;
}

const AISearchAssistant: React.FC<AISearchAssistantProps> = ({ 
  onSearchApply,
  className = "" 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { genres, subGenres, moods, loading: dataLoading } = useDynamicSearchData();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [_suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'history'>('search');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const queryRef = React.useRef('');
  const [searchExplanation, setSearchExplanation] = useState<string>('');
  const [algoliaResults, setAlgoliaResults] = useState<any>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Hide AI Search Assistant on login pages and other pages where it might interfere
  const shouldHide = [
    '/login',
    '/producer/login',
    '/admin/login',
    '/reset-password'
  ].some(path => location.pathname.includes(path));

  // Enhanced popular search examples with natural language
  const popularExamples = [
    'I need energetic hiphop for my workout routine',
    'Looking for peaceful classical music for meditation',
    'Want uplifting pop songs for commercials',
    'Need dramatic classical music for movie trailers',
    'Searching for funky jazz for restaurant background',
    'Find electronic dance music for club nights',
    'Looking for romantic classical for wedding ceremonies',
    'Need mysterious electronic for documentary films',
    'Want energetic rock for gaming content',
    'Looking for peaceful ambient for relaxation'
  ];

  // AI-powered suggestions based on context and user behavior
  const generateAISuggestions = React.useCallback(async () => {
    if (!user) return [];

    try {
      const userPreferences = await analyzeUserPreferences();
      const suggestions = [];

      // Personalized suggestions based on user history
      if (userPreferences) {
        if (userPreferences.favoriteGenres.length > 0) {
          suggestions.push(`Based on your love for ${userPreferences.favoriteGenres[0]}: "energetic ${userPreferences.favoriteGenres[0]} for workout"`);
        }
        if (userPreferences.favoriteMoods.length > 0) {
          suggestions.push(`Since you enjoy ${userPreferences.favoriteMoods[0]} music: "peaceful ${userPreferences.favoriteMoods[0]} for meditation"`);
        }
      }

      // Context-aware suggestions based on time of day
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        suggestions.push('Morning energy: "uplifting pop for commercials"');
      } else if (hour >= 12 && hour < 18) {
        suggestions.push('Afternoon focus: "peaceful classical for work"');
      } else if (hour >= 18 && hour < 22) {
        suggestions.push('Evening vibes: "energetic electronic for parties"');
      } else {
        suggestions.push('Late night: "mysterious electronic for documentaries"');
      }

      // Trending suggestions (simulated)
      const trendingSuggestions = [
        'Trending now: "energetic trap for fitness videos"',
        'Popular this week: "peaceful ambient for meditation"',
        'Hot right now: "dramatic orchestral for movie scenes"'
      ];
      suggestions.push(...trendingSuggestions.slice(0, 2));

      // Use case suggestions
      const useCaseSuggestions = [
        'For gaming: "energetic electronic with fast tempo"',
        'For restaurants: "peaceful jazz for background music"',
        'For weddings: "romantic classical for ceremonies"',
        'For podcasts: "calm acoustic for intros"'
      ];
      suggestions.push(...useCaseSuggestions.slice(0, 2));

      return suggestions.slice(0, 6); // Limit to 6 suggestions
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  }, [user]);

  // State for AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Load AI suggestions when component mounts or user changes
  useEffect(() => {
    if (user && isOpen && activeTab === 'suggestions') {
      const loadSuggestions = async () => {
        const suggestions = await generateAISuggestions();
        setAiSuggestions(suggestions);
      };
      loadSuggestions();
    }
  }, [user, isOpen, activeTab, generateAISuggestions]);

  useEffect(() => {
    loadRecentSearches();
    loadFavorites();
  }, [user]);

  // Focus input when modal opens or when switching to search tab
  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0); // Use 0ms delay to ensure DOM is mounted
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, activeTab]);

  const loadRecentSearches = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      if (recent) {
        setRecentSearches(JSON.parse(recent).slice(0, 8));
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  }, [user]);

  const saveRecentSearch = React.useCallback((search: string) => {
    if (!user) return;
    
    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      const searches = recent ? JSON.parse(recent) : [];
      const updated = [search, ...searches.filter((s: string) => s !== search)].slice(0, 10);
      localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 8));
    } catch (err) {
      console.error('Error saving recent search:', err);
    }
  }, [user]);

  const loadFavorites = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('track_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const favoriteTrackIds = data?.map(f => f.track_id) || [];
      setFavorites(new Set(favoriteTrackIds));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [user]);

  const toggleFavorite = React.useCallback(async (trackId: string) => {
    if (!user || favoriteLoading === trackId) return;
    
    try {
      setFavoriteLoading(trackId);
      
      const isCurrentlyFavorite = favorites.has(trackId);
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        if (error) throw error;
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(trackId);
          return newFavorites;
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            track_id: trackId
          });

        if (error) throw error;
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(trackId);
          return newFavorites;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(null);
    }
  }, [user, favorites, favoriteLoading]);

  const handleTrackClick = React.useCallback((trackId: string) => {
    navigate(`/track/${trackId}`);
    setIsOpen(false);
  }, [navigate]);

  const togglePlay = React.useCallback((trackId: string) => {
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(trackId);
    }
  }, [currentlyPlaying]);

  // Audio Player Component for AI Search Assistant tracks
  const AISearchAudioPlayer = React.useCallback(({ track }: { track: any }) => {
    const { signedUrl, loading, error } = useSignedUrl('track-audio', track.audio_url);

    if (loading) {
      return (
        <div className="flex items-center justify-center w-8 h-8">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        </div>
      );
    }

    if (error || !signedUrl) {
      return (
        <div className="flex items-center justify-center w-8 h-8">
          <span className="text-red-400 text-xs">!</span>
        </div>
      );
    }

    return (
      <AudioPlayer
        src={signedUrl}
        title={track.title}
        isPlaying={currentlyPlaying === track.id}
        onToggle={() => togglePlay(track.id)}
        size="sm"
        audioId={`ai-search-${track.id}`}
      />
    );
  }, [currentlyPlaying, togglePlay]);

  const processNaturalLanguageQuery = React.useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchExplanation('');
    setAlgoliaResults(null);
    saveRecentSearch(query);

    try {
      // Use Algolia for AI-powered search
      const results = await searchTracks(query);
      
      console.log('Frontend received algoliaResults:', results);
      console.log('algoliaResults.tracks:', results?.tracks);
      console.log('algoliaResults.tracks.length:', results?.tracks?.length);
      
      // Clear error immediately when we get any response (success or no results)
      setError(null);
      
      if (results && results.tracks && Array.isArray(results.tracks) && results.tracks.length > 0) {
        console.log('Found tracks, generating explanation...');
        // Store the results for display
        setAlgoliaResults(results);
        
        // Generate explanation of what the AI found
        const explanation = generateAlgoliaSearchExplanation(query, results);
        setSearchExplanation(explanation);
      } else {
        console.log('No tracks found or invalid response structure');
        setSearchExplanation(`🤖 AI found no tracks matching "${query}". Try different keywords or be more specific.`);
        setAlgoliaResults(null);
      }

    } catch (err) {
      console.error('Algolia search error:', err);
      // Only show error for actual service failures (404, 500, 401, etc.)
      setError('AI search is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSearchApply, saveRecentSearch]);

  // Generate explanation of what the AI found using Algolia
  const generateAlgoliaSearchExplanation = (originalQuery: string, results: any) => {
    const explanations = [];
    
    if (results.tracks && results.tracks.length > 0) {
      explanations.push(`🎯 Found ${results.totalHits} tracks matching your search`);
      
      // Analyze the types of tracks found
      const genres = new Set();
      const moods = new Set();
      
      results.tracks.forEach((track: any) => {
        if (track.genres) {
          track.genres.forEach((genre: string) => genres.add(genre));
        }
        if (track.moods) {
          track.moods.forEach((mood: string) => moods.add(mood));
        }
      });
      
      if (genres.size > 0) {
        explanations.push(`🎵 Genres: ${Array.from(genres).slice(0, 3).join(', ')}`);
      }
      
      if (moods.size > 0) {
        explanations.push(`😊 Moods: ${Array.from(moods).slice(0, 3).join(', ')}`);
      }
    }
    
    if (explanations.length === 0) {
      return "🤖 AI is searching for tracks matching your description...";
    }
    
    return `🤖 From "${originalQuery}": ${explanations.join(' | ')}`;
  };

  // Convert Algolia results to the expected filter format
  const convertAlgoliaResultsToFilters = (results: any, query: string): SearchFilters => {
    const filters: SearchFilters = {
      query: query,
      genres: [],
      subGenres: [],
      moods: [],
      minBpm: 0,
      maxBpm: 300
    };

    // Extract unique genres and moods from the results
    const genres = new Set<string>();
    const moods = new Set<string>();
    
    if (results.tracks) {
      results.tracks.forEach((track: any) => {
        if (track.genres) {
          track.genres.forEach((genre: string) => genres.add(genre));
        }
        if (track.moods) {
          track.moods.forEach((mood: string) => moods.add(mood));
        }
      });
    }

    filters.genres = Array.from(genres);
    filters.moods = Array.from(moods);

    return filters;
  };

  // Algolia-powered search processing for AI Search Assistant
  const processAlgoliaSearch = async (query: string) => {
    try {
      const results = await searchTracks(query);
      return results;
    } catch (error) {
      console.error('Algolia search error:', error);
      throw error;
    }
  };



  // Analyze user preferences based on search history
  const analyzeUserPreferences = async () => {
    if (!user) return null;

    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      if (!recent) return null;

      const searches = JSON.parse(recent);
      const genreCounts: { [key: string]: number } = {};
      const moodCounts: { [key: string]: number } = {};

      // Analyze recent searches for patterns
      searches.forEach((search: string) => {
        const lowerSearch = search.toLowerCase();
        
        // Count genre mentions
        genres.forEach(genre => {
          if (lowerSearch.includes(genre.name.toLowerCase()) || lowerSearch.includes(genre.display_name.toLowerCase())) {
            genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
          }
        });

        // Count mood mentions
        moods.forEach(mood => {
          if (lowerSearch.includes(mood.name.toLowerCase()) || lowerSearch.includes(mood.display_name.toLowerCase())) {
            moodCounts[mood.name] = (moodCounts[mood.name] || 0) + 1;
          }
        });
      });

      // Get top preferences
      const favoriteGenres = Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      const favoriteMoods = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([mood]) => mood);

      return { favoriteGenres, favoriteMoods };
    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      return null;
    }
  };



  const handleExampleClick = React.useCallback((example: string) => {
    queryRef.current = example;
    if (inputRef.current) {
      inputRef.current.value = example;
    }
    processNaturalLanguageQuery(example);
  }, [processNaturalLanguageQuery]);

  const handleRecentSearchClick = React.useCallback((search: string) => {
    queryRef.current = search;
    if (inputRef.current) {
      inputRef.current.value = search;
    }
    processNaturalLanguageQuery(search);
  }, [processNaturalLanguageQuery]);

  const handleSuggestionClick = React.useCallback((suggestion: string) => {
    queryRef.current = suggestion;
    if (inputRef.current) {
      inputRef.current.value = suggestion;
    }
    processNaturalLanguageQuery(suggestion);
  }, [processNaturalLanguageQuery]);

  const toggleVoiceInput = React.useCallback(() => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate intelligent voice recognition with context
      const voiceExamples = [
        'I need energetic hiphop for working out',
        'Looking for peaceful music to relax',
        'Want upbeat electronic for gaming',
        'Searching for dramatic orchestral music',
        'Need romantic jazz for dinner'
      ];
      
      setTimeout(() => {
        const randomExample = voiceExamples[Math.floor(Math.random() * voiceExamples.length)];
        queryRef.current = randomExample;
        if (inputRef.current) {
          inputRef.current.value = randomExample;
        }
        setIsListening(false);
        
        // Auto-process the voice input
        setTimeout(() => {
          processNaturalLanguageQuery(randomExample);
        }, 500);
      }, 2000);
    }
  }, [isListening, processNaturalLanguageQuery]);

  // Floating Button Component
  const FloatingButton = React.useCallback(() => (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
    >
      <Brain className="w-6 h-6" />
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        AI
      </div>
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        AI Search Assistant
      </div>
    </button>
  ), []);

  // Modal Component
  const Modal = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-blue-900/90 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
                             <div>
                 <h2 className="text-2xl font-bold text-white">AI Search Assistant</h2>
                 <p className="text-gray-400 text-sm">Powered by Algolia AI to help you find the perfect music</p>
               </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Search
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'suggestions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Lightbulb className="w-4 h-4 inline mr-2" />
                AI Suggestions
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                History
              </button>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                {/* Natural Language Search */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Describe Your Music</h3>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      defaultValue=""
                      onChange={(e) => {
                        queryRef.current = e.target.value;
                      }}
                      placeholder="e.g., 'energetic hip hop for workout videos' or 'peaceful ambient for meditation'"
                      className="w-full pl-4 pr-20 py-4 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20 text-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          processNaturalLanguageQuery(queryRef.current);
                        }
                      }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-2">
                      <button
                        onClick={toggleVoiceInput}
                        className={`p-2 rounded-lg transition-colors ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
                        }`}
                        title="Voice Input"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => processNaturalLanguageQuery(queryRef.current)}
                        disabled={loading || !queryRef.current.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Search"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* AI Explanation */}
                {searchExplanation && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm">{searchExplanation}</p>
                  </div>
                )}

                                                  {/* Search Results */}
                 {algoliaResults && algoliaResults.tracks && algoliaResults.tracks.length > 0 && (
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                       <Search className="w-5 h-5 mr-2 text-green-400" />
                       Found Tracks ({algoliaResults.tracks.length})
                     </h3>
                                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                        {algoliaResults.tracks.map((track: any, index: number) => (
                          <div key={track.id || index} className="bg-white/5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => handleTrackClick(track.id)}>
                            {/* Track Image */}
                            <div className="relative aspect-square rounded-t-lg overflow-hidden">
                             {track.image_url ? (
                               <img 
                                 src={track.image_url} 
                                 alt={track.title}
                                 className="w-full h-full object-cover"
                                 onError={(e) => {
                                   e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjM0I4M0Y2Ii8+CjxwYXRoIGQ9Ik0zMiAxNkMyMy4xNjM0IDE2IDE2IDIzLjE2MzQgMTYgMzJDMTYgNDAuODM2NiAyMy4xNjM0IDQ4IDMyIDQ4QzQwLjgzNjYgNDggNDggNDAuODM2NiA0OCAzMkM0OCAyMy4xNjM0IDQwLjgzNjYgMTYgMzIgMTZaIiBmaWxsPSIjNjM2NkY3Ii8+CjxwYXRoIGQ9Ik0zMiAyOEMzNC4yMDkxIDI4IDM2IDI5Ljc5MDkgMzYgMzJDMzYgMzQuMjA5MSAzNC4yMDkxIDM2IDMyIDM2QzI5Ljc5MDkgMzYgMjggMzQuMjA5MSAyOCAzMkMyOCAyOS43OTA5IDI5Ljc5MDkgMjggMzIgMjhaIiBmaWxsPSIjM0I4M0Y2Ii8+Cjwvc3ZnPgo=';
                                 }}
                               />
                             ) : (
                               <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                 <span className="text-white text-2xl">🎵</span>
                               </div>
                             )}
                                                           {/* Audio Player Overlay */}
                              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <div 
                                  className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <AISearchAudioPlayer track={track} />
                                </div>
                              </div>
                              
                              {/* Favorite Button */}
                              <div className="absolute top-2 right-2">
                                <button
                                  className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors disabled:opacity-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(track.id);
                                  }}
                                  disabled={favoriteLoading === track.id}
                                  title={favorites.has(track.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  {favoriteLoading === track.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <Heart 
                                      className={`w-4 h-4 ${favorites.has(track.id) ? 'text-red-500 fill-current' : 'text-white'}`} 
                                    />
                                  )}
                                </button>
                              </div>
                           </div>
                           
                           {/* Track Info */}
                           <div className="p-4">
                             <h4 className="text-white font-medium text-sm truncate mb-1">{track.title}</h4>
                             <p className="text-gray-400 text-xs mb-2">{track.artist}</p>
                             
                             {/* Genres */}
                             <div className="flex flex-wrap gap-1 mb-2">
                               {track.genres && track.genres.split(',').slice(0, 2).map((genre: string, i: number) => (
                                 <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                   {genre.trim()}
                                 </span>
                               ))}
                             </div>
                             
                             {/* BPM */}
                             {track.bpm && (
                               <p className="text-gray-500 text-xs">BPM: {track.bpm}</p>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                {/* Popular Examples */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-400" />
                    Popular Searches
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {popularExamples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example)}
                        className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300 border border-blue-500/20 hover:border-blue-500/40 hover:scale-105 transform"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    AI-Powered Suggestions
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Based on your listening history and popular trends, here are some recommendations:
                  </p>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 transform"
                      >
                        <div className="flex items-center justify-between">
                          <span>{suggestion}</span>
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Features Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-blue-400" />
                    How AI Helps You Find Music
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <h5 className="font-medium text-white mb-2">Smart Understanding</h5>
                      <ul className="space-y-1">
                        <li>• Natural language processing</li>
                        <li>• Context-aware suggestions</li>
                        <li>• Genre and mood detection</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-white mb-2">Personalized Results</h5>
                      <ul className="space-y-1">
                        <li>• Learning from your preferences</li>
                        <li>• Trending recommendations</li>
                        <li>• Similar user patterns</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    Recent Searches
                  </h3>
                  {recentSearches.length > 0 ? (
                    <div className="space-y-3">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300 flex items-center justify-between border border-blue-500/20 hover:border-blue-500/40 hover:scale-105 transform"
                        >
                          <span>{search}</span>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No recent searches yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start searching to see your history here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Don't render anything if we should hide the AI Search Assistant
  if (shouldHide) {
    return null;
  }

  return (
    <>
      <FloatingButton />
      <Modal />
    </>
  );
};

export default AISearchAssistant; 
