import React, { useState } from 'react';
import { LogIn, KeyRound, Mic, Podcast, Youtube } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { VideoBackground } from './VideoBackground';

export function WhiteLabelClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useUnifiedAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emailLower = email.toLowerCase().trim();

      // Check if user is an admin
      const isAdmin = ['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(emailLower);
      
      if (!isAdmin) {
        // Verify account type before authentication
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('email', emailLower)
          .maybeSingle();

        if (profileError) {
          if (profileError.code !== 'PGRST116') {
            throw new Error('Failed to verify account type');
          }
          // If no profile found, deny access
          throw new Error('Please use the appropriate login page for your account type');
        }

        // If profile exists but account type is not white_label
        if (profileData && profileData.account_type !== 'white_label') {
          if (profileData.account_type === 'client') {
            throw new Error('Please use the client login page');
          } else if (profileData.account_type === 'producer') {
            throw new Error('Please use the producer login page');
          } else if (profileData.account_type === 'rights_holder') {
            throw new Error('Please use the rights holder login page');
          } else if (profileData.account_type === 'artist_band') {
            throw new Error('Please use the artist login page');
          } else {
            throw new Error('Please use the appropriate login page for your account type');
          }
        }
      }

      // Attempt to sign in
      const { error: signInError } = await signIn(emailLower, password);
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }

      // After login, check if password setup is required
      const { data: client, error: clientError } = await supabase
        .from('white_label_clients')
        .select('id, owner_email, password_setup_required')
        .eq('owner_email', emailLower)
        .maybeSingle();
      if (clientError && clientError.code !== 'PGRST116') {
        throw new Error('Error looking up white label client.');
      }
      if (!client) {
        throw new Error('No white label client found for this email.');
      }
      if (client.password_setup_required) {
        navigate('/white-label-password-setup', { state: { email: emailLower } });
        setLoading(false);
        return;
      }
      navigate('/white-label-dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      console.error('White label login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      // Use our custom password reset function with Resend
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });
      if (error) throw error;
      alert('Password reset instructions have been sent to your email');
    } catch (err) {
      setError('Failed to send reset password email');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Podcast/YouTube Content Creation Video Background */}
      <VideoBackground 
        videoUrl="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
        fallbackImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1920&q=80"
        page="white-label-login"
        alt="Podcast content creation background"
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <Mic className="w-8 h-8 text-yellow-400" />
              <LogIn className="w-12 h-12 text-blue-500" />
              <Youtube className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            White Label Client Login
          </h2>
          <p className="text-gray-300 text-center mb-6">Access your branded licensing platform</p>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-center font-medium">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="mt-1 block w-full rounded-md bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="mt-1 block w-full rounded-md bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full flex items-center justify-center py-2 px-4 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Forgot Password?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WhiteLabelClientLogin; 