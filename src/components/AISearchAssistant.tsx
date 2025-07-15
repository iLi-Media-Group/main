import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Mic, Clock, Brain, X, Lightbulb, Loader2, ArrowRight, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface SearchFilters {
  query: string;
  genres: string[];
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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [_suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'history'>('search');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Hide AI Search Assistant on login pages and other pages where it might interfere
  const shouldHide = [
    '/login',
    '/producer/login',
    '/admin/login',
    '/reset-password'
  ].some(path => location.pathname.includes(path));

  // Popular search examples
  const popularExamples = [
    'energetic hip hop for workout',
    'peaceful ambient for meditation',
    'uplifting pop for commercials',
    'dramatic orchestral for trailers',
    'funky jazz for restaurants',
    'electronic dance for clubs',
    'romantic piano for weddings',
    'mysterious synth for documentaries'
  ];

  // AI-powered suggestions based on context
  const aiSuggestions = [
    'Based on your recent searches: "upbeat electronic for gaming"',
    'Similar to what others found: "calm acoustic for podcasts"',
    'Trending now: "energetic trap for fitness videos"',
    'Popular in your genre: "dramatic orchestral for movie scenes"'
  ];

  useEffect(() => {
    loadRecentSearches();
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      // Focus the input when modal opens
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Separate effect to focus when switching to search tab
  useEffect(() => {
    if (isOpen && activeTab === 'search' && inputRef.current) {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab]);

  const loadRecentSearches = async () => {
    if (!user) return;
    
    try {
      const recent = localStorage.getItem(`recent_searches_${user.id}`);
      if (recent) {
        setRecentSearches(JSON.parse(recent).slice(0, 8));
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  };

  const saveRecentSearch = (search: string) => {
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
  };

  const processNaturalLanguageQuery = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    saveRecentSearch(query);

    try {
      // Parse natural language query
      const filters = parseQuery(query);
      
      // Apply the search
      if (onSearchApply) {
        onSearchApply(filters);
      }

      // Close modal after successful search
      setTimeout(() => setIsOpen(false), 1000);

    } catch (err) {
      setError('Failed to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseQuery = (query: string) => {
    const filters: SearchFilters = {
      query: '',
      genres: [],
      moods: [],
      minBpm: 0,
      maxBpm: 300
    };

    const lowerQuery = query.toLowerCase();

    // Genre detection
    const genres = ['hip hop', 'electronic', 'pop', 'rock', 'jazz', 'classical', 'country', 'r&b', 'folk', 'reggae', 'blues', 'metal', 'punk', 'indie', 'ambient', 'techno', 'house', 'trance', 'dubstep', 'trap'];
    genres.forEach(genre => {
      if (lowerQuery.includes(genre)) {
        filters.genres.push(genre);
      }
    });

    // Mood detection
    const moods = ['energetic', 'peaceful', 'uplifting', 'dramatic', 'romantic', 'mysterious', 'funky', 'aggressive', 'melancholic', 'happy', 'sad', 'excited', 'calm', 'intense', 'relaxed', 'powerful', 'gentle', 'dark', 'bright', 'emotional'];
    moods.forEach(mood => {
      if (lowerQuery.includes(mood)) {
        filters.moods.push(mood);
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

    // Use case detection
    const useCases = ['workout', 'meditation', 'commercial', 'trailer', 'restaurant', 'club', 'party', 'background', 'foreground', 'intro', 'outro', 'transition'];
    useCases.forEach(useCase => {
      if (lowerQuery.includes(useCase)) {
        filters.query = useCase;
      }
    });

    return filters;
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    processNaturalLanguageQuery(example);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    processNaturalLanguageQuery(search);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    processNaturalLanguageQuery(suggestion);
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Here you would implement actual voice recognition
    // For now, just simulate it
    if (!isListening) {
      setTimeout(() => {
        setQuery('energetic electronic music for workout');
        setIsListening(false);
      }, 2000);
    }
  };

  // Floating Button Component
  const FloatingButton = () => (
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
  );

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
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., 'energetic hip hop for workout videos' or 'peaceful ambient for meditation'"
                      className="w-full pl-4 pr-20 py-4 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20 text-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          processNaturalLanguageQuery(query);
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
                        onClick={() => processNaturalLanguageQuery(query)}
                        disabled={loading || !query.trim()}
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