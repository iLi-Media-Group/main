import React, { useState, useEffect } from 'react';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { X, Music, ChevronDown, ChevronRight } from 'lucide-react';
import { MOODS_CATEGORIES, MOODS, MEDIA_USAGE_CATEGORIES, MEDIA_USAGE_TYPES } from '../types';
import { fetchInstrumentsData, type InstrumentWithCategory } from '../lib/instruments';
import { supabase } from '../lib/supabase';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';
import { uploadFile } from '../lib/storage';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: string;
    title: string;
    genres: string[];
    moods: string[];
    instruments?: string[];
    mediaUsage?: string[];
    has_vocals?: boolean;
    vocals_usage_type?: 'normal' | 'sync_only';
    is_sync_only?: boolean;
    stems_url?: string;
    split_sheet_url?: string;
    mp3_url?: string;
    trackouts_url?: string;
    audio_url?: string;
  };
  onUpdate: () => void;
}

export function EditTrackModal({ isOpen, onClose, track, onUpdate }: EditTrackModalProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedMediaUsage, setSelectedMediaUsage] = useState<string[]>([]);
  const [hasVocals, setHasVocals] = useState(false);
  const [isSyncOnly, setIsSyncOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [instruments, setInstruments] = useState<InstrumentWithCategory[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);

  const { isEnabled: deepMediaSearchEnabled } = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();
  const { mediaTypes } = useDynamicSearchData();
  const [genres, setGenres] = useState<any[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // Add stemsUrl and splitSheetFile to form state
  const [stemsUrl, setStemsUrl] = useState(track.stems_url || '');
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [splitSheetUrl, setSplitSheetUrl] = useState(track.split_sheet_url || '');
  // Add mp3Url and trackoutsUrl state
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [mp3Url, setMp3Url] = useState(track.mp3_url || '');
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [trackoutsUrl, setTrackoutsUrl] = useState(track.trackouts_url || '');
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  
  // Fetch genres and instruments from database - use stable effect to prevent refreshes
  useStableDataFetch(
    async () => {
      try {
        setGenresLoading(true);
        setInstrumentsLoading(true);
        
        // Fetch genres
        const { data: genresData, error: genresError } = await supabase
          .from('genres')
          .select(`
            *,
            sub_genres (*)
          `)
          .order('display_name');

        if (genresError) throw genresError;
        setGenres(genresData || []);
        
        // Fetch instruments
        const instrumentsData = await fetchInstrumentsData();
        setInstruments(instrumentsData.instruments);
      } catch (err) {
        console.error('Error fetching data:', err);
        setGenres([]);
        setInstruments([]);
      } finally {
        setGenresLoading(false);
        setInstrumentsLoading(false);
      }
    },
    [],
    () => true
  );

  // Update state when track prop changes
  useEffect(() => {
    if (track) {
      console.log('EditTrackModal: Received track data:', {
        id: track.id,
        title: track.title,
        genres: track.genres,
        moods: track.moods,
        mediaUsage: track.mediaUsage,
        has_vocals: track.has_vocals,
        is_sync_only: track.is_sync_only,
        stems_url: track.stems_url,
        split_sheet_url: track.split_sheet_url,
        mp3_url: track.mp3_url,
        trackouts_url: track.trackouts_url,
        audio_url: track.audio_url
      });

      setSelectedGenres(Array.isArray(track.genres) ? track.genres : []);
      setSelectedMoods(Array.isArray(track.moods) ? track.moods : []);
      setSelectedInstruments(Array.isArray(track.instruments) ? track.instruments : []);
      setSelectedMediaUsage(Array.isArray(track.mediaUsage) ? track.mediaUsage : []);
      setHasVocals(track.has_vocals || false);
      setIsSyncOnly(track.is_sync_only || false);
      setStemsUrl(track.stems_url || '');
      setSplitSheetUrl(track.split_sheet_url || '');
      setMp3Url(track.mp3_url || '');
      setTrackoutsUrl(track.trackouts_url || '');

      console.log('EditTrackModal: Populated form state:', {
        selectedGenres: Array.isArray(track.genres) ? track.genres : [],
        selectedMoods: Array.isArray(track.moods) ? track.moods : [],
        hasVocals: track.has_vocals || false,
        isSyncOnly: track.is_sync_only || false
      });
    }
  }, [track]);







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

      // Check if any files are being uploaded
      const hasFilesToUpload = mp3File || trackoutsFile || stemsFile || splitSheetFile;
      
      if (hasFilesToUpload) {
        setUploadingFiles(true);
      }

      // --- File upload logic with better error handling ---
      let mp3UploadedUrl = mp3Url;
      if (mp3File) {
        try {
          console.log('Uploading MP3 file:', mp3File.name);
          const uploadedMp3Path = await uploadFile(
            mp3File,
            'track-audio',
            undefined,
            `${track.id}`,
            'audio.mp3'
          );
          mp3UploadedUrl = `${track.id}/audio.mp3`;
          setMp3Url(mp3UploadedUrl);
          console.log('MP3 upload successful:', uploadedMp3Path);
        } catch (uploadError) {
          console.error('MP3 upload failed:', uploadError);
          throw new Error(`Failed to upload MP3 file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let trackoutsUploadedUrl = trackoutsUrl;
      if (trackoutsFile) {
        try {
          console.log('Uploading trackouts file:', trackoutsFile.name);
          const uploadedTrackoutsPath = await uploadFile(
            trackoutsFile,
            'trackouts',
            undefined,
            `${track.id}`,
            'trackouts.zip'
          );
          trackoutsUploadedUrl = `${track.id}/trackouts.zip`;
          setTrackoutsUrl(trackoutsUploadedUrl);
          console.log('Trackouts upload successful:', uploadedTrackoutsPath);
        } catch (uploadError) {
          console.error('Trackouts upload failed:', uploadError);
          throw new Error(`Failed to upload trackouts file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let stemsUploadedUrl = stemsUrl;
      if (stemsUrl && stemsUrl.startsWith('http')) {
        // If user pasted a URL, use as is
        stemsUploadedUrl = stemsUrl;
      } else if (stemsFile) {
        try {
          console.log('Uploading stems file:', stemsFile.name);
          const uploadedStemsPath = await uploadFile(
            stemsFile,
            'stems',
            undefined,
            `${track.id}`,
            'stems.zip'
          );
          stemsUploadedUrl = `${track.id}/stems.zip`;
          setStemsUrl(stemsUploadedUrl);
          console.log('Stems upload successful:', uploadedStemsPath);
        } catch (uploadError) {
          console.error('Stems upload failed:', uploadError);
          throw new Error(`Failed to upload stems file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let splitSheetUploadedUrl = splitSheetUrl;
      if (splitSheetFile) {
        try {
          console.log('Uploading split sheet file:', splitSheetFile.name);
          const uploadedSplitSheetPath = await uploadFile(
            splitSheetFile,
            'split-sheets',
            undefined,
            `${track.id}`,
            'split_sheet.pdf'
          );
          splitSheetUploadedUrl = `${track.id}/split_sheet.pdf`;
          setSplitSheetUrl(splitSheetUploadedUrl);
          console.log('Split sheet upload successful:', uploadedSplitSheetPath);
        } catch (uploadError) {
          console.error('Split sheet upload failed:', uploadError);
          throw new Error(`Failed to upload split sheet file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      // --- End file upload logic ---

      console.log('Updating track with data:', {
        genres: formattedGenres,
        moods: validMoods,
        instruments: selectedInstruments,
        media_usage: selectedMediaUsage,
        has_vocals: hasVocals,
        is_sync_only: isSyncOnly,
        mp3_url: mp3UploadedUrl,
        trackouts_url: trackoutsUploadedUrl,
        stems_url: stemsUploadedUrl,
        split_sheet_url: splitSheetUploadedUrl
      });

      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          genres: formattedGenres,
          moods: validMoods,
          instruments: selectedInstruments,
          media_usage: selectedMediaUsage,
          has_vocals: hasVocals,
          is_sync_only: isSyncOnly,
          mp3_url: mp3UploadedUrl || null,
          trackouts_url: trackoutsUploadedUrl || null,
          stems_url: stemsUploadedUrl || null,
          split_sheet_url: splitSheetUploadedUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', track.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update track in database: ${updateError.message}`);
      }

      console.log('Track updated successfully');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating track:', err);
      setError(err instanceof Error ? err.message : 'Failed to update track. Please try again.');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
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
          {/* Current Track Summary */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-3">Current Track Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Genres: <span className="text-white">{selectedGenres.length > 0 ? selectedGenres.join(', ') : 'None set'}</span></p>
                <p className="text-gray-400">Moods: <span className="text-white">{selectedMoods.length > 0 ? selectedMoods.join(', ') : 'None set'}</span></p>
                <p className="text-gray-400">Instruments: <span className="text-white">{selectedInstruments.length > 0 ? selectedInstruments.join(', ') : 'None set'}</span></p>
                <div className="text-gray-400">
                  Media Usage: 
                  {selectedMediaUsage.length > 0 ? (
                    <div className="mt-1">
                      <span className="text-white text-xs bg-blue-600/20 px-2 py-1 rounded mr-1 mb-1 inline-block">
                        {selectedMediaUsage.length} selected
                      </span>
                      <div className="text-white text-xs mt-1">
                        {selectedMediaUsage.slice(0, 3).join(', ')}
                        {selectedMediaUsage.length > 3 && (
                          <span className="text-gray-400"> +{selectedMediaUsage.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-white">None set</span>
                  )}
                </div>
                <p className="text-gray-400">Vocals: <span className="text-white">{hasVocals ? 'Full Track with Vocals' : 'Instrumental'}</span></p>
                <p className="text-gray-400">Sync Only: <span className="text-white">{isSyncOnly ? 'Yes' : 'No'}</span></p>
              </div>
              <div>
                <p className="text-gray-400">MP3: <span className="text-white">{track.audio_url ? '✓ Available' : '❌ Not uploaded'}</span></p>
                <p className="text-gray-400">Trackouts: <span className="text-white">{track.trackouts_url ? '✓ Available' : '❌ Not uploaded'}</span></p>
                <p className="text-gray-400">Stems: <span className="text-white">{track.stems_url ? '✓ Available' : '❌ Not uploaded'}</span></p>
                <p className="text-gray-400">Split Sheet: <span className="text-white">{track.split_sheet_url ? '✓ Available' : '❌ Not uploaded'}</span></p>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Genres</h2>
            
            {genresLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-400">Loading genres...</p>
              </div>
            ) : genres.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No genres available</p>
                <p className="text-sm text-gray-500">Please contact an administrator to add genres</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Genres (Select at least one)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {genres.map((genre) => (
                      <label
                        key={genre.id}
                        className="flex items-center space-x-2 text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre.display_name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGenres([...selectedGenres, genre.display_name]);
                            } else {
                              setSelectedGenres(selectedGenres.filter((g) => g !== genre.display_name));
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-sm">{genre.display_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Moods Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Moods</h2>
            <p className="text-sm text-gray-400 mb-4">
              Select the moods that best describe this track. This helps clients find music with the right emotional feel.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Moods (Select at least one)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(MOODS_CATEGORIES) as [string, readonly string[]][]).map(([mainMood, subMoods]) => (
                    <label
                      key={mainMood}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMoods.includes(mainMood)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add only the main mood category
                            if (!selectedMoods.includes(mainMood)) {
                              setSelectedMoods([...selectedMoods, mainMood]);
                            }
                          } else {
                            // Remove only the main mood category
                            setSelectedMoods(selectedMoods.filter((m) => m !== mainMood));
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm">{mainMood}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(Object.entries(MOODS_CATEGORIES) as [string, readonly string[]][]).map(([mainMood, subMoods]) => {
                const isMainMoodSelected = selectedMoods.includes(mainMood);
                
                return isMainMoodSelected ? (
                  <div key={mainMood}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {mainMood} Sub-Moods
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subMoods.map((subMood: string) => (
                        <label
                          key={subMood}
                          className="flex items-center space-x-2 text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMoods.includes(subMood)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMoods([...selectedMoods, subMood]);
                              } else {
                                setSelectedMoods(selectedMoods.filter((m) => m !== subMood));
                              }
                            }}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                            disabled={loading}
                          />
                          <span className="text-sm">{subMood}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Instruments Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Instruments</h2>
            <p className="text-sm text-gray-400 mb-4">
              Select the instruments used in this track. This helps clients find music with specific instrumentation.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Instrument Categories (Select at least one)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Group instruments by category
                    const groupedInstruments: Record<string, InstrumentWithCategory[]> = {};
                    instruments.forEach(instrument => {
                      const categoryName = instrument.category_info?.display_name || instrument.category;
                      if (!groupedInstruments[categoryName]) {
                        groupedInstruments[categoryName] = [];
                      }
                      groupedInstruments[categoryName].push(instrument);
                    });

                    return Object.entries(groupedInstruments).map(([categoryName, categoryInstruments]) => (
                      <label
                        key={categoryName}
                        className="flex items-center space-x-2 text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={(selectedInstruments || []).includes(categoryName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add only the main instrument category
                              if (!(selectedInstruments || []).includes(categoryName)) {
                                setSelectedInstruments([...(selectedInstruments || []), categoryName]);
                              }
                            } else {
                              // Remove only the main instrument category
                              setSelectedInstruments((selectedInstruments || []).filter((i) => i !== categoryName));
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-sm">{categoryName}</span>
                      </label>
                    ));
                  })()}
                </div>
              </div>

              {(() => {
                // Group instruments by category
                const groupedInstruments: Record<string, InstrumentWithCategory[]> = {};
                instruments.forEach(instrument => {
                  const categoryName = instrument.category_info?.display_name || instrument.category;
                  if (!groupedInstruments[categoryName]) {
                    groupedInstruments[categoryName] = [];
                  }
                  groupedInstruments[categoryName].push(instrument);
                });

                return Object.entries(groupedInstruments).map(([categoryName, categoryInstruments]) => {
                  const isMainCategorySelected = (selectedInstruments || []).includes(categoryName);
                  
                  return isMainCategorySelected ? (
                    <div key={categoryName}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {categoryName} Instruments
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryInstruments.map((instrument) => (
                          <label
                            key={instrument.id}
                            className="flex items-center space-x-2 text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={(selectedInstruments || []).includes(instrument.display_name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInstruments([...(selectedInstruments || []), instrument.display_name]);
                                } else {
                                  setSelectedInstruments((selectedInstruments || []).filter((i) => i !== instrument.display_name));
                                }
                              }}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                              disabled={loading}
                            />
                            <span className="text-sm">{instrument.display_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null;
                });
              })()}
            </div>
          </div>

          {/* Media Usage Section */}
          {deepMediaSearchEnabled ? (
            <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Media Usage Types (Deep Media Search)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Select which media types this track would be suitable for. This helps clients find your music for specific use cases.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Media Categories (Select at least one)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      // Separate parent and child media types
                      const parentTypes = mediaTypes.filter(mt => mt.is_parent || mt.parent_id === null);
                      const childTypes = mediaTypes.filter(mt => mt.parent_id !== null);
                      
                      // Group parent types by category
                      const parentTypesByCategory = parentTypes.reduce((acc, mediaType) => {
                        if (!acc[mediaType.category]) {
                          acc[mediaType.category] = [];
                        }
                        acc[mediaType.category].push(mediaType);
                        return acc;
                      }, {} as Record<string, typeof parentTypes>);

                      return Object.entries(parentTypesByCategory).map(([category, types]) => 
                        types.map((parentType) => {
                          const childTypesForParent = childTypes.filter(mt => mt.parent_id === parentType.id);
                          
                          return (
                            <label
                              key={parentType.id}
                              className="flex items-center space-x-2 text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMediaUsage.includes(parentType.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Add only the main media type category
                                    if (!selectedMediaUsage.includes(parentType.name)) {
                                      setSelectedMediaUsage([...selectedMediaUsage, parentType.name]);
                                    }
                                  } else {
                                    // Remove only the main media type category
                                    setSelectedMediaUsage(selectedMediaUsage.filter(u => u !== parentType.name));
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={loading}
                              />
                              <span className="text-sm">{parentType.name}</span>
                            </label>
                          );
                        })
                      ).flat();
                    })()}
                  </div>
                </div>

                {(() => {
                  // Separate parent and child media types
                  const parentTypes = mediaTypes.filter(mt => mt.is_parent || mt.parent_id === null);
                  const childTypes = mediaTypes.filter(mt => mt.parent_id !== null);
                  
                  return parentTypes.map((parentType) => {
                    const childTypesForParent = childTypes.filter(mt => mt.parent_id === parentType.id);
                    const isMainTypeSelected = selectedMediaUsage.includes(parentType.name);
                    
                    return isMainTypeSelected ? (
                      <div key={parentType.id}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {parentType.name} Media Types
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {childTypesForParent.map((childType) => (
                            <label
                              key={childType.id}
                              className="flex items-center space-x-2 text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMediaUsage.includes(childType.full_name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMediaUsage([...selectedMediaUsage, childType.full_name]);
                                  } else {
                                    setSelectedMediaUsage(selectedMediaUsage.filter(u => u !== childType.full_name));
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={loading}
                              />
                              <span className="text-sm">{childType.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  });
                })()}
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



          {/* Split Sheet PDF */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Split Sheet PDF {splitSheetUrl && !splitSheetFile && <span className="text-green-400">(Current: ✓)</span>}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setSplitSheetFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={loading || uploadingFiles}
            />
            {splitSheetFile && (
              <p className="text-green-400 text-sm mt-1">✓ {splitSheetFile.name} selected (will replace existing)</p>
            )}
            {splitSheetUrl && !splitSheetFile && (
              <a href={splitSheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-2 block">View Current Split Sheet</a>
            )}
          </div>

          {/* MP3 Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              MP3 File {mp3Url && !mp3File && <span className="text-green-400">(Current: ✓)</span>}
            </label>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg"
              onChange={e => setMp3File(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={loading || uploadingFiles}
            />
            {mp3File && (
              <p className="text-green-400 text-sm mt-1">✓ {mp3File.name} selected (will replace existing)</p>
            )}
            {mp3Url && !mp3File && (
              <a href={mp3Url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-2 block">View Current MP3</a>
            )}
          </div>
          
          {/* Trackouts Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trackouts ZIP {trackoutsUrl && !trackoutsFile && <span className="text-green-400">(Current: ✓)</span>}
            </label>
            <input
              type="file"
              accept="application/zip,application/x-zip-compressed,.zip"
              onChange={e => setTrackoutsFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={loading || uploadingFiles}
            />
            {trackoutsFile && (
              <p className="text-green-400 text-sm mt-1">✓ {trackoutsFile.name} selected (will replace existing)</p>
            )}
            {trackoutsUrl && !trackoutsFile && (
              <a href={trackoutsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-2 block">View Current Trackouts</a>
            )}
          </div>

          {/* Stems Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stems ZIP {stemsUrl && !stemsFile && !stemsUrl.startsWith('http') && <span className="text-green-400">(Current: ✓)</span>}
            </label>
            <input
              type="file"
              accept="application/zip,application/x-zip-compressed,.zip"
              onChange={e => setStemsFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={loading || uploadingFiles}
            />
            {stemsFile && (
              <p className="text-green-400 text-sm mt-1">✓ {stemsFile.name} selected (will replace existing)</p>
            )}
            {stemsUrl && !stemsFile && !stemsUrl.startsWith('http') && (
              <a href={stemsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-2 block">View Current Stems</a>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading || uploadingFiles}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || uploadingFiles}
            >
              {uploadingFiles ? 'Uploading Files...' : loading ? 'Updating...' : 'Update Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
