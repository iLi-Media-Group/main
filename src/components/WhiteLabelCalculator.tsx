import React, { useState } from 'react';
import { Calculator, Brain, Users, Search, DollarSign, Calendar, ArrowRight } from 'lucide-react';

interface PricingCalculatorProps {
  onCalculate?: (total: number) => void;
}

export function WhiteLabelCalculator({ onCalculate }: PricingCalculatorProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

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
      availableIn: ['starter', 'pro']
    },
    {
      id: 'ai_recommendations',
      name: 'AI Search Assistance',
      description: 'AI-powered search and recommendations',
      price: 249,
      icon: Brain,
      availableIn: ['pro']
    },
    {
      id: 'deep_media_search',
      name: 'Deep Media Search',
      description: 'Advanced media type tagging and filtering',
      price: 249,
      icon: Search,
      availableIn: ['starter', 'pro']
    }
  ];

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
      .map(featureId => features.find(f => f.id === featureId)?.price || 0)
      .reduce((sum, price) => sum + price, 0);
    
    return plan.setupFee + selectedFeatureCosts;
  };

  const calculateAnnualCost = () => {
    const plan = getSelectedPlan();
    return plan.monthlyFee * 12;
  };

  const calculateTotalFirstYear = () => {
    return calculateStartupCost() + calculateAnnualCost();
  };

  const getBundleDiscount = () => {
    const selectedFeatureCount = selectedFeatures.length;
    if (selectedFeatureCount === 2) return 49; // Save $49
    if (selectedFeatureCount === 3) return 148; // Save $148
    return 0;
  };

  const finalStartupCost = calculateStartupCost() - getBundleDiscount();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Calculator className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Pricing Calculator</h3>
          <p className="text-gray-400">Calculate your startup and annual costs</p>
        </div>
      </div>

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
            const isDisabled = !feature.availableIn.includes(selectedPlan);
            
            return (
              <label
                key={feature.id}
                className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-white/5 hover:border-gray-500'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleFeatureToggle(feature.id)}
                  disabled={isDisabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h6 className="font-medium text-white">{feature.name}</h6>
                      <span className="text-blue-400 font-semibold">${feature.price}</span>
                    </div>
                    <p className="text-sm text-gray-400">{feature.description}</p>
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

      {/* CTA */}
      <div className="mt-6">
        <a
          href="#contact"
          className="block w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center"
        >
          <span>Request Demo with This Configuration</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </a>
      </div>
    </div>
  );
} 