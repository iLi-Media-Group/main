import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Loader2, Building2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function RightsHolderLogin() {
  const navigate = useNavigate();
  const { signIn } = useUnifiedAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const loginEmail = formData.email.toLowerCase().trim();

      // Check if user is an admin
      const isAdmin = ['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(loginEmail);
      
      if (!isAdmin) {
        // Verify account type before authentication
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('email', loginEmail)
          .maybeSingle();

        if (profileError) {
          if (profileError.code !== 'PGRST116') {
            throw new Error('Failed to verify account type');
          }
          // If no profile found, deny access
          throw new Error('Please use the appropriate login page for your account type');
        }

        // If profile exists but account type is not rights_holder
        if (profileData && profileData.account_type !== 'rights_holder') {
          if (profileData.account_type === 'client') {
            throw new Error('Please use the client login page');
          } else if (profileData.account_type === 'producer') {
            throw new Error('Please use the producer login page');
          } else if (profileData.account_type === 'artist_band') {
            throw new Error('Please use the artist login page');
          } else if (profileData.account_type === 'white_label') {
            throw new Error('Please use the white label client login page');
          } else {
            throw new Error('Please use the appropriate login page for your account type');
          }
        }
      }

      // Attempt to sign in
      const { error: signInError } = await signIn(loginEmail, formData.password);
      
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }

      // Successful login - redirect to dashboard
      navigate('/rights-holder/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Record Label or Publisher Login</h1>
          </div>
          <p className="text-gray-300">
            Sign in to your MyBeatFi rights holder account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/rights-holder/signup" className="text-blue-400 hover:underline">
                Sign up here
              </Link>
            </p>
            <p className="text-gray-400">
              <Link to="/rights-holder/forgot-password" className="text-blue-400 hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">Or</span>
            </div>
          </div>

          {/* Back to Main Site */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              ← Back to MyBeatFi
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
