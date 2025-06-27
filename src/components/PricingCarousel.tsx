// ✅ COMBINED VERSION OF BOTH PRICINGCAROUSEL FILES
// - Uses full pricing details from the FIRST file
// - Keeps accountType restrictions and error alerts from the SECOND file
// - Uses only ONE subscribe button as requested

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
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-300">Cancel</button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" />Continue</>}
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
    if (user) fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
      if (subscription?.subscription_id && subscription?.status === 'active') await refreshMembership();
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleSubscribe = async (product: typeof PRODUCTS[0]) => {
    if (user && (accountType === 'admin' || accountType === 'producer')) {
      setError('Admins and producers cannot subscribe to client plans. Please use a separate client account.');
      return;
    }

    if (!user) {
      setSelectedProduct(product);
      setShowEmailCheck(true);
      return;
    }

    proceedWithSubscription(product);
  };

  const handleEmailContinue = (email: string, exists: boolean) => {
    setShowEmailCheck(false);
    const redirect = `/pricing&product=${selectedProduct?.id}`;
    navigate(`${exists ? '/login' : '/signup'}?email=${encodeURIComponent(email)}&redirect=${redirect}`);
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
              As a {accountType}, you cannot subscribe to client plans with this account.
              Please create a separate client account using a different email address.
            </p>
          </div>
        )}

        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className={`bg-white/5 backdrop-blur-sm rounded-2xl border ${product.popular ? 'border-purple-500/40' : 'border-blue-500/20'} p-8 h-full hover:border-blue-500/40 transition-colors relative flex flex-col`}
          >
            {product.popular && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">Popular</div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
              <p className="text-gray-400 mb-4">{product.description}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-white">${product.price.toFixed(2)}</span>
                <span className="text-gray-400 ml-2">
                  {product.name === 'Ultimate Access' ? '/year' : product.mode === 'subscription' ? '/month' : ''}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-white mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <button
                onClick={() => handleSubscribe(product)}
                disabled={loading || isAdminOrProducer}
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingProductId === product.id ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>Subscribe</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <EmailCheckDialog
          isOpen={showEmailCheck}
          onClose={() => setShowEmailCheck(false)}
          onContinue={handleEmailContinue}
          product={selectedProduct}
        />
      )}
    </>
  );
}
