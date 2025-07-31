// NOTE: Triggering redeploy for deployment troubleshooting.
// NOTE: Last updated to always show clean version question and adjust explicit lyrics logic.
import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Music, Hash, Image, Search, Play, Pause } from 'lucide-react';
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
  isSyncOnly: boolean;
  stemsUrl: string;
  splitSheetUrl: string;
  spotifyUrl: string;
  audioFileName: string;
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
  const [audioFileName, setAudioFileName] = useState(savedData?.audioFileName || '');
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
  // Add state for explicit lyrics
  const [explicitLyrics, setExplicitLyrics] = useState(false);
  // Add state for clean version logic
  const [isCleanVersion, setIsCleanVersion] = useState<null | boolean>(null);
  const [explicitTracks, setExplicitTracks] = useState<any[]>([]);
  const [cleanVersionOf, setCleanVersionOf] = useState<string>('');
  // Add state for autocomplete search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Spotify integration state
  const [spotifyTrack, setSpotifyTrack] = useState<any>(null);
  const [spotifyUrl, setSpotifyUrl] = useState(savedData?.spotifyUrl || '');
  const [spotifyUrlError, setSpotifyUrlError] = useState<string>('');

  // Process saved Spotify URL on load
  useEffect(() => {
    if (savedData?.spotifyUrl) {
      handleSpotifyUrlChange(savedData.spotifyUrl);
    }
  }, []);

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
      mp3Url,
      trackoutsUrl,
      hasVocals,
      isSyncOnly,
      stemsUrl,
      splitSheetUrl,
      spotifyUrl,
      audioFileName
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
    isSyncOnly,
    stemsUrl,
    splitSheetUrl,
    spotifyUrl,
    audioFileName
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
    setAudioFileName(selectedFile.name);
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

  // Handle Spotify URL input
  const handleSpotifyUrlChange = (url: string) => {
    setSpotifyUrl(url);
    setSpotifyUrlError('');
    
    // Extract track ID from Spotify URL if valid
    const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    console.log('[DEBUG] Track ID match:', trackIdMatch);
    if (trackIdMatch) {
      const trackId = trackIdMatch[1];
      console.log('[DEBUG] Extracted track ID:', trackId);
      // Set as manual Spotify data
      const spotifyData = {
        id: trackId,
        external_urls: { spotify: url },
        preview_url: null,
        name: 'Manual Spotify Link',
        artists: [{ name: 'Unknown Artist' }],
        duration_ms: 0
      };
      console.log('[DEBUG] Setting Spotify track data:', spotifyData);
      setSpotifyTrack(spotifyData);
    } else if (url && !url.includes('open.spotify.com')) {
      setSpotifyUrlError('Please enter a valid Spotify track URL');
      setSpotifyTrack(null);
    } else if (url) {
      setSpotifyTrack(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    alert('Submit function called');
    e.preventDefault();
    if (!user || !audioFile) {
      alert('Submit blocked - missing user or audio file');
      return;
    }

    try {
      alert('Starting upload process');
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
      const audioPath = await uploadFile(
        audioFile,
        'track-audio',
        (progress) => { setUploadProgress(progress); },
        `${user.id}/${title}`,
        'audio.mp3'
      );
      console.log('[DEBUG] Uploaded audio file path:', audioPath);
      setUploadedUrl(audioPath); // Store the file path, not URL

      let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      if (imageFile) {
        setUploadStatus('Uploading image file...');
        const imageSignedUrl = await uploadFile(
          imageFile,
          'track-images',
          undefined,
          `${user.id}/${title}`,
          'cover.jpg'
        );
        console.log('[DEBUG] Uploaded image signed URL:', imageSignedUrl);
        imageUrl = imageSignedUrl; // Store the signed URL
      }

      let splitSheetUploadedUrl = splitSheetUrl;
      if (splitSheetFile) {
        setUploadStatus('Uploading split sheet...');
        const splitSheetSignedUrl = await uploadFile(
          splitSheetFile,
          'split-sheets',
          undefined,
          `${user.id}/${title}`,
          'split_sheet.pdf'
        );
        splitSheetUploadedUrl = splitSheetSignedUrl;
        setSplitSheetUrl(splitSheetUploadedUrl);
        console.log('[DEBUG] Uploaded split sheet signed URL:', splitSheetUploadedUrl);
      }

      // --- New logic for trackouts and stems ---
      let trackoutsStoragePath = trackoutsUrl;
      if (trackoutsFile) {
        setUploadStatus('Uploading trackouts file...');
        const trackoutsSignedUrl = await uploadFile(
          trackoutsFile,
          'trackouts',
          undefined,
          `${user.id}/${title}`,
          'trackouts.zip'
        );
        trackoutsStoragePath = trackoutsSignedUrl;
        setTrackoutsUrl(trackoutsStoragePath);
        console.log('[DEBUG] Uploaded trackouts signed URL:', trackoutsStoragePath);
      }
      let stemsStoragePath = stemsUrl;
      if (stemsFile) {
        setUploadStatus('Uploading stems file...');
        const stemsSignedUrl = await uploadFile(
          stemsFile,
          'stems',
          undefined,
          `${user.id}/${title}`,
          'stems.zip'
        );
        stemsStoragePath = stemsSignedUrl;
        setStemsUrl(stemsStoragePath);
        console.log('[DEBUG] Uploaded stems signed URL:', stemsStoragePath);
      }
      // --- End new logic ---

      setUploadStatus('Saving track to database...');
      
      // Prepare Spotify data if available
      let spotifyData = {};
      
      // Always try to extract from spotifyUrl if it exists
      alert('Spotify URL: ' + spotifyUrl);
      if (spotifyUrl && spotifyUrl.trim()) {
        // Try to extract track ID first
        let trackIdMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
        if (trackIdMatch) {
          spotifyData = {
            spotify_track_id: trackIdMatch[1],
            spotify_external_url: spotifyUrl,
            use_spotify_preview: true,
            spotify_search_attempted: true,
            spotify_last_searched: new Date().toISOString()
          };
          alert('Spotify TRACK data prepared: ' + JSON.stringify(spotifyData));
        } else {
          // If no track ID, just save the URL as external_url
          spotifyData = {
            spotify_external_url: spotifyUrl,
            use_spotify_preview: true,
            spotify_search_attempted: true,
            spotify_last_searched: new Date().toISOString()
          };
          alert('Spotify URL data prepared (no track ID): ' + JSON.stringify(spotifyData));
        }
      }
      
      // Insert or update track in DB
      const insertData = {
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
        audio_url: `${user.id}/${title}/audio.mp3`, // Always set to deterministic path
        image_url: imageUrl, // This is now a file path
        mp3_url: mp3Url || null,
        trackouts_url: trackoutsStoragePath || null,
        stems_url: stemsStoragePath || null,
        split_sheet_url: splitSheetUploadedUrl || null,
        has_vocals: hasVocals,
        vocals_usage_type: hasVocals ? 'normal' : null,
        is_sync_only: isSyncOnly,
        explicit_lyrics: isCleanVersion ? false : explicitLyrics,
        clean_version_of: isCleanVersion && cleanVersionOf ? cleanVersionOf : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...spotifyData // Include Spotify data if available
      };
      
      console.log('[DEBUG] Full insert data:', insertData);
      
      const { error: trackError } = await supabase
        .from('tracks')
        .insert(insertData);
      console.log('[DEBUG] Inserted track DB values:', {
        audio_url: `${user.id}/${title}/audio.mp3`,
        image_url: imageUrl,
        trackouts_url: trackoutsStoragePath,
        stems_url: stemsStoragePath,
        split_sheet_url: splitSheetUploadedUrl
      });
      if (trackError) {
        console.error('[DEBUG] Track insertion error:', trackError);
        throw trackError;
      }

      // Get the inserted track ID (if needed for further logic)
      const { data: trackData, error: trackFetchError } = await supabase
        .from('tracks')
        .select('id')
        .eq('track_producer_id', user.id)
        .eq('title', title)
        .eq('audio_url', `${user.id}/${title}/audio.mp3`)
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

  // Fetch user's explicit tracks for clean version dropdown
  useEffect(() => {
    if (user && explicitLyrics && hasVocals && isCleanVersion) {
      supabase
        .from('tracks')
        .select('id, title')
        .eq('track_producer_id', user.id)
        .eq('explicit_lyrics', true)
        .neq('id', uploadedTrackId) // Exclude current track if editing
        .then(({ data }) => setExplicitTracks(data || []));
    }
  }, [user, explicitLyrics, hasVocals, isCleanVersion, uploadedTrackId]);

  // Autocomplete search for explicit tracks
  useEffect(() => {
    if (user && isCleanVersion && searchTerm.length > 1) {
      setSearchLoading(true);
      supabase
        .from('tracks')
        .select('id, title')
        .eq('track_producer_id', user.id)
        .eq('explicit_lyrics', true)
        .ilike('title', `%${searchTerm}%`)
        .then(({ data }) => {
          setSearchResults(data || []);
          setSearchLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  }, [user, isCleanVersion, searchTerm]);

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
                  accept="audio/mp3"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported format: MP3 only (Max 50MB)
                </p>
              </div>

              {/* Show saved audio file name if no file is currently selected */}
              {!audioFile && audioFileName && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-blue-400 font-medium">Saved Audio File</h4>
                    <button
                      type="button"
                      onClick={() => setAudioFileName('')}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-white text-sm">{audioFileName}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Please re-select your audio file to continue
                  </p>
                </div>
              )}

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
                
                {/* Spotify URL Integration */}
                <div className="mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Spotify Track URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={spotifyUrl}
                      onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                      placeholder="https://open.spotify.com/track/..."
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste your Spotify track URL to link it to this upload
                    </p>
                  </div>
                  
                  {spotifyUrlError && (
                    <p className="text-red-400 text-xs mt-2">{spotifyUrlError}</p>
                  )}
                  
                  {spotifyTrack && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-green-400 font-medium">Spotify Link Added</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setSpotifyTrack(null);
                            setSpotifyUrl('');
                          }}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-white text-sm">Spotify track link added successfully</p>
                    </div>
                  )}
                </div>
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
              {/* Clean version logic - always show if hasVocals is true */}
              {hasVocals && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Is this the clean version of an explicit song?
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="radio"
                        checked={isCleanVersion === true}
                        onChange={() => {
                          setIsCleanVersion(true);
                          setExplicitLyrics(false); // Uncheck explicit if clean version
                        }}
                        disabled={isSubmitting}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="radio"
                        checked={isCleanVersion === false}
                        onChange={() => setIsCleanVersion(false)}
                        disabled={isSubmitting}
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {isCleanVersion && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select the explicit track this is the clean version of:
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Type to search tracks..."
                        className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        disabled={isSubmitting}
                      />
                      {searchLoading && <div className="text-blue-400 text-xs mt-1">Searching...</div>}
                      {searchResults.length > 0 && (
                        <ul className="bg-blue-900/90 border border-blue-500/20 rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {searchResults.map(track => (
                            <li
                              key={track.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-700/40 text-white ${cleanVersionOf === track.id ? 'bg-blue-700/60' : ''}`}
                              onClick={() => {
                                setCleanVersionOf(track.id);
                                setSearchTerm(track.title);
                                setSearchResults([]);
                              }}
                            >
                              {track.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Explicit Lyrics Checkbox - only show if hasVocals is true and not a clean version */}
              {hasVocals && (
                <label className="flex items-center space-x-2 text-red-300">
                  <input
                    type="checkbox"
                    checked={explicitLyrics}
                    onChange={(e) => setExplicitLyrics(e.target.checked)}
                    className="rounded border-gray-600 text-red-600 focus:ring-red-500"
                    disabled={isSubmitting || isCleanVersion}
                  />
                  <span>This track contains explicit lyrics</span>
                </label>
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