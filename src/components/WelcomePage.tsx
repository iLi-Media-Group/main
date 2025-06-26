import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Music, Star, Zap, Gift, PlayCircle, Video, Headphones, FileCheck, Loader2, Check, ArrowRight, CreditCard, Coins, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession, getUserSubscription } from '../lib/stripe';
import { createCryptoInvoice } from '../utils/createCryptoInvoice';

export function WelcomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, accountType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  
  // Get user info from location state
  const state = location.state as {
    newUser?: boolean;
    email?: string;
    firstName?: string;
    redirectTo?: string;
    productId?: string;
  } | null;
  
  // If user navigated here directly without being a new user, redirect to home
  useEffect(() => {
    if (!state?.newUser && !user) {
      navigate('/');
    }
  }, [state, user, navigate]);
  
  // If user was redirected here after signup with a specific product, handle that
  useEffect(() => {
    const handleInitialRedirect = async () => {
      if (state?.newUser && state?.redirectTo === 'pricing' && state?.productId && user) {
        const product = PRODUCTS.find(p => p.id === state.productId);
        if (product) {
          await handleSubscribe(product);
        }
      }
    };
    
    handleInitialRedirect();
  }, [state, user]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleSubscribe = async (product: typeof PRODUCTS[0]) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is admin or producer
    if (accountType === 'admin' || accountType === 'producer') {
      setError('Admins and producers cannot subscribe to client plans. Please create a separate client account with a different email address.');
      return;
    }
    
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

  const handleCryptoSubscribe = async (product: typeof PRODUCTS[0]) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is admin or producer
    if (accountType === 'admin' || accountType === 'producer') {
      setError('Admins and producers cannot subscribe to client plans. Please create a separate client account with a different email address.');
      return;
    }
    
    try {
      setLoading(true);
      setLoadingProductId(product.id);
      setError(null);
      const invoiceUrl = await createCryptoInvoice(product.id, user.id);
      window.location.href = invoiceUrl;
    } catch (err) {
      console.error('Crypto subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start crypto payment');
    } finally {
      setLoading(false);
      setLoadingProductId(null);
    }
  };
  
  const handleSkip = () => {
    // Navigate to dashboard with Single Track as default
    navigate('/dashboard');
  };

  // Check if user is admin or producer
  const isAdminOrProducer = accountType === 'admin' || accountType === 'producer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to MyBeatFi Sync
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Choose your membership plan to start licensing music for your projects
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {product.name === 'Single Track License' && <Music className="w-6 h-6 text-white" />}
                    {product.name === 'Gold Access' && <Star className="w-6 h-6 text-white" />}
                    {product.name === 'Platinum Access' && <Zap className="w-6 h-6 text-white" />}
                    {product.name === 'Ultimate Access' && <Gift className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <div className="text-3xl font-bold text-white mb-2">
                    ${product.price}
                    {product.mode === 'subscription' && <span className="text-lg text-gray-400">/month</span>}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => handleSubscribe(product)}
                    disabled={loading && loadingProductId === product.id || (currentSubscription?.subscription_id && currentSubscription?.status === 'active' && currentSubscription?.price_id === product.priceId) || isAdminOrProducer}
                    className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentSubscription?.subscription_id && currentSubscription?.status === 'active' && currentSubscription?.price_id === product.priceId ? (
                      <span>Current Plan</span>
                    ) : loading && loadingProductId === product.id ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : isAdminOrProducer ? (
                      <span>Not Available</span>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Subscribe with Card</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCryptoSubscribe(product)}
                    disabled={loading && loadingProductId === product.id || (currentSubscription?.subscription_id && currentSubscription?.status === 'active' && currentSubscription?.price_id === product.priceId) || isAdminOrProducer}
                    className="w-full py-2 px-4 rounded-lg bg-blue-900/40 hover:bg-green-600/60 text-white font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && loadingProductId === product.id ? (
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
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Accepts USDC, USDT, and Solana
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Continue with Single Track License
            </button>
            <p className="mt-2 text-sm text-gray-400">
              You can upgrade anytime from your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
