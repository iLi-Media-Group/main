import React, { useState, useRef } from 'react';
import { Mail, Lock, User, X, Building2, Music, Info, UserPlus, Sparkles } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { VideoBackground } from './VideoBackground';

interface SignupFormProps {
  onClose: () => void;
}

function SignupFormContent({ onClose }: SignupFormProps) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState<'client' | 'producer' | 'artist_band'>('client');
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [performingRightsOrg, setPerformingRightsOrg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp, signIn } = useUnifiedAuth();
  const navigate = useNavigate();
  
  // Get redirect and product info from URL params
  const redirectTo = searchParams.get('redirect') || '';
  const productId = searchParams.get('product') || '';

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasSpecial && hasMinLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Starting signup process...');
      setError('');
      setLoading(true);

      if (!ageVerified) {
        throw new Error('You must be 18 years or older to create an account');
      }

      if (!termsAccepted) {
        throw new Error('You must accept the Terms and Conditions to create an account');
      }

      if (!validatePassword(password)) {
        throw new Error('Password does not meet requirements');
      }

      // Temporarily disable reCAPTCHA due to CSP issues
      console.log('reCAPTCHA disabled for testing');
      // if (!executeRecaptcha) {
      //   console.warn('reCAPTCHA not loaded, proceeding without verification');
      //   // For now, allow signup to proceed without reCAPTCHA for testing
      //   // In production, you might want to throw an error here
      // } else {
      //   console.log('Executing reCAPTCHA...');
      //   // Execute reCAPTCHA
      //   const token = await executeRecaptcha('signup');
      //   if (!token) {
      //     throw new Error('Please complete the reCAPTCHA verification');
      //   }
      //   console.log('reCAPTCHA token received:', token ? 'YES' : 'NO');
      // }

      let producerNumber: string | null = null;
      let artistNumber: string | null = null;
      
      // Check invitation code for producer accounts
      if (accountType === 'producer') {
        if (!invitationCode.trim()) {
          throw new Error('Producer invitation code is required');
        }
        
        // Validate IPI number and PRO for producers
        if (!ipiNumber.trim()) {
          throw new Error('IPI Number is required for producers');
        }
        
        if (!performingRightsOrg) {
          throw new Error('Performing Rights Organization is required for producers');
        }

        // Validate the invitation code and get producer details
        const { data: isValid, error: validationError } = await supabase
          .rpc('validate_producer_invitation', {
            code: invitationCode,
            email_address: email
          });

        if (validationError || !isValid) {
          throw new Error('Invalid or expired producer invitation code');
        }

        // Get the invitation details to get the producer number
        const { data: invitation, error: invitationError } = await supabase
          .from('producer_invitations')
          .select('producer_number')
          .eq('invitation_code', invitationCode)
          .single();

        if (invitationError || !invitation) {
          throw new Error('Failed to get producer details');
        }

        producerNumber = invitation.producer_number;
      }

      // Check invitation code for artist accounts
      if (accountType === 'artist_band') {
        if (!invitationCode.trim()) {
          throw new Error('Artist invitation code is required');
        }

        // Validate the invitation code and get artist details
        const { data: isValid, error: validationError } = await supabase
          .rpc('validate_artist_invitation', {
            code: invitationCode,
            email_address: email
          });

        if (validationError || !isValid) {
          throw new Error('Invalid or expired artist invitation code');
        }

        // Get the invitation details to get the artist number
        const { data: invitation, error: invitationError } = await supabase
          .from('artist_invitations')
          .select('artist_number')
          .eq('invitation_code', invitationCode)
          .single();

        if (invitationError || !invitation) {
          throw new Error('Failed to get artist details');
        }

        artistNumber = invitation.artist_number;
      }

      console.log('Creating user account...');
      // Create user account
      const signUpResult = await signUp(email, password);
      console.log('Signup result:', signUpResult);

      // Check if email confirmation is required
      if (signUpResult.requiresEmailConfirmation) {
        console.log('Email confirmation required, redirecting...');
        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', email);
        setSuccess(true);
        setError('');
        // Show email verification message
        setTimeout(() => {
          onClose();
          // Redirect to a verification page or show verification message
          navigate('/auth/verify-email');
        }, 2000);
        return;
      }

      console.log('Creating profile...');
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found after account creation');
      }

      // Check if a profile already exists for this user
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        throw new Error('Failed to check existing profile');
      }

      let profileError;
      if (existingProfile) {
        // Profile exists, update it
        console.log('Profile exists, updating...');
        const { error } = await supabase
          .from('profiles')
          .update({
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            company_name: companyName.trim() || null,
            account_type: accountType,
            membership_plan: 'Single Track',
                         age_verified: ageVerified,
             terms_accepted: termsAccepted,
             terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
             invitation_code: (accountType === 'producer' || accountType === 'artist_band') ? invitationCode : null,
             producer_number: accountType === 'producer' ? producerNumber : null,
             artist_number: accountType === 'artist_band' ? artistNumber : null,
             ipi_number: accountType === 'producer' ? ipiNumber.trim() : null,
             performing_rights_org: accountType === 'producer' ? performingRightsOrg : null,
             updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        profileError = error;
      } else {
        // Profile doesn't exist, create it
        console.log('Profile doesn\'t exist, creating...');
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            company_name: companyName.trim() || null,
                         account_type: accountType,
             membership_plan: 'Single Track',
             age_verified: ageVerified,
             terms_accepted: termsAccepted,
             terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
             invitation_code: (accountType === 'producer' || accountType === 'artist_band') ? invitationCode : null,
             producer_number: accountType === 'producer' ? producerNumber : null,
             artist_number: accountType === 'artist_band' ? artistNumber : null,
             ipi_number: accountType === 'producer' ? ipiNumber.trim() : null,
             performing_rights_org: accountType === 'producer' ? performingRightsOrg : null,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
          });
        profileError = error;
      }

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
      console.log('Profile created successfully');

      // Send welcome email for all account types
      try {
        console.log('Sending welcome email...');
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: email,
            first_name: firstName,
            account_type: accountType
          }
        });
        
        if (emailError) {
          console.error('Welcome email error:', emailError);
          // Log the error but don't prevent signup completion
        } else {
          console.log('Welcome email sent successfully');
        }
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
        // Log the error but don't prevent signup completion
      }

      // Mark invitation as used if it's a producer or artist
      if (accountType === 'producer') {
        await supabase.rpc('use_producer_invitation', {
          code: invitationCode,
          email_address: email
        });
      }

      if (accountType === 'artist_band') {
        await supabase.rpc('use_artist_invitation', {
          code: invitationCode,
          email_address: email
        });
      }

      console.log('Signing in user...');
      // Automatically sign in the user after account creation
      const signInResult = await signIn(email, password);
      if (signInResult.error) {
        console.error('Sign in error:', signInResult.error);
        throw new Error('Account created but failed to sign in automatically. Please sign in manually.');
      }
      console.log('User signed in successfully');

      // Set success state and show message
      setSuccess(true);
      setError('');
      
      console.log('Account created successfully, redirecting to dashboard...');
      
      // Show success message for 3 seconds before redirecting
      setTimeout(() => {
        console.log('Closing form and navigating...');
        onClose();
        
        // For client accounts, go directly to the dashboard
        if (accountType === 'client') {
          console.log('Navigating to client dashboard');
          navigate('/dashboard');
          return;
        }
        
        // For producer accounts, go directly to dashboard
        console.log('Navigating to producer dashboard');
        navigate('/producer/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      console.error('Error details:', err);
      setError(errorMessage);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
      {/* Creative/Media Production Video Background */}
      <VideoBackground 
        videoUrl="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
        fallbackImage="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80"
        page="signup"
        alt="Creative media production background"
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/20 backdrop-blur-md p-8 rounded-xl border border-blue-500/20 shadow-xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <UserPlus className="w-12 h-12 text-blue-500" />
              <Music className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Create Your Account
          </h2>
          <p className="text-gray-300 text-center mb-6">Join the MyBeatFi community</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-green-300 text-center">
              <div className="font-semibold text-lg mb-2">✅ Account Created Successfully!</div>
              <div className="text-sm">Redirecting to your dashboard...</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={{ opacity: success ? 0.6 : 1, pointerEvents: success ? 'none' : 'auto' }}>
            {/* Hidden fields to prevent autofill */}
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'client' | 'producer' | 'artist_band')}
                className="w-full px-4 py-2"
                disabled={loading}
              >
                <option value="client">Sign Up as Client</option>
                <option value="producer">Sign Up as Producer</option>
                <option value="artist_band">Sign Up as Artist/Band</option>
              </select>
            </div>

            {(accountType === 'producer' || accountType === 'artist_band') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {accountType === 'producer' ? 'Producer' : 'Artist'} Invitation Code
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="w-full px-4 py-2"
                  required
                  disabled={loading}
                  placeholder="Enter your invitation code"
                />
                <p className="mt-1 text-xs text-gray-400">
                  A valid invitation code is required to create a {accountType === 'producer' ? 'producer' : 'artist'} account
                </p>
              </div>
            )}
              
            {accountType === 'producer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    IPI Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={ipiNumber}
                      onChange={(e) => setIpiNumber(e.target.value)}
                      className={`w-full pl-10 ${!ipiNumber.trim() ? 'border-red-500' : ''}`}
                      required
                      disabled={loading}
                      placeholder="Enter your IPI number"
                    />
                  </div>
                  {!ipiNumber.trim() && (
                    <p className="mt-1 text-sm text-red-400">IPI Number is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Performing Rights Organization <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={performingRightsOrg}
                      onChange={(e) => setPerformingRightsOrg(e.target.value)}
                      className={`w-full pl-10 ${!performingRightsOrg ? 'border-red-500' : ''}`}
                      required
                      disabled={loading}
                    >
                      <option value="">Select your PRO</option>
                      <option value="ASCAP">ASCAP</option>
                      <option value="BMI">BMI</option>
                      <option value="SESAC">SESAC</option>
                      <option value="GMR">Global Music Rights</option>
                      <option value="PRS">PRS for Music (UK)</option>
                      <option value="SOCAN">SOCAN (Canada)</option>
                      <option value="APRA">APRA AMCOS (Australia/NZ)</option>
                      <option value="SACEM">SACEM (France)</option>
                      <option value="GEMA">GEMA (Germany)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  {!performingRightsOrg && (
                    <p className="mt-1 text-sm text-red-400">PRO is required</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                  required
                  disabled={loading}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must contain at least 8 characters, including uppercase, lowercase, and special characters.
              </p>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={ageVerified}
                onChange={(e) => setAgeVerified(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-300">
                I am 18 years or older
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-300">
                I agree to follow the{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Terms and Conditions
                </a>
                {' '}of this website and service
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full"
            >
              {success ? '✅ Account Created!' : loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function SignupForm({ onClose }: SignupFormProps) {
  return <SignupFormContent onClose={onClose} />;
}
