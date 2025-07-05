import React from 'react';
import { Crown, Lock, Sparkles, ArrowUp } from 'lucide-react';

interface PremiumFeatureNoticeProps {
  featureName: string;
  description: string;
  currentPlan?: string;
  className?: string;
}

export function PremiumFeatureNotice({ 
  featureName, 
  description, 
  currentPlan = 'starter',
  className = '' 
}: PremiumFeatureNoticeProps) {
  const getFeatureAccess = (featureName: string) => {
    switch (featureName) {
      case 'ai_search_assistance':
        return {
          starter: 'Paid Add-on',
          pro: 'Paid Add-on',
          enterprise: 'Included'
        };
      case 'producer_onboarding':
        return {
          starter: 'Paid Add-on',
          pro: 'Included',
          enterprise: 'Included'
        };
      case 'deep_media_search':
        return {
          starter: 'Paid Add-on',
          pro: 'Paid Add-on',
          enterprise: 'Included'
        };
      case 'advanced_analytics':
        return {
          starter: 'Paid Add-on',
          pro: 'Paid Add-on',
          enterprise: 'Included'
        };
      default:
        return {
          starter: 'Paid Add-on',
          pro: 'Paid Add-on',
          enterprise: 'Included'
        };
    }
  };

  const access = getFeatureAccess(featureName);
  const currentAccess = access[currentPlan as keyof typeof access] || 'Paid Add-on';
  const nextPlan = currentPlan === 'starter' ? 'Pro' : currentPlan === 'pro' ? 'Enterprise' : null;

  return (
    <div className={`bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{featureName}</h3>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
              {currentAccess}
            </span>
          </div>
          
          <p className="text-gray-300 mb-4">{description}</p>
          
          {/* Plan Access Overview */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="font-medium text-gray-300">Starter</div>
              <div className={access.starter === 'Included' ? 'text-green-400' : 'text-yellow-400'}>
                {access.starter}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="font-medium text-gray-300">Pro</div>
              <div className={access.pro === 'Included' ? 'text-green-400' : 'text-yellow-400'}>
                {access.pro}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="font-medium text-gray-300">Enterprise</div>
              <div className={access.enterprise === 'Included' ? 'text-green-400' : 'text-yellow-400'}>
                {access.enterprise}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>
              {nextPlan ? `Upgrade to ${nextPlan} Plan` : 'Contact sales for custom pricing'}
            </span>
            {nextPlan && <ArrowUp className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
} 