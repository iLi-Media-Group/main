// NOTE: Triggering redeploy for deployment troubleshooting.
// NOTE: Last updated to always show clean version question and adjust explicit lyrics logic.
import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Music, Hash, Image, Search, Play, Pause, ChevronDown, ChevronRight } from 'lucide-react';
import { MOODS_CATEGORIES, MUSICAL_KEYS } from '../types';
import { fetchInstrumentsData, type InstrumentWithCategory } from '../lib/instruments';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile, validateAudioFile, validateArchiveFile } from '../lib/storage';
import { AudioPlayer } from './AudioPlayer';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { FilePersistenceManager } from '../utils/filePersistence';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';


const FORM_STORAGE_KEY = 'trackUploadFormData';
const FORM_KEY = 'trackUpload';

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
  selectedInstruments: string[];
  selectedMediaUsage: string[];
  mp3Url: string;
  trackoutsUrl: string;
  hasVocals: boolean;
  isSyncOnly: boolean;
  stemsUrl: string;
  splitSheetUrl: string;
  audioFileName: string;
  explicitLyrics: boolean;
  isCleanVersion: boolean | null;
  cleanVersionOf: string;
}

export function TrackUploadForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize form persistence
  const {
    formData,
    updateFormData,
    clearSavedData,
    resetForm: resetFormData
  } = useFormPersistence({
    title: '',
    bpm: '',
    key: '',
    hasStingEnding: false,
    isOneStop: false,
    selectedGenres: [] as string[],
    selectedSubGenres: [] as string[],
    selectedMoods: [] as string[],
    selectedInstruments: [] as string[],
    selectedMediaUsage: [] as string[],
    mp3Url: '',
    trackoutsUrl: '',
    hasVocals: false,
    isSyncOnly: false,
    stemsUrl: '',
    splitSheetUrl: '',
    audioFileName: '',
    explicitLyrics: false,
    isCleanVersion: null as boolean | null,
    cleanVersionOf: ''
  }, {
    storageKey: FORM_STORAGE_KEY,
    excludeFields: ['audioFile', 'imageFile', 'trackoutsFile', 'stemsFile', 'splitSheetFile', 'imagePreview']
  });

  // File states (not persisted in localStorage)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);

  // Other states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedTrackId, setUploadedTrackId] = useState<string | null>(null);
  const [successCountdown, setSuccessCountdown] = useState(10);
  const [genres, setGenres] = useState<GenreWithSubGenres[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [instruments, setInstruments] = useState<InstrumentWithCategory[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);
  const { isEnabled: deepMediaSearchEnabled } = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();
  const { mediaTypes } = useDynamicSearchData();
  const [explicitTracks, setExplicitTracks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // State for tracking expanded categories
  const [expandedMoodCategories, setExpandedMoodCategories] = useState<Set<string>>(new Set());
  const [expandedInstrumentCategories, setExpandedInstrumentCategories] = useState<Set<string>>(new Set());
  const [expandedMediaCategories, setExpandedMediaCategories] = useState<Set<string>>(new Set());

  // Toggle functions for expanding/collapsing categories
  const toggleMoodCategory = (category: string) => {
    const newExpanded = new Set(expandedMoodCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedMoodCategories(newExpanded);
  };

  const toggleInstrumentCategory = (category: string) => {
    const newExpanded = new Set(expandedInstrumentCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedInstrumentCategories(newExpanded);
  };

  const toggleMediaCategory = (category: string) => {
    const newExpanded = new Set(expandedMediaCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedMediaCategories(newExpanded);
  };

  // Load saved files on mount
  useEffect(() => {
    const loadSavedFiles = () => {
      // Load audio file
      const savedAudioFile = FilePersistenceManager.restoreFile(FORM_KEY, 'audioFile');
      if (savedAudioFile) {
        setAudioFile(savedAudioFile);
      }

      // Load image file
      const savedImageFile = FilePersistenceManager.restoreFile(FORM_KEY, 'imageFile');
      if (savedImageFile) {
        setImageFile(savedImageFile);
        setImagePreview(URL.createObjectURL(savedImageFile));
      }

      // Load other files
      const savedTrackoutsFile = FilePersistenceManager.restoreFile(FORM_KEY, 'trackoutsFile');
      if (savedTrackoutsFile) {
        setTrackoutsFile(savedTrackoutsFile);
      }

      const savedStemsFile = FilePersistenceManager.restoreFile(FORM_KEY, 'stemsFile');
      if (savedStemsFile) {
        setStemsFile(savedStemsFile);
      }

      const savedSplitSheetFile = FilePersistenceManager.restoreFile(FORM_KEY, 'splitSheetFile');
      if (savedSplitSheetFile) {
        setSplitSheetFile(savedSplitSheetFile);
      }
    };

    loadSavedFiles();
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
          navigate('/producer/dashboard');
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

  // Fetch instruments from database
  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setInstrumentsLoading(true);
        const instrumentsData = await fetchInstrumentsData();
        setInstruments(instrumentsData.instruments);
      } catch (err) {
        console.error('Error fetching instruments:', err);
        // Fallback to empty array if database is not set up yet
        setInstruments([]);
      } finally {
        setInstrumentsLoading(false);
      }
    };

    fetchInstruments();
  }, []);

  const resetForm = () => {
    resetFormData();
    setAudioFile(null);
    setImageFile(null);
    setImagePreview(null);
    setTrackoutsFile(null);
    setStemsFile(null);
    setSplitSheetFile(null);
    setUploadProgress(0);
    setUploadedUrl(null);
    setError('');
    
    // Clear saved files
    FilePersistenceManager.clearAllFiles(FORM_KEY);
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
    updateFormData({ audioFileName: selectedFile.name });
    
    // Save file to persistence
    FilePersistenceManager.saveFileMetadata(selectedFile, FORM_KEY, 'audioFile');
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
    
    // Save file to persistence
    FilePersistenceManager.saveFileMetadata(file, FORM_KEY, 'imageFile');
  };

  // Handle Spotify URL input


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !audioFile) {
      return;
    }

    // Debug authentication status
    console.log('[DEBUG] User authentication check:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      userAppMetadata: user.app_metadata,
      userUserMetadata: user.user_metadata
    });

    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[DEBUG] Current session:', {
      session: session ? {
        access_token: session.access_token ? 'EXISTS' : 'MISSING',
        refresh_token: session.refresh_token ? 'EXISTS' : 'MISSING',
        user_id: session.user?.id
      } : 'NO_SESSION',
      sessionError
    });

    // Test if user can access their own profile (this should work if RLS is working)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, account_type')
      .eq('id', user.id)
      .single();
    
    console.log('[DEBUG] Profile access test:', {
      profileData,
      profileError,
      canAccessProfile: !profileError
    });

    try {
      setIsSubmitting(true);
      setIsUploading(true);
      setError('');
      setUploadProgress(0);

      const bpmNumber = parseInt(formData.bpm);
      if (isNaN(bpmNumber) || bpmNumber < 1 || bpmNumber > 999) {
        throw new Error('Please provide a valid BPM value between 1 and 999');
      }

      if (!formData.selectedGenres.length) {
        throw new Error('Please select at least one genre');
      }

      // Validate and format genres - use display names for database storage
      const formattedGenres = formData.selectedGenres
        .map(genreName => {
          const genre = genres.find(g => g.display_name === genreName);
          return genre ? genre.display_name : genreName;
        })
        .filter(Boolean);

      if (formattedGenres.length === 0) {
        throw new Error('At least one valid genre is required');
      }

      const audioPath = await uploadFile(
        audioFile,
        'track-audio',
        (progress) => { setUploadProgress(progress); },
        `${user.id}/${formData.title}`,
        'audio.mp3'
      );
      console.log('[DEBUG] Uploaded audio file path:', audioPath);
      setUploadedUrl(audioPath); // Store the file path, not URL

      let imageUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      if (imageFile) {
        const imageSignedUrl = await uploadFile(
          imageFile,
          'track-images',
          undefined,
          `${user.id}/${formData.title}`,
          'cover.jpg'
        );
        console.log('[DEBUG] Uploaded image signed URL:', imageSignedUrl);
        imageUrl = imageSignedUrl; // Store the signed URL
      }

      let splitSheetUploadedUrl = formData.splitSheetUrl;
      if (splitSheetFile) {
        const splitSheetSignedUrl = await uploadFile(
          splitSheetFile,
          'split-sheets',
          undefined,
          `${user.id}/${formData.title}`,
          'split_sheet.pdf'
        );
        splitSheetUploadedUrl = splitSheetSignedUrl;
        updateFormData({ splitSheetUrl: splitSheetUploadedUrl });
        console.log('[DEBUG] Uploaded split sheet signed URL:', splitSheetUploadedUrl);
      }

      // --- New logic for trackouts and stems ---
      let trackoutsStoragePath = formData.trackoutsUrl;
      if (trackoutsFile) {
        const trackoutsSignedUrl = await uploadFile(
          trackoutsFile,
          'trackouts',
          undefined,
          `${user.id}/${formData.title}`,
          'trackouts.zip'
        );
        trackoutsStoragePath = trackoutsSignedUrl;
        updateFormData({ trackoutsUrl: trackoutsStoragePath });
        console.log('[DEBUG] Uploaded trackouts signed URL:', trackoutsStoragePath);
      }
      let stemsStoragePath = formData.stemsUrl;
      if (stemsFile) {
        console.log('[DEBUG] Uploading stems file:', stemsFile.name, stemsFile.size);
        const stemsSignedUrl = await uploadFile(
          stemsFile,
          'stems',
          undefined,
          `${user.id}/${formData.title}`,
          'stems.zip'
        );
        stemsStoragePath = stemsSignedUrl;
        updateFormData({ stemsUrl: stemsStoragePath });
        console.log('[DEBUG] Uploaded stems signed URL:', stemsStoragePath);
      } else {
        console.log('[DEBUG] No stems file to upload, using existing stemsUrl:', formData.stemsUrl);
      }
      // --- End new logic ---

      // Prepare Spotify data if available

      // Insert or update track in DB
      const insertData = {
        track_producer_id: user.id,
        title: formData.title,
        artist: user.email?.split('@')[0] || 'Unknown Artist',
        genres: formattedGenres.join(','),
        sub_genres: formData.selectedSubGenres.join(','),
        moods: formData.selectedMoods,
        instruments: formData.selectedInstruments,
        bpm: bpmNumber,
        key: formData.key,
        has_sting_ending: formData.hasStingEnding,
        is_one_stop: formData.isOneStop,
        audio_url: `${user.id}/${formData.title}/audio.mp3`, // Always set to deterministic path
        image_url: imageUrl, // This is now a file path
        mp3_url: formData.mp3Url || null,
        trackouts_url: trackoutsStoragePath || null,
        stems_url: stemsStoragePath || null,
        split_sheet_url: splitSheetUploadedUrl || null,
        has_vocals: formData.hasVocals,
        is_sync_only: formData.isSyncOnly,
        explicit_lyrics: formData.isCleanVersion ? false : formData.explicitLyrics,
        clean_version_of: formData.isCleanVersion && formData.cleanVersionOf ? formData.cleanVersionOf : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[DEBUG] Full insert data:', insertData);
      
      // Debug instruments specifically
      console.log('[DEBUG] Instruments data:', {
        selectedInstruments: formData.selectedInstruments,
        instrumentsLength: formData.selectedInstruments?.length || 0,
        instrumentsType: typeof formData.selectedInstruments,
        instrumentsIsArray: Array.isArray(formData.selectedInstruments)
      });
      
      // Log the exact data being sent to help debug the 400 error
      console.log('[DEBUG] Inserting track with data:', JSON.stringify(insertData, null, 2));
      
      // Debug stems_url specifically
      console.log('[DEBUG] Stems URL details:', {
        stemsFile: stemsFile ? `${stemsFile.name} (${stemsFile.size} bytes)` : 'null',
        formDataStemsUrl: formData.stemsUrl,
        stemsStoragePath: stemsStoragePath,
        finalStemsUrl: insertData.stems_url
      });
      
      console.log('🎵 Inserting track with data:', JSON.stringify(insertData, null, 2));
      const { data: insertResult, error: trackError } = await supabase
        .from('tracks')
        .insert(insertData);
      
      console.log('✅ Track insertion result:', { insertResult, trackError });
      
      // Log detailed error information
      if (trackError) {
        console.error('[DEBUG] Track insertion error details:', {
          message: trackError.message,
          details: trackError.details,
          hint: trackError.hint,
          code: trackError.code
        });
        
        // Check if it's an RLS policy issue
        if (trackError.message?.includes('policy') || trackError.message?.includes('row level security')) {
          console.error('[DEBUG] RLS policy error detected');
        }
        
        // Check if it's an instruments-related error
        if (trackError.message?.includes('instruments') || trackError.details?.includes('instruments')) {
          console.error('[DEBUG] Instruments-related error detected');
          console.error('[DEBUG] Instruments data that caused error:', formData.selectedInstruments);
        }
      }
      
      console.log('[DEBUG] Inserted track DB values:', {
        audio_url: `${user.id}/${formData.title}/audio.mp3`,
        image_url: imageUrl,
        trackouts_url: trackoutsStoragePath,
        stems_url: stemsStoragePath,
        split_sheet_url: splitSheetUploadedUrl
      });
      if (trackError) {
        console.error('[DEBUG] Track insertion error:', trackError);
        console.error('[DEBUG] Error details:', {
          message: trackError.message,
          details: trackError.details,
          hint: trackError.hint,
          code: trackError.code
        });
        
        // Additional debugging for instruments-related errors
        if (trackError.message?.includes('instruments') || trackError.details?.includes('instruments')) {
          console.error('[DEBUG] Instruments-related error detected');
          console.error('[DEBUG] Instruments data that caused error:', formData.selectedInstruments);
        }
        
        throw trackError;
      }

      // Get the inserted track ID (if needed for further logic)
      const { data: trackData, error: trackFetchError } = await supabase
        .from('tracks')
        .select('id')
        .eq('track_producer_id', user.id)
        .eq('title', formData.title)
        .eq('audio_url', `${user.id}/${formData.title}/audio.mp3`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trackFetchError) throw trackFetchError;

      // Insert media types into track_media_types table if any are selected
      if (formData.selectedMediaUsage.length > 0 && trackData?.id) {
        // Get media type IDs for the selected media types using full_name
        const selectedMediaTypeIds = mediaTypes
          .filter(mt => formData.selectedMediaUsage.includes(mt.full_name))
          .map(mt => mt.id);

        if (selectedMediaTypeIds.length > 0) {
          const trackMediaTypesData = selectedMediaTypeIds.map(mediaTypeId => ({
            track_id: trackData.id,
            media_type_id: mediaTypeId
          }));

          const { error: mediaTypesError } = await supabase
            .from('track_media_types')
            .insert(trackMediaTypesData);

          if (mediaTypesError) {
            console.error('[DEBUG] Media types insertion error:', mediaTypesError);
            // Don't throw error here as the track was already created successfully
          }
        }
      }

      // Set success state
      setUploadedTrackId(trackData?.id || null);
      setSuccessCountdown(10); // Reset countdown
      setShowSuccessModal(true);
      clearSavedData();
      resetForm(); // Reset form to empty state
      
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
    }
  };

  // Fetch user's explicit tracks for clean version dropdown
  useEffect(() => {
    if (user && formData.explicitLyrics && formData.hasVocals && formData.isCleanVersion) {
      supabase
        .from('tracks')
        .select('id, title')
        .eq('track_producer_id', user.id)
        .eq('explicit_lyrics', true)
        .neq('id', uploadedTrackId) // Exclude current track if editing
        .then(({ data }) => setExplicitTracks(data || []));
    }
  }, [user, formData.explicitLyrics, formData.hasVocals, formData.isCleanVersion, uploadedTrackId]);

  // Autocomplete search for explicit tracks
  useEffect(() => {
    if (user && formData.isCleanVersion && searchTerm.length > 1) {
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
  }, [user, formData.isCleanVersion, searchTerm]);

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
              <p className="text-green-300 mb-6 text-sm">Track: <span className="font-semibold">{formData.title}</span></p>
              
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
                    navigate('/producer/dashboard');
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
                    resetForm();
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
          <p className="text-gray-400">Share your music with the world</p>
          
          {/* Persistence notification */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <p className="text-blue-300 text-sm">
                  💾 Your form data is automatically saved. You can navigate away and return without losing your progress.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Track Details Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Track Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title *
                </label>
                <input
                  id="track-title"
                  name="track-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
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
                  id="track-bpm"
                  name="track-bpm"
                  type="number"
                  value={formData.bpm}
                  onChange={(e) => updateFormData({ bpm: e.target.value })}
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
                  id="track-key"
                  name="track-key"
                  value={formData.key}
                  onChange={(e) => updateFormData({ key: e.target.value })}
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
                    id="track-has-sting-ending"
                    name="track-has-sting-ending"
                    type="checkbox"
                    checked={formData.hasStingEnding}
                    onChange={(e) => updateFormData({ hasStingEnding: e.target.checked })}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span>Has sting ending</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    id="track-is-one-stop"
                    name="track-is-one-stop"
                    type="checkbox"
                    checked={formData.isOneStop}
                    onChange={(e) => updateFormData({ isOneStop: e.target.checked })}
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
                  id="track-cover-image"
                  name="track-cover-image"
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
                  id="track-audio-file"
                  name="track-audio-file"
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
              {!audioFile && formData.audioFileName && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-blue-400 font-medium">Saved Audio File</h4>
                    <button
                      type="button"
                      onClick={() => updateFormData({ audioFileName: '' })}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-white text-sm">{formData.audioFileName}</p>
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

          {/* Additional Files Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Additional Files</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Trackouts Link
                </label>
                <input
                  id="track-trackouts-file"
                  name="track-trackouts-file"
                  type="file"
                  accept=".zip,.rar"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validationError = await validateArchiveFile(file);
                      if (validationError) {
                        setError(validationError);
                        e.target.value = '';
                        return;
                      }
                      setTrackoutsFile(file);
                      updateFormData({ trackoutsUrl: URL.createObjectURL(file) }); // Preview for now
                      FilePersistenceManager.saveFileMetadata(file, FORM_KEY, 'trackoutsFile');
                    } else {
                      setTrackoutsFile(null);
                      updateFormData({ trackoutsUrl: '' });
                      FilePersistenceManager.clearFile(FORM_KEY, 'trackoutsFile');
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing trackouts. (Max 500MB)
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
                  id="track-stems-file"
                  name="track-stems-file"
                  type="file"
                  accept=".zip,.rar"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validationError = await validateArchiveFile(file);
                      if (validationError) {
                        setError(validationError);
                        e.target.value = '';
                        return;
                      }
                      setStemsFile(file);
                      updateFormData({ stemsUrl: URL.createObjectURL(file) }); // Preview for now
                      FilePersistenceManager.saveFileMetadata(file, FORM_KEY, 'stemsFile');
                    } else {
                      setStemsFile(null);
                      updateFormData({ stemsUrl: '' });
                      FilePersistenceManager.clearFile(FORM_KEY, 'stemsFile');
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP or RAR file containing stems. (Max 500MB)
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
                  id="track-split-sheet-file"
                  name="track-split-sheet-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSplitSheetFile(file);
                    if (file) {
                      FilePersistenceManager.saveFileMetadata(file, FORM_KEY, 'splitSheetFile');
                    } else {
                      FilePersistenceManager.clearFile(FORM_KEY, 'splitSheetFile');
                    }
                  }}
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
                  checked={formData.hasVocals}
                  onChange={(e) => updateFormData({ hasVocals: e.target.checked })}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span>Track contains vocals</span>
              </label>
              {/* Clean version logic - always show if hasVocals is true */}
              {formData.hasVocals && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Is this the clean version of an explicit song?
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="radio"
                        checked={formData.isCleanVersion === true}
                        onChange={() => {
                          updateFormData({ 
                            isCleanVersion: true,
                            explicitLyrics: false // Uncheck explicit if clean version
                          });
                        }}
                        disabled={isSubmitting}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="radio"
                        checked={formData.isCleanVersion === false}
                        onChange={() => updateFormData({ isCleanVersion: false })}
                        disabled={isSubmitting}
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {formData.isCleanVersion && (
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
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-700/40 text-white ${formData.cleanVersionOf === track.id ? 'bg-blue-700/60' : ''}`}
                              onClick={() => {
                                updateFormData({ cleanVersionOf: track.id });
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
                {formData.hasVocals && (
                              <label className="flex items-center space-x-2 text-red-300">
                <input
                  type="checkbox"
                  checked={formData.explicitLyrics}
                  onChange={(e) => updateFormData({ explicitLyrics: e.target.checked })}
                  className="rounded border-gray-600 text-red-600 focus:ring-red-500"
                  disabled={isSubmitting || !!formData.isCleanVersion}
                />
                <span>This track contains explicit lyrics</span>
              </label>
              )}


              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isSyncOnly}
                  onChange={(e) => updateFormData({ isSyncOnly: e.target.checked })}
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
                          checked={formData.selectedGenres.includes(genre.display_name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData({ 
                                selectedGenres: [...formData.selectedGenres, genre.display_name] 
                              });
                            } else {
                              const newSelectedGenres = formData.selectedGenres.filter((g) => g !== genre.display_name);
                              updateFormData({ selectedGenres: newSelectedGenres });
                              // Remove sub-genres for this genre when unchecking
                              const newSelectedSubGenres = formData.selectedSubGenres.filter(sg => {
                                const subGenre = genre.sub_genres.find(s => s.display_name === sg);
                                return !subGenre;
                              });
                              updateFormData({ selectedSubGenres: newSelectedSubGenres });
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

                {formData.selectedGenres.map((genreName: string) => {
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
                              checked={formData.selectedSubGenres.includes(subGenre.display_name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateFormData({ 
                                    selectedSubGenres: [...formData.selectedSubGenres, subGenre.display_name] 
                                  });
                                } else {
                                  updateFormData({
                                    selectedSubGenres: formData.selectedSubGenres.filter((sg) => sg !== subGenre.display_name)
                                  });
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
            
            <div className="space-y-4">
              {(Object.entries(MOODS_CATEGORIES) as [string, readonly string[]][]).map(([mainMood, subMoods]) => (
                <div key={mainMood} className="bg-white/5 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={() => toggleMoodCategory(mainMood)}
                    className="flex items-center justify-between w-full text-left mb-2"
                  >
                    <label className="flex items-center space-x-2 text-white font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subMoods.some(subMood => formData.selectedMoods.includes(subMood))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add all sub-moods for this category
                            const newMoods = [...formData.selectedMoods];
                            subMoods.forEach(subMood => {
                              if (!newMoods.includes(subMood)) {
                                newMoods.push(subMood);
                              }
                            });
                            updateFormData({ selectedMoods: newMoods });
                          } else {
                            // Remove all sub-moods for this category
                            const newMoods = formData.selectedMoods.filter(mood => !subMoods.includes(mood));
                            updateFormData({ selectedMoods: newMoods });
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{mainMood}</span>
                    </label>
                    {expandedMoodCategories.has(mainMood) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedMoodCategories.has(mainMood) && (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subMoods.map((subMood: string) => (
                          <label
                            key={subMood}
                            className="flex items-center space-x-2 text-gray-300 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedMoods.includes(subMood)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateFormData({ 
                                    selectedMoods: [...formData.selectedMoods, subMood] 
                                  });
                                } else {
                                  updateFormData({
                                    selectedMoods: formData.selectedMoods.filter((m) => m !== subMood)
                                  });
                                }
                              }}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              disabled={isSubmitting}
                            />
                            <span className="text-sm">{subMood}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instruments Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Instruments</h2>
            <p className="text-sm text-gray-400 mb-4">
              Select the instruments used in this track. This helps clients find music with specific instrumentation.
            </p>
            
            <div className="space-y-4">
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
                  <div key={categoryName} className="bg-white/5 rounded-lg p-4">
                    <button
                      type="button"
                      onClick={() => toggleInstrumentCategory(categoryName)}
                      className="flex items-center justify-between w-full text-left mb-2"
                    >
                      <label className="flex items-center space-x-2 text-white font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryInstruments.some(instrument => (formData.selectedInstruments || []).includes(instrument.display_name))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add all instruments for this category
                              const newInstruments = [...(formData.selectedInstruments || [])];
                              categoryInstruments.forEach(instrument => {
                                if (!newInstruments.includes(instrument.display_name)) {
                                  newInstruments.push(instrument.display_name);
                                }
                              });
                              updateFormData({ selectedInstruments: newInstruments });
                            } else {
                              // Remove all instruments for this category
                              const newInstruments = (formData.selectedInstruments || []).filter(instrumentName => 
                                !categoryInstruments.some(instrument => instrument.display_name === instrumentName)
                              );
                              updateFormData({ selectedInstruments: newInstruments });
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={isSubmitting}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{categoryName}</span>
                      </label>
                      {expandedInstrumentCategories.has(categoryName) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedInstrumentCategories.has(categoryName) && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryInstruments.map((instrument) => (
                            <label
                              key={instrument.id}
                              className="flex items-center space-x-2 text-gray-300 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={(formData.selectedInstruments || []).includes(instrument.display_name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateFormData({ 
                                      selectedInstruments: [...(formData.selectedInstruments || []), instrument.display_name] 
                                    });
                                  } else {
                                    updateFormData({
                                      selectedInstruments: (formData.selectedInstruments || []).filter((i) => i !== instrument.display_name)
                                    });
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                disabled={isSubmitting}
                              />
                              <span className="text-sm">{instrument.display_name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ));
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
              
              <div className="space-y-4">
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
                      const hasChildren = childTypesForParent.length > 0;
                      
                      return (
                        <div key={parentType.id} className="bg-white/5 rounded-lg p-4">
                          <button
                            type="button"
                            onClick={() => toggleMediaCategory(parentType.id)}
                            className="flex items-center justify-between w-full text-left mb-2"
                          >
                            <label className="flex items-center space-x-2 text-white font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={childTypesForParent.some(childType => formData.selectedMediaUsage.includes(childType.full_name))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Add all child types for this parent
                                    const newMediaUsage = [...formData.selectedMediaUsage];
                                    childTypesForParent.forEach(childType => {
                                      if (!newMediaUsage.includes(childType.full_name)) {
                                        newMediaUsage.push(childType.full_name);
                                      }
                                    });
                                    updateFormData({ selectedMediaUsage: newMediaUsage });
                                  } else {
                                    // Remove all child types for this parent
                                    const newMediaUsage = formData.selectedMediaUsage.filter(usage => 
                                      !childTypesForParent.some(childType => childType.full_name === usage)
                                    );
                                    updateFormData({ selectedMediaUsage: newMediaUsage });
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={isSubmitting}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{parentType.name}</span>
                            </label>
                            {expandedMediaCategories.has(parentType.id) ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          
                          {expandedMediaCategories.has(parentType.id) && hasChildren && (
                            <div className="mt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {childTypesForParent.map((childType) => (
                                  <label
                                    key={childType.id}
                                    className="flex items-center space-x-2 text-gray-300 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.selectedMediaUsage.includes(childType.full_name)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          updateFormData({ 
                                            selectedMediaUsage: [...formData.selectedMediaUsage, childType.full_name] 
                                          });
                                        } else {
                                          updateFormData({
                                            selectedMediaUsage: formData.selectedMediaUsage.filter(u => u !== childType.full_name)
                                          });
                                        }
                                      }}
                                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      disabled={isSubmitting}
                                    />
                                    <span className="text-sm">{childType.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  );
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