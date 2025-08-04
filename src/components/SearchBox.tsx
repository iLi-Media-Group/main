import React, { useState } from 'react';
import { Search, Sliders } from 'lucide-react';
import { GENRES, SUB_GENRES, MOODS } from '../types';

interface SearchBoxProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  genres: string[];
  subGenres: string[];
  moods: string[];
  minBpm: number;
  maxBpm: number;
}

export function SearchBox({ onSearch }: SearchBoxProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    genres: [],
    subGenres: [],
    moods: [],
    minBpm: 0,
    maxBpm: 300,
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse the query text to automatically detect genres, subgenres, and moods
    const parsedFilters = parseQueryText(filters.query);
    
    // Combine manual selections with parsed text
    const combinedFilters = {
      ...filters,
      query: parsedFilters.query,
      genres: [...new Set([...filters.genres, ...parsedFilters.genres])],
      subGenres: [...new Set([...filters.subGenres, ...parsedFilters.subGenres])],
      moods: [...new Set([...filters.moods, ...parsedFilters.moods])]
    };
    
    onSearch(combinedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Parse the query text to automatically detect genres, subgenres, and moods
      const parsedFilters = parseQueryText(filters.query);
      
      // Combine manual selections with parsed text
      const combinedFilters = {
        ...filters,
        query: parsedFilters.query,
        genres: [...new Set([...filters.genres, ...parsedFilters.genres])],
        subGenres: [...new Set([...filters.subGenres, ...parsedFilters.subGenres])],
        moods: [...new Set([...filters.moods, ...parsedFilters.moods])]
      };
      
      onSearch(combinedFilters);
    }
  };

  // Function to parse query text and detect genres, subgenres, and moods
  const parseQueryText = (queryText: string) => {
    const lowerQuery = queryText.toLowerCase();
    const detectedGenres: string[] = [];
    const detectedSubGenres: string[] = [];
    const detectedMoods: string[] = [];
    let remainingQuery = queryText;

    // Detect genres
    GENRES.forEach(genre => {
      const genreLower = genre.toLowerCase();
      if (lowerQuery.includes(genreLower)) {
        detectedGenres.push(genre);
        // Remove the detected genre from the remaining query
        remainingQuery = remainingQuery.replace(new RegExp(genreLower, 'gi'), '').trim();
      }
    });

    // Detect subgenres
    Object.entries(SUB_GENRES).forEach(([genreKey, subGenres]) => {
      subGenres.forEach(subGenre => {
        const subGenreLower = subGenre.toLowerCase();
        if (lowerQuery.includes(subGenreLower)) {
          detectedSubGenres.push(subGenre);
          // Remove the detected subgenre from the remaining query
          remainingQuery = remainingQuery.replace(new RegExp(subGenreLower, 'gi'), '').trim();
        }
      });
    });

    // Detect moods
    MOODS.forEach(mood => {
      const moodLower = mood.toLowerCase();
      if (lowerQuery.includes(moodLower)) {
        detectedMoods.push(mood);
        // Remove the detected mood from the remaining query
        remainingQuery = remainingQuery.replace(new RegExp(moodLower, 'gi'), '').trim();
      }
    });

    return {
      query: remainingQuery, // The remaining text after removing detected terms
      genres: detectedGenres,
      subGenres: detectedSubGenres,
      moods: detectedMoods
    };
  };

  const getPlaceholderText = () => {
    const examples = [
      'hiphop energetic',
      'electronic peaceful',
      'pop uplifting',
      'jazz romantic',
      'rock powerful',
      'energetic hiphop',
      'peaceful electronic',
      'uplifting pop'
    ];
    return `Search by title, genre, mood, or any combination (e.g., "${examples[Math.floor(Math.random() * examples.length)]}")`;
  };

  // Get available subgenres based on selected genres
  const getAvailableSubGenres = () => {
    if (filters.genres.length === 0) return [];
    
    const availableSubGenres: string[] = [];
    filters.genres.forEach(genre => {
      const genreKey = genre.toLowerCase();
      if (SUB_GENRES[genreKey as keyof typeof SUB_GENRES]) {
        availableSubGenres.push(...SUB_GENRES[genreKey as keyof typeof SUB_GENRES]);
      }
    });
    return [...new Set(availableSubGenres)]; // Remove duplicates
  };

  const availableSubGenres = getAvailableSubGenres();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={getPlaceholderText()}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-4 pr-12 py-3 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="p-3 bg-white/5 border border-blue-500/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle filters"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {isFiltersOpen && (
          <div className="glass-card p-6 rounded-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genres (Primary Filter)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {GENRES.map((genre) => (
                    <label key={genre} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.genres.includes(genre)}
                        onChange={(e) => {
                          const newGenres = e.target.checked
                            ? [...filters.genres, genre]
                            : filters.genres.filter(g => g !== genre);
                          handleFilterChange('genres', newGenres);
                          // Clear subgenres when genres change
                          handleFilterChange('subGenres', []);
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subgenres
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {availableSubGenres.length > 0 ? (
                    availableSubGenres.map((subGenre) => (
                      <label key={subGenre} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.subGenres.includes(subGenre)}
                          onChange={(e) => {
                            const newSubGenres = e.target.checked
                              ? [...filters.subGenres, subGenre]
                              : filters.subGenres.filter(sg => sg !== subGenre);
                            handleFilterChange('subGenres', newSubGenres);
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-300">{subGenre}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Select genres first to see subgenres</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Moods
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {MOODS.map((mood) => (
                    <label key={mood} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.moods.includes(mood)}
                        onChange={(e) => {
                          const newMoods = e.target.checked
                            ? [...filters.moods, mood]
                            : filters.moods.filter(m => m !== mood);
                          handleFilterChange('moods', newMoods);
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{mood}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tempo Range (BPM)
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Min BPM</label>
                    <input
                      type="number"
                      min="0"
                      max={filters.maxBpm}
                      value={filters.minBpm}
                      onChange={(e) => handleFilterChange('minBpm', parseInt(e.target.value))}
                      className="mt-1 block w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Max BPM</label>
                    <input
                      type="number"
                      min={filters.minBpm}
                      max="300"
                      value={filters.maxBpm}
                      onChange={(e) => handleFilterChange('maxBpm', parseInt(e.target.value))}
                      className="mt-1 block w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
