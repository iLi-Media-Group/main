import React, { useState } from 'react';
import { Mail, Lock, Music, AlertCircle } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { VideoBackground } from './VideoBackground';

const ArtistLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useUnifiedAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginEmail = email.toLowerCase().trim();

      // Attempt to sign in with account type validation
      const result = await signIn(loginEmail, password, 'artist_band');
      
      if (result.error) {
        if (result.error.message === 'Invalid login credentials') {
          setError('Invalid email or password');
        } else {
          setError(result.error.message || 'Login failed. Please check your credentials.');
        }
        setLoading(false);
        return;
      }

      // Successful login - navigate to artist dashboard
      console.log('🎵 Artist login successful, navigating to dashboard...');
      navigate('/artist/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Artist/Band Music Production Video Background */}
      <VideoBackground 
        videoUrl="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
        fallbackImage="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1920&q=80"
        page="artist-login"
        alt="Artist music production background"
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 rounded-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Artist/Band Login</h1>
          <p className="text-gray-300">
            Access your artist dashboard and manage your sync licensing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an artist account?{' '}
            <a
              href="/artist-application"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Apply here
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
          >
            Forgot your password?
          </a>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistLogin;
