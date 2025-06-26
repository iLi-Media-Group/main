import React, { useState } from 'react';
import { Music, Star, Zap, Gift, PlayCircle, Video, Headphones, FileCheck, Loader2, Mail, ArrowRight, X, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../lib/stripe';
import { CryptoPaymentButton } from './CryptoPaymentButton';
import { supabase } from '../lib/supabase';

interface EmailCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (email: string, exists: boolean) => void;
}

function EmailCheckDialog({ isOpen, onClose, onContinue }: EmailCheckDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');

      // Check if email exists
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const exists = existingUser.users.some(user => user.email === email.toLowerCase());

      onContinue(email, exists);
    } catch (err) {
      setError('Failed to check email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Continue with Email</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GoldAccessPage() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailCheck, setShowEmailCheck] = useState(false);

  const handleUpgrade = async () => {
    // Check if user is admin or producer
    if (user && (accountType === 'admin' || accountType === 'producer')) {
      setError('Admins and producers cannot subscribe to client plans. Please create a separate client account with a different email address.');
      return;
    }

    if (user) {
      // User is already logged in, proceed with subscription
      await proceedWithSubscription();
    } else {
      // User is not logged in, show email check dialog
      setShowEmailCheck(true);
    }
  };

  const handleEmailContinue = (email: string, exists: boolean) => {
    setShowEmailCheck(false);
    
    if (exists) {
      // Account exists, redirect to login with email prefilled
      navigate(`/login?email=${encodeURIComponent(email)}&redirect=pricing&product=prod_SQOhLQJIM6Rji8`);
    } else {
      // No account exists, redirect to signup with email prefilled
      navigate(`/signup?email=${encodeURIComponent(email)}&redirect=pricing&product=prod_SQOhLQJIM6Rji8`);
    }
  };

  const proceedWithSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Find Gold Access product
      const goldProduct = PRODUCTS.find(p => p.name === 'Gold Membership');
      
      if (!goldProduct) {
        throw new Error('Gold membership product not found');
      }
      
      // Create checkout session
      const checkoutUrl = await createCheckoutSession(
        goldProduct.priceId, 
        goldProduct.mode
      );
      
      // Redirect to checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin or producer
  const isAdminOrProducer = accountType === 'admin' || accountType === 'producer';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Gold Access Membership
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Unlock premium features and get 10 tracks per month for your projects
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {isAdminOrProducer && (
              <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-yellow-400 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-400">Account Type Restriction</h3>
                </div>
                <p className="text-yellow-300 text-center">
                  As a {accountType === 'admin' ? 'administrator' : 'producer'}, you cannot subscribe to client plans with this account. 
                  To access client features, please create a separate client account using a different email address.
                </p>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-yellow-500/20 p-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white mb-4">What's Included</h2>
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>10 tracks per month</span>
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>Premium music library access</span>
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>Advanced search filters</span>
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>Exclusive content access</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    $34.99
                    <span className="text-lg text-gray-400 ml-2">/month</span>
                  </div>
                  <p className="text-gray-400 mb-6">Cancel anytime, no commitment</p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleUpgrade}
                      disabled={loading || isAdminOrProducer}
                      className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : isAdminOrProducer ? (
                        <span>Not Available</span>
                      ) : (
                        <>
                          <Star className="w-5 h-5" />
                          <span>Upgrade to Gold</span>
                        </>
                      )}
                    </button>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-600"></div>
                      <span className="flex-shrink mx-4 text-gray-400">or</span>
                      <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    
                    <CryptoPaymentButton
                      productId="prod_SQOhLQJIM6Rji8"
                      productName="Gold Access Membership"
                      productDescription="Monthly subscription with 10 tracks per month"
                      price={34.99}
                      disabled={loading || isAdminOrProducer}
                      metadata={{
                        product_type: 'subscription',
                        price_id: 'price_1RVXu9Ikn3xpidKHqxoSb6bC'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmailCheckDialog
        isOpen={showEmailCheck}
        onClose={() => setShowEmailCheck(false)}
        onContinue={handleEmailContinue}
      />
    </>
  );
}
