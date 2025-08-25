import React, { useState, useEffect } from 'react';
import { CheckCircle, User, Mail, Music, Briefcase, Info, ArrowRight, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRefreshPrevention, clearUnsavedChanges } from '../utils/preventRefresh';

const steps = ['Basic Profile', 'Production & Creation', 'Ownership & Rights', 'Releases & Catalog', 'Sync Suitability', 'Account Management', 'Sync Licensing Course', 'Quiz'];

// Quiz questions and correct answers (same as producer applications)
const quizQuestions = [
  {
    id: 1,
    question: "What does \"one-stop\" mean in music licensing?",
    options: [
      "A song that is only available in one country",
      "A track made using one sample or instrument", 
      "The producer controls both the master and publishing rights",
      "The song has only one version (no stems or edits)"
    ],
    correctAnswer: "C",
    explanation: "One-stop means the producer controls both the master and publishing rights, making licensing easier."
  },
  {
    id: 2,
    question: "Which of the following best describes a \"sync license\"?",
    options: [
      "A license to perform a song live",
      "A license to use a song in a film, TV show, or commercial",
      "A license to sell music on streaming platforms", 
      "A license to sample another artist's music"
    ],
    correctAnswer: "B",
    explanation: "A sync license allows music to be synchronized with visual media like films, TV shows, or commercials."
  },
  {
    id: 3,
    question: "Who typically needs to grant permission for a sync license to be approved?",
    options: [
      "The performing artist",
      "The owner of the master recording", 
      "The owner of the publishing rights",
      "The distributor (e.g., DistroKid)"
    ],
    correctAnswers: ["B", "C"],
    explanation: "Both the master and the publishing rights holders must approve the sync license.",
    isMultipleChoice: true
  },
  {
    id: 4,
    question: "What is the main difference between a master license and a sync license?",
    options: [
      "A master license is more expensive",
      "A sync license is only for film and TV",
      "A master license covers the recording, a sync license covers the composition",
      "A sync license is only for streaming platforms"
    ],
    correctAnswer: "C",
    explanation: "A master license covers the recording itself, while a sync license covers the composition and its use in visual media."
  },
  {
    id: 5,
    question: "Which of the following is typically NOT included in a sync license?",
    options: [
      "The right to use the music in a film",
      "The right to modify the music",
      "The right to use the music in a TV commercial",
      "The right to use the music in a video game"
    ],
    correctAnswer: "B",
    explanation: "Modifying the music typically requires separate permission and is not automatically included in a sync license."
  }
];

const initialFormData = {
  name: '',
  email: '',
  artist_type: '',
  primary_genre: '',
  stage_name: '',
  music_producer: '',
  production_method: '',
  uses_premade_tracks: '',
  master_rights_owner: '',
  publishing_rights_owner: '',
  shares_ownership: '',
  ownership_explanation: '',
  is_one_stop: '',
  has_streaming_releases: '',
  streaming_links: '',
  catalog_track_count: '',
  has_instrumentals: '',
  has_stems: '',
  has_sync_licenses: '',
  understands_rights_requirement: '',
  account_manager_name: '',
  account_manager_email: '',
  account_manager_phone: '',
  account_manager_authority: '',
  additional_info: '',
  // Sync licensing and quiz fields
  sync_licensing_course: '',
  quiz_question_1: '',
  quiz_question_2: '',
  quiz_question_3: '',
  quiz_question_4: '',
  quiz_question_5: '',
  quiz_score: 0,
  quiz_total_questions: 5,
  quiz_completed: false
};

// Local storage key for form data persistence
const FORM_STORAGE_KEY = 'artist_application_form_data';
const FORM_STEP_KEY = 'artist_application_form_step';

const ArtistApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    const savedStep = localStorage.getItem(FORM_STEP_KEY);
    
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
    
    // Clear any existing error state on component mount
    setError('');
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(FORM_STEP_KEY, currentStep.toString());
  }, [formData, currentStep]);

  // Prevent accidental page refresh
  useRefreshPrevention();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear any previous errors when user makes changes
    if (error) {
      setError('');
    }
  };

  const calculateQuizScore = (data: typeof formData): number => {
    let score = 0;
    
    // Question 1: One-stop definition
    if (data.quiz_question_1 === 'C') score += 1;
    
    // Question 2: Sync license definition
    if (data.quiz_question_2 === 'B') score += 1;
    
    // Question 3: Multiple choice - both B and C
    if (data.quiz_question_3 && data.quiz_question_3.includes('B') && data.quiz_question_3.includes('C')) score += 1;
    
    // Question 4: Master vs sync license
    if (data.quiz_question_4 === 'C') score += 1;
    
    // Question 5: What's NOT included in sync license
    if (data.quiz_question_5 === 'B') score += 1;
    
    return score;
  };

  const calculateScore = (data: typeof formData): number => {
    let score = 0;
    const breakdown: any = {};

    // Basic Profile (20 points)
    if (data.artist_type) score += 5;
    if (data.primary_genre) score += 5;
    if (data.stage_name) score += 5;
    if (data.name && data.email) score += 5;
    breakdown.basicProfile = score;

    // Production & Creation (15 points)
    if (data.music_producer) score += 5;
    if (data.production_method) score += 5;
    if (data.uses_premade_tracks === 'No') score += 5; // Bonus for not using premade tracks
    breakdown.production = score - breakdown.basicProfile;

    // Ownership & Rights (25 points)
    if (data.master_rights_owner) score += 5;
    if (data.publishing_rights_owner) score += 5;
    if (data.is_one_stop === 'Yes') score += 10; // Bonus for one-stop
    if (data.shares_ownership === 'No') score += 5; // Bonus for full ownership
    breakdown.ownership = score - breakdown.basicProfile - breakdown.production;

    // Releases & Catalog (20 points)
    if (data.has_streaming_releases === 'Yes') score += 10;
    if (data.streaming_links) score += 5;
    if (data.catalog_track_count && parseInt(data.catalog_track_count) > 5) score += 5;
    breakdown.catalog = score - breakdown.basicProfile - breakdown.production - breakdown.ownership;

    // Sync Suitability (15 points)
    if (data.has_sync_licenses === 'Yes') score += 10;
    if (data.understands_rights_requirement === 'Yes') score += 5;
    breakdown.syncSuitability = score - breakdown.basicProfile - breakdown.production - breakdown.ownership - breakdown.catalog;

    // Account Management (5 points)
    if (data.account_manager_name && data.account_manager_email && data.account_manager_phone) score += 5;
    breakdown.accountManagement = score - breakdown.basicProfile - breakdown.production - breakdown.ownership - breakdown.catalog - breakdown.syncSuitability;

    return Math.min(score, 100); // Cap at 100
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const score = calculateScore(formData);
      const quizScore = calculateQuizScore(formData);
      const scoreBreakdown = {
        basicProfile: 20,
        production: 15,
        ownership: 25,
        catalog: 20,
        syncSuitability: 15,
        accountManagement: 5
      };

      const { error } = await supabase
        .from('artist_applications')
        .insert({
          ...formData,
          application_score: score,
          quiz_score: quizScore,
          quiz_completed: true,
          score_breakdown: scoreBreakdown,
          status: 'new'
        });

      if (error) throw error;

      // Clear saved form data
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(FORM_STEP_KEY);
      clearUnsavedChanges();

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(''); // Clear any previous errors when navigating
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(''); // Clear any previous errors when navigating
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Profile
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Are you a solo artist, duo, or band? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.artist_type}
                onChange={(e) => handleInputChange('artist_type', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              >
                <option value="">Select...</option>
                <option value="solo">Solo Artist</option>
                <option value="duo">Duo</option>
                <option value="band">Band</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Genre/Style of Music <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.primary_genre}
                onChange={(e) => handleInputChange('primary_genre', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="e.g., Pop, Rock, Hip-Hop, Electronic, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stage/Band Name (if different from legal name)
              </label>
              <input
                type="text"
                value={formData.stage_name}
                onChange={(e) => handleInputChange('stage_name', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="e.g., The Midnight Echoes"
              />
            </div>
          </div>
        );

      case 1: // Production & Creation
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who produces your music tracks? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.music_producer}
                onChange={(e) => handleInputChange('music_producer', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              >
                <option value="">Select...</option>
                <option value="myself">Myself</option>
                <option value="band_member">A band member</option>
                <option value="outside_producer">An outside producer</option>
                <option value="combination">Combination of the above</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How are your music tracks typically produced? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.production_method}
                onChange={(e) => handleInputChange('production_method', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              >
                <option value="">Select...</option>
                <option value="home_studio">Home studio</option>
                <option value="professional_studio">Professional studio</option>
                <option value="collaboration">Collaboration</option>
                <option value="mixed">Mixed approach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you buy pre-made music tracks or instrumentals from sites like Beatstars, Airbit, or similar platforms?
              </label>
              <select
                value={formData.uses_premade_tracks}
                onChange={(e) => handleInputChange('uses_premade_tracks', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        );

      case 2: // Ownership & Rights
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who owns the master recordings for your record releases? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.master_rights_owner}
                onChange={(e) => handleInputChange('master_rights_owner', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              >
                <option value="">Select...</option>
                <option value="myself">Myself/My band</option>
                <option value="label">Record label</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who owns the publishing rights for your music? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.publishing_rights_owner}
                onChange={(e) => handleInputChange('publishing_rights_owner', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                required
              >
                <option value="">Select...</option>
                <option value="myself">Myself/My band</option>
                <option value="publisher">Music publisher</option>
                <option value="label">Record label</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you share ownership with a label, distributor, or co-writer?
              </label>
              <select
                value={formData.shares_ownership}
                onChange={(e) => handleInputChange('shares_ownership', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {formData.shares_ownership === 'Yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Please explain your ownership arrangements:
                </label>
                <textarea
                  value={formData.ownership_explanation}
                  onChange={(e) => handleInputChange('ownership_explanation', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                  rows={4}
                  placeholder="Describe your ownership arrangements..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Are your tracks one-stop (meaning you control both the master and publishing rights)?
              </label>
              <select
                value={formData.is_one_stop}
                onChange={(e) => handleInputChange('is_one_stop', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        );

      case 3: // Releases & Catalog
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Have you released music on streaming platforms (Spotify, Apple Music, etc.)?
              </label>
              <select
                value={formData.has_streaming_releases}
                onChange={(e) => handleInputChange('has_streaming_releases', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {formData.has_streaming_releases === 'Yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Please provide links to your streaming releases:
                </label>
                <textarea
                  value={formData.streaming_links}
                  onChange={(e) => handleInputChange('streaming_links', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                  rows={4}
                  placeholder="Spotify, Apple Music, YouTube, etc. links..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How many tracks are currently in your catalog that you would like to make available for sync licensing?
              </label>
              <input
                type="number"
                value={formData.catalog_track_count}
                onChange={(e) => handleInputChange('catalog_track_count', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="e.g., 10"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you have instrumental versions of your tracks available?
              </label>
              <select
                value={formData.has_instrumentals}
                onChange={(e) => handleInputChange('has_instrumentals', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you have stems (separated audio files like vocals, drums, bass, etc.) available if requested?
              </label>
              <select
                value={formData.has_stems}
                onChange={(e) => handleInputChange('has_stems', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        );

      case 4: // Sync Suitability
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Have any of your songs been licensed for sync before (TV, film, ads, YouTube, etc.)?
              </label>
              <select
                value={formData.has_sync_licenses}
                onChange={(e) => handleInputChange('has_sync_licenses', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you understand and agree that MyBeatFi.io requires you to submit only tracks you fully control the rights to?
              </label>
              <select
                value={formData.understands_rights_requirement}
                onChange={(e) => handleInputChange('understands_rights_requirement', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        );

      case 5: // Account Management
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who is going to be responsible for managing the MyBeatFi.io account on behalf of the band? <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.account_manager_name}
                onChange={(e) => handleInputChange('account_manager_name', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.account_manager_email}
                onChange={(e) => handleInputChange('account_manager_email', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.account_manager_phone}
                onChange={(e) => handleInputChange('account_manager_phone', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Do you give authority to this individual to make licensing decisions on behalf of you and your band?
              </label>
              <select
                value={formData.account_manager_authority}
                onChange={(e) => handleInputChange('account_manager_authority', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => handleInputChange('additional_info', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                rows={4}
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>
        );

      case 6: // Sync Licensing Course
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-4">🎵 Sync Licensing Basics Course</h3>
              <p className="text-gray-300 mb-4">
                Please review this comprehensive course on sync licensing fundamentals before taking the quiz.
              </p>
            </div>

            {/* Module 1: Understanding Sync Licensing */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 1: Understanding Sync Licensing</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">What is Sync Licensing?</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• <strong>"Synchronization"</strong> means pairing music with visual media (TV, film, ads, games, YouTube, etc.)</li>
                    <li>• A sync license gives permission to use your music alongside visual content</li>
                    <li>• Unlike streaming royalties, sync deals are usually upfront, one-time payments (sometimes with backend royalties if broadcasted)</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Why It Matters:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Sync is a growing industry that allows independent artists to earn revenue without major label backing</li>
                    <li>• Music supervisors, brands, and content creators need pre-cleared tracks</li>
                    <li>• Can provide significant income streams beyond traditional music sales</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 2: Master Rights vs. Publishing Rights */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 2: Master Rights vs. Publishing Rights</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Master Rights:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• The actual sound recording</li>
                    <li>• Typically owned by whoever paid for the recording (label, producer, or artist if independent)</li>
                    <li>• Includes the performance, arrangement, and production elements</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Publishing Rights:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• The composition (lyrics + melody)</li>
                    <li>• Usually split between songwriter(s) and publisher(s)</li>
                    <li>• Includes the underlying musical work and lyrics</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h5 className="text-lg font-medium text-yellow-300 mb-2">Key Point:</h5>
                  <p className="text-gray-300 text-sm">To license a track, both the master and the publishing rights must be cleared.</p>
                </div>
              </div>
            </div>

            {/* Module 3: One-Stop Licensing */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 3: One-Stop Licensing</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Definition:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• "One-stop" means the same person or company controls both the master and publishing rights</li>
                    <li>• Example: An independent artist who writes and records their own music</li>
                    <li>• Also applies when a single entity owns all rights to a track</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Why It's Important:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Music supervisors love one-stop tracks because they only need one signature to clear usage</li>
                    <li>• More complex ownership (labels, multiple publishers, co-writers) slows down deals</li>
                    <li>• Increases the likelihood of your music being selected for projects</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 4: Common Licensing Scenarios */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 4: Common Licensing Scenarios</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">TV & Film</h5>
                  <p className="text-gray-300 text-sm ml-4">Background music, opening/closing credits, featured song in a scene</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Advertising</h5>
                  <p className="text-gray-300 text-sm ml-4">Commercials for brands or products</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Video Games</h5>
                  <p className="text-gray-300 text-sm ml-4">Soundtracks, trailers, or in-game background music</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Online Content</h5>
                  <p className="text-gray-300 text-sm ml-4">YouTube, social media, influencer campaigns</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Corporate & Trailers</h5>
                  <p className="text-gray-300 text-sm ml-4">Event videos, movie trailers, presentations</p>
                </div>
              </div>
            </div>

            {/* Module 5: Rights & Permissions */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 5: Rights & Permissions</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">What You Need Before Licensing:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Confirm ownership of both master + publishing rights</li>
                    <li>• If multiple people own shares, all must approve the license</li>
                    <li>• If samples are used, they must be cleared (uncleared samples = legal risk)</li>
                    <li>• Ensure all co-writers and producers have signed agreements</li>
                  </ul>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h5 className="text-lg font-medium text-green-300 mb-2">Permissions Checklist:</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>✅ Do you own the master recording?</li>
                    <li>✅ Do you own or control the publishing rights?</li>
                    <li>✅ Are there co-writers, producers, or labels that need to approve?</li>
                    <li>✅ Are there uncleared samples in your track?</li>
                    <li>✅ Do you have proper documentation of all rights?</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 6: Best Practices for Sync Success */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 6: Best Practices for Sync Success</h4>
              
              <div className="space-y-4">
                <ul className="text-gray-300 text-sm space-y-2 ml-4">
                  <li>• Create instrumental versions of your songs (music supervisors often request them)</li>
                  <li>• Tag your tracks with clear moods, genres, and keywords</li>
                  <li>• Keep paperwork and agreements organized (split sheets, copyright registration)</li>
                  <li>• Understand that sync deals vary: some are exclusive (locked to one library) and others are non-exclusive (you can license elsewhere)</li>
                  <li>• Build relationships with music supervisors and licensing companies</li>
                  <li>• Ensure your tracks are professionally mixed and mastered</li>
                  <li>• Consider creating multiple versions (30s, 60s, full length) of your tracks</li>
                  <li>• Stay current with industry trends and licensing opportunities</li>
                </ul>
              </div>
            </div>

            {/* Course Completion */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Course Completion</h4>
              <p className="text-gray-300 text-sm mb-4">
                You have now completed the Sync Licensing Basics Course. This knowledge will help you understand 
                the licensing process and prepare you for the quiz that follows.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Have you completed the sync licensing course? <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.sync_licensing_course}
                  onChange={(e) => handleInputChange('sync_licensing_course', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes, I have completed the course</option>
                  <option value="No">No, I need more time to review</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 7: // Quiz
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sync Licensing Quiz</h3>
              <p className="text-gray-300 mb-4">
                Please answer the following questions about sync licensing. This helps us understand your knowledge level.
              </p>
            </div>

            {quizQuestions.map((question, index) => (
              <div key={question.id} className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                <h4 className="text-white font-medium mb-4">
                  Question {index + 1}: {question.question}
                </h4>
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type={question.isMultipleChoice ? "checkbox" : "radio"}
                        name={`question_${question.id}`}
                        value={String.fromCharCode(65 + optionIndex)} // A, B, C, D
                        onChange={(e) => {
                          const fieldName = `quiz_question_${question.id}` as keyof typeof formData;
                          if (question.isMultipleChoice) {
                            const currentAnswers = (formData[fieldName] as string) ? (formData[fieldName] as string).split(',').filter(Boolean) : [];
                            let newAnswers;
                            if (e.target.checked) {
                              newAnswers = [...currentAnswers, e.target.value];
                            } else {
                              newAnswers = currentAnswers.filter((ans: string) => ans !== e.target.value);
                            }
                            handleInputChange(fieldName, newAnswers.join(','));
                          } else {
                            handleInputChange(fieldName, e.target.value);
                          }
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for your artist application. We'll review your submission and get back to you within 5-7 business days.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Artist/Band Application</h1>
            <p className="text-xl text-blue-200">
              Join our sync licensing platform and get your music featured in TV, film, and advertising
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-300">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <span className="text-sm font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStep()}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Previous</span>
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistApplicationForm;
