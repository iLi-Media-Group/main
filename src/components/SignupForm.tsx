// You can upload your Welcome PDF (e.g. welcome.pdf) to Supabase Storage and use a public URL:

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Building2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../lib/stripe';

interface SignupFormProps {
  onClose: () => void;
}

export function SignupForm({ onClose }: SignupFormProps) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState<'client' | 'producer'>('client');
  const [ageVerified, setAgeVerified] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

      if (accountType === 'producer') {
        if (!invitationCode.trim()) {
          throw new Error('Producer invitation code is required');
        }

        const { data: isValid, error: validationError } = await supabase
          .rpc('validate_producer_invitation', {
            code: invitationCode,
            email_address: email
          });

        if (validationError || !isValid) {
          throw new Error('Invalid or expired producer invitation code');
        }
      }

      // Fetch user's public IP address
      let userIP = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIP = ipData.ip;
      } catch (ipErr) {
        console.warn('Could not fetch user IP:', ipErr);
      }

      // 1. Create user with metadata
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: accountType,
            signup_ip: userIP
          }
        }
      });

      // 2. Get session and user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Failed to retrieve session after signup');
      }
      const user = session.user;

      // 3. Update the profile row (created by trigger)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          company_name: companyName.trim() || null,
          account_type: accountType,
          age_verified: ageVerified,
          invitation_code: accountType === 'producer' ? invitationCode : null
        })
        .eq('id', user.id);
      if (updateError) throw updateError;

      // 4. Mark producer invitation as used
      if (accountType === 'producer') {
        await supabase.rpc('use_producer_invitation', {
          code: invitationCode,
          email_address: email
        });
      }

      // 5. Redirect
      onClose();

      if (accountType === 'client') {
        navigate('/welcome', {
          state: {
            newUser: true,
            email,
            firstName,
            redirectTo,
            productId
          }
        });
      } else {
        navigate('/producer/dashboard');
      }

    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setAccountType('client');
    setAgeVerified(false);
    setInvitationCode('');
    setError('');
    setLoading(false);
  };

  // Handle close: reset form then close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-xl w-full max-w-md relative">
        <button
          onClick={handleClose}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}