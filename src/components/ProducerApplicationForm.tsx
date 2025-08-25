import React, { useState, useEffect } from 'react';
import { CheckCircle, User, Mail, Music, Briefcase, Info, ArrowRight, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRefreshPrevention, clearUnsavedChanges } from '../utils/preventRefresh';

const proOptions = [
  '',
  'ASCAP',
  'BMI',
  'SESAC',
  'None',
  'Other',
];

const proficiencyOptions = [
  'beginner',
  'intermediate',
  'pro'
];

// Quiz questions and correct answers
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

const steps = ['Contact Info', 'Experience', 'Music & Links', 'Business Details', 'Screening Questions', 'Sync Licensing Course', 'Quiz', 'Additional Info'];

const initialFormData = {
  name: '',
  email: '',
  primary_genre: '',
  secondary_genre: '',
  years_experience: '',
  daws_used: '',
  team_type: '',
  tracks_per_week: '',
  instruments: '', // Keep for backward compatibility
  sample_use: '',
  splice_use: '',
  loop_use: '',
  ai_generated_music: '',
  artist_collab: '',
  business_entity: '',
  pro_affiliation: '',
  additional_info: '',
  // New fields
  instrument_one: '',
  instrument_one_proficiency: '',
  instrument_two: '',
  instrument_two_proficiency: '',
  instrument_three: '',
  instrument_three_proficiency: '',
  instrument_four: '',
  instrument_four_proficiency: '',
  records_artists: '',
  artist_example_link: '',
  // Sync licensing and quiz fields
  sync_licensing_course: '',
  quiz_question_1: '',
  quiz_question_2: '',
  quiz_question_3: '',
  quiz_question_4: '',
  quiz_question_5: '',
  quiz_score: 0,
  quiz_total_questions: 5,
  quiz_completed: false,
  // Screening questions
  signed_to_label: '',
  label_relationship_explanation: '',
  signed_to_publisher: '',
  publisher_relationship_explanation: '',
  signed_to_manager: '',
  manager_relationship_explanation: '',
  entity_collects_payment: '',
  payment_collection_explanation: '',
  production_master_percentage: '',
};

// Local storage key for form data persistence
const FORM_STORAGE_KEY = 'producer_application_form_data';
const FORM_STEP_KEY = 'producer_application_form_step';

const ProducerApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = Object.values(formData).some(value => 
    typeof value === 'string' && value.trim() !== ''
  );

  // Temporarily disabled refresh prevention to fix tab switching issue
  // useRefreshPrevention(hasUnsavedChanges);

  // Load saved form data on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem(FORM_STORAGE_KEY);
    const savedStep = localStorage.getItem(FORM_STEP_KEY);
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
    
    if (savedStep) {
      try {
        const parsedStep = parseInt(savedStep);
        if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < steps.length) {
          setStep(parsedStep);
        }
      } catch (error) {
        console.error('Error loading saved step:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STEP_KEY, step.toString());
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Clear saved form data when application is successfully submitted
  const clearSavedFormData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(FORM_STEP_KEY);
    // Temporarily disabled to fix tab switching issue
    // clearUnsavedChanges(); // Clear refresh prevention
  };

  // Validation functions for each step
  const validateStep = (currentStep: number): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 0: // Contact Info
        if (!formData.name.trim()) errors.push('Full name is required');
        if (!formData.email.trim()) errors.push('Email is required');
        if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
          errors.push('Please enter a valid email address');
        }
        break;
      
      case 1: // Experience
        if (!formData.primary_genre.trim()) errors.push('Primary genre is required');
        if (!formData.years_experience.trim()) errors.push('Years of experience is required');
        if (!formData.daws_used.trim()) errors.push('DAWs used is required');
        if (!formData.team_type) errors.push('Team type is required');
        if (!formData.tracks_per_week.trim()) errors.push('Tracks per week is required');
        break;
      
      case 2: // Music & Links
        if (!formData.sample_use) errors.push('Please select whether you use samples');
        if (!formData.splice_use) errors.push('Please select whether you use Splice');
        if (!formData.loop_use) errors.push('Please select whether you use loops');
        if (!formData.ai_generated_music) errors.push('Please select whether you use AI to create music');
        if (!formData.records_artists) errors.push('Please select whether you record artists');
        break;
      
      case 3: // Business Details
        if (!formData.pro_affiliation) errors.push('PRO affiliation is required');
        break;
      
      case 4: // Screening Questions
        if (!formData.signed_to_label) errors.push('Please answer whether you are signed to a label');
        if (!formData.signed_to_publisher) errors.push('Please answer whether you are signed to a publisher');
        if (!formData.signed_to_manager) errors.push('Please answer whether you are signed to a manager or agent');
        if (!formData.entity_collects_payment) errors.push('Please answer whether an entity collects payment for your music');
        if (!formData.production_master_percentage) errors.push('Please enter your production master ownership percentage');
        if (formData.production_master_percentage && (parseInt(formData.production_master_percentage) < 0 || parseInt(formData.production_master_percentage) > 100)) {
          errors.push('Production master percentage must be between 0 and 100');
        }
        break;
      
      case 5: // Sync Licensing Course
        if (!formData.sync_licensing_course) errors.push('Please select whether you have completed a sync licensing course');
        break;
      
      case 6: // Quiz
        if (!formData.quiz_question_1) errors.push('Please answer quiz question 1');
        if (!formData.quiz_question_2) errors.push('Please answer quiz question 2');
        if (!formData.quiz_question_3) errors.push('Please answer quiz question 3');
        if (!formData.quiz_question_4) errors.push('Please answer quiz question 4');
        if (!formData.quiz_question_5) errors.push('Please answer quiz question 5');
        break;
      
      default:
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const calculateQuizScore = () => {
    let score = 0;
    const totalQuestions = quizQuestions.length;

    quizQuestions.forEach((question, index) => {
      const userAnswer = formData[`quiz_question_${index + 1}` as keyof typeof formData] as string;
      
      if (question.isMultipleChoice) {
        // For multiple choice questions, check if user selected all correct answers
        const userAnswers = userAnswer ? userAnswer.split(',').sort() : [];
        const correctAnswers = question.correctAnswers ? question.correctAnswers.sort() : [];
        
        if (userAnswers.length === correctAnswers.length && 
            userAnswers.every((answer, i) => answer === correctAnswers[i])) {
          score++;
        }
      } else {
        // For single choice questions
        if (userAnswer === question.correctAnswer) {
          score++;
        }
      }
    });

    return Math.round((score / totalQuestions) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the final step before submission
    if (!validateStep(step)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    
    // Calculate quiz score
    const quizScore = calculateQuizScore();
    
    // Check if AI-generated music is "Yes" - this is a disqualifying factor
    const isDisqualified = formData.ai_generated_music === 'Yes';
    
    // Prepare the data to insert
    const submissionData = {
      ...formData,
      quiz_score: quizScore,
      quiz_completed: true,
      auto_disqualified: isDisqualified,
      status: 'new', // Ensure new applications have 'new' status
      is_auto_rejected: false // Ensure new applications are not auto-rejected
    };
    
    const { error } = await supabase.from('producer_applications').insert([submissionData]);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setFormData(initialFormData);
      clearSavedFormData(); // Clear saved data after successful submission
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for your producer application. We'll review your submission and get back to you within 5-7 business days.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Producer Application</h1>
            <p className="text-xl text-blue-200">
              Join our sync licensing platform and get your music featured in TV, film, and advertising
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Step {step + 1} of {steps.length}</span>
              <span className="text-sm text-gray-300">{Math.round(((step + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              {steps.map((stepName, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    index <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <span className="text-sm font-medium">{stepName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="text-red-400 font-semibold">Please complete all required fields:</h3>
                    <ul className="text-red-400 text-sm space-y-1 mt-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Step Content */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      required
                    />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Genre <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="primary_genre"
                      type="text"
                      value={formData.primary_genre}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., Hip-Hop, Pop, Rock, Electronic"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Secondary Genre (Optional)
                    </label>
                    <input
                      name="secondary_genre"
                      type="text"
                      value={formData.secondary_genre}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., Trap, R&B, Alternative"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Years of Experience <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="years_experience"
                      type="text"
                      value={formData.years_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., 3 years"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      DAWs Used (comma separated) <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="daws_used"
                      type="text"
                      value={formData.daws_used}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., FL Studio, Logic Pro, Ableton"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Team Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="team_type"
                      value={formData.team_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      required
                    >
                      <option value="">Select Team Type</option>
                      <option value="One Man Team">One Man Team</option>
                      <option value="Band">Band</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tracks per Week <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="tracks_per_week"
                      type="text"
                      value={formData.tracks_per_week}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., 5-10 tracks"
                      required
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Instruments You Play (up to 4)</h3>
                    
                    {/* Instrument 1 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Instrument 1</label>
                        <input 
                          name="instrument_one" 
                          type="text"
                          value={formData.instrument_one} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                          placeholder="e.g., Piano, Guitar, Drums"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency</label>
                        <select 
                          name="instrument_one_proficiency" 
                          value={formData.instrument_one_proficiency} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                        >
                          <option value="">Select Level</option>
                          {proficiencyOptions.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instrument 2 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Instrument 2</label>
                        <input 
                          name="instrument_two" 
                          type="text"
                          value={formData.instrument_two} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                          placeholder="e.g., Bass, Saxophone, Violin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency</label>
                        <select 
                          name="instrument_two_proficiency" 
                          value={formData.instrument_two_proficiency} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                        >
                          <option value="">Select Level</option>
                          {proficiencyOptions.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instrument 3 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Instrument 3</label>
                        <input 
                          name="instrument_three" 
                          type="text"
                          value={formData.instrument_three} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                          placeholder="e.g., Synth, Trumpet, Cello"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency</label>
                        <select 
                          name="instrument_three_proficiency" 
                          value={formData.instrument_three_proficiency} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                        >
                          <option value="">Select Level</option>
                          {proficiencyOptions.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instrument 4 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Instrument 4</label>
                        <input 
                          name="instrument_four" 
                          type="text"
                          value={formData.instrument_four} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                          placeholder="e.g., Harmonica, Flute, Accordion"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency</label>
                        <select 
                          name="instrument_four_proficiency" 
                          value={formData.instrument_four_proficiency} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                        >
                          <option value="">Select Level</option>
                          {proficiencyOptions.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Production Tools & Methods */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Production Tools & Methods</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Do you use samples from 3rd parties? <span className="text-red-400">*</span>
                      </label>
                      <select 
                        name="sample_use" 
                        value={formData.sample_use} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Do you use Splice? <span className="text-red-400">*</span>
                      </label>
                      <select 
                        name="splice_use" 
                        value={formData.splice_use} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Do you use loops from other producers? <span className="text-red-400">*</span>
                      </label>
                      <select 
                        name="loop_use" 
                        value={formData.loop_use} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Do you use AI to create music? <span className="text-red-400">*</span>
                      </label>
                      <select 
                        name="ai_generated_music" 
                        value={formData.ai_generated_music} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Do you record artists? <span className="text-red-400">*</span>
                      </label>
                      <select 
                        name="records_artists" 
                        value={formData.records_artists} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {formData.records_artists === 'Yes' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Link to example of artist recording (Optional)
                        </label>
                        <input 
                          name="artist_example_link" 
                          type="url"
                          value={formData.artist_example_link} 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                          placeholder="https://example.com/recording"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Are you an LLC or other registered business? (Optional)
                    </label>
                    <input 
                      name="business_entity" 
                      type="text"
                      value={formData.business_entity} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      placeholder="e.g., MyMusic LLC, Sole Proprietorship"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select your PRO (ASCAP, BMI, etc.) <span className="text-red-400">*</span>
                    </label>
                    <select 
                      name="pro_affiliation" 
                      value={formData.pro_affiliation} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                    >
                      <option value="">Select your PRO</option>
                      {proOptions.slice(1).map((pro) => (
                        <option key={pro} value={pro}>{pro}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Screening Questions</h3>
                    <p className="text-gray-300 text-sm">
                      Please answer these questions to help us understand your current music business relationships.
                    </p>
                  </div>
                  
                  {/* Label Question */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-white">Are you signed to a label?</h3>
                    <select 
                      name="signed_to_label" 
                      value={formData.signed_to_label} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white mb-3"
                    >
                      <option value="">Select an option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {formData.signed_to_label === 'Yes' && (
                      <textarea 
                        name="label_relationship_explanation" 
                        placeholder="Please explain your relationship with the label..." 
                        value={formData.label_relationship_explanation} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                        rows={3} 
                      />
                    )}
                  </div>

                  {/* Publisher Question */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-white">Are you signed to a publisher?</h3>
                    <select 
                      name="signed_to_publisher" 
                      value={formData.signed_to_publisher} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white mb-3"
                    >
                      <option value="">Select an option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {formData.signed_to_publisher === 'Yes' && (
                      <textarea 
                        name="publisher_relationship_explanation" 
                        placeholder="Please explain your relationship with the publisher..." 
                        value={formData.publisher_relationship_explanation} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                        rows={3} 
                      />
                    )}
                  </div>

                  {/* Manager/Agent Question */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-white">Are you signed to a manager or agent?</h3>
                    <select 
                      name="signed_to_manager" 
                      value={formData.signed_to_manager} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white mb-3"
                    >
                      <option value="">Select an option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {formData.signed_to_manager === 'Yes' && (
                      <textarea 
                        name="manager_relationship_explanation" 
                        placeholder="Please explain your relationship with your manager/agent..." 
                        value={formData.manager_relationship_explanation} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                        rows={3} 
                      />
                    )}
                  </div>

                  {/* Payment Collection Question */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-white">Does anyone or any entity collect payment for your music on your behalf?</h3>
                    <select 
                      name="entity_collects_payment" 
                      value={formData.entity_collects_payment} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white mb-3"
                    >
                      <option value="">Select an option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {formData.entity_collects_payment === 'Yes' && (
                      <textarea 
                        name="payment_collection_explanation" 
                        placeholder="Please explain who collects payments and how..." 
                        value={formData.payment_collection_explanation} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                        rows={3} 
                      />
                    )}
                  </div>

                  {/* Production Master Percentage Question */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-white">What percentage of the production master do you typically own?</h3>
                    <input 
                      name="production_master_percentage" 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="Enter percentage (0-100)" 
                      value={formData.production_master_percentage} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                    />
                    <p className="text-sm text-gray-400 mt-2">Enter the percentage you typically own of your production masters (e.g., 100 for 100%)</p>
                  </div>
                </div>
              )}
                             {step === 5 && (
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
                         name="sync_licensing_course" 
                         value={formData.sync_licensing_course} 
                         onChange={handleChange} 
                         required 
                         className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                       >
                         <option value="">Select an option</option>
                         <option value="Yes">Yes, I have completed the course</option>
                         <option value="No">No, I need more time to review</option>
                       </select>
                     </div>
                   </div>
                 </div>
               )}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Sync Licensing Quiz</h3>
                    <p className="text-gray-300 text-sm">
                      Please answer these questions about sync licensing. This helps us understand your knowledge level.
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
                              name={`quiz_question_${index + 1}`}
                              value={String.fromCharCode(65 + optionIndex)} // A, B, C, D
                              checked={question.isMultipleChoice 
                                ? formData[`quiz_question_${index + 1}` as keyof typeof formData]?.includes(String.fromCharCode(65 + optionIndex))
                                : formData[`quiz_question_${index + 1}` as keyof typeof formData] === String.fromCharCode(65 + optionIndex)
                              }
                              onChange={(e) => {
                                if (question.isMultipleChoice) {
                                  const currentAnswers = formData[`quiz_question_${index + 1}` as keyof typeof formData] as string || '';
                                  const answer = e.target.value;
                                  
                                  if (e.target.checked) {
                                    // Add answer
                                    const newAnswers = currentAnswers ? `${currentAnswers},${answer}` : answer;
                                    setFormData({ ...formData, [`quiz_question_${index + 1}`]: newAnswers });
                                  } else {
                                    // Remove answer
                                    const newAnswers = currentAnswers.split(',').filter(a => a !== answer).join(',');
                                    setFormData({ ...formData, [`quiz_question_${index + 1}`]: newAnswers });
                                  }
                                } else {
                                  handleChange(e);
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
              )}
              {step === 7 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea 
                      name="additional_info" 
                      placeholder="Tell us anything else we should know..." 
                      value={formData.additional_info} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white" 
                      rows={4} 
                    />
                  </div>
                </div>
              )}

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
                  disabled={step === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Previous</span>
                </button>

                {step < steps.length - 1 ? (
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
                    disabled={submitting}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
                  >
                    {submitting ? (
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

export default ProducerApplicationForm;
