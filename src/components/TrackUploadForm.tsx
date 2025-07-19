import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Music, Hash, Image } from 'lucide-react';
import { MOODS_CATEGORIES, MUSICAL_KEYS, MEDIA_USAGE_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile, validateAudioFile, validateArchiveFile } from '../lib/storage';
import { AudioPlayer } from './AudioPlayer';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';

const FORM_STORAGE_KEY = 'trackUploadFormData';

interface Genre {
  id: string;
  name: string;
  display_name: string;
}

interface SubGenre {
  id: string;
  genre_id: string;
  name: string;
  display_name: string;
}

interface GenreWithSubGenres extends Genre {
  sub_genres: SubGenre[];
}

interface FormData {
  title: string;
  bpm: string;
  key: string;
  hasStingEnding: boolean;
  isOneStop: boolean;
  selectedGenres: string[];
  selectedSubGenres: string[];
  selectedMoods: string[];
  selectedMediaUsage: string[];
  mp3Url: string;
  trackoutsUrl: string;
  hasVocals: boolean;
  vocalsUsageType: 'normal' | 'sync_only';
  isSyncOnly: boolean;
  stemsUrl: string;
  splitSheetUrl: string;
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [bpm, setBpm] = useState(savedData?.bpm || '');
  const [key, setKey] = useState(savedData?.key || '');
  const [hasStingEnding, setHasStingEnding] = useState(savedData?.hasStingEnding || false);
  const [isOneStop, setIsOneStop] = useState(savedData?.isOneStop || false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(savedData?.selectedGenres || []);
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>(savedData?.selectedSubGenres || []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(savedData?.selectedMoods || []);
  const [selectedMediaUsage, setSelectedMediaUsage] = useState<string[]>(savedData?.selectedMediaUsage || []);
  const [mp3Url, setMp3Url] = useState(savedData?.mp3Url || '');
  const [trackoutsUrl, setTrackoutsUrl] = useState(savedData?.trackoutsUrl || '');
  const [hasVocals, setHasVocals] = useState(savedData?.hasVocals || false); 
  const [vocalsUsageType, setVocalsUsageType] = useState<'normal' | 'sync_only'>(savedData?.vocalsUsageType || 'normal');
  const [isSyncOnly, setIsSyncOnly] = useState(savedData?.isSyncOnly || false);
  const [stemsUrl, setStemsUrl] = useState(savedData?.stemsUrl || '');
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [splitSheetUrl, setSplitSheetUrl] = useState(savedData?.splitSheetUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedTrackId, setUploadedTrackId] = useState<string | null>(null);
  const [successCountdown, setSuccessCountdown] = useState(10);
  const [genres, setGenres] = useState<GenreWithSubGenres[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const { isEnabled: deepMediaSearchEnabled } = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  // Add state for expanded moods
  const [expandedMoods, setExpandedMoods] = useState<string[]>([]);

  // Handle success modal countdown
  useEffect(() => {
    if (showSuccessModal && successCountdown > 0) {
      const timer = setTimeout(() => {
        setSuccessCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && successCountdown === 0) {
      // Auto-dismiss after countdown reaches 0
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessCountdown(10);
        navigate('/producer/dashboard?refresh=true');
      }, 1000);
    }
  }, [showSuccessModal, successCountdown, navigate]);

  // Fetch genres from database
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true);
        const { data, error } = await supabase
          .from('genres')
          .select(`
            *,
            sub_genres (*)
          `)
          .order('display_name');

        if (error) throw error;
        setGenres(data || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
        // Fallback to empty array if database is not set up yet
        setGenres([]);
      } finally {
        setGenresLoading(false);
      }
    };

    fetchGenres();
  }, []);

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
      selectedMediaUsage,
      mp3Url,
      trackoutsUrl,
      hasVocals,
      vocalsUsageType,
      isSyncOnly,
      stemsUrl,
      splitSheetUrl
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
    mp3Url,
    trackoutsUrl,
    hasVocals,
    vocalsUsageType,
    isSyncOnly,
    stemsUrl,
    splitSheetUrl
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !audioFile) return;

    try {
      setIsSubmitting(true);
      setIsUploading(true);
      setError('');
      setUploadProgress(0);
      setUploadStatus('Starting upload...');

      const bpmNumber = parseInt(bpm);
      if (isNaN(bpmNumber) || bpmNumber < 1 || bpmNumber > 999) {
        throw new Error('Please provide a valid BPM value between 1 and 999');
      }

      if (!selectedGenres.length) {
        throw new Error('Please select at least one genre');
      }

      // Validate and format genres - use display names for database storage
      const formattedGenres = selectedGenres
        .map(genreName => {
          const genre = genres.find(g => g.display_name === genreName);
          return genre ? genre.display_name : genreName;
        })
        .filter(Boolean);

      if (formattedGenres.length === 0) {
        throw new Error('At least one valid genre is required');
      }

      setUploadStatus('Uploading audio file...');
      const audioPath = await uploadFile(audioFile, 'track-audio', (progress) => {
        setUploadProgress(progress);
      }, `${user.id}/${title}`);

      setUploadedUrl(audioPath); // Store the file path, not URL

      let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      if (imageFile) {
        setUploadStatus('Uploading image file...');
        const imagePath = await uploadFile(imageFile, 'track-images', undefined, `${user.id}/${title}`);
        imageUrl = imagePath; // Store the file path, not URL
      }

      let splitSheetUploadedUrl = splitSheetUrl;
      if (splitSheetFile) {
        setUploadStatus('Uploading split sheet...');
        const splitSheetPath = await uploadFile(splitSheetFile, 'split-sheets', undefined, `${user.id}/${title}`);
        splitSheetUploadedUrl = splitSheetPath; // Store the file path, not URL
        setSplitSheetUrl(splitSheetUploadedUrl);
      }

      // --- New logic for trackouts and stems ---
      let trackoutsStoragePath = trackoutsUrl;
      if (trackoutsFile) {
        setUploadStatus('Uploading trackouts file...');
        // If editing and old file exists, delete it first (not shown here, but should be handled)
        const trackoutsPath = await uploadFile(trackoutsFile, 'trackouts', undefined, `${user.id}/${title}`);
        trackoutsStoragePath = trackoutsPath; // Store the file path, not URL
        setTrackoutsUrl(trackoutsStoragePath);
      }
      let stemsStoragePath = stemsUrl;
      if (stemsFile) {
        setUploadStatus('Uploading stems file...');
        // If editing and old file exists, delete it first (not shown here, but should be handled)
        const stemsPath = await uploadFile(stemsFile, 'stems', undefined, `${user.id}/${title}`);
        stemsStoragePath = stemsPath; // Store the file path, not URL
        setStemsUrl(stemsStoragePath);
      }
      // --- End new logic ---

      setUploadStatus('Saving track to database...');
      // Insert or update track in DB
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          track_producer_id: user.id,
          title,
          artist: user.email?.split('@')[0] || 'Unknown Artist',
          genres: formattedGenres.join(','),
          sub_genres: selectedSubGenres.join(','),
          moods: selectedMoods,
          media_usage: selectedMediaUsage,
          bpm: bpmNumber,
          key,
          has_sting_ending: hasStingEnding,
          is_one_stop: isOneStop,
          audio_url: audioPath, // This is now a file path
          image_url: imageUrl, // This is now a file path
          mp3_url: mp3Url || null,
          trackouts_url: trackoutsStoragePath || null,
          stems_url: stemsStoragePath || null,
          split_sheet_url: splitSheetUploadedUrl || null,
          has_vocals: hasVocals,
          vocals_usage_type: hasVocals ? vocalsUsageType : null,
          is_sync_only: isSyncOnly,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (trackError) {
        console.error('Track insertion error:', trackError);
        throw trackError;
      }

      // Get the inserted track ID (if needed for further logic)
      const { data: trackData, error: trackFetchError } = await supabase
        .from('tracks')
        .select('id')
        .eq('track_producer_id', user.id)
        .eq('title', title)
        .eq('audio_url', audioPath)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trackFetchError) throw trackFetchError;

      // Set success state
      setUploadedTrackId(trackData?.id || null);
      setSuccessCountdown(10); // Reset countdown
      setShowSuccessModal(true);
      clearSavedFormData();
      
      // Don't navigate immediately - let user see success modal first
      // navigate('/producer/dashboard');
    } catch (err) {
      console.error('=== SUBMISSION ERROR DETAILS ===');
      console.error('Full error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      if (err && typeof err === 'object' && 'code' in err) {
        console.error('Database error code:', err.code);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to save track. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  if (genresLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading genres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-xl p-8 max-w-md w-full mx-4 shadow-lg border border-blue-500/40">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Uploading Track</h3>
              <p className="text-blue-300 mb-6">{uploadStatus}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-800/60 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-400">
                {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}% complete` : 'Preparing upload...'}
              </p>
              
              <p className="text-xs text-gray-500 mt-4">
                Please don't close this page while uploading
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-900/95 to-green-800/95 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-green-400/50 relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-400/10 animate-pulse"></div>
            
            <div className="relative text-center">
              {/* Success icon with animation */}
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">🎉 Upload Successful!</h3>
              <p className="text-green-200 mb-2 text-lg">Your track has been uploaded and saved successfully.</p>
              <p className="text-green-300 mb-6 text-sm">Track: <span className="font-semibold">{title}</span></p>
              
              {/* Countdown timer */}
              <div className="mb-6">
                <p className="text-yellow-300 text-sm mb-2">Auto-redirecting to dashboard in:</p>
                <div className="text-3xl font-bold text-yellow-400">{successCountdown}s</div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccessCountdown(10);
                    navigate('/producer/dashboard?refresh=true');
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🏠 Go to Dashboard Now
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccessCountdown(10);
                    // Reset form for another upload
                    window.location.reload();
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ➕ Upload Another Track
                </button>
              </div>
              
              {/* Progress bar for countdown */}
              <div className="mt-4 w-full bg-green-800/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((10 - successCountdown) / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload New Track</h1>
          <p className="text-gray-400">Share your music with the world</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Audio Upload Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Music className="w-5 h-5 mr-2" />
              Audio File
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Audio File *
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: MP3, WAV, AIFF (Max 50MB)
                </p>
              </div>

                              {audioFile && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Preview</h3>
                    <AudioPlayer src={URL.createObjectURL(audioFile)} title={audioFile.name} />
                  </div>
                )}
            </div>
          </div>

          {/* Track Details Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Track Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter track title"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BPM *
                </label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="120"
                  min="1"
                  max="999"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Musical Key
                </label>
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">Select key</option>
                  {MUSICAL_KEYS.map((musicalKey) => (
                    <option key={musicalKey} value={musicalKey}>
                      {musicalKey}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={hasStingEnding}
                    onChange={(e) => setHasStingEnding(e.target.checked)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span>Has sting ending</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={isOneStop}
                    onChange={(e) => setIsOneStop(e.target.checked)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span>One-stop production</span>
                </label>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Cover Art
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 800x800px, Max 2MB
                </p>
              </div>

              {imagePreview && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Preview</h3>
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Files Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Additional Files</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Trackouts Link
                </label>
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validationError = await validateArchiveFile(file);
                      if (validationError) {
                        alert(validationError);
                        e.target.value = '';
                        return;
                      }
                      setTrackoutsFile(file);
                      setTrackoutsUrl(URL.createObjectURL(file)); // Preview for now
                    } else {
                      setTrackoutsFile(null);
                      setTrackoutsUrl('');
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing trackouts.
                </p>
                {trackoutsFile && (
                  <div className="bg-white/5 rounded-lg p-4 mt-2">
                    <h3 className="text-white font-medium mb-2">Preview</h3>
                    <p className="text-gray-400 text-sm">{trackoutsFile.name}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stems Link
                </label>
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validationError = await validateArchiveFile(file);
                      if (validationError) {
                        alert(validationError);
                        e.target.value = '';
                        return;
                      }
                      setStemsFile(file);
                      setStemsUrl(URL.createObjectURL(file)); // Preview for now
                    } else {
                      setStemsFile(null);
                      setStemsUrl('');
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing stems.
                </p>
                {stemsFile && (
                  <div className="bg-white/5 rounded-lg p-4 mt-2">
                    <h3 className="text-white font-medium mb-2">Preview</h3>
                    <p className="text-gray-400 text-sm">{stemsFile.name}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Split Sheet PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSplitSheetFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Vocals Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Vocals</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={hasVocals}
                  onChange={(e) => setHasVocals(e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span>Track contains vocals</span>
              </label>

              {hasVocals && (
                <div>
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

              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={isSyncOnly}
                  onChange={(e) => setIsSyncOnly(e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span>Sync Only - Track is only available for submitted Sync Proposals</span>
              </label>
            </div>
          </div>

          {/* Genres Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Genres</h2>
            
            {genres.length === 0 ? (
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
                              // Remove sub-genres for this genre when unchecking
                              setSelectedSubGenres(selectedSubGenres.filter(sg => {
                                const subGenre = genre.sub_genres.find(s => s.display_name === sg);
                                return !subGenre;
                              }));
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">{genre.display_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedGenres.map((genreName) => {
                  const genre = genres.find(g => g.display_name === genreName);
                  const subGenres = genre?.sub_genres || [];
                  
                  return subGenres.length > 0 ? (
                    <div key={genreName}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {genreName} Sub-Genres
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subGenres.map((subGenre) => (
                          <label
                            key={subGenre.id}
                            className="flex items-center space-x-2 text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubGenres.includes(subGenre.display_name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubGenres([...selectedSubGenres, subGenre.display_name]);
                                } else {
                                  setSelectedSubGenres(
                                    selectedSubGenres.filter((sg) => sg !== subGenre.display_name)
                                  );
                                }
                              }}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                              disabled={isSubmitting}
                            />
                            <span className="text-sm">{subGenre.display_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Moods Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Moods</h2>
            <div className="space-y-2">
              {(Object.entries(MOODS_CATEGORIES) as [string, readonly string[]][]).map(([mainMood, subMoods]) => (
                <div key={mainMood} className="border-b border-blue-700 pb-2 mb-2">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center text-left text-white font-medium py-2 focus:outline-none"
                    onClick={() => setExpandedMoods(expandedMoods.includes(mainMood)
                      ? expandedMoods.filter(m => m !== mainMood)
                      : [...expandedMoods, mainMood])}
                  >
                    <span>{mainMood}</span>
                    <span>{expandedMoods.includes(mainMood) ? '▲' : '▼'}</span>
                  </button>
                  {expandedMoods.includes(mainMood) && (
                    <div className="pl-4 pt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subMoods.map((subMood: string) => (
                        <label key={subMood} className="flex items-center space-x-2 text-gray-300">
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
                            disabled={isSubmitting}
                          />
                          <span className="text-sm">{subMood}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(MEDIA_USAGE_CATEGORIES).map(([category, subcategories]) => (
                  <div key={category} className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">{category}</h3>
                    <div className="space-y-3">
                      {Object.entries(subcategories).map(([subcategory, types]) => (
                        <div key={subcategory} className="ml-4">
                          <h4 className="text-blue-300 font-medium mb-2 text-sm">{subcategory}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {types.map((type: string) => {
                              const fullType = `${category} > ${subcategory} > ${type}`;
                              return (
                                <label key={fullType} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedMediaUsage.includes(fullType)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMediaUsage([...selectedMediaUsage, fullType]);
                                      } else {
                                        setSelectedMediaUsage(selectedMediaUsage.filter(u => u !== fullType));
                                      }
                                    }}
                                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  />
                                  <span className="text-gray-300 text-sm">{type}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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

          <div className="pt-8 relative z-10">
            <button
              type="submit"
              className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl border-2 border-green-400/30 hover:border-green-300/50"
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