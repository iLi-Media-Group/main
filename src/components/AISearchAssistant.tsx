import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Search, TrendingUp, Clock, Zap, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AISearchAssistantProps {
  onSearchApply?: (filters: any) => void;
  className?: string;
}

const AISearchAssistant: React.FC<AISearchAssistantProps> = ({ 
  onSearchApply,
  className = "" 
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    } catch (err) {
      setError('Failed to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseQuery = (query: string) => {
    const filters: any = {
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

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">AI Search Assistant</h2>
        </div>
        <Sparkles className="w-5 h-5 text-purple-400" />
      </div>

      {/* Natural Language Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for... (e.g., 'energetic hip hop for workout')"
            className="w-full pl-4 pr-12 py-3 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
            onKeyPress={(e) => e.key === 'Enter' && processNaturalLanguageQuery(query)}
          />
          <button
            onClick={() => processNaturalLanguageQuery(query)}
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Popular Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
          Popular Searches
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {popularExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300 border border-blue-500/20 hover:border-blue-500/40"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Recent Searches
          </h3>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="w-full text-left p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300 flex items-center justify-between border border-blue-500/20 hover:border-blue-500/40"
              >
                <span>{search}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Features Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-white font-medium mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-blue-400" />
          AI-Powered Features
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Natural language search understanding</li>
          <li>• Automatic genre and mood detection</li>
          <li>• BPM range recognition</li>
          <li>• Use case identification</li>
          <li>• Smart search suggestions</li>
        </ul>
      </div>
    </div>
  );
};

export default AISearchAssistant; 