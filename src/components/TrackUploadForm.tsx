import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Music, Hash, Image, FileText } from 'lucide-react';
import { GENRES, SUB_GENRES, MOODS_CATEGORIES, MUSICAL_KEYS } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile, validateAudioFile } from '../lib/storage';
import { AudioPlayer } from './AudioPlayer';

const FORM_STORAGE_KEY = 'trackUploadFormData';

interface FormData {
  title: string;
  bpm: string;
  key: string;
  hasStingEnding: boolean;
  isOneStop: boolean;
  selectedGenres: string[];
  selectedSubGenres: string[];
  selectedMoods: string[];
  selectedMediaTypes: string[];
  mp3Url: string;
  trackoutsUrl: string;
  stems_url: string;
  hasVocals: boolean;
  vocalsUsageType: 'normal' | 'sync_only';
  isSyncOnly: boolean;
}

export function TrackUploadForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const loadSavedFormData = (): FormData | null => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  const savedData = loadSavedFormData();

  const [title, setTitle] = useState(savedData?.title || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [splitSheetPreview, setSplitSheetPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [bpm, setBpm] = useState(savedData?.bpm || '');
  const [key, setKey] = useState(savedData?.key || '');
  const [hasStingEnding, setHasStingEnding] = useState(savedData?.hasStingEnding || false);
  const [isOneStop, setIsOneStop] = useState(savedData?.isOneStop || false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(savedData?.selectedGenres || []);
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>(savedData?.selectedSubGenres || []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(savedData?.selectedMoods || []);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(savedData?.selectedMediaTypes || []);
  const [mp3Url, setMp3Url] = useState(savedData?.mp3Url || '');
  const [trackoutsUrl, setTrackoutsUrl] = useState(savedData?.trackoutsUrl || '');
  const [stemsUrl, setStemsUrl] = useState(savedData?.stems_url || '');
  const [hasVocals, setHasVocals] = useState(savedData?.hasVocals || false);
  const [vocalsUsageType, setVocalsUsageType] = useState<'normal' | 'sync_only'>(savedData?.vocalsUsageType || 'normal');
  const [isSyncOnly, setIsSyncOnly] = useState(savedData?.isSyncOnly || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const formData: FormData = {
      title,
      bpm,
      key,
      hasStingEnding,
      isOneStop,
      selectedGenres,
      selectedSubGenres,
      selectedMoods,
      selectedMediaTypes,
      mp3Url,
      trackoutsUrl,
      stems_url: stemsUrl,
      hasVocals,
      vocalsUsageType,
      isSyncOnly
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [
    title,
    bpm,
    key,
    hasStingEnding,
    isOneStop,
    selectedGenres,
    selectedSubGenres,
    selectedMoods,
    selectedMediaTypes,
    mp3Url,
    trackoutsUrl,
    stemsUrl,
    hasVocals,
    vocalsUsageType,
    isSyncOnly
  ]);

  const clearSavedFormData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    const validationError = await validateAudioFile(selectedFile);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setAudioFile(selectedFile);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSplitSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file for the split sheet');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
      setError('Split sheet PDF size must be less than 10MB');
      return;
    }

    setSplitSheetFile(file);
    setSplitSheetPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !audioFile) return;

    try {
      setIsSubmitting(true);
      setError('');

      const bpmNumber = parseInt(bpm);
      if (isNaN(bpmNumber) || bpmNumber < 1 || bpmNumber > 999) {
        throw new Error('Please provide a valid BPM value between 1 and 999');
      }

      if (!selectedGenres.length) {
        throw new Error('Please select at least one genre');
      }

      // Validate and format genres
      const formattedGenres = selectedGenres
        .map(genre => genre.toLowerCase().trim())
        .filter(genre => GENRES.map(g => g.toLowerCase()).includes(genre));

      if (formattedGenres.length === 0) {
        throw new Error('At least one valid genre from the provided list is required');
      }

      const audioUrl = await uploadFile(audioFile, 'track-audio', (progress) => {
        setUploadProgress(progress);
      });

      setUploadedUrl(audioUrl);

      let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'track-images');
      }

      let splitSheetUrl = null;
      if (splitSheetFile) {
        splitSheetUrl = await uploadFile(splitSheetFile, 'split-sheets');
      }

      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          producer_id: user.id,
          title,
          artist: user.email?.split('@')[0] || 'Unknown Artist',
          genres: formattedGenres,
          sub_genres: selectedSubGenres,
          moods: selectedMoods,
          bpm: bpmNumber,
          key,
          has_sting_ending: hasStingEnding,
          is_one_stop: isOneStop,
          audio_url: audioUrl,
          image_url: imageUrl,
          split_sheet_url: splitSheetUrl,
          mp3_url: mp3Url || null,
          trackouts_url: trackoutsUrl || null,
          stems_url: stemsUrl || null,
          has_vocals: hasVocals,
          vocals_usage_type: hasVocals ? (isSyncOnly ? 'sync_only' : vocalsUsageType) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (trackError) throw trackError;

      // Get the inserted track ID
      const { data: trackData, error: trackFetchError } = await supabase
        .from('tracks')
        .select('id')
        .eq('producer_id', user.id)
        .eq('title', title)
        .eq('audio_url', audioUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trackFetchError) throw trackFetchError;

      // Save media types if any are selected
      if (selectedMediaTypes.length > 0 && trackData?.id) {
        // Get media type IDs
        const { data: mediaTypesData, error: mediaTypesError } = await supabase
          .from('media_types')
          .select('id, name')
          .in('name', selectedMediaTypes);

        if (mediaTypesError) throw mediaTypesError;

        if (mediaTypesData && mediaTypesData.length > 0) {
          // Insert track media type associations
          const mediaTypeAssociations = mediaTypesData.map(mt => ({
            track_id: trackData.id,
            media_type_id: mt.id
          }));

          const { error: mediaAssocError } = await supabase
            .from('track_media_types')
            .insert(mediaTypeAssociations);

          if (mediaAssocError) throw mediaAssocError;
        }
      }

      clearSavedFormData();
      navigate('/producer/dashboard');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save track. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Add New Track</h2>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Track Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer file:transition-colors"
                disabled={isSubmitting}
                required
              />
              {audioFile && (
                <p className="mt-2 text-sm text-gray-400">
                  Selected file: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {uploadedUrl && (
                <div className="mt-4">
                  <AudioPlayer src={uploadedUrl} title={audioFile?.name || 'Track Preview'} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Track Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/10">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Track preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">
                          Click to upload image
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          Max size: 2MB
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
                BPM (Required)
              </label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="bpm"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  min="1"
                  max="999"
                  className="block w-full pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-300 mb-2">
                Musical Key (Optional)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="block w-full pl-10"
                  disabled={isSubmitting}
                >
                  <option value="">Select Key</option>
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                MP3 Only Link
              </label>
              <input
                type="url"
                value={mp3Url}
                onChange={(e) => setMp3Url(e.target.value)}
                className="block w-full"
                placeholder="https://boombox.io/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Trackouts
              </label>
              <input
                type="url"
                value={trackoutsUrl}
                onChange={(e) => setTrackoutsUrl(e.target.value)}
                className="block w-full"
                placeholder="https://boombox.io/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stems (Optional)
            </label>
            <input
              type="url"
              value={stemsUrl}
              onChange={(e) => setStemsUrl(e.target.value)}
              className="block w-full"
              placeholder="https://your-stems-link.com/..."
            />
          </div>

          <div className="text-center">
            <a
              href="https://app.boombox.io/referral/rn1oVpnyzXBar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Get A Boombox.io Account Here
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={hasStingEnding}
                  onChange={(e) => setHasStingEnding(e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Has Sting Ending</span>
              </label>

              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={isOneStop}
                  onChange={(e) => setIsOneStop(e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span>One Stop Production</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={isSyncOnly}
                onChange={(e) => setIsSyncOnly(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span>Sync Only</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={hasVocals}
                onChange={(e) => setHasVocals(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span>Full Track With Vocals</span>
            </div>

            {hasVocals && (
              <div className="pl-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vocals Usage Type
                </label>
                <select
                  value={vocalsUsageType}
                  onChange={(e) => setVocalsUsageType(e.target.value as 'normal' | 'sync_only')}
                  className="block w-full"
                  disabled={isSubmitting}
                >
                  <option value="normal">Allow use in normal memberships</option>
                  <option value="sync_only">Only allow for sync briefs</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genres (Select primary genre)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GENRES.map((genre) => (
                <label
                  key={genre}
                  className="flex items-center space-x-2 text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                      }
                    }}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span>{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedGenres.map((genre) => {
            // Add safety check for SUB_GENRES[genre]
            const subGenres = SUB_GENRES[genre as keyof typeof SUB_GENRES] || [];
            
            return subGenres.length > 0 ? (
              <div key={genre}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {genre} Sub-Genres
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {subGenres.map((subGenre) => (
                    <label
                      key={subGenre}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubGenres.includes(subGenre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubGenres([...selectedSubGenres, subGenre]);
                          } else {
                            setSelectedSubGenres(
                              selectedSubGenres.filter((sg) => sg !== subGenre)
                            );
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>{subGenre}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null;
          })}

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
                      <label
                        key={mood}
                        className="flex items-center space-x-2 text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMoods.includes(mood)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMoods([...selectedMoods, mood]);
                            } else {
                              setSelectedMoods(
                                selectedMoods.filter((m) => m !== mood)
                              );
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                        <span>{mood}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Types Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Recommended Media Types (Optional)
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Select the media types where this track would work well. This helps clients find the perfect music for their projects.
            </p>
            <div className="space-y-6">
              {/* Video Media */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Video Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['TV Shows', 'Films', 'Commercials', 'Documentaries', 'Music Videos', 'YouTube', 'TikTok', 'Instagram', 'Social Media'].map((mediaType) => (
                    <label
                      key={mediaType}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMediaTypes.includes(mediaType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMediaTypes([...selectedMediaTypes, mediaType]);
                          } else {
                            setSelectedMediaTypes(
                              selectedMediaTypes.filter((mt) => mt !== mediaType)
                            );
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>{mediaType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audio Media */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Audio Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Podcasts', 'Radio', 'Audiobooks', 'Voice-overs', 'Background Music'].map((mediaType) => (
                    <label
                      key={mediaType}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMediaTypes.includes(mediaType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMediaTypes([...selectedMediaTypes, mediaType]);
                          } else {
                            setSelectedMediaTypes(
                              selectedMediaTypes.filter((mt) => mt !== mediaType)
                            );
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>{mediaType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Digital Media */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Digital Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Video Games', 'Apps', 'Websites', 'Presentations'].map((mediaType) => (
                    <label
                      key={mediaType}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMediaTypes.includes(mediaType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMediaTypes([...selectedMediaTypes, mediaType]);
                          } else {
                            setSelectedMediaTypes(
                              selectedMediaTypes.filter((mt) => mt !== mediaType)
                            );
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>{mediaType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Media */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Other Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Live Events', 'Corporate', 'Educational', 'Sports', 'News'].map((mediaType) => (
                    <label
                      key={mediaType}
                      className="flex items-center space-x-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMediaTypes.includes(mediaType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMediaTypes([...selectedMediaTypes, mediaType]);
                          } else {
                            setSelectedMediaTypes(
                              selectedMediaTypes.filter((mt) => mt !== mediaType)
                            );
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>{mediaType}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Split Sheet Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Split Sheet (Optional)
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Upload a PDF showing all contributors and their percentages. This helps clients understand the complete production team.
            </p>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/10 border border-blue-500/20">
                {splitSheetPreview ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-400" />
                    <span className="text-xs text-gray-400 mt-2">PDF Ready</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-400">
                        Click to upload split sheet
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        PDF only, max 10MB
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleSplitSheetChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
            {splitSheetFile && (
              <p className="mt-2 text-sm text-gray-400">
                Selected file: {splitSheetFile.name} ({(splitSheetFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="sticky bottom-8 pt-8 bg-gradient-to-b from-transparent via-white-900 to-gray-900">
            <button
              type="submit"
              className="w-full py-3 px-6 bg-indigo-900 hover:bg-green-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-10"
              disabled={isSubmitting || !audioFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Saving...'}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Save Track</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
