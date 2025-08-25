import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Clock, Lightbulb, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useServiceLevel } from '../hooks/useServiceLevel';
import { logSearchQuery } from '../lib/searchLogger';

interface SearchInsight {
  query: string;
  count: number;
  lastSearched?: string;
}

interface AISearchBrainProps {
  onSearchApply: (query: string) => void;
  className?: string;
}

export default function AISearchBrain({ onSearchApply, className = '' }: AISearchBrainProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'recent' | 'suggested'>('popular');
  const [popularSearches, setPopularSearches] = useState<SearchInsight[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchInsight[]>([]);
  const [suggestedSearches, setSuggestedSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUnifiedAuth();
  const { hasAISearch, level } = useServiceLevel();

  // Check if user has access to AI Search Brain
  const hasAccess = hasAISearch || level === 'both';

  // Fetch popular searches (aggregated across all users)
  const fetchPopularSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('search_queries')
        .select('query, created_at')
        .not('query', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group by query and count occurrences
      const queryCounts: { [key: string]: number } = {};
      data?.forEach(item => {
        if (item.query) {
          queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
        }
      });

      const popular = Object.entries(queryCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setPopularSearches(popular);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  // Fetch recent searches for current user
  const fetchRecentSearches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_queries')
        .select('query, created_at')
        .eq('user_id', user.id)
        .not('query', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const recent = data?.map(item => ({
        query: item.query,
        count: 1,
        lastSearched: item.created_at
      })) || [];

      setRecentSearches(recent);
    } catch (error) {
      console.error('Error fetching recent searches:', error);
    }
  };

  // Generate suggested searches based on user's recent activity and license history
  const generateSuggestedSearches = async () => {
    if (!user) return;

    try {
      // Get search history
      const { data: searchData, error: searchError } = await supabase
        .from('search_queries')
        .select('query')
        .eq('user_id', user.id)
        .not('query', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchError) throw searchError;

      // Get license history - use sales table instead of licenses
      const { data: licenseData, error: licenseError } = await supabase
        .from('sales')
        .select(`
          track_id,
          track:tracks (
            id,
            title,
            genres,
            sub_genres,
            moods,
            instruments,
            media_usage
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (licenseError) throw licenseError;

      // Extract common terms from user's search history
      const searchTerms = searchData?.map(item => item.query.toLowerCase()) || [];
      const termFrequency: { [key: string]: number } = {};

      searchTerms.forEach(query => {
        const terms = query.split(/\s+/);
        terms.forEach(term => {
          if (term.length > 2) {
            termFrequency[term] = (termFrequency[term] || 0) + 1;
          }
        });
      });

      // Extract patterns from licensed tracks
      const licensedTrackPatterns: { [key: string]: number } = {};
      licenseData?.forEach(license => {
        const track = license.tracks;
        if (track) {
          // Analyze genres
          if (track.genres) {
            const genres = Array.isArray(track.genres) ? track.genres : [track.genres];
            genres.forEach(genre => {
              if (genre) {
                licensedTrackPatterns[genre.toLowerCase()] = (licensedTrackPatterns[genre.toLowerCase()] || 0) + 1;
              }
            });
          }
          
          // Analyze moods
          if (track.moods) {
            const moods = Array.isArray(track.moods) ? track.moods : [track.moods];
            moods.forEach(mood => {
              if (mood) {
                licensedTrackPatterns[mood.toLowerCase()] = (licensedTrackPatterns[mood.toLowerCase()] || 0) + 1;
              }
            });
          }
          
          // Analyze instruments
          if (track.instruments) {
            const instruments = Array.isArray(track.instruments) ? track.instruments : [track.instruments];
            instruments.forEach(instrument => {
              if (instrument) {
                licensedTrackPatterns[instrument.toLowerCase()] = (licensedTrackPatterns[instrument.toLowerCase()] || 0) + 1;
              }
            });
          }
        }
      });

      // Generate suggestions based on frequent terms and license patterns
      const suggestions: string[] = [];
      const frequentTerms = Object.entries(termFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);

      const frequentLicensedPatterns = Object.entries(licensedTrackPatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern]) => pattern);

      // Create combination suggestions from search history
      if (frequentTerms.length >= 2) {
        suggestions.push(`${frequentTerms[0]} ${frequentTerms[1]}`);
      }
      if (frequentTerms.length >= 3) {
        suggestions.push(`${frequentTerms[0]} ${frequentTerms[2]}`);
      }

      // Create suggestions based on license patterns
      if (frequentLicensedPatterns.length >= 2) {
        suggestions.push(`${frequentLicensedPatterns[0]} ${frequentLicensedPatterns[1]}`);
      }
      if (frequentLicensedPatterns.length >= 3) {
        suggestions.push(`${frequentLicensedPatterns[0]} ${frequentLicensedPatterns[2]}`);
      }

      // Mix search and license patterns
      if (frequentTerms.length > 0 && frequentLicensedPatterns.length > 0) {
        suggestions.push(`${frequentTerms[0]} ${frequentLicensedPatterns[0]}`);
      }

      // Add genre-based fallback suggestions
      const genreSuggestions = [
        'jazzy energetic guitar',
        'peaceful piano meditation',
        'dramatic orchestral trailer',
        'funky bass restaurant',
        'uplifting pop social media'
      ];

      suggestions.push(...genreSuggestions.slice(0, 3));
      setSuggestedSearches(suggestions.slice(0, 8));
    } catch (error) {
      console.error('Error generating suggested searches:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        fetchPopularSearches(),
        fetchRecentSearches(),
        generateSuggestedSearches()
      ]).finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  const handleSearchClick = async (query: string) => {
    // Log the search query to the database
    await logSearchQuery({ query });
    
    // Refresh the data to include the new search
    await Promise.all([
      fetchPopularSearches(),
      fetchRecentSearches(),
      generateSuggestedSearches()
    ]);
    
    onSearchApply(query);
    setIsOpen(false);
  };

  // Don't render if user doesn't have access
  if (!hasAccess) {
    return null;
  }

  return (
    <div className={`ai-search-brain ${className}`}>
      {/* AI Brain Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        title="AI Search Brain - Get search insights and suggestions"
      >
        <Brain className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-purple-500/20 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-500/20">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">AI Search Brain</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(80vh-120px)]">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 sm:mb-6 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Popular</span>
                  <span className="sm:hidden">Pop</span>
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'recent'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Recent</span>
                  <span className="sm:hidden">Rec</span>
                </button>
                <button
                  onClick={() => setActiveTab('suggested')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'suggested'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Suggested</span>
                  <span className="sm:hidden">Sug</span>
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )}

              {/* Tab Content */}
              {!loading && (
                <div className="space-y-4">
                  {activeTab === 'popular' && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Popular Searches</h3>
                      <div className="space-y-2">
                        {popularSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchClick(search.query)}
                            className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Search className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                                <span className="text-white group-hover:text-purple-300">
                                  {search.query}
                                </span>
                              </div>
                              <span className="text-sm text-gray-400">
                                {search.count} searches
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'recent' && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Searches</h3>
                      {recentSearches.length > 0 ? (
                        <div className="space-y-2">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchClick(search.query)}
                              className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Search className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                                  <span className="text-white group-hover:text-purple-300">
                                    {search.query}
                                  </span>
                                </div>
                                {search.lastSearched && (
                                  <span className="text-sm text-gray-400">
                                    {new Date(search.lastSearched).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-8">
                          No recent searches yet. Start searching to see your history here!
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'suggested' && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Suggested Searches</h3>
                      <div className="space-y-2">
                        {suggestedSearches.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchClick(suggestion)}
                            className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <Lightbulb className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300" />
                              <span className="text-white group-hover:text-yellow-300">
                                {suggestion}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
