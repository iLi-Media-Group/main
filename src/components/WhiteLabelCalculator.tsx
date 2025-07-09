import React, { useState, useEffect } from 'react';
import { Calculator, Brain, Users, Search, DollarSign, Calendar, ArrowRight, Percent, Loader2, CheckCircle } from 'lucide-react';
import { createWhiteLabelCheckout, calculateDiscountedPrice } from '../lib/whiteLabelCheckout';
import { supabase } from '../lib/supabase';

interface PricingCalculatorProps {
  onCalculate?: (total: number) => void;
  initialFeatures?: string[];
  initialCustomerEmail?: string;
  initialCompanyName?: string;
}

interface DiscountInfo {
  name: string;
  description: string;
  percent: number;
}

export function WhiteLabelCalculator({ onCalculate, initialFeatures, initialCustomerEmail, initialCompanyName }: PricingCalculatorProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialFeatures || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    email: initialCustomerEmail || '',
    firstName: '',
    lastName: '',
    company: initialCompanyName || ''
  });
  const [discounts, setDiscounts] = useState<{
    plan?: DiscountInfo;
    features: { [key: string]: DiscountInfo };
  }>({ features: {} });
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pricing structure
  const plans = {
    starter: {
      name: 'Starter',
      setupFee: 999,
      monthlyFee: 49,
      color: 'blue'
    },
    pro: {
      name: 'Pro',
      setupFee: 5000,
      monthlyFee: 299,
      color: 'purple'
    }
  };

  const features = [
    {
      id: 'producer_applications',
      name: 'Producer Applications',
      description: 'Let producers apply to join your library',
      price: 249,
      icon: Users,
      availableIn: ['starter', 'pro'],
      includedIn: ['pro', 'enterprise']
    },
    {
      id: 'ai_recommendations',
      name: 'AI Search Assistance',
      description: 'AI-powered search and recommendations',
      price: 249,
      icon: Brain,
      availableIn: ['starter', 'pro'],
      includedIn: ['enterprise']
    },
    {
      id: 'deep_media_search',
      name: 'Deep Media Search',
      description: 'Advanced media type tagging and filtering',
      price: 249,
      icon: Search,
      availableIn: ['starter', 'pro'],
      includedIn: ['enterprise']
    }
  ];

  // Fetch applicable discounts on component mount and when plan/features change
  useEffect(() => {
    fetchDiscounts();
  }, [selectedPlan, selectedFeatures]);

  const fetchDiscounts = async () => {
    try {
      // Get plan discount
      const planDiscount = await calculateDiscountedPrice(plans[selectedPlan].setupFee, selectedPlan);
      
      // Get feature discounts
      const featureDiscounts: { [key: string]: DiscountInfo } = {};
      for (const feature of selectedFeatures) {
        const featureInfo = features.find(f => f.id === feature);
        if (featureInfo && !featureInfo.includedIn.includes(selectedPlan)) {
          const discount = await calculateDiscountedPrice(featureInfo.price, feature);
          if (discount.discount_percent > 0) {
            featureDiscounts[feature] = {
              name: discount.discount_name || 'Discount',
              description: discount.discount_description || '',
              percent: discount.discount_percent
            };
          }
        }
      }

      setDiscounts({
        plan: planDiscount.discount_percent > 0 ? {
          name: planDiscount.discount_name || 'Plan Discount',
          description: planDiscount.discount_description || '',
          percent: planDiscount.discount_percent
        } : undefined,
        features: featureDiscounts
      });
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const getSelectedPlan = () => plans[selectedPlan];
  const getAvailableFeatures = () => features.filter(f => f.availableIn.includes(selectedPlan));

  const calculateStartupCost = () => {
    const plan = getSelectedPlan();
    const selectedFeatureCosts = selectedFeatures
      .map(featureId => {
        const feature = features.find(f => f.id === featureId);
        // Don't charge for features included in the plan
        if (feature && feature.includedIn.includes(selectedPlan)) {
          return 0;
        }
        return feature?.price || 0;
      })
      .reduce((sum, price) => sum + price, 0);
    
    return plan.setupFee + selectedFeatureCosts;
  };

  const calculateDiscountedStartupCost = () => {
    const baseCost = calculateStartupCost();
    let discountedCost = baseCost;

    // Apply plan discount
    if (discounts.plan) {
      discountedCost = baseCost * (1 - discounts.plan.percent / 100);
    }

    // Apply feature discounts
    Object.values(discounts.features).forEach(discount => {
      // This is a simplified calculation - in reality, the Edge Function handles this more precisely
      discountedCost = discountedCost * (1 - discount.percent / 100);
    });

    return Math.round(discountedCost);
  };

  const calculateAnnualCost = () => {
    const plan = getSelectedPlan();
    return plan.monthlyFee * 12;
  };

  const calculateTotalFirstYear = () => {
    return calculateDiscountedStartupCost() + calculateAnnualCost();
  };

  const getBundleDiscount = () => {
    const additionalFeatures = selectedFeatures.filter(f => {
      const feature = features.find(feat => feat.id === f);
      return feature && !feature.includedIn.includes(selectedPlan);
    });
    
    if (additionalFeatures.length === 2) return 49; // Save $49
    if (additionalFeatures.length === 3) return 148; // Save $148
    return 0;
  };

  const finalStartupCost = calculateDiscountedStartupCost() - getBundleDiscount();

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasSpecial && hasMinLength;
  };

  const handleCheckout = async () => {
    // Validate customer data
    if (!customerData.email || !customerData.firstName || !customerData.lastName) {
      setError('Please provide your email, first name, and last name to continue.');
      return;
    }
    if (!customerData.company) {
      setError('Please provide your company name to continue.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Auth user (if not exists)
      const emailLower = customerData.email.toLowerCase();
      let userId = null;
      let userCreated = false;
      // Try to sign up (will error if user exists)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password: password,
      });
      if (signUpError && !signUpError.message.includes('User already registered')) {
        setError('Failed to create user: ' + signUpError.message);
        setLoading(false);
        return;
      }
      if (signUpData?.user) {
        userId = signUpData.user.id;
        userCreated = true;
      }
      // If user already exists, fetch their id
      if (!userId) {
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', emailLower)
          .maybeSingle();
        if (userFetchError || !userData) {
          setError('Failed to find or create user.');
          setLoading(false);
          return;
        }
        userId = userData.id;
      }
      // 2. Insert into profiles if not exists
      if (userCreated) {
        await supabase.from('profiles').insert({
          id: userId,
          email: emailLower,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          account_type: 'white_label',
        });
      } else {
        // If user exists, update account_type if not already set
        await supabase.from('profiles').update({
          account_type: 'white_label',
          first_name: customerData.firstName,
          last_name: customerData.lastName,
        }).eq('id', userId);
      }
      // 3. Insert into white_label_clients if not exists
      const { data: existingClient } = await supabase
        .from('white_label_clients')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      
      let clientId;
      if (!existingClient) {
        // Create feature flags based on selected features and plan inclusions
        const featureFlags = {
          ai_search_assistance_enabled: selectedFeatures.includes('ai_recommendations'),
          producer_onboarding_enabled: selectedFeatures.includes('producer_applications') || selectedPlan === 'pro',
          deep_media_search_enabled: selectedFeatures.includes('deep_media_search'),
          // Payment status - all features start as unpaid
          ai_search_assistance_paid: false,
          producer_onboarding_paid: false,
          deep_media_search_paid: false
        };

        const { data: inserted, error: insertError } = await supabase.from('white_label_clients').insert({
          owner_id: userId,
          owner_email: emailLower,
          display_name: customerData.company,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          domain: null,
          primary_color: '#6366f1',
          secondary_color: '#8b5cf6',
          password_setup_required: false,
          plan: selectedPlan,
          // Feature flags
          ...featureFlags
        }).select('id').single();
        
        if (insertError) {
          console.error('Error inserting white label client:', insertError);
          throw new Error('Failed to create white label client');
        }
        clientId = inserted.id;
      } else {
        clientId = existingClient.id;
        // Update existing client with new features and plan
        const featureFlags = {
          ai_search_assistance_enabled: selectedFeatures.includes('ai_recommendations'),
          producer_onboarding_enabled: selectedFeatures.includes('producer_applications') || selectedPlan === 'pro',
          deep_media_search_enabled: selectedFeatures.includes('deep_media_search'),
          plan: selectedPlan
        };
        
        await supabase.from('white_label_clients').update(featureFlags).eq('id', clientId);
      }
      // 4. Proceed to payment/session
      const checkoutData = await createWhiteLabelCheckout({
        plan: selectedPlan,
        features: selectedFeatures,
        customerEmail: customerData.email,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        companyName: customerData.company,
        clientId: clientId, // Pass client ID for payment tracking
        // Do NOT send password to backend anymore
      });
      window.location.href = checkoutData.url;
      setSuccess(true);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckout = () => {
    setShowCheckoutForm(true);
  };

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-white mb-4">Creating Your Account</h3>
          <p className="text-gray-300 text-center max-w-md">
            Please wait while we set up your white label platform and prepare your payment session...
          </p>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Feature(s) Paid & Activated!</h3>
          <p className="text-gray-300 mb-4 text-center">
            Thank you! Your selected feature(s) are now active. You can start using them immediately.
          </p>
          <button
            className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            onClick={() => setSuccess(false)}
          >
            Close
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calculator className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Pricing Calculator</h3>
            <p className="text-gray-400">Calculate your startup and annual costs</p>
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">Choose Your Plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(plans).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key as 'starter' | 'pro')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPlan === key
                  ? `border-${plan.color}-500 bg-${plan.color}-500/10`
                  : 'border-gray-600 bg-white/5 hover:border-gray-500'
              }`}
            >
              <div className="text-left">
                <h5 className="font-semibold text-white">{plan.name}</h5>
                <p className="text-sm text-gray-400">
                  ${plan.setupFee} setup + ${plan.monthlyFee}/month
                </p>
                {discounts.plan && selectedPlan === key && (
                  <div className="flex items-center mt-2 text-green-400">
                    <Percent className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">
                      {discounts.plan.percent}% off - {discounts.plan.name}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Selection */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">Select Features</h4>
        <div className="space-y-3">
          {getAvailableFeatures().map((feature) => {
            const Icon = feature.icon;
            const isSelected = selectedFeatures.includes(feature.id);
            const isIncluded = feature.includedIn.includes(selectedPlan);
            const isDisabled = !feature.availableIn.includes(selectedPlan);
            const hasDiscount = discounts.features[feature.id];
            
            return (
              <label
                key={feature.id}
                className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? isIncluded 
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-white/5 hover:border-gray-500'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected || isIncluded}
                  onChange={() => {
                    if (isIncluded) return; // Can't uncheck included features
                    handleFeatureToggle(feature.id);
                  }}
                  disabled={isDisabled || isIncluded}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h6 className="font-medium text-white">{feature.name}</h6>
                      <div className="flex items-center space-x-2">
                        {isIncluded ? (
                          <span className="text-green-400 text-sm font-medium">Included</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {hasDiscount && (
                              <span className="text-red-400 text-sm line-through">${feature.price}</span>
                            )}
                            <span className="text-blue-400 font-semibold">
                              ${hasDiscount ? Math.round(feature.price * (1 - hasDiscount.percent / 100)) : feature.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                    {hasDiscount && !isIncluded && (
                      <div className="flex items-center mt-1 text-green-400">
                        <Percent className="w-3 h-3 mr-1" />
                        <span className="text-xs">
                          {hasDiscount.percent}% off - {hasDiscount.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-black/20 rounded-lg p-6 border border-gray-600">
        <h4 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h4>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Plan Setup Fee:</span>
            <span className="text-white font-semibold">${getSelectedPlan().setupFee}</span>
          </div>
          
          {selectedFeatures.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Feature Setup Fees:</span>
                <span className="text-white font-semibold">${calculateStartupCost() - getSelectedPlan().setupFee}</span>
              </div>
              
              {getBundleDiscount() > 0 && (
                <div className="flex justify-between items-center text-green-400">
                  <span>Bundle Discount:</span>
                  <span className="font-semibold">-${getBundleDiscount()}</span>
                </div>
              )}
            </>
          )}

          {/* Show applied discounts */}
          {(discounts.plan || Object.keys(discounts.features).length > 0) && (
            <div className="border-t border-gray-600 pt-3">
              <div className="text-sm text-gray-400 mb-2">Applied Discounts:</div>
              {discounts.plan && (
                <div className="flex justify-between items-center text-green-400">
                  <span className="text-sm">{discounts.plan.name}:</span>
                  <span className="text-sm font-semibold">-{discounts.plan.percent}%</span>
                </div>
              )}
              {Object.entries(discounts.features).map(([featureId, discount]) => {
                const feature = features.find(f => f.id === featureId);
                return (
                  <div key={featureId} className="flex justify-between items-center text-green-400">
                    <span className="text-sm">{feature?.name} - {discount.name}:</span>
                    <span className="text-sm font-semibold">-{discount.percent}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show included features */}
          {getAvailableFeatures().filter(f => f.includedIn.includes(selectedPlan)).length > 0 && (
            <div className="border-t border-gray-600 pt-3">
              <div className="text-sm text-gray-400 mb-2">Included Features:</div>
              {getAvailableFeatures()
                .filter(f => f.includedIn.includes(selectedPlan))
                .map(feature => (
                  <div key={feature.id} className="flex justify-between items-center text-green-400">
                    <span className="text-sm">{feature.name}:</span>
                    <span className="text-sm font-semibold">FREE (${feature.price} value)</span>
                  </div>
                ))}
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Total Startup Cost:</span>
              <span className="text-blue-400 font-bold text-lg">${finalStartupCost}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Annual Service Fee:</span>
            <span className="text-white font-semibold">${calculateAnnualCost()}</span>
          </div>
          
          <div className="flex justify-between items-center text-lg">
            <span className="text-white font-semibold">First Year Total:</span>
            <span className="text-green-400 font-bold">${finalStartupCost + calculateAnnualCost()}</span>
          </div>
        </div>
      </div>

      {/* Bundle Savings Notice */}
      {getBundleDiscount() > 0 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-green-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">
              You're saving ${getBundleDiscount()} with bundle pricing!
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Checkout Form */}
      {showCheckoutForm && (
        <div className="mt-6 bg-black/20 rounded-lg p-6 border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">Complete Your Order</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={customerData.firstName}
                onChange={handleCustomerDataChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={customerData.lastName}
                onChange={handleCustomerDataChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your last name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={customerData.email}
                onChange={handleCustomerDataChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={customerData.company}
                onChange={handleCustomerDataChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your company name"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Must be at least 8 characters with uppercase, lowercase, and special characters
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-6">
        {showCheckoutForm ? (
          <div className="space-y-3">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="block w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            <button
              onClick={() => setShowCheckoutForm(false)}
              className="block w-full py-2 px-6 bg-white/10 hover:bg-white/20 text-white text-center font-medium rounded-lg transition-colors border border-gray-600"
            >
              Back to Calculator
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartCheckout}
            disabled={loading}
            className="block w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <span>Start Checkout</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 