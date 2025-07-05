import React, { useState, useEffect } from 'react';
import { X, Music, ChevronDown, ChevronRight } from 'lucide-react';
import { GENRES, MOODS_CATEGORIES, MOODS, MEDIA_USAGE_CATEGORIES, MEDIA_USAGE_TYPES } from '../types';
import { supabase } from '../lib/supabase';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';

interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: string;
    title: string;
    genres: string[];
    moods: string[];
    mediaUsage?: string[];
    hasVocals?: boolean;
    vocalsUsageType?: 'normal' | 'sync_only';
  };
  onUpdate: () => void;
}

export function EditTrackModal({ isOpen, onClose, track, onUpdate }: EditTrackModalProps) {
  const normalizeGenre = (genre: string) => genre.toLowerCase().replace(/\s+/g, '');

  const initialGenres = (track.genres || []).filter(genre =>
    GENRES.some(g => normalizeGenre(g) === normalizeGenre(genre))
  ).map(genre => {
    return GENRES.find(g => normalizeGenre(g) === normalizeGenre(genre)) || genre;
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(track.moods || []);
  const [selectedMediaUsage, setSelectedMediaUsage] = useState<string[]>(track.mediaUsage || []);
  const [hasVocals, setHasVocals] = useState(track.hasVocals || false);
  const [isSyncOnly, setIsSyncOnly] = useState(track.vocalsUsageType === 'sync_only');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMediaCategories, setExpandedMediaCategories] = useState<Set<string>>(new Set());
  const { isEnabled: deepMediaSearchEnabled } = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();

  // Expand categories that have selected items
  useEffect(() => {
    const categoriesToExpand = new Set<string>();
    selectedMediaUsage.forEach(usage => {
      const [category] = usage.split(' > ');
      categoriesToExpand.add(category);
    });
    setExpandedMediaCategories(categoriesToExpand);
  }, [selectedMediaUsage]);

  const toggleMediaCategory = (category: string) => {
    const newExpanded = new Set(expandedMediaCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedMediaCategories(newExpanded);
  };

  const handleMediaUsageChange = (usageType: string, checked: boolean) => {
    if (checked) {
      setSelectedMediaUsage([...selectedMediaUsage, usageType]);
    } else {
      setSelectedMediaUsage(selectedMediaUsage.filter(u => u !== usageType));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (selectedGenres.length === 0) {
        throw new Error('At least one genre is required');
      }

      const formattedGenres = selectedGenres;
      const validMoods = selectedMoods.filter(mood => MOODS.includes(mood));

      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          genres: formattedGenres,
          moods: validMoods,
          media_usage: selectedMediaUsage,
          has_vocals: hasVocals,
          vocals_usage_type: isSyncOnly ? 'sync_only' : 'normal',
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating track:', err);
      setError(err instanceof Error ? err.message : 'Failed to update track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-8 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Music className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">Edit Track: {track.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Current Values Display */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Current Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Current Genres:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(initialGenres || []).map(genre => (
                    <span key={genre} className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Current Moods:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(track.moods || []).map(mood => (
                    <span key={mood} className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Genres
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GENRES.map((genre) => (
                <label key={genre} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedGenres.some(g => normalizeGenre(g) === normalizeGenre(genre))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(selectedGenres.filter(g => normalizeGenre(g) !== normalizeGenre(genre)));
                      }
                    }}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-300">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Moods
            </label>
            <div className="space-y-6">
              {Object.entries(MOODS_CATEGORIES).map(([category, moods]) => (
                <div key={category} className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {moods.map((mood) => (
                      <label key={mood} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedMoods.includes(mood)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMoods([...selectedMoods, mood]);
                            } else {
                              setSelectedMoods(selectedMoods.filter(m => m !== mood));
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-gray-300">{mood}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Usage - Show feature or premium notice */}
          {deepMediaSearchEnabled ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Media Usage Types (Deep Media Search)
              </label>
              <div className="space-y-4">
                {Object.entries(MEDIA_USAGE_CATEGORIES).map(([category, subcategories]) => (
                  <div key={category} className="bg-white/5 rounded-lg p-4">
                    <button
                      type="button"
                      onClick={() => toggleMediaCategory(category)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-white font-medium">{category}</h3>
                      {expandedMediaCategories.has(category) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedMediaCategories.has(category) && (
                      <div className="mt-4 space-y-4">
                        {Object.entries(subcategories).map(([subcategory, types]) => (
                          <div key={subcategory} className="ml-4">
                            <h4 className="text-blue-300 font-medium mb-2">{subcategory}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {types.map((type: string) => {
                                const fullType = `${category} > ${subcategory} > ${type}`;
                                return (
                                  <label key={fullType} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedMediaUsage.includes(fullType)}
                                      onChange={(e) => handleMediaUsageChange(fullType, e.target.checked)}
                                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                      disabled={loading}
                                    />
                                    <span className="text-gray-300 text-sm">{type}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <PremiumFeatureNotice
              featureName="Deep Media Search"
              description="Tag your tracks with specific media usage types like TV shows, commercials, podcasts, and more. This helps clients find the perfect music for their specific use cases."
              currentPlan={currentPlan}
            />
          )}

          {/* Has Vocals */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasVocals}
                onChange={(e) => setHasVocals(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <label className="text-gray-300">Full Track With Vocals</label>
            </div>

            {/* Sync Only */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSyncOnly}
                onChange={(e) => setIsSyncOnly(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <label className="text-gray-300">Sync Only (Only allow for sync briefs)</label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
