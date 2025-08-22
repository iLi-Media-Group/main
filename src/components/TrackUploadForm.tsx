// NOTE: Triggering redeploy for deployment troubleshooting.
// NOTE: Last updated to always show clean version question and adjust explicit lyrics logic.
import React, { useState, useEffect } from 'react';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { Upload, Loader2, Music, Hash, Image, Search, Play, Pause, ChevronDown, ChevronRight, CheckCircle, AlertCircle, FileAudio, FileText, Users, Building2 } from 'lucide-react';
import { MOODS_CATEGORIES, MUSICAL_KEYS, MEDIA_USAGE_TYPES, ALL_INSTRUMENTS, INSTRUMENTS, MEDIA_USAGE_CATEGORIES } from '../types';
import { fetchInstrumentsData, type InstrumentWithCategory } from '../lib/instruments';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
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
  genre: string;
  subGenre: string;
  mood: string;
  subMood: string;
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
  // Sample clearance fields
  containsLoops: boolean;
  containsSamples: boolean;
  containsSpliceLoops: boolean;
  samplesCleared: boolean;
  sampleClearanceNotes: string;
  // Rights management fields
  masterRightsOwner: string;
  publishingRightsOwner: string;
  participants: SplitSheetParticipant[];
  coSigners: CoSigner[];
  // New rights holder fields
  rightsHolderName: string;
  rightsHolderType: 'producer' | 'record_label' | 'publisher' | 'other';
  rightsHolderEmail: string;
  rightsHolderPhone: string;
  rightsHolderAddress: string;
  rightsDeclarationAccepted: boolean;
}

interface SplitSheetParticipant {
  id: string;
  name: string;
  role: 'writer' | 'producer' | 'publisher' | 'performer';
  percentage: number;
  email: string;
  pro: string; // ASCAP, BMI, SESAC, etc.
  publisher: string;
}

interface CoSigner {
  id: string;
  name: string;
  email: string;
  role: string;
  invited: boolean;
  signed: boolean;
}

