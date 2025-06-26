import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Coins, Loader2, Mail, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession, getUserSubscription } from '../lib/stripe';
import { createCryptoInvoice } from "../utils/createCryptoInvoice";

interface EmailCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (email: string, exists: boolean) => void;
  product: typeof PRODUCTS[0];
}

function EmailCheckDialog({ isOpen, onClose, onContinue, product }: EmailCheckDialogProps) {
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

export function PricingCarousel() {
  const navigate = useNavigate();
  const { user, refreshMembership, accountType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showEmailCheck, setShowEmailCheck] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
      
      if (subscription?.subscription_id && subscription?.status === 'active') {
        await refreshMembership();
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleSubscribe = async (product: typeof PRODUCTS[0]) => {
    // Check if user is admin or producer
    if (user && (accountType === 'admin' || accountType === 'producer')) {
      setError('Admins and producers cannot subscribe to client plans. Please create a separate client account with a different email address.');
      return;
    }

    // Special handling for Single Track (pay-as-you-go)
    if (product.id === 'prod_SYHCZgM5UBmn3C') { // Single Track product ID
      if (!user) {
        // Not signed in - redirect to login with signup option
        setSelectedProduct(product);
        setShowEmailCheck(true);
        return;
      }

      // User is signed in - check if they need to downgrade membership
      if (currentSubscription?.subscription_id && currentSubscription?.status === 'active') {
        // User has an active subscription - check if they want to downgrade to Single Track
        const shouldDowngrade = window.confirm(
          'You currently have an active subscription. To switch to Single Track (pay-as-you-go) licensing, your current subscription will be cancelled at the end of the current billing period. Would you like to proceed?'
        );
        
        if (shouldDowngrade) {
          // Navigate to dashboard where they can manage their subscription
          navigate('/dashboard');
          return;
        } else {
          return;
        }
      }

      // User is signed in but has no active subscription - proceed with single track purchase
      proceedWithSubscription(product);
      return;
    }

    // Handle subscription plans (Gold, Platinum, Ultimate)
    if (user) {
      proceedWithSubscription(product);
    } else {
      setSelectedProduct(product);
      setShowEmailCheck(true);
    }
  };

  const handleEmailContinue = (email: string, exists: boolean) => {
    setShowEmailCheck(false);
    
    if (exists) {
      navigate(`/login?email=${encodeURIComponent(email)}&redirect=pricing&product=${selectedProduct?.id}`);
    } else {
     navigate(`/signup?email=${encodeURIComponent(email)}&redirect=pricing&product=${selectedProduct?.id}`);

    }
  };

  const proceedWithSubscription = async (product: typeof PRODUCTS[0]) => {
    try {
      setLoading(true);
      setLoadingProductId(product.id);
      setError(null);

      if (currentSubscription?.subscription_id && product.mode === 'subscription') {
        navigate('/dashboard');
        return;
      }

      const checkoutUrl = await createCheckoutSession(product.priceId, product.mode);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setLoading(false);
      setLoadingProductId(null);
    }
  };

  // Check if user is admin or producer
  const isAdminOrProducer = accountType === 'admin' || accountType === 'producer';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {error && (
          <div className="col-span-full mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {isAdminOrProducer && (
          <div className="col-span-full mb-4 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
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

        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className={`bg-white/5 backdrop-blur-sm rounded-xl border ${
              product.popular ? 'border-purple-500/40' : 'border-blue-500/20'
            } p-6 hover:border-blue-500/40 transition-colors relative`}
          >
            {product.popular && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-medium">
                Popular
              </div>
            )}

            <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
            <div className="flex items-baseline mb-4">
              <span className="text-2xl font-bold text-white">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-gray-400 ml-2">
                /{product.interval}
              </span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {product.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-center text-gray-300 text-sm">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              {!product.mode.includes('subscription') && (
                <button
                  onClick={() => handleSubscribe(product)}
                  disabled={loading || isAdminOrProducer}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingProductId === product.id ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : isAdminOrProducer ? (
                    <span>Not Available</span>
                  ) : (
                    <>Get Started</>
                  )}
                </button>
              )}

              {product.mode.includes('subscription') && (
                <div className="space-y-4">
                  <button
                    onClick={() => handleSubscribe(product)}
                    disabled={loading || (currentSubscription?.subscription_id && currentSubscription?.status === 'active') || isAdminOrProducer}
                    className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingProductId === product.id ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : isAdminOrProducer ? (
                      <span>Not Available</span>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>
                          {currentSubscription?.subscription_id && currentSubscription?.status === 'active'
                            ? 'Current Plan'
                            : 'Subscribe'}
                        </span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSubscribe(product)}
                    disabled={loading || (currentSubscription?.subscription_id && currentSubscription?.status === 'active') || isAdminOrProducer}
                    className="w-full py-3 px-6 rounded-lg bg-blue-900/40 hover:bg-green-600/60 text-white font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingProductId === product.id ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : isAdminOrProducer ? (
                      <span>Not Available</span>
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        <span>Subscribe with Crypto</span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-center text-sm text-gray-400">
                    Accepts USDC, USDT, and Solana
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <EmailCheckDialog
        isOpen={showEmailCheck}
        onClose={() => setShowEmailCheck(false)}
        onContinue={handleEmailContinue}
        product={selectedProduct!}
      />
    </>
  );
}