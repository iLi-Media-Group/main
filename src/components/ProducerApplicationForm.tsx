import React, { useState } from 'react';
import { CheckCircle, User, Mail, Music, Briefcase, Info, ArrowRight, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const steps = [
  'Contact Info',
  'Experience',
  'Music & Links',
  'Business Details',
  'Additional Info',
];

interface Instrument {
  name: string;
  proficiency: string;
}

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
};

const ProducerApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
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
      
      case 4: // Additional Info
        // Additional info is optional, so no validation needed
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the final step before submission
    if (!validateStep(step)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    
    // Check if AI-generated music is "Yes" - this is a disqualifying factor
    const isDisqualified = formData.ai_generated_music === 'Yes';
    
    // Prepare the data to insert
    const submissionData = {
      ...formData,
      auto_disqualified: isDisqualified
    };
    
    const { error } = await supabase.from('producer_applications').insert([submissionData]);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setFormData(initialFormData);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-green-50 rounded-xl shadow-lg flex flex-col items-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-green-800">Thank you!</h2>
        <p className="text-green-700 text-center">Your application has been submitted. Our team will review and contact you if selected.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg space-y-8 mt-8">
      {/* Progress Bar */}
      <div className="flex items-center mb-6">
        {steps.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex items-center ${idx <= step ? 'text-blue-600' : 'text-gray-400'}`}> 
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${idx <= step ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white/20'}`}>{idx + 1}</div>
              <span className="ml-2 font-medium text-sm hidden sm:inline">{label}</span>
            </div>
            {idx < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${idx < step ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
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
          <input name="tracks_per_week" placeholder="Tracks Produced Per Week *" value={formData.tracks_per_week} onChange={handleChange} required className="w-full border p-3 rounded text-black" />
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
          
          {/* Recording Artists Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Recording Artists</h3>
            <select name="records_artists" value={formData.records_artists} onChange={handleChange} required className="w-full border p-3 rounded text-black">
              <option value="">Do you record artists? *</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {formData.records_artists === 'Yes' && (
              <input 
                name="artist_example_link" 
                placeholder="Example link to an artist you work with" 
                value={formData.artist_example_link} 
                onChange={handleChange} 
                className="w-full border p-3 rounded text-black" 
              />
            )}
          </div>
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
