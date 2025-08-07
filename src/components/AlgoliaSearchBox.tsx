import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music } from 'lucide-react';
import { searchTracks, getSearchSuggestions } from '../lib/algolia';
import { Track } from '../types';

interface AlgoliaSearchBoxProps {
  onSearch: (filters: any) => void;
  placeholder?: string;
  className?: string;
}

interface SearchSuggestion {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  moods: string[];
  _highlightResult?: {
    title?: { value: string };
    artist?: { value: string };
  };
}

export function AlgoliaSearchBox({ onSearch, placeholder = "Search tracks...", className = "" }: AlgoliaSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside the search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const suggestions = await getSearchSuggestions(query);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionSelect(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch({ query: query.trim() });
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    // Extract search terms from the suggestion
    const searchTerms = [
      suggestion.title,
      suggestion.artist,
      ...suggestion.genres,
      ...suggestion.moods
    ].filter(Boolean).join(' ');
    
    setQuery(searchTerms);
    onSearch({ query: searchTerms });
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch({ query: '' });
  };

  const highlightText = (text: string, highlight?: { value: string }) => {
    if (!highlight) return text;
    return <span dangerouslySetInnerHTML={{ __html: highlight.value }} />;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-white/10 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : (
            <>
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {highlightText(suggestion.title, suggestion._highlightResult?.title)}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        by {highlightText(suggestion.artist, suggestion._highlightResult?.artist)}
                      </div>
                      {(suggestion.genres.length > 0 || suggestion.moods.length > 0) && (
                        <div className="text-gray-500 text-xs mt-1">
                          {[...suggestion.genres, ...suggestion.moods].slice(0, 3).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Search all results option */}
              <div
                onClick={handleSearch}
                className="p-3 cursor-pointer hover:bg-gray-700 transition-colors border-t border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Search className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="text-green-400 font-medium">
                    Search for "{query}"
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
