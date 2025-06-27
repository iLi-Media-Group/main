import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Loader2, Mail, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession, getUserSubscription } from '../lib/stripe';
import { sendLicenseEmail } from '../lib/email';

function EmailCheckDialog({ isOpen, onClose, onContinue, product }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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

function ConfirmModal({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-white text-lg font-semibold mb-4">Confirm Plan Change</h3>
        <p className="text-gray-300 mb-6">
          You are currently subscribed to a higher tier. Do you want to downgrade to the Single Track plan?
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Confirm Downgrade
          </button>
        </div>
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          setSelectedProduct(product);
          setShowConfirmModal(true);
          return;
        }
      }
      proceedWithSubscription(product);
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

      if (user) {
        await sendLicenseEmail({
          to: user.email,
          subject: 'Subscription Change Confirmed',
          html: `<p>Hello,</p><p>This email is to confirm you have changed your plan to <strong>${product.name}</strong>.</p><p>Thank you,<br/>The MyBeatFi Team</p>`
        });
      }

      const checkoutUrl = await createCheckoutSession(product.priceId, product.mode);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Error creating checkout session or sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setLoading(false);
      setLoadingProductId(null);
      setShowConfirmModal(false);
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

      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={() => proceedWithSubscription(selectedProduct!)}
        onCancel={() => setShowConfirmModal(false)}
      />

      <EmailCheckDialog
        isOpen={showEmailCheck}
        onClose={() => setShowEmailCheck(false)}
        onContinue={handleEmailContinue}
        product={selectedProduct!}
      />
    </>
  );
}
