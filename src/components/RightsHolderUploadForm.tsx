import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { uploadFile } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { fetchInstrumentsData, type InstrumentWithCategory } from '../lib/instruments';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';
import { 
  Upload, 
  Music, 
  FileText, 
  Users, 
  Percent, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Building2,
  Mic,
  FileAudio,
  UserPlus,
  Send,
  Save,
  ChevronDown,
  ChevronRight,
  X,
  Layers,
  FileMusic
} from 'lucide-react';
import { MOODS_CATEGORIES, MOODS, MUSICAL_KEYS } from '../types';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

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
  // File upload fields (not persisted)
  audioFile?: File | null;
  artworkFile?: File | null;
  description?: string;
  artist?: string;
  duration?: number;
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

export function RightsHolderUploadForm() {
  const navigate = useNavigate();
  const { user, profile } = useUnifiedAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedTrackTitle, setUploadedTrackTitle] = useState('');
  
  // Database-driven dropdown data
  const [genres, setGenres] = useState<GenreWithSubGenres[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [instruments, setInstruments] = useState<InstrumentWithCategory[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);
  const { mediaTypes, moods: dynamicMoods, instruments: dynamicInstruments, loading: dynamicDataLoading } = useDynamicSearchData();
  
  // Feature flags and plans
  const deepMediaSearchEnabled = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();
  
  // State for tracking expanded categories
  const [expandedMoodCategories, setExpandedMoodCategories] = useState<Set<string>>(new Set());
  const [expandedInstrumentCategories, setExpandedInstrumentCategories] = useState<Set<string>>(new Set());

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
    cleanVersionOf: '',
    // Sample clearance fields
    containsLoops: false,
    containsSamples: false,
    containsSpliceLoops: false,
    samplesCleared: false,
    sampleClearanceNotes: '',
    // Rights management fields
    masterRightsOwner: profile?.company_name || '',
    publishingRightsOwner: profile?.company_name || '',
    participants: [
      {
        id: '1',
        name: '',
        role: 'writer' as const,
        percentage: 100,
        email: '',
        pro: '',
        publisher: ''
      }
    ] as SplitSheetParticipant[],
    coSigners: [] as CoSigner[],
    // New rights holder fields
    rightsHolderName: profile?.company_name || '',
    rightsHolderType: 'record_label' as const,
    rightsHolderEmail: profile?.email || '',
    rightsHolderPhone: profile?.phone || '',
    rightsHolderAddress: '',
    rightsDeclarationAccepted: false,
    // File upload fields (not persisted)
    audioFile: null as File | null,
    artworkFile: null as File | null,
    description: '',
    artist: '',
    duration: 0
  }, {
    storageKey: 'rights-holder-upload',
    excludeFields: ['audioFile', 'artworkFile', 'trackoutsFile', 'stemsFile', 'splitSheetFile', 'imagePreview']
  });

  // Transform dynamic moods data into categorized structure
  const getMoodsCategories = () => {
    if (dynamicDataLoading || !dynamicMoods.length) {
      return MOODS_CATEGORIES; // Fallback to static data
    }
    
    // Group moods by category (main moods) and their sub-moods
    const categorizedMoods: Record<string, string[]> = {};
    
    // First, find all main mood categories
    const mainMoods = dynamicMoods.filter(mood => 
      mood.category === mood.display_name // Main mood categories have same name as display_name
    );
    
    // Then group sub-moods under their main categories
    mainMoods.forEach(mainMood => {
      const subMoods = dynamicMoods.filter(mood => 
        mood.category === mainMood.display_name && mood.id !== mainMood.id
      );
      categorizedMoods[mainMood.display_name] = subMoods.map(subMood => subMood.name);
    });
    
    return categorizedMoods;
  };

  // Get main mood categories for checkboxes
  const getMainMoodCategories = () => {
    if (dynamicDataLoading || !dynamicMoods || dynamicMoods.length === 0) {
      return Object.keys(MOODS_CATEGORIES);
    }
    
    // Return only main mood categories (where category === display_name)
    return dynamicMoods
      .filter(mood => mood.category === mood.display_name)
      .map(mood => mood.display_name);
  };

  // Get sub-moods for a specific main mood category
  const getSubMoodsForCategory = (categoryName: string) => {
    if (dynamicDataLoading || !dynamicMoods || dynamicMoods.length === 0) {
      return Object.values(MOODS_CATEGORIES).find((_, index) => 
        Object.keys(MOODS_CATEGORIES)[index] === categoryName
      ) || [];
    }
    
    return dynamicMoods
      .filter(mood => mood.category === categoryName && mood.id !== mood.category)
      .map(mood => mood.name);
  };

  // Transform dynamic instruments data into categorized structure
  const getInstrumentsCategories = () => {
    if (dynamicDataLoading || !dynamicInstruments.length) {
      return {}; // Fallback to empty object, will use existing instruments data
    }
    
    // Group instruments by category
    const categorizedInstruments: Record<string, string[]> = {};
    dynamicInstruments.forEach(instrument => {
      if (!categorizedInstruments[instrument.category]) {
        categorizedInstruments[instrument.category] = [];
      }
      categorizedInstruments[instrument.category].push(instrument.display_name);
    });
    
    return categorizedInstruments;
  };

  const audioFileRef = useRef<HTMLInputElement>(null);
  const artworkFileRef = useRef<HTMLInputElement>(null);

  // Fetch genres from database
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
        setGenres([]);
      } finally {
        setGenresLoading(false);
      }
    },
    [],
    () => true
  );

  // Fetch instruments from database
  useStableDataFetch(
    async () => {
      try {
        setInstrumentsLoading(true);
        const instrumentsData = await fetchInstrumentsData();
        setInstruments(instrumentsData.instruments);
      } catch (err) {
        console.error('Error fetching instruments:', err);
        setInstruments([]);
      } finally {
        setInstrumentsLoading(false);
      }
    },
    [],
    () => true
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs properly
    if (type === 'number') {
      const numValue = value === '' ? 0 : Number(value);
      updateFormData({
        [name]: isNaN(numValue) ? 0 : numValue
      });
    } else {
      updateFormData({
        [name]: value
      });
    }
  };

  const handleMultiSelectChange = (field: keyof FormData, value: string, checked: boolean) => {
    const currentValues = formData[field] as string[];
    if (checked) {
      updateFormData({
        [field]: [...currentValues, value]
      });
    } else {
      updateFormData({
        [field]: currentValues.filter(v => v !== value)
      });
    }
  };

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

  const getSelectedGenreSubGenres = () => {
    const selectedGenre = genres.find(g => g.id === formData.genre);
    return selectedGenre?.sub_genres || [];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'audio' | 'artwork') => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'audio') {
        updateFormData({ audioFile: file });
      } else {
        updateFormData({ artworkFile: file });
      }
    }
  };

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
      participants: formData.participants.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    });
  };

  const removeParticipant = (id: string) => {
    updateFormData({
      participants: formData.participants.filter(p => p.id !== id)
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
      coSigners: formData.coSigners.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const removeCoSigner = (id: string) => {
    updateFormData({
      coSigners: formData.coSigners.filter(c => c.id !== id)
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.artist && formData.genre && formData.audioFile);
      case 2:
        return !!(formData.masterRightsOwner && formData.publishingRightsOwner);
      case 3:
        return formData.participants.length > 0 && 
               formData.participants.every(p => p.name && p.percentage > 0);
      case 4:
        return true; // Co-signers are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user || !formData.audioFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload audio file
      const audioPath = await uploadFile(
        formData.audioFile,
        'track-audio',
        (progress) => setUploadProgress(progress * 0.7), // Audio is 70% of upload
        `rights-holders/${user.id}`
      );

      // Upload artwork if provided
      let artworkPath = null;
      if (formData.artworkFile) {
        artworkPath = await uploadFile(
          formData.artworkFile,
          'track-images',
          (progress) => setUploadProgress(70 + progress * 0.3), // Artwork is 30% of upload
          `rights-holders/${user.id}`
        );
      }

      // Validate required fields before insertion
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.artist.trim()) {
        throw new Error('Artist is required');
      }
      if (!formData.genre) {
        throw new Error('Genre is required');
      }

      // Ensure numeric fields are valid
      const bpm = formData.bpm && !isNaN(Number(formData.bpm)) ? Number(formData.bpm) : null;
      const duration = formData.duration && !isNaN(Number(formData.duration)) ? Number(formData.duration) : null;

                           // Create master recording record
        const { data: masterRecording, error: masterError } = await supabase
          .from('master_recordings')
          .insert({
            rights_holder_id: user.id,
            title: formData.title.trim(),
            artist: formData.artist.trim(),
            genres: formData.genre ? [genres.find(g => g.id === formData.genre)?.display_name || formData.genre] : [],
            sub_genres: formData.subGenre ? [genres.find(g => g.id === formData.genre)?.sub_genres?.find(sg => sg.id === formData.subGenre)?.display_name || formData.subGenre] : [],
            moods: formData.selectedMoods || [],
            bpm: bpm,
            key: formData.key || null,
            duration: duration,
            description: formData.description || null,
            audio_url: audioPath,
            artwork_url: artworkPath || null,
            master_rights_owner: formData.masterRightsOwner || null,
            publishing_rights_owner: formData.publishingRightsOwner || null,
            status: 'pending_verification',
            instruments: formData.selectedInstruments.length > 0 ? formData.selectedInstruments : null,
            media_usage: formData.selectedMediaUsage.length > 0 ? formData.selectedMediaUsage : null,
            has_vocals: formData.hasVocals,
            is_sync_only: formData.isSyncOnly
          })
          .select()
          .single();

      if (masterError) throw masterError;

      // Create publishing rights record
      const { error: publishingError } = await supabase
        .from('publishing_rights')
        .insert({
          master_recording_id: masterRecording.id,
          rights_holder_id: user.id,
          status: 'pending_verification'
        });

      if (publishingError) throw publishingError;

      // Create split sheet
      const { data: splitSheet, error: splitError } = await supabase
        .from('split_sheets')
        .insert({
          master_recording_id: masterRecording.id,
          rights_holder_id: user.id,
          status: 'pending_signatures'
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // Create split sheet participants
      const participantsData = formData.participants.map(p => ({
        split_sheet_id: splitSheet.id,
        name: p.name,
        role: p.role,
        percentage: p.percentage,
        email: p.email,
        pro: p.pro,
        publisher: p.publisher
      }));

      const { error: participantsError } = await supabase
        .from('split_sheet_participants')
        .insert(participantsData);

      if (participantsError) throw participantsError;

      // Create co-signers if any
      if (formData.coSigners.length > 0) {
        const coSignersData = formData.coSigners.map(c => ({
          split_sheet_id: splitSheet.id,
          name: c.name,
          email: c.email,
          role: c.role,
          invited: false
        }));

        const { error: coSignersError } = await supabase
          .from('co_signers')
          .insert(coSignersData);

        if (coSignersError) throw coSignersError;
      }

      setSuccess(true);
      setUploadProgress(100);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/rights-holder/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Track Information', icon: Music },
    { number: 2, title: 'Rights Declaration', icon: FileText },
    { number: 3, title: 'Split Sheet', icon: Users },
    { number: 4, title: 'Co-signers', icon: Mail }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Upload Successful!</h2>
          <p className="text-gray-300 mb-6">
            Your track has been uploaded and is pending verification. You'll be redirected to your dashboard shortly.
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading upload form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Upload Master Recording</h1>
          <p className="text-gray-300">Complete the rights verification process for your track</p>
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

          {/* Step 1: Track Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Track Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Track Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter track title"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Artist *</label>
                  <input
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter artist name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Genre *</label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    disabled={genresLoading}
                  >
                    <option value="">Select genre</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Sub-Genre</label>
                  <select
                    name="subGenre"
                    value={formData.subGenre}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    disabled={!formData.genre}
                  >
                    <option value="">Select sub-genre</option>
                    {getSelectedGenreSubGenres().map((subGenre) => (
                      <option key={subGenre.id} value={subGenre.id}>
                        {subGenre.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">BPM</label>
                  <input
                    type="number"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="120"
                  />
                </div>
                
                               <div>
                 <label className="block text-gray-300 mb-2">Key</label>
                 <select
                   name="key"
                   value={formData.key}
                   onChange={handleInputChange}
                   className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                 >
                   <option value="">Select key</option>
                   {MUSICAL_KEYS.map((key) => (
                     <option key={key} value={key}>
                       {key}
                     </option>
                   ))}
                 </select>
               </div>
             </div>

             {/* Track Type Options */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex items-center space-x-3">
                 <input
                   type="checkbox"
                   id="hasVocals"
                   name="hasVocals"
                   checked={formData.hasVocals}
                   onChange={(e) => updateFormData({ hasVocals: e.target.checked })}
                   className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                 />
                 <label htmlFor="hasVocals" className="text-gray-300">
                   Full Track with Vocals
                 </label>
               </div>
               
               <div className="flex items-center space-x-3">
                 <input
                   type="checkbox"
                   id="isSyncOnly"
                   name="isSyncOnly"
                   checked={formData.isSyncOnly}
                   onChange={(e) => updateFormData({ isSyncOnly: e.target.checked })}
                   className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                 />
                 <label htmlFor="isSyncOnly" className="text-gray-300">
                   Sync Only (Only allow for sync briefs)
                 </label>
               </div>
             </div>

                             {/* Mood Selection */}
               <div>
                 <label className="block text-gray-300 mb-2">Moods</label>
                 <div className="bg-gray-800/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                   {getMainMoodCategories().map((category) => (
                     <div key={category} className="mb-4">
                       <button
                         type="button"
                         onClick={() => toggleMoodCategory(category)}
                         className="flex items-center justify-between w-full p-2 text-left text-white hover:bg-gray-700/50 rounded"
                       >
                         <span className="font-medium">{category}</span>
                         {expandedMoodCategories.has(category) ? (
                           <ChevronDown className="w-4 h-4" />
                         ) : (
                           <ChevronRight className="w-4 h-4" />
                         )}
                       </button>
                       {expandedMoodCategories.has(category) && (
                         <div className="ml-4 mt-2 space-y-1">
                           {getSubMoodsForCategory(category).map((mood: string) => (
                             <label key={mood} className="flex items-center space-x-2 text-gray-300">
                               <input
                                 type="checkbox"
                                 checked={formData.selectedMoods.includes(mood)}
                                 onChange={(e) => handleMultiSelectChange('selectedMoods', mood, e.target.checked)}
                                 className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                               />
                               <span className="capitalize">{mood}</span>
                             </label>
                           ))}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>

                             {/* Instruments Selection */}
               <div>
                 <label className="block text-gray-300 mb-2">Instruments</label>
                 <div className="bg-gray-800/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                   {dynamicDataLoading ? (
                     <div className="text-gray-400 text-center py-4">Loading instruments...</div>
                   ) : (
                     <div>
                       {Object.entries(getInstrumentsCategories()).map(([category, instruments]) => (
                         <div key={category} className="mb-4">
                           <button
                             type="button"
                             onClick={() => toggleInstrumentCategory(category)}
                             className="flex items-center justify-between w-full p-2 text-left text-white hover:bg-gray-700/50 rounded"
                           >
                             <span className="font-medium">{category}</span>
                             {expandedInstrumentCategories.has(category) ? (
                               <ChevronDown className="w-4 h-4" />
                             ) : (
                               <ChevronRight className="w-4 h-4" />
                             )}
                           </button>
                           {expandedInstrumentCategories.has(category) && (
                             <div className="ml-4 mt-2 space-y-1">
                               {instruments.map((instrument: string) => (
                                 <label key={instrument} className="flex items-center space-x-2 text-gray-300">
                                   <input
                                     type="checkbox"
                                     checked={formData.selectedInstruments.includes(instrument)}
                                     onChange={(e) => handleMultiSelectChange('selectedInstruments', instrument, e.target.checked)}
                                     className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                   />
                                   <span>{instrument}</span>
                                 </label>
                               ))}
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               {/* Media Usage Types */}
               {deepMediaSearchEnabled && (
                 <div>
                   <label className="block text-gray-300 mb-2">Media Usage Types</label>
                   <div className="bg-gray-800/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                     {dynamicDataLoading ? (
                       <div className="text-gray-400 text-center py-4">Loading media types...</div>
                     ) : (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                         {mediaTypes.map((mediaType) => (
                           <label key={mediaType.id} className="flex items-center space-x-2 text-gray-300">
                             <input
                               type="checkbox"
                               checked={formData.selectedMediaUsage.includes(mediaType.name)}
                               onChange={(e) => handleMultiSelectChange('selectedMediaUsage', mediaType.name, e.target.checked)}
                               className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                             />
                             <span className="text-sm">{mediaType.name}</span>
                           </label>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}
              
              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Describe the track, its intended use, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Audio File *</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      ref={audioFileRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, 'audio')}
                      className="hidden"
                    />
                    <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      {formData.audioFile ? formData.audioFile.name : 'Click to upload audio file'}
                    </p>
                    <button
                      type="button"
                      onClick={() => audioFileRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Artwork (Optional)</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      ref={artworkFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'artwork')}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      {formData.artworkFile ? formData.artworkFile.name : 'Click to upload artwork'}
                    </p>
                    <button
                      type="button"
                      onClick={() => artworkFileRef.current?.click()}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Rights Declaration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Rights Declaration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Master Rights Owner *</label>
                  <input
                    type="text"
                    name="masterRightsOwner"
                    value={formData.masterRightsOwner}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Who owns the master recording?"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Publishing Rights Owner *</label>
                  <input
                    type="text"
                    name="publishingRightsOwner"
                    value={formData.publishingRightsOwner}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Who owns the publishing rights?"
                  />
                </div>
              </div>
              
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Rights Declaration</h3>
                <p className="text-gray-300 text-sm">
                  By uploading this track, you declare that you have the legal authority to license this content 
                  and that all rights holders have been properly credited and compensated according to the split sheet.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Split Sheet */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Split Sheet</h2>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Participant
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.participants.map((participant, index) => (
                  <div key={participant.id} className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-semibold">Participant {index + 1}</h3>
                      {formData.participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Name *</label>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          placeholder="Full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Role *</label>
                        <select
                          value={participant.role}
                          onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="writer">Writer</option>
                          <option value="producer">Producer</option>
                          <option value="publisher">Publisher</option>
                          <option value="performer">Performer</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Percentage *</label>
                        <input
                          type="number"
                          value={participant.percentage}
                          onChange={(e) => updateParticipant(participant.id, 'percentage', parseFloat(e.target.value))}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={participant.email}
                          onChange={(e) => updateParticipant(participant.id, 'email', e.target.value)}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">PRO</label>
                        <select
                          value={participant.pro}
                          onChange={(e) => updateParticipant(participant.id, 'pro', e.target.value)}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select PRO</option>
                          <option value="ascap">ASCAP</option>
                          <option value="bmi">BMI</option>
                          <option value="sesac">SESAC</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Publisher</label>
                        <input
                          type="text"
                          value={participant.publisher}
                          onChange={(e) => updateParticipant(participant.id, 'publisher', e.target.value)}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          placeholder="Publisher name"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-2">Total Percentage</h3>
                <p className="text-gray-300">
                  Current total: {formData.participants.reduce((sum, p) => sum + p.percentage, 0)}%
                  {formData.participants.reduce((sum, p) => sum + p.percentage, 0) !== 100 && (
                    <span className="text-yellow-400 ml-2">(Should equal 100%)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Co-signers */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Co-signers (Optional)</h2>
                <button
                  type="button"
                  onClick={addCoSigner}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Co-signer
                </button>
              </div>
              
              {formData.coSigners.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No co-signers added yet</p>
                  <p className="text-gray-400 text-sm">
                    Co-signers will receive email invitations to sign the split sheet electronically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.coSigners.map((coSigner, index) => (
                    <div key={coSigner.id} className="bg-gray-800/30 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-semibold">Co-signer {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeCoSigner(coSigner.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 mb-2">Name *</label>
                          <input
                            type="text"
                            value={coSigner.name}
                            onChange={(e) => updateCoSigner(coSigner.id, 'name', e.target.value)}
                            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-2">Email *</label>
                          <input
                            type="email"
                            value={coSigner.email}
                            onChange={(e) => updateCoSigner(coSigner.id, 'email', e.target.value)}
                            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="email@example.com"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-gray-300 mb-2">Role</label>
                          <input
                            type="text"
                            value={coSigner.role}
                            onChange={(e) => updateCoSigner(coSigner.id, 'role', e.target.value)}
                            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Co-writer, Producer, Publisher"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">E-Signature Process</h3>
                <p className="text-gray-300 text-sm">
                  Co-signers will receive secure email invitations to electronically sign the split sheet. 
                  The track will be available for licensing once all signatures are collected.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-4">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={uploading || !validateStep(currentStep)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Upload Track
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
