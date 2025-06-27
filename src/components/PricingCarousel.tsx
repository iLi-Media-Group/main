import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Coins, Loader2, Mail, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession, getUserSubscription } from '../lib/stripe';

export function PricingCarousel() {
  const navigate = useNavigate();
  const { user, refreshMembership, accountType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

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
    if (user && (accountType === 'admin' || accountType === 'producer')) {
      setError('Admins and producers cannot subscribe to client plans. Please create a separate client account with a different email address.');
      return;
    }

    if (product.id === 'prod_SYHCZgM5UBmn3C') {
      if (!user) {
        navigate('/login');
        return;
      }

      if (currentSubscription?.subscription_id && currentSubscription?.status === 'active') {
        if (currentSubscription.product_id === 'prod_SYHCZgM5UBmn3C') {
          alert('You are already on the Single Track plan.');
          return;
        } else {
          const shouldDowngrade = window.confirm(
            'You currently have an active subscription. To switch to Single Track (pay-as-you-go) licensing, your current subscription will be cancelled at the end of the current billing period. Would you like to proceed?'
          );

          if (shouldDowngrade) {
            navigate('/dashboard');
            return;
          } else {
            return;
          }
        }
      }

      navigate('/dashboard');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    proceedWithSubscription(product);
  };

  const proceedWithSubscription = async (product: typeof PRODUCTS[0]) => {
    try {
      setLoading(true);
      setLoadingProductId(product.id);
      setError(null);

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
        {PRODUCTS.map((product) => (
          <div key={product.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
            <p className="text-white text-2xl mb-4">${product.price.toFixed(2)} / {product.interval}</p>
            <ul className="text-sm text-gray-300 mb-6 space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(product)}
              disabled={loading && loadingProductId === product.id}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all flex items-center justify-center space-x-2"
            >
              {loadingProductId === product.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {product.id === 'prod_SYHCZgM5UBmn3C' ? 'Get Started' : 'Subscribe'}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