export function TrackUploadForm() {
  const { user } = useUnifiedAuth();
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
    genre: '',
    subGenre: '',
    mood: '',
    subMood: '',
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
    cleanVersionOf: '',
    // Sample clearance fields
    containsLoops: false,
    containsSpliceLoops: false,
    containsSamples: false,
    samplesCleared: false,
    sampleClearanceNotes: '',
    // Rights management fields
    masterRightsOwner: '',
    publishingRightsOwner: '',
    participants: [] as SplitSheetParticipant[],
    coSigners: [] as CoSigner[],
    // New rights holder fields
    rightsHolderName: '',
    rightsHolderType: 'producer' as const,
    rightsHolderEmail: '',
    rightsHolderPhone: '',
    rightsHolderAddress: '',
    rightsDeclarationAccepted: false
  }, {
    storageKey: FORM_STORAGE_KEY,
    excludeFields: ['audioFile', 'imageFile', 'trackoutsFile', 'stemsFile', 'splitSheetFile', 'imagePreview']
  });

  // File states (not persisted in localStorage)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showCleanVersionModal, setShowCleanVersionModal] = useState(false);
  const [cleanVersionTrack, setCleanVersionTrack] = useState<any>(null);
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
  const { mediaTypes, moods: dynamicMoods, loading: dynamicDataLoading } = useDynamicSearchData();
  const [explicitTracks, setExplicitTracks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // State for tracking expanded categories
  const [expandedMoodCategories, setExpandedMoodCategories] = useState<Set<string>>(new Set());
  const [expandedInstrumentCategories, setExpandedInstrumentCategories] = useState<Set<string>>(new Set());
  const [expandedMediaCategories, setExpandedMediaCategories] = useState<Set<string>>(new Set());

  // Step management for improved layout
  const [currentStep, setCurrentStep] = useState(1);

  // Transform dynamic moods data into categorized structure
  const getMoodsCategories = () => {
    if (dynamicDataLoading || !dynamicMoods.length) {
      return MOODS_CATEGORIES; // Fallback to static data
    }
    
    // Group moods by category
    const categorizedMoods: Record<string, string[]> = {};
    dynamicMoods.forEach(mood => {
      if (!categorizedMoods[mood.category]) {
        categorizedMoods[mood.category] = [];
      }
      categorizedMoods[mood.category].push(mood.display_name);
    });
    
    return categorizedMoods;
  };

  // Toggle functions for collapsible categories
  const toggleMoodCategory = (category: string) => {
    setExpandedMoodCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleInstrumentCategory = (category: string) => {
    setExpandedInstrumentCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleMediaCategory = (category: string) => {
    setExpandedMediaCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const steps = [
    { number: 1, title: 'Basic Info', icon: FileText },
    { number: 2, title: 'Audio & Files', icon: FileAudio },
    { number: 3, title: 'Genres & Moods', icon: Music },
    { number: 4, title: 'Instruments & Usage', icon: Users },
    { number: 5, title: 'Rights', icon: FileText },
    { number: 6, title: 'Co-signers', icon: Users },
    { number: 7, title: 'Review & Submit', icon: Building2 }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.bpm && formData.key);
      case 2:
        return !!audioFile;
      case 3:
        return !!formData.genre && formData.selectedMoods.length > 0;
      case 4:
        return formData.selectedInstruments.length > 0 && formData.selectedMediaUsage.length > 0;
      case 5:
        return !!(formData.masterRightsOwner && formData.publishingRightsOwner);
      case 6:
        return true; // Co-signers are optional
      case 7:
        return true; // Review step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Rights management functions
  const addParticipant = () => {
    const newParticipant: SplitSheetParticipant = {
      id: Date.now().toString(),
      name: '',
      role: 'writer',
      percentage: 0,
      email: '',
      pro: '',
      publisher: ''
    };
    updateFormData({
      participants: [...formData.participants, newParticipant]
    });
  };

  const updateParticipant = (id: string, field: keyof SplitSheetParticipant, value: any) => {
    updateFormData({
      participants: (formData.participants || []).map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    });
  };

  const removeParticipant = (id: string) => {
    updateFormData({
      participants: (formData.participants || []).filter(p => p.id !== id)
    });
  };

  const addCoSigner = () => {
    const newCoSigner: CoSigner = {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: '',
      invited: false,
      signed: false
    };
    updateFormData({
      coSigners: [...formData.coSigners, newCoSigner]
    });
  };

  const updateCoSigner = (id: string, field: keyof CoSigner, value: any) => {
    updateFormData({
      coSigners: (formData.coSigners || []).map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const removeCoSigner = (id: string) => {
    updateFormData({
      coSigners: (formData.coSigners || []).filter(c => c.id !== id)
    });
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

  // Fetch genres from database - use stable effect to prevent refreshes
  useStableDataFetch(
    async () => {
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
    },
    [],
    () => true
  );

  // Fetch instruments from database - use stable effect to prevent refreshes
  useStableDataFetch(
    async () => {
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
    },
    [],
    () => true
  );

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

      if (!formData.genre) {
        throw new Error('Please select a genre');
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

      // Insert or update track in DB
      const insertData = {
        track_producer_id: user.id,
        title: formData.title,
        artist: user.email?.split('@')[0] || 'Unknown Artist',
        genres: formData.genre,
        sub_genres: formData.subGenre,
        moods: formData.mood,
        instruments: formData.selectedInstruments || [],
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
        // Sample clearance fields
        contains_loops: formData.containsLoops,
        contains_samples: formData.containsSamples,
        contains_splice_loops: formData.containsSpliceLoops,
        samples_cleared: formData.samplesCleared,
        sample_clearance_notes: formData.sampleClearanceNotes || null,
        // Rights management fields
        master_rights_owner: formData.masterRightsOwner,
        publishing_rights_owner: formData.publishingRightsOwner,
        participants: JSON.stringify(formData.participants),
        co_signers: JSON.stringify(formData.coSigners),
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
      
      // Add try-catch around the insert to catch any errors
      let insertResult, trackError;
      try {
        const result = await supabase
          .from('tracks')
          .insert(insertData);
        insertResult = result.data;
        trackError = result.error;
      } catch (err) {
        console.error('[DEBUG] Exception during insert:', err);
        trackError = err;
      }
      
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

      // Insert music rights information into music_rights table
      if (trackData?.id) {
        const musicRightsData = {
          track_id: trackData.id,
          producer_id: user.id,
          master_rights_owner: formData.masterRightsOwner,
          publishing_rights_owner: formData.publishingRightsOwner,
          rights_holder_name: formData.rightsHolderName || null,
          rights_holder_type: formData.rightsHolderType,
          rights_holder_email: formData.rightsHolderEmail || null,
          rights_holder_phone: formData.rightsHolderPhone || null,
          rights_holder_address: formData.rightsHolderAddress || null,
          split_sheet_url: splitSheetUploadedUrl || null,
          participants: formData.participants,
          co_signers: formData.coSigners,
          rights_declaration_accepted: formData.rightsDeclarationAccepted,
          rights_declaration_accepted_at: formData.rightsDeclarationAccepted ? new Date().toISOString() : null
        };

        const { error: musicRightsError } = await supabase
          .from('music_rights')
          .insert(musicRightsData);

        if (musicRightsError) {
          console.error('[DEBUG] Music rights insertion error:', musicRightsError);
          // Don't throw error here as the track was already created successfully
          // But log it for debugging
        } else {
          console.log('[DEBUG] Music rights inserted successfully for track:', trackData.id);
        }
      }

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
    <div className="min-h-screen bg-blue-900/90 p-4">
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Music className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Upload Track</h1>
          <p className="text-gray-300">Share your music with the world</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                    isCompleted ? 'bg-green-500 border-green-500' :
                    isActive ? 'bg-blue-500 border-blue-500' :
                    'bg-gray-700 border-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
          
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
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Basic Track Information</h2>
              
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
                      Key *
                </label>
                <select
                  id="track-key"
                  name="track-key"
                  value={formData.key}
                  onChange={(e) => updateFormData({ key: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting}
                      required
                >
                  <option value="">Select key</option>
                      <option value="C">C</option>
                      <option value="C#">C#</option>
                      <option value="D">D</option>
                      <option value="D#">D#</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="F#">F#</option>
                      <option value="G">G</option>
                      <option value="G#">G#</option>
                      <option value="A">A</option>
                      <option value="A#">A#</option>
                      <option value="B">B</option>
                </select>
              </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        id="track-sting-ending"
                        name="track-sting-ending"
                        type="checkbox"
                        checked={formData.hasStingEnding}
                        onChange={(e) => updateFormData({ hasStingEnding: e.target.checked })}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span>Sting ending</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
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
            </div>
          )}

          {/* Step 2: Audio & Files */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Audio & Additional Files</h2>

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
                  </div>
          )}

          {/* Step 3: Genres & Moods */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Genres & Moods</h2>

          {/* Genres Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Genres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => updateFormData({ genre: e.target.value, subGenre: '' })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting || genresLoading}
                >
                  <option value="">Select genre</option>
                  {(Array.isArray(genres) ? genres : []).map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sub-Genre</label>
                <select
                  value={formData.subGenre}
                  onChange={(e) => updateFormData({ subGenre: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting || !formData.genre}
                >
                  <option value="">Select sub-genre</option>
                  {formData.genre && (Array.isArray(genres) ? genres : []).find(g => g.id === formData.genre)?.sub_genres?.map((subGenre) => (
                    <option key={subGenre.id} value={subGenre.id}>
                      {subGenre.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

              {/* Moods Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Moods</h2>
                <div className="space-y-3">
                  {/* Main Mood Categories */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.keys(getMoodsCategories()).map((category) => (
                      <label key={category} className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer py-2">
                        <input
                          type="checkbox"
                          checked={formData.selectedMoods.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData({ 
                                selectedMoods: [...formData.selectedMoods, category]
                              });
                            } else {
                              updateFormData({
                                selectedMoods: formData.selectedMoods.filter(m => m !== category)
                              });
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm font-medium">{category}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Sub-moods for selected main moods */}
                  {formData.selectedMoods.filter(mood => Object.keys(getMoodsCategories()).includes(mood)).map((selectedCategory) => {
                    const subMoods = getMoodsCategories()[selectedCategory] || [];
                    return (
                      <div key={selectedCategory} className="mt-4 p-4 bg-blue-700/30 rounded-lg border border-blue-600/30">
                        <h3 className="text-lg font-medium text-white mb-3">{selectedCategory} - Sub-moods</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {subMoods.map((subMood) => (
                            <label key={subMood} className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer py-1">
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
                                      selectedMoods: formData.selectedMoods.filter(m => m !== subMood)
                                    });
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                              <span className="text-sm capitalize">{subMood}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Instruments & Usage */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Instruments & Usage</h2>
              
              {/* Instruments Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Instruments</h2>
                <div className="space-y-3">
                  {Object.entries(INSTRUMENTS).map(([category, instruments]) => {
                    const categoryInstrumentsSelected = instruments.filter(instrument => formData.selectedInstruments.includes(instrument));
                    const isExpanded = expandedInstrumentCategories.has(category);
                    
                    return (
                      <div key={category} className="border border-blue-600/30 rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <div className="w-full px-4 py-3 bg-blue-700/50 hover:bg-blue-700/70 transition-colors flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={categoryInstrumentsSelected.length === instruments.length}
                                onChange={(e) => {
                                  e.stopPropagation(); // Prevent event bubbling
                                  if (e.target.checked) {
                                    // Select all instruments in this category
                                    const newInstruments = [...formData.selectedInstruments];
                                    instruments.forEach(instrument => {
                                      if (!newInstruments.includes(instrument)) {
                                        newInstruments.push(instrument);
                                      }
                                    });
                                    updateFormData({ selectedInstruments: newInstruments });
                                  } else {
                                    // Deselect all instruments in this category
                                    updateFormData({
                                      selectedInstruments: formData.selectedInstruments.filter(instrument => !instruments.includes(instrument))
                                    });
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                              <span className="font-medium text-white">{category}</span>
                            </div>
                            {categoryInstrumentsSelected.length > 0 && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                {categoryInstrumentsSelected.length}/{instruments.length}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleInstrumentCategory(category)}
                            className="flex items-center space-x-2 p-1 hover:bg-blue-600/50 rounded transition-colors"
                            disabled={isSubmitting}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-300" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                          </button>
                        </div>
                        
                        {/* Collapsible Instrument List */}
                        {isExpanded && (
                          <div className="px-4 py-3 bg-blue-800/30 border-t border-blue-600/20">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {instruments.map((instrument) => (
                                <label key={instrument} className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer py-1">
                                  <input
                                    type="checkbox"
                                    checked={formData.selectedInstruments.includes(instrument)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        updateFormData({ 
                                          selectedInstruments: [...formData.selectedInstruments, instrument]
                                        });
                                      } else {
                                        updateFormData({
                                          selectedInstruments: formData.selectedInstruments.filter(i => i !== instrument)
                                        });
                                      }
                                    }}
                                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  />
                                  <span className="text-sm">{instrument}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Media Usage Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Media Usage</h2>
                <div className="space-y-3">
                  {Object.entries(MEDIA_USAGE_CATEGORIES).map(([category, subcategories]) => {
                    // Flatten all usage types for this category
                    const categoryUsageTypes = Object.entries(subcategories).reduce((acc, [subcategory, types]) => {
                      types.forEach((type: string) => {
                        acc.push(`${category} > ${subcategory} > ${type}`);
                      });
                      return acc;
                    }, [] as string[]);
                    
                    const categoryUsageSelected = categoryUsageTypes.filter(usage => formData.selectedMediaUsage.includes(usage));
                    const isExpanded = expandedMediaCategories.has(category);
                    
                    return (
                      <div key={category} className="border border-blue-600/30 rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <button
                          type="button"
                          onClick={() => toggleMediaCategory(category)}
                          className="w-full px-4 py-3 bg-blue-700/50 hover:bg-blue-700/70 transition-colors flex items-center justify-between text-left"
                          disabled={isSubmitting}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={categoryUsageSelected.length === categoryUsageTypes.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Select all usage types in this category
                                    const newUsageTypes = [...formData.selectedMediaUsage];
                                    categoryUsageTypes.forEach(usage => {
                                      if (!newUsageTypes.includes(usage)) {
                                        newUsageTypes.push(usage);
                                      }
                                    });
                                    updateFormData({ selectedMediaUsage: newUsageTypes });
                                  } else {
                                    // Deselect all usage types in this category
                                    updateFormData({
                                      selectedMediaUsage: formData.selectedMediaUsage.filter(usage => !categoryUsageTypes.includes(usage))
                                    });
                                  }
                                }}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                              <span className="font-medium text-white">{category}</span>
                            </div>
                            {categoryUsageSelected.length > 0 && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                {categoryUsageSelected.length}/{categoryUsageTypes.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-300" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                        </button>
                        
                        {/* Collapsible Media Usage List */}
                        {isExpanded && (
                          <div className="px-4 py-3 bg-blue-800/30 border-t border-blue-600/20">
                            <div className="space-y-3">
                              {Object.entries(subcategories).map(([subcategory, types]) => (
                                <div key={subcategory} className="border-l-2 border-blue-500/30 pl-3">
                                  <h4 className="text-sm font-medium text-blue-300 mb-2">{subcategory}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {types.map((type: string) => {
                                      const fullUsageType = `${category} > ${subcategory} > ${type}`;
                                      return (
                                        <label key={fullUsageType} className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer py-1">
                                          <input
                                            type="checkbox"
                                            checked={formData.selectedMediaUsage.includes(fullUsageType)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                updateFormData({ 
                                                  selectedMediaUsage: [...formData.selectedMediaUsage, fullUsageType]
                                                });
                                              } else {
                                                updateFormData({
                                                  selectedMediaUsage: formData.selectedMediaUsage.filter(u => u !== fullUsageType)
                                                });
                                              }
                                            }}
                                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                          />
                                          <span className="text-sm">{type}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                                explicitLyrics: false
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
                    </div>
                  )}
            </div>
          </div>
            </div>
          )}

          {/* Step 5: Rights */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Rights</h2>
              
              {/* Rights Declaration Section */}
            <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Rights Declaration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                      Master Rights Owner *
                  </label>
                    <input
                      type="text"
                      value={formData.masterRightsOwner}
                      onChange={(e) => updateFormData({ masterRightsOwner: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter master rights owner"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Publishing Rights Owner *
                    </label>
                    <input
                      type="text"
                      value={formData.publishingRightsOwner}
                      onChange={(e) => updateFormData({ publishingRightsOwner: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter publishing rights owner"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Rights Holder Information Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Rights Holder Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rights Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.rightsHolderName}
                      onChange={(e) => updateFormData({ rightsHolderName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter rights holder name"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rights Holder Type
                    </label>
                    <select
                      value={formData.rightsHolderType}
                      onChange={(e) => updateFormData({ rightsHolderType: e.target.value as 'producer' | 'record_label' | 'publisher' | 'other' })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="producer">Producer</option>
                      <option value="record_label">Record Label</option>
                      <option value="publisher">Publisher</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rights Holder Email
                    </label>
                    <input
                      type="email"
                      value={formData.rightsHolderEmail}
                      onChange={(e) => updateFormData({ rightsHolderEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter rights holder email"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rights Holder Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.rightsHolderPhone}
                      onChange={(e) => updateFormData({ rightsHolderPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter rights holder phone"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rights Holder Address
                    </label>
                    <textarea
                      value={formData.rightsHolderAddress}
                      onChange={(e) => updateFormData({ rightsHolderAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter rights holder address"
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.rightsDeclarationAccepted}
                        onChange={(e) => updateFormData({ rightsDeclarationAccepted: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">
                        I declare that I have the legal authority to license this content and that all rights holders have been properly credited and compensated according to the split sheet.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Split Sheet Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Split Sheet Participants</h2>
                
                {(formData.participants || []).map((participant) => (
                  <div key={participant.id} className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Participant</h3>
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Name</label>
                              <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Full name"
                                disabled={isSubmitting}
                              />
                  </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Role</label>
                        <select
                          value={participant.role}
                          onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          disabled={isSubmitting}
                        >
                          <option value="writer">Writer</option>
                          <option value="composer">Composer</option>
                          <option value="producer">Producer</option>
                          <option value="performer">Performer</option>
                        </select>
                </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Percentage</label>
                        <input
                          type="number"
                          value={participant.percentage}
                          onChange={(e) => updateParticipant(participant.id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={participant.email}
                          onChange={(e) => updateParticipant(participant.id, 'email', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="email@example.com"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">PRO</label>
                              <input
                          type="text"
                          value={participant.pro}
                          onChange={(e) => updateParticipant(participant.id, 'pro', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="e.g., ASCAP, BMI, SESAC"
                                disabled={isSubmitting}
                              />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Publisher</label>
                        <input
                          type="text"
                          value={participant.publisher}
                          onChange={(e) => updateParticipant(participant.id, 'publisher', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Publisher name"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addParticipant}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  + Add Participant
                </button>
                        </div>
                      </div>
          )}

          {/* Step 6: Co-signers */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Co-signers</h2>
              
              {/* Co-signers Section */}
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Co-signers</h2>
                
                {(formData.coSigners || []).map((coSigner) => (
                  <div key={coSigner.id} className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Co-signer</h3>
                      <button
                        type="button"
                        onClick={() => removeCoSigner(coSigner.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
              </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={coSigner.name}
                          onChange={(e) => updateCoSigner(coSigner.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Full name"
                          disabled={isSubmitting}
                        />
            </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={coSigner.email}
                          onChange={(e) => updateCoSigner(coSigner.id, 'email', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="email@example.com"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Role</label>
                        <input
                          type="text"
                          value={coSigner.role}
                          onChange={(e) => updateCoSigner(coSigner.id, 'role', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="e.g., Manager, Lawyer, etc."
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addCoSigner}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  + Add Co-signer
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Review & Submit */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Review & Submit</h2>
              
              <div className="bg-blue-800/80 backdrop-blur-sm rounded-xl border border-blue-500/40 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Review Your Track Information</h2>
                
                <div className="space-y-4 text-white">
                  <div>
                    <strong>Track Title:</strong> {formData.title}
                  </div>
                  <div>
                    <strong>BPM:</strong> {formData.bpm}
                  </div>
                  <div>
                    <strong>Key:</strong> {formData.key}
                  </div>
                  <div>
                    <strong>Genres:</strong> {formData.selectedGenres.join(', ')}
                  </div>
                  <div>
                    <strong>Moods:</strong> {formData.selectedMoods.join(', ')}
                  </div>
                  <div>
                    <strong>Master Rights Owner:</strong> {formData.masterRightsOwner}
                  </div>
                  <div>
                    <strong>Publishing Rights Owner:</strong> {formData.publishingRightsOwner}
                  </div>
                  <div>
                    <strong>Participants:</strong> {formData.participants.length}
                  </div>
                  <div>
                    <strong>Co-signers:</strong> {formData.coSigners.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation */}
          <div className="flex justify-between items-center pt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <span className="text-gray-300 text-sm">Step {currentStep} of {steps.length}</span>
            </div>
            
            <button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center"
            >
              Next →
            </button>
          </div>

          {/* Submit Button - Only show on last step */}
          {currentStep === 7 && (
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
          )}
        </form>
      </div>
    </div>
  );
}