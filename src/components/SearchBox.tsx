import React, { useState } from 'react';
import { Search, Sliders } from 'lucide-react';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';
import { useServiceLevel } from '../hooks/useServiceLevel';

interface SearchBoxProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  genres: string[];
  subGenres: string[];
  moods: string[];
  instruments: string[];
  mediaTypes: string[];
  minBpm: number;
  maxBpm: number;
}

export function SearchBox({ onSearch }: SearchBoxProps) {
  const { genres, subGenres, moods, instruments, mediaTypes, loading: dataLoading, error: dataError } = useDynamicSearchData();
  const { level, hasAISearch, hasDeepMedia, hasProducerOnboarding, isProLevel, isEnterpriseLevel } = useServiceLevel();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    genres: [],
    subGenres: [],
    moods: [],
    instruments: [],
    mediaTypes: [],
    minBpm: 0,
    maxBpm: 200
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, query: value }));
    
    // Auto-detect genres, moods, and instruments from text input
    const detectedGenres: string[] = [];
    const detectedMoods: string[] = [];
    const detectedInstruments: string[] = [];
    const detectedMediaTypes: string[] = [];
    
    const lowerValue = value.toLowerCase();
    
    // Detect genres
    genres.forEach(genre => {
      if (lowerValue.includes(genre.name.toLowerCase()) || lowerValue.includes(genre.display_name.toLowerCase())) {
        detectedGenres.push(genre.name);
      }
    });
    
    // Detect moods
    moods.forEach(mood => {
      if (lowerValue.includes(mood.name.toLowerCase()) || lowerValue.includes(mood.display_name.toLowerCase())) {
        detectedMoods.push(mood.name);
      }
    });
    
    // Detect instruments
    instruments.forEach(instrument => {
      if (lowerValue.includes(instrument.name.toLowerCase()) || lowerValue.includes(instrument.display_name.toLowerCase())) {
        detectedInstruments.push(instrument.name);
      }
    });
    
    // Detect media types
    mediaTypes.forEach(mediaType => {
      if (lowerValue.includes(mediaType.name.toLowerCase())) {
        detectedMediaTypes.push(mediaType.name);
      }
    });
    
    setFilters(prev => ({
      ...prev,
      query: value,
      genres: detectedGenres,
      moods: detectedMoods,
      instruments: detectedInstruments,
      mediaTypes: detectedMediaTypes
    }));
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      genres: [],
      subGenres: [],
      moods: [],
      instruments: [],
      mediaTypes: [],
      minBpm: 0,
      maxBpm: 200
    });
    onSearch({
      query: '',
      genres: [],
      subGenres: [],
      moods: [],
      instruments: [],
      mediaTypes: [],
      minBpm: 0,
      maxBpm: 200
    });
  };

  // Group media types by category
  const mediaTypesByCategory = mediaTypes.reduce((acc, mediaType) => {
    if (!acc[mediaType.category]) {
      acc[mediaType.category] = [];
    }
    acc[mediaType.category].push(mediaType);
    return acc;
  }, {} as Record<string, typeof mediaTypes>);

  return (
    <div className="glass-card rounded-lg p-6 mb-8">
      {/* Service Level Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">Service Level:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isEnterpriseLevel 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : isProLevel 
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            {isEnterpriseLevel ? 'Enterprise' : isProLevel ? 'Pro' : 'Starter'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {hasAISearch && (
            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
              AI Search
            </span>
          )}
          {hasDeepMedia && (
            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Deep Media
            </span>
          )}
          {hasProducerOnboarding && (
            <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Producer Onboarding
            </span>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={filters.query}
            onChange={handleInputChange}
            placeholder={
              level === 'normal' 
                ? "Search tracks, artists, genres, or moods..."
                : level === 'ai_search'
                ? "Search tracks, artists, genres, moods, sub-genres, or instruments..."
                : level === 'deep_media'
                ? "Search tracks, artists, genres, moods, or media types..."
                : "Search tracks, artists, genres, moods, sub-genres, instruments, or media types..."
            }
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center space-x-2 text-white hover:text-blue-300 transition-colors"
          >
            <Sliders className="w-5 h-5" />
            <span>Advanced Filters</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={dataLoading}
            >
              {dataLoading ? 'Loading...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {isFiltersOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-white/20">
            {/* Genres - Always Available */}
            <div>
              <h3 className="text-white font-semibold mb-3">Genres</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {genres.map(genre => (
                  <label key={genre.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.genres.includes(genre.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('genres', [...filters.genres, genre.name]);
                        } else {
                          handleFilterChange('genres', filters.genres.filter(g => g !== genre.name));
                        }
                      }}
                      className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">{genre.display_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sub Genres - AI Search Only */}
            {hasAISearch && (
              <div>
                <h3 className="text-white font-semibold mb-3">Sub Genres</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {subGenres.map(subGenre => (
                    <label key={subGenre.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.subGenres.includes(subGenre.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('subGenres', [...filters.subGenres, subGenre.name]);
                          } else {
                            handleFilterChange('subGenres', filters.subGenres.filter(sg => sg !== subGenre.name));
                          }
                        }}
                        className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{subGenre.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Moods - Always Available */}
            <div>
              <h3 className="text-white font-semibold mb-3">Moods</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {moods.map(mood => (
                  <label key={mood.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.moods.includes(mood.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('moods', [...filters.moods, mood.name]);
                        } else {
                          handleFilterChange('moods', filters.moods.filter(m => m !== mood.name));
                        }
                      }}
                      className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">{mood.display_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instruments - AI Search Only */}
            {hasAISearch && (
              <div>
                <h3 className="text-white font-semibold mb-3">Instruments</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {instruments.map(instrument => (
                    <label key={instrument.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.instruments.includes(instrument.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('instruments', [...filters.instruments, instrument.name]);
                          } else {
                            handleFilterChange('instruments', filters.instruments.filter(i => i !== instrument.name));
                          }
                        }}
                        className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{instrument.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Media Types - Deep Media Search Only */}
            {hasDeepMedia && (
              <div>
                <h3 className="text-white font-semibold mb-3">Media Types</h3>
                <div className="space-y-4 max-h-40 overflow-y-auto">
                  {Object.entries(mediaTypesByCategory).map(([category, types]) => (
                    <div key={category}>
                      <h4 className="text-white/80 text-xs font-medium mb-2">{category}</h4>
                      <div className="space-y-1">
                        {types.map(mediaType => (
                          <label key={mediaType.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.mediaTypes.includes(mediaType.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFilterChange('mediaTypes', [...filters.mediaTypes, mediaType.name]);
                                } else {
                                  handleFilterChange('mediaTypes', filters.mediaTypes.filter(mt => mt !== mediaType.name));
                                }
                              }}
                              className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-white text-xs">{mediaType.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BPM Range */}
            <div>
              <h3 className="text-white font-semibold mb-3">BPM Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm">Min BPM</label>
                  <input
                    type="number"
                    value={filters.minBpm}
                    onChange={(e) => handleFilterChange('minBpm', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    min="0"
                    max="300"
                  />
                </div>
                <div>
                  <label className="text-white text-sm">Max BPM</label>
                  <input
                    type="number"
                    value={filters.maxBpm}
                    onChange={(e) => handleFilterChange('maxBpm', parseInt(e.target.value) || 200)}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    min="0"
                    max="300"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
