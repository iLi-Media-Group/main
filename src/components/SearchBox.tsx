import React, { useState } from 'react';
import { Search, Sliders } from 'lucide-react';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

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
  const { genres, subGenres, moods, loading: dataLoading, error: dataError } = useDynamicSearchData();
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

    // Detect genres with variations
    Object.entries(genreVariations).forEach(([genreName, variations]) => {
      const matchedVariation = variations.find(variation => 
        lowerQuery.includes(variation.toLowerCase())
      );
      
      if (matchedVariation) {
        detectedGenres.push(genreName);
        remainingQuery = remainingQuery.replace(new RegExp(matchedVariation, 'gi'), '').trim();
      }
    });

    // Detect subgenres with variations
    subGenres.forEach(subGenre => {
      const subGenreLower = subGenre.name.toLowerCase();
      const displayNameLower = subGenre.display_name.toLowerCase();
      
      // Check for exact match
      if (lowerQuery.includes(subGenreLower) || lowerQuery.includes(displayNameLower)) {
        detectedSubGenres.push(subGenre.name);
        remainingQuery = remainingQuery.replace(new RegExp(subGenreLower, 'gi'), '').trim();
        remainingQuery = remainingQuery.replace(new RegExp(displayNameLower, 'gi'), '').trim();
      }
      
      // Check for common variations
      const subGenreVariations = [
        subGenreLower,
        displayNameLower,
        subGenreLower.replace(/\s+/g, ''),
        subGenreLower.replace(/\s+/g, '-'),
        subGenreLower.replace(/\s+/g, '_'),
        displayNameLower.replace(/\s+/g, ''),
        displayNameLower.replace(/\s+/g, '-'),
        displayNameLower.replace(/\s+/g, '_')
      ];
      
      const matchedVariation = subGenreVariations.find(variation => 
        lowerQuery.includes(variation) && !detectedSubGenres.includes(subGenre.name)
      );
      
      if (matchedVariation) {
        detectedSubGenres.push(subGenre.name);
        remainingQuery = remainingQuery.replace(new RegExp(matchedVariation, 'gi'), '').trim();
      }
    });

    // Detect moods with variations
    Object.entries(moodVariations).forEach(([moodName, variations]) => {
      const matchedVariation = variations.find(variation => 
        lowerQuery.includes(variation.toLowerCase())
      );
      
      if (matchedVariation) {
        detectedMoods.push(moodName);
        remainingQuery = remainingQuery.replace(new RegExp(matchedVariation, 'gi'), '').trim();
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
      'hip-hop energetic',
      'hip hop powerful',
      'electronic peaceful',
      'pop uplifting',
      'jazz romantic',
      'rock dramatic',
      'energetic hiphop',
      'peaceful electronic',
      'uplifting pop',
      'calm classical',
      'upbeat r&b'
    ];
    return `Search by title, genre, mood, or any combination (e.g., "${examples[Math.floor(Math.random() * examples.length)]}")`;
  };

  // Get available subgenres based on selected genres
  const getAvailableSubGenres = () => {
    if (filters.genres.length === 0) return [];
    
    const availableSubGenres: string[] = [];
    filters.genres.forEach(genreName => {
      const genre = genres.find(g => g.name === genreName);
      if (genre && genre.sub_genres) {
        availableSubGenres.push(...genre.sub_genres.map(sg => sg.name));
      }
    });
    return [...new Set(availableSubGenres)]; // Remove duplicates
  };

  const availableSubGenres = getAvailableSubGenres();

  // Show loading state if data is still loading
  if (dataLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading search options...</span>
        </div>
      </div>
    );
  }

  // Show error state if data failed to load
  if (dataError) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-center">Failed to load search options. Please refresh the page.</p>
        </div>
      </div>
    );
  }

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
                  {genres.map((genre) => (
                    <label key={genre.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.genres.includes(genre.name)}
                        onChange={(e) => {
                          const newGenres = e.target.checked
                            ? [...filters.genres, genre.name]
                            : filters.genres.filter(g => g !== genre.name);
                          handleFilterChange('genres', newGenres);
                          // Clear subgenres when genres change
                          handleFilterChange('subGenres', []);
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{genre.display_name}</span>
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
                    availableSubGenres.map((subGenreName) => (
                      <label key={subGenreName} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.subGenres.includes(subGenreName)}
                          onChange={(e) => {
                            const newSubGenres = e.target.checked
                              ? [...filters.subGenres, subGenreName]
                              : filters.subGenres.filter(sg => sg !== subGenreName);
                            handleFilterChange('subGenres', newSubGenres);
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-300">{subGenreName}</span>
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
                  {moods.map((mood) => (
                    <label key={mood.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.moods.includes(mood.name)}
                        onChange={(e) => {
                          const newMoods = e.target.checked
                            ? [...filters.moods, mood.name]
                            : filters.moods.filter(m => m !== mood.name);
                          handleFilterChange('moods', newMoods);
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{mood.display_name}</span>
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
