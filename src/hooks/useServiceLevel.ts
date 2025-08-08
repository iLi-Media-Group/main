import { useContext } from 'react';
import { WhiteLabelFeatureFlagsContext } from '../contexts/WhiteLabelFeatureFlagsContext';
import { useAuth } from '../contexts/AuthContext';

export type ServiceLevel = 'normal' | 'ai_search' | 'deep_media' | 'both';

export interface ServiceLevelInfo {
  level: ServiceLevel;
  hasAISearch: boolean;
  hasDeepMedia: boolean;
  hasProducerOnboarding: boolean;
  isPaid: boolean;
}

export function useServiceLevel(): ServiceLevelInfo {
  const flags = useContext(WhiteLabelFeatureFlagsContext);
  const { user, accountType } = useAuth();
  
  // MyBeatFi.io users (admin, clients) always have full access
  const isMyBeatFiUser = !flags || accountType === 'admin' || accountType === 'client';
  
  if (isMyBeatFiUser) {
    return {
      level: 'both',
      hasAISearch: true,
      hasDeepMedia: true,
      hasProducerOnboarding: true,
      isPaid: true
    };
  }

  // White label clients - check their paid features
  const hasAISearch = flags.ai_search_assistance_enabled && flags.ai_search_assistance_paid;
  const hasDeepMedia = flags.deep_media_search_enabled && flags.deep_media_search_paid;
  const hasProducerOnboarding = flags.producer_onboarding_enabled && flags.producer_onboarding_paid;

  // Determine service level based on enabled and paid features
  let level: ServiceLevel = 'normal';
  
  if (hasAISearch && hasDeepMedia) {
    level = 'both';
  } else if (hasAISearch) {
    level = 'ai_search';
  } else if (hasDeepMedia) {
    level = 'deep_media';
  }

  return {
    level,
    hasAISearch,
    hasDeepMedia,
    hasProducerOnboarding,
    isPaid: hasAISearch || hasDeepMedia || hasProducerOnboarding
  };
}
