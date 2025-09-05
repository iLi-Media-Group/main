import React, { useState, useEffect } from 'react';
import { useSearchAPI, SearchPayload, SearchResult } from '../hooks/useSearchAPI';

interface AISearchAssistantProps {
  onTrackSelect?: (track: SearchResult) => void;
  className?: string;
}

export default function AISearchAssistant({ onTrackSelect, className = '' }: AISearchAssistantProps) {
  const { search, loading, error, lastResults } = useSearchAPI();
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedUsageTypes, setSelectedUsageTypes] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Example search suggestions
  const searchSuggestions = [
    'jazzy energetic guitar for tv commercials',
    'peaceful piano for meditation apps',
      'dramatic orchestral for movie trailers',
    'funky bass for restaurant background',
    'uplifting pop for social media'
  ];

  const handleSearch = async () => {
    if (!query.trim() && selectedGenres.length === 0 && selectedMoods.length === 0 && selectedUsageTypes.length === 0) {
      return;
    }

    const payload: SearchPayload = {
      query: query.trim() || undefined,
      genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      moods: selectedMoods.length > 0 ? selectedMoods : undefined,
      usageTypes: selectedUsageTypes.length > 0 ? selectedUsageTypes : undefined
    };

    try {
      await search(payload);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleTrackClick = (track: SearchResult) => {
    onTrackSelect?.(track);
  };

    return (
    <div className={`ai-search-assistant ${className}`}>
      {/* Search Input */}
      <div className="search-input-container mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Describe the music you're looking for... (e.g., 'jazzy energetic guitar for tv commercials')"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
            <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
            {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

        {/* Search Suggestions */}
        {showSuggestions && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Try these examples:</h4>
            <div className="space-y-2">
              {searchSuggestions.map((suggestion, index) => (
              <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  "{suggestion}"
              </button>
              ))}
                    </div>
                  </div>
        )}
                </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
                  </div>
                )}

                                                  {/* Search Results */}
      {lastResults && (
        <div className="search-results">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Found {lastResults.meta.count} tracks
                     </h3>
            {lastResults.meta.popularSearches.length > 0 && (
              <div className="text-sm text-gray-600">
                Popular: {lastResults.meta.popularSearches[0]?.query}
                               </div>
                             )}
                              </div>
                              
          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastResults.results.map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className="track-card p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={track.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                    alt={track.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{track.title}</h4>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                    <div className="mt-2 space-y-1">
                      {track.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {track.genres.slice(0, 3).map((genre) => (
                            <span key={genre} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {genre}
                                 </span>
                               ))}
                             </div>
                      )}
                      {track.moods.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {track.moods.slice(0, 2).map((mood) => (
                            <span key={mood} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {mood}
                            </span>
                          ))}
                   </div>
                 )}
                  </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Relevance: {track.relevance} • {track.duration} • {track.bpm} BPM
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Searches */}
          {lastResults.meta.popularSearches.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Popular Searches</h4>
              <div className="flex flex-wrap gap-2">
                {lastResults.meta.popularSearches.slice(0, 5).map((item, index) => (
                        <button
                          key={index}
                    onClick={() => setQuery(item.query)}
                    className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50"
                        >
                    {item.query} ({item.hits})
                        </button>
                      ))}
                    </div>
                    </div>
                  )}
                </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}
      </div>
    );
} 
