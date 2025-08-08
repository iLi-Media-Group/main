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

const steps = ['Contact Info', 'Experience', 'Music & Links', 'Business Details', 'Sync Licensing Course', 'Quiz', 'Additional Info'];

const initialFormData = {
  name: '',
  email: '',
  primary_genre: '',
  secondary_genre: '',
  years_experience: '',
  daws_used: '',
  team_type: '',
  tracks_per_week: '',
  spotify_link: '',
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

  // Use refresh prevention hook
  useRefreshPrevention(hasUnsavedChanges);

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
    clearUnsavedChanges(); // Clear refresh prevention
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
        if (!formData.spotify_link.trim()) errors.push('Spotify link is required');
        if (!formData.sample_use) errors.push('Please select whether you use samples');
        if (!formData.splice_use) errors.push('Please select whether you use Splice');
        if (!formData.loop_use) errors.push('Please select whether you use loops');
        if (!formData.ai_generated_music) errors.push('Please select whether you use AI to create music');
        if (!formData.records_artists) errors.push('Please select whether you record artists');
        break;
      
      case 3: // Business Details
        if (!formData.pro_affiliation) errors.push('PRO affiliation is required');
        break;
      
      case 4: // Sync Licensing
        if (!formData.sync_licensing_course) errors.push('Please select whether you have completed a sync licensing course');
        break;
      
      case 5: // Quiz
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
      auto_disqualified: isDisqualified
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
      <div className="max-w-6xl mx-auto p-8 bg-green-50 rounded-xl shadow-lg flex flex-col items-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-green-800">Thank you!</h2>
        <p className="text-green-700 text-center">Your application has been submitted. Our team will review and contact you if selected.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg space-y-8 mt-8">
      {/* Progress Bar */}
      <div className="flex items-center mb-6 overflow-x-auto">
        {steps.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex items-center flex-shrink-0 ${idx <= step ? 'text-blue-600' : 'text-gray-400'}`}> 
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${idx <= step ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white/20'}`}>{idx + 1}</div>
              <span className="ml-2 font-medium text-sm whitespace-nowrap">{label}</span>
            </div>
            {idx < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded min-w-8 ${idx < step ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-red-800 font-semibold">Please complete all required fields:</h3>
          </div>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><User className="w-5 h-5 mr-2" />Contact Info</h2>
          <input name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
          <input name="email" type="email" placeholder="Email *" value={formData.email} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><Music className="w-5 h-5 mr-2" />Experience</h2>
          <input name="primary_genre" placeholder="Primary Genre *" value={formData.primary_genre} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
          <input name="secondary_genre" placeholder="Secondary Genre (optional)" value={formData.secondary_genre} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <input name="years_experience" placeholder="Years of Experience *" value={formData.years_experience} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
          <input name="daws_used" placeholder="DAWs Used (comma separated) *" value={formData.daws_used} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
          <select name="team_type" value={formData.team_type} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Select Team Type *</option>
            <option value="One Man Team">One Man Team</option>
            <option value="Band">Band</option>
            <option value="Other">Other</option>
          </select>
          <input name="tracks_per_week" placeholder="Tracks per Week *" value={formData.tracks_per_week} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><Music className="w-5 h-5 mr-2" />Music & Links</h2>
          <input name="spotify_link" placeholder="Best Spotify Link to Your Work *" value={formData.spotify_link} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
          
          {/* Instruments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Instruments You Play (up to 4)</h3>
            
            {/* Instrument 1 */}
            <div className="grid grid-cols-3 gap-2">
              <input 
                name="instrument_one" 
                placeholder="Instrument 1" 
                value={formData.instrument_one} 
                onChange={handleChange} 
                className="col-span-2 border p-3 rounded text-black" 
              />
              <select 
                name="instrument_one_proficiency" 
                value={formData.instrument_one_proficiency} 
                onChange={handleChange} 
                className="border p-3 rounded text-black"
              >
                <option value="">Level</option>
                {proficiencyOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Instrument 2 */}
            <div className="grid grid-cols-3 gap-2">
              <input 
                name="instrument_two" 
                placeholder="Instrument 2" 
                value={formData.instrument_two} 
                onChange={handleChange} 
                className="col-span-2 border p-3 rounded text-black" 
              />
              <select 
                name="instrument_two_proficiency" 
                value={formData.instrument_two_proficiency} 
                onChange={handleChange} 
                className="border p-3 rounded text-black"
              >
                <option value="">Level</option>
                {proficiencyOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Instrument 3 */}
            <div className="grid grid-cols-3 gap-2">
              <input 
                name="instrument_three" 
                placeholder="Instrument 3" 
                value={formData.instrument_three} 
                onChange={handleChange} 
                className="col-span-2 border p-3 rounded text-black" 
              />
              <select 
                name="instrument_three_proficiency" 
                value={formData.instrument_three_proficiency} 
                onChange={handleChange} 
                className="border p-3 rounded text-black"
              >
                <option value="">Level</option>
                {proficiencyOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Instrument 4 */}
            <div className="grid grid-cols-3 gap-2">
              <input 
                name="instrument_four" 
                placeholder="Instrument 4" 
                value={formData.instrument_four} 
                onChange={handleChange} 
                className="col-span-2 border p-3 rounded text-black" 
              />
              <select 
                name="instrument_four_proficiency" 
                value={formData.instrument_four_proficiency} 
                onChange={handleChange} 
                className="border p-3 rounded text-black"
              >
                <option value="">Level</option>
                {proficiencyOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <select name="sample_use" value={formData.sample_use} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Do you use samples from 3rd parties? *</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <select name="splice_use" value={formData.splice_use} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Do you use Splice? *</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <select name="loop_use" value={formData.loop_use} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Do you use loops from other producers? *</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <select name="ai_generated_music" value={formData.ai_generated_music} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Do you use AI to create music? *</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <select name="records_artists" value={formData.records_artists} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Do you record artists? *</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {formData.records_artists === 'Yes' && (
            <input name="artist_example_link" placeholder="Link to example of artist recording (optional)" value={formData.artist_example_link} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><Briefcase className="w-5 h-5 mr-2" />Business Details</h2>
          <input name="business_entity" placeholder="Are you an LLC or other registered business? (optional)" value={formData.business_entity} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <select name="pro_affiliation" value={formData.pro_affiliation} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            {proOptions.map((pro) => (
              <option key={pro} value={pro}>{pro ? pro : 'Select your PRO (ASCAP, BMI, etc.) *'}</option>
            ))}
          </select>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><Info className="w-5 h-5 mr-2" />Sync Licensing Course</h2>
          <p className="text-white text-sm mb-4">Have you completed a Sync Licensing course online or in person?</p>
          <select name="sync_licensing_course" value={formData.sync_licensing_course} onChange={handleChange} required className="w-full border p-3 rounded text-black">
            <option value="">Select an option *</option>
            <option value="Yes - Online">Yes - Online</option>
            <option value="Yes - In Person">Yes - In Person</option>
            <option value="No">No</option>
          </select>
        </div>
      )}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center"><Info className="w-5 h-5 mr-2" />Sync Licensing Quiz</h2>
          <p className="text-white text-sm mb-6">Please answer these questions about sync licensing. This helps us understand your knowledge level.</p>
          
          {quizQuestions.map((question, index) => (
            <div key={question.id} className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-white">
                Question {index + 1}: {question.question}
              </h3>
              
              {question.isMultipleChoice ? (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`quiz_question_${index + 1}`}
                        value={String.fromCharCode(65 + optionIndex)} // A, B, C, D
                        checked={formData[`quiz_question_${index + 1}` as keyof typeof formData]?.includes(String.fromCharCode(65 + optionIndex))}
                        onChange={(e) => {
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
                        }}
                        className="rounded"
                      />
                      <span className="text-white">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`quiz_question_${index + 1}`}
                        value={String.fromCharCode(65 + optionIndex)} // A, B, C, D
                        checked={formData[`quiz_question_${index + 1}` as keyof typeof formData] === String.fromCharCode(65 + optionIndex)}
                        onChange={handleChange}
                        className="rounded"
                      />
                      <span className="text-white">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {step === 6 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 flex items-center"><Info className="w-5 h-5 mr-2" />Additional Info</h2>
          <textarea name="additional_info" placeholder="Tell us anything else we should know..." value={formData.additional_info} onChange={handleChange} className="w-full border p-3 rounded text-black" rows={4} />
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-600 text-center">{error}</p>}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        {step > 0 ? (
          <button type="button" onClick={prevStep} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Back</button>
        ) : <div />}
        {step < steps.length - 1 ? (
          <button type="button" onClick={nextStep} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 hover:bg-blue-700 transition">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 hover:bg-blue-700 transition">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
          </button>
        )}
      </div>
    </form>
  );
};

export default ProducerApplicationForm;
