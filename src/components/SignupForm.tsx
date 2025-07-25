import React, { useState, useRef } from 'react';
import { Mail, Lock, User, X, Building2, Music, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

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
  const [accountType, setAccountType] = useState<'client' | 'producer'>('client');
  const [ageVerified, setAgeVerified] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [performingRightsOrg, setPerformingRightsOrg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { signUp, signIn } = useAuth();
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
      setError('');
      setLoading(true);

      if (!ageVerified) {
        throw new Error('You must be 18 years or older to create an account');
      }

      if (!validatePassword(password)) {
        throw new Error('Password does not meet requirements');
      }

      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA not loaded');
      }

      // Execute reCAPTCHA
      const token = await executeRecaptcha('signup');
      if (!token) {
        throw new Error('Please complete the reCAPTCHA verification');
      }

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

        // Validate the invitation code
        const { data: isValid, error: validationError } = await supabase
          .rpc('validate_producer_invitation', {
            code: invitationCode,
            email_address: email
          });

        if (validationError || !isValid) {
          throw new Error('Invalid or expired producer invitation code');
        }
      }

      // Create user account
      const signUpResult = await signUp(email, password);

      // Check if email confirmation is required
      if (signUpResult.requiresEmailConfirmation) {
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

      // If email is already confirmed, proceed with profile creation
      // Upsert profile with additional details
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName.trim() || null,
          account_type: accountType, 
          age_verified: ageVerified, 
          invitation_code: accountType === 'producer' ? invitationCode : null,
          ipi_number: accountType === 'producer' ? ipiNumber.trim() : null,
          performing_rights_org: accountType === 'producer' ? performingRightsOrg : null
        }, { onConflict: 'email' });

      if (profileError) throw profileError;

      // Mark invitation as used if it's a producer
      if (accountType === 'producer') {
        await supabase.rpc('use_producer_invitation', {
          code: invitationCode,
          email_address: email
        });
      }

      // Automatically sign in the user after account creation
      const signInResult = await signIn(email, password);
      if (signInResult.error) {
        throw new Error('Account created but failed to sign in automatically. Please sign in manually.');
      }

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
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Create Your Account
        </h2>

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
              onChange={(e) => setAccountType(e.target.value as 'client' | 'producer')}
              className="w-full px-4 py-2"
              disabled={loading}
            >
              <option value="client">Sign Up as Client</option>
              <option value="producer">Sign Up as Producer</option>
            </select>
          </div>

          {accountType === 'producer' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Producer Invitation Code
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
                A valid invitation code is required to create a producer account
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
  );
}

export function SignupForm({ onClose }: SignupFormProps) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey="6LeE_Y4rAAAAALZxpq4wmNgMTCldPePWEKdy2-W0"
      scriptProps={{
        async: false,
        defer: false,
        appendTo: 'body',
        nonce: undefined,
      }}
    >
      <SignupFormContent onClose={onClose} />
    </GoogleReCaptchaProvider>
  );
}
