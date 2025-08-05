import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Mic, Clock, Brain, X, Lightbulb, Loader2, ArrowRight, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

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

  const processNaturalLanguageQuery = React.useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchExplanation('');
    saveRecentSearch(query);

    try {
      // Enhanced AI-powered natural language processing
      const filters = await processAISearch(query);
      
      // Generate explanation of what the AI understood
      const explanation = generateSearchExplanation(query, filters);
      setSearchExplanation(explanation);
      
      // Apply the search
      if (onSearchApply) {
        onSearchApply(filters);
      }

      // Don't auto-close the modal - let user close it manually
      // This prevents interference with typing

    } catch (err) {
      setError('Failed to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSearchApply, saveRecentSearch]);

  // Generate explanation of what the AI understood
  const generateSearchExplanation = (originalQuery: string, filters: SearchFilters) => {
    const explanations = [];
    
    if (filters.genres.length > 0) {
      explanations.push(`🎵 Genres: ${filters.genres.join(', ')}`);
    }
    
    if (filters.moods.length > 0) {
      explanations.push(`😊 Moods: ${filters.moods.join(', ')}`);
    }
    
    if (filters.subGenres.length > 0) {
      explanations.push(`🎼 Subgenres: ${filters.subGenres.join(', ')}`);
    }
    
    if (filters.minBpm > 0 || filters.maxBpm < 300) {
      explanations.push(`⚡ BPM: ${filters.minBpm}-${filters.maxBpm}`);
    }
    
    if (filters.query) {
      explanations.push(`🎯 Use case: ${filters.query}`);
    }
    
    if (explanations.length === 0) {
      return "🤖 AI is searching for tracks matching your description...";
    }
    
    // Add context about the original query
    return `🤖 From "${originalQuery}": ${explanations.join(' | ')}`;
  };

  // Enhanced AI-powered search processing
  const processAISearch = async (query: string): Promise<SearchFilters> => {
    const filters: SearchFilters = {
      query: '',
      genres: [],
      subGenres: [],
      moods: [],
      minBpm: 0,
      maxBpm: 300
    };

    const lowerQuery = query.toLowerCase();

    // 1. ENHANCED CONTEXT-AWARE GENRE DETECTION
    // Create dynamic genre variations from database data
    const genreVariations: { [key: string]: string[] } = {};
    genres.forEach(genre => {
      const variations = [
        genre.name.toLowerCase(),
        genre.display_name.toLowerCase(),
        genre.name.toLowerCase().replace(/\s+/g, ''),
        genre.name.toLowerCase().replace(/\s+/g, '-'),
        genre.name.toLowerCase().replace(/\s+/g, '_'),
        genre.display_name.toLowerCase().replace(/\s+/g, ''),
        genre.display_name.toLowerCase().replace(/\s+/g, '-'),
        genre.display_name.toLowerCase().replace(/\s+/g, '_')
      ];
      
      // Add common variations for specific genres
      if (genre.name.toLowerCase().includes('hip')) {
        variations.push('hip hop', 'hip-hop', 'hiphop', 'rap', 'trap', 'drill');
      }
      if (genre.name.toLowerCase().includes('rnb') || genre.name.toLowerCase().includes('soul')) {
        variations.push('r&b', 'rnb', 'rhythm and blues', 'soul', 'neo soul');
      }
      if (genre.name.toLowerCase().includes('electronic')) {
        variations.push('edm', 'electronic dance', 'techno', 'house', 'trance');
      }
      
      genreVariations[genre.name] = [...new Set(variations)];
    });

    // 2. INTELLIGENT MOOD DETECTION
    // Create dynamic mood variations from database data
    const moodVariations: { [key: string]: string[] } = {};
    moods.forEach(mood => {
      const variations = [
        mood.name.toLowerCase(),
        mood.display_name.toLowerCase()
      ];
      
      // Add common synonyms for moods
      if (mood.name.toLowerCase().includes('energetic')) {
        variations.push('upbeat', 'high energy', 'powerful', 'intense', 'dynamic');
      }
      if (mood.name.toLowerCase().includes('peaceful')) {
        variations.push('calm', 'relaxing', 'serene', 'tranquil', 'soothing');
      }
      if (mood.name.toLowerCase().includes('uplifting')) {
        variations.push('inspiring', 'motivational', 'positive', 'encouraging');
      }
      if (mood.name.toLowerCase().includes('dramatic')) {
        variations.push('intense', 'emotional', 'powerful', 'epic');
      }
      if (mood.name.toLowerCase().includes('romantic')) {
        variations.push('love', 'passionate', 'intimate', 'sweet');
      }
      if (mood.name.toLowerCase().includes('mysterious')) {
        variations.push('dark', 'moody', 'atmospheric', 'haunting');
      }
      if (mood.name.toLowerCase().includes('funky')) {
        variations.push('groovy', 'rhythmic', 'danceable');
      }
      if (mood.name.toLowerCase().includes('melancholic')) {
        variations.push('sad', 'melancholy', 'sorrowful', 'emotional');
      }
      
      moodVariations[mood.name] = [...new Set(variations)];
    });

    // More precise genre detection - prioritize exact matches using dynamic genres
    let genreDetected = false;
    
    // First, check for exact matches in the genres array
    genres.forEach(genre => {
      if (lowerQuery.includes(genre.name.toLowerCase()) || lowerQuery.includes(genre.display_name.toLowerCase())) {
        filters.genres.push(genre.name);
        genreDetected = true;
      }
    });
    
    // Then check for synonyms and variations
    Object.entries(genreVariations).forEach(([genreName, synonyms]) => {
      if (synonyms.some(syn => lowerQuery.includes(syn))) {
        // Only add if not already added
        if (!filters.genres.includes(genreName)) {
          filters.genres.push(genreName);
          genreDetected = true;
        }
      }
    });

    // First, check for exact matches in the moods array
    moods.forEach(mood => {
      if (lowerQuery.includes(mood.name.toLowerCase()) || lowerQuery.includes(mood.display_name.toLowerCase())) {
        filters.moods.push(mood.name);
      }
    });

    // Then check for synonyms and variations
    Object.entries(moodVariations).forEach(([moodName, synonyms]) => {
      if (synonyms.some(syn => lowerQuery.includes(syn))) {
        // Only add if not already added
        if (!filters.moods.includes(moodName)) {
          filters.moods.push(moodName);
        }
      }
    });

    // 3. CONTEXT-AWARE BPM DETECTION
    // Detect BPM from natural language descriptions
    const bpmContexts = [
      { pattern: /(\d+)\s*(?:bpm|tempo|speed)/, weight: 1.0 },
      { pattern: /slow|laid back|chill/, bpmRange: [60, 90] },
      { pattern: /medium|moderate/, bpmRange: [90, 130] },
      { pattern: /fast|upbeat|energetic/, bpmRange: [130, 180] },
      { pattern: /very fast|intense/, bpmRange: [150, 200] }
    ];

    for (const context of bpmContexts) {
      if (context.pattern.test(lowerQuery)) {
        if (context.weight) {
          const match = lowerQuery.match(context.pattern);
          if (match) {
            const bpm = parseInt(match[1]);
            if (bpm >= 60 && bpm <= 200) {
              filters.minBpm = Math.max(0, bpm - 10);
              filters.maxBpm = Math.min(300, bpm + 10);
            }
          }
        } else if (context.bpmRange) {
          filters.minBpm = context.bpmRange[0];
          filters.maxBpm = context.bpmRange[1];
        }
        break;
      }
    }

    // 4. ENHANCED USE CASE AND CONTEXT DETECTION
    // More specific use case contexts that override general preferences
    const useCaseContexts = {
      'workout': { genres: ['hiphop', 'electronic'], moods: ['energetic'], bpmRange: [120, 180] },
      'meditation': { genres: ['classical', 'world'], moods: ['peaceful'], bpmRange: [60, 90] },
      'commercial': { genres: ['pop', 'electronic'], moods: ['uplifting'], bpmRange: [90, 140] },
      'movie': { genres: ['classical', 'electronic'], moods: ['dramatic'], bpmRange: [60, 140] },
      'gaming': { genres: ['electronic', 'rock'], moods: ['energetic'], bpmRange: [120, 160] },
      'restaurant': { genres: ['jazz', 'classical'], moods: ['peaceful'], bpmRange: [60, 100] },
      'party': { genres: ['electronic', 'pop'], moods: ['energetic'], bpmRange: [120, 160] },
      'wedding': { genres: ['classical', 'jazz'], moods: ['romantic'], bpmRange: [60, 120] }
    };

    // Check for use case keywords and apply context-specific filters
    Object.entries(useCaseContexts).forEach(([useCase, context]) => {
      if (lowerQuery.includes(useCase)) {
        // Apply use case specific filters
        if (context.genres && !filters.genres.length) {
          filters.genres.push(...context.genres);
        }
        if (context.moods && !filters.moods.length) {
          filters.moods.push(...context.moods);
        }
        if (context.bpmRange && filters.minBpm === 0 && filters.maxBpm === 300) {
          filters.minBpm = context.bpmRange[0];
          filters.maxBpm = context.bpmRange[1];
        }
      }
    });

    // 3.5. SUBGENRE DETECTION
    // Check for subgenres using the dynamic subGenres from database
    subGenres.forEach(subGenre => {
      if (lowerQuery.includes(subGenre.name.toLowerCase()) || lowerQuery.includes(subGenre.display_name.toLowerCase())) {
        filters.subGenres.push(subGenre.name);
      }
    });

    // 5. CLEAN UP AND OPTIMIZE QUERY
    // Remove detected terms from the remaining query text
    let remainingQuery = query;
    
    // Remove detected genres
    filters.genres.forEach(genre => {
      const variations = genreVariations[genre] || [];
      variations.forEach(variation => {
        remainingQuery = remainingQuery.replace(new RegExp(variation, 'gi'), '').trim();
      });
    });

    // Remove detected moods
    filters.moods.forEach(mood => {
      const variations = moodVariations[mood] || [];
      variations.forEach(variation => {
        remainingQuery = remainingQuery.replace(new RegExp(variation, 'gi'), '').trim();
      });
    });

    // Remove detected subgenres
    filters.subGenres.forEach(subGenre => {
      remainingQuery = remainingQuery.replace(new RegExp(subGenre, 'gi'), '').trim();
    });

    // Set the cleaned query as the remaining search text
    filters.query = remainingQuery;

    return filters;
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

  const parseQuery = (query: string) => {
    const filters: SearchFilters = {
      query: '',
      genres: [],
      subGenres: [],
      moods: [],
      minBpm: 0,
      maxBpm: 300
    };

    const lowerQuery = query.toLowerCase();

    // Genre detection - check for exact matches first, then partial matches
    genres.forEach(genre => {
      const genreLower = genre.name.toLowerCase();
      
      // Check for exact genre match
      if (lowerQuery.includes(genreLower)) {
        filters.genres.push(genre.name);
        
        // Check if this genre has subgenres and if any are mentioned
        const genreKey = genreLower;
        const genreSubGenres = subGenres.filter(sg => sg.genre_id === genre.id);
        genreSubGenres.forEach(subGenre => {
          const subGenreLower = subGenre.name.toLowerCase();
          if (lowerQuery.includes(subGenreLower)) {
            filters.subGenres.push(subGenre.name);
          }
        });
      }
    });

    // Mood detection - use the actual MOODS from types
    moods.forEach(mood => {
      const moodLower = mood.name.toLowerCase();
      if (lowerQuery.includes(moodLower)) {
        filters.moods.push(mood.name);
      }
    });

    // BPM detection
    const bpmMatch = lowerQuery.match(/(\d+)\s*(?:bpm|tempo|speed)/);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1]);
      if (bpm >= 60 && bpm <= 200) {
        filters.minBpm = Math.max(0, bpm - 10);
        filters.maxBpm = Math.min(300, bpm + 10);
      }
    }

    // Use case detection for query text
    const useCases = ['workout', 'meditation', 'commercial', 'trailer', 'restaurant', 'club', 'party', 'background', 'foreground', 'intro', 'outro', 'transition', 'gaming', 'fitness', 'podcast', 'movie', 'documentary', 'wedding'];
    for (const useCase of useCases) {
      if (lowerQuery.includes(useCase)) {
        filters.query = useCase;
        break; // Use the first use case found
      }
    }

    return filters;
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
                <p className="text-gray-400 text-sm">Powered by advanced AI to help you find the perfect music</p>
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
