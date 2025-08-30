import React, { useState } from 'react';
import { useWhiteLabelFeatureFlags } from '../contexts/WhiteLabelFeatureFlagsContext';
import { supabase } from '../lib/supabase';
import { WhiteLabelCalculator } from './WhiteLabelCalculator';

export function WhiteLabelAdminPanel({ clientId, clientEmail, clientCompany }: { clientId: string, clientEmail: string, clientCompany?: string }) {
  const flags = useWhiteLabelFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState<string | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  const handleToggle = async (field: string, value: boolean, paid: boolean) => {
    if (!paid && value) {
      setUpgradeFeature(field);
      setShowCalculator(true);
      return;
    }
    await supabase.from('white_label_clients').update({ [field]: value }).eq('id', clientId);
    // Trigger a state update instead of reloading
    // The parent component should handle feature flag updates
  };

  if (!flags) return <div className="text-white">Loading feature flags...</div>;

  // Map UI field to feature id for calculator
  const featureFieldToId: Record<string, string> = {
    ai_search_assistance_enabled: 'ai_search_assistance',
    producer_onboarding_enabled: 'producer_onboarding',
    deep_media_search_enabled: 'deep_media_search',
  };

  return (
    <div className="max-w-lg mx-auto bg-white/5 rounded-xl p-8 border border-blue-500/20 mt-12">
      <h2 className="text-2xl font-bold text-white mb-6">Manage Your Paid Features</h2>
      <div className="space-y-4">
        <label className="flex items-center space-x-3 text-white">
          <input
            type="checkbox"
            checked={!!flags.ai_search_assistance_enabled}
            disabled={!flags.ai_search_assistance_paid}
            onChange={e => handleToggle('ai_search_assistance_enabled', e.target.checked, !!flags.ai_search_assistance_paid)}
          />
          <span>AI Search Assistance</span>
          {!flags.ai_search_assistance_paid && (
            <button
              className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
              onClick={() => {
                setUpgradeFeature('ai_search_assistance_enabled');
                setShowCalculator(true);
              }}
              type="button"
            >
              Upgrade
            </button>
          )}
        </label>
        <label className="flex items-center space-x-3 text-white">
          <input
            type="checkbox"
            checked={!!flags.producer_onboarding_enabled}
            disabled={!flags.producer_onboarding_paid}
            onChange={e => handleToggle('producer_onboarding_enabled', e.target.checked, !!flags.producer_onboarding_paid)}
          />
          <span>Producer Onboarding</span>
          {!flags.producer_onboarding_paid && (
            <button
              className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
              onClick={() => {
                setUpgradeFeature('producer_onboarding_enabled');
                setShowCalculator(true);
              }}
              type="button"
            >
              Upgrade
            </button>
          )}
        </label>
        <label className="flex items-center space-x-3 text-white">
          <input
            type="checkbox"
            checked={!!flags.deep_media_search_enabled}
            disabled={!flags.deep_media_search_paid}
            onChange={e => handleToggle('deep_media_search_enabled', e.target.checked, !!flags.deep_media_search_paid)}
          />
          <span>Deep Media Search</span>
          {!flags.deep_media_search_paid && (
            <button
              className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
              onClick={() => {
                setUpgradeFeature('deep_media_search_enabled');
                setShowCalculator(true);
              }}
              type="button"
            >
              Upgrade
            </button>
          )}
        </label>
      </div>
      {showCalculator && upgradeFeature && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-blue-900/90 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Upgrade Feature</h2>
              <button
                onClick={() => { setShowCalculator(false); setUpgradeFeature(null); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <WhiteLabelCalculator
                onCalculate={() => {}}
                initialFeatures={[featureFieldToId[upgradeFeature]]}
                initialCustomerEmail={clientEmail}
                initialCompanyName={clientCompany}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 