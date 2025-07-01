import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Music, 
  Clock, 
  Monitor, 
  Users, 
  TrendingUp, 
  Link, 
  Guitar, 
  FileAudio, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Loader2,
  Star,
  Briefcase,
  Globe
} from 'lucide-react';

const ProducerApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    primary_genre: '',
    secondary_genre: '',
    years_experience: '',
    daws_used: '',
    team_type: '',
    tracks_per_week: '',
    spotify_link: '',
    instruments: '',
    sample_use: '',
    splice_use: '',
    loop_use: '',
    artist_collab: '',
    business_entity: '',
    additional_info: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from('producer_applications').insert([formData]);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        primary_genre: '',
        secondary_genre: '',
        years_experience: '',
        daws_used: '',
        team_type: '',
        tracks_per_week: '',
        spotify_link: '',
        instruments: '',
        sample_use: '',
        splice_use: '',
        loop_use: '',
        artist_collab: '',
        business_entity: '',
        additional_info: '',
      });
    }

    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-300 leading-relaxed">
            Thank you for your interest! Our team will carefully review your application and contact you within 5-7 business days if selected.
          </p>
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <Star className="w-4 h-4 inline mr-2" />
              We'll evaluate your experience, production quality, and fit for our platform.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Producer Application
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Join our exclusive network of professional music producers. Show us your talent and let's create something amazing together.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Personal Information
                </h2>
                <p className="text-gray-400 text-sm">Tell us about yourself</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Music Background */}
            <div className="space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <Music className="w-5 h-5 mr-2 text-purple-400" />
                  Music Background
                </h2>
                <p className="text-gray-400 text-sm">Your musical expertise</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Primary Genre</label>
                  <input
                    name="primary_genre"
                    value={formData.primary_genre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., Hip Hop, Pop, Electronic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Genre (Optional)</label>
                  <input
                    name="secondary_genre"
                    value={formData.secondary_genre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., R&B, Rock, Jazz"
                  />
                </div>
              </div>
            </div>

            {/* Experience & Skills */}
            <div className="space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-400" />
                  Experience & Skills
                </h2>
                <p className="text-gray-400 text-sm">Your production experience</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
                  <input
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., 3 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">DAWs Used</label>
                  <input
                    name="daws_used"
                    value={formData.daws_used}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., Logic Pro, Ableton, FL Studio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Type</label>
                  <select
                    name="team_type"
                    value={formData.team_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select your team type</option>
                    <option value="One Man Team">One Man Team</option>
                    <option value="Band">Band</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Production Details */}
            <div className="space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
                  Production Details
                </h2>
                <p className="text-gray-400 text-sm">Your production workflow</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tracks Per Week</label>
                  <input
                    name="tracks_per_week"
                    value={formData.tracks_per_week}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., 2-3 tracks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Best Spotify Link</label>
                  <div className="relative">
                    <input
                      name="spotify_link"
                      value={formData.spotify_link}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="https://open.spotify.com/track/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Instruments Played</label>
                  <input
                    name="instruments"
                    value={formData.instruments}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., Piano, Guitar, Drums"
                  />
                </div>
              </div>
            </div>

            {/* Sample Usage */}
            <div className="space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <FileAudio className="w-5 h-5 mr-2 text-pink-400" />
                  Sample Usage
                </h2>
                <p className="text-gray-400 text-sm">Your sample workflow</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Use 3rd Party Samples?</label>
                  <select
                    name="sample_use"
                    value={formData.sample_use}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Use Splice?</label>
                  <select
                    name="splice_use"
                    value={formData.splice_use}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Use Producer Loops?</label>
                  <select
                    name="loop_use"
                    value={formData.loop_use}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="md:col-span-2 space-y-6">
              <div className="border-b border-blue-500/20 pb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-indigo-400" />
                  Additional Information
                </h2>
                <p className="text-gray-400 text-sm">Tell us more about your work</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Artist Collaborations</label>
                  <input
                    name="artist_collab"
                    value={formData.artist_collab}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Do you work with artists? Provide examples or links..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Entity (Optional)</label>
                  <input
                    name="business_entity"
                    value={formData.business_entity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., LLC, Corporation, Sole Proprietorship"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Information</label>
                  <textarea
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    placeholder="Tell us anything else we should know about your music, experience, or goals..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </button>
            <p className="text-gray-400 text-sm mt-4">
              We'll review your application and get back to you within 5-7 business days
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProducerApplicationForm;
