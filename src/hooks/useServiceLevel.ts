import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { WhiteLabelFeatureFlagsContext } from '../contexts/WhiteLabelFeatureFlagsContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

export type ServiceLevel = 'normal' | 'ai_search' | 'deep_media' | 'both';

export interface ServiceLevelInfo {
  level: ServiceLevel;
  hasAISearch: boolean;
  hasDeepMedia: boolean;
  hasProducerOnboarding: boolean;
  isPaid: boolean;
  isProLevel: boolean;
  isEnterpriseLevel: boolean;
}

export function useServiceLevel(): ServiceLevelInfo {
  const flags = useContext(WhiteLabelFeatureFlagsContext);
  const { user, accountType } = useUnifiedAuth();
  
  // MyBeatFi.io users (admin, clients) always have full access
  const isMyBeatFiUser = !flags || accountType === 'admin' || accountType === 'client';
  
  if (isMyBeatFiUser) {
    return {
      level: 'both',
      hasAISearch: true,
      hasDeepMedia: true,
      hasProducerOnboarding: true,
      isPaid: true,
      isProLevel: true,
      isEnterpriseLevel: true
    };
  }

  // White label clients - check their paid features
  const hasAISearch = flags.ai_search_assistance_enabled && flags.ai_search_assistance_paid;
  const hasDeepMedia = flags.deep_media_search_enabled && flags.deep_media_search_paid;
  const hasProducerOnboarding = flags.producer_onboarding_enabled && flags.producer_onboarding_paid;

  // Determine service level based on enabled and paid features
  let level: ServiceLevel = 'normal';
  let isProLevel = false;
  let isEnterpriseLevel = false;
  
  // Check if this is Pro level (has Producer Onboarding included)
  if (hasProducerOnboarding) {
    isProLevel = true;
  }
  
  // Check if this is Enterprise level (has everything)
  if (hasAISearch && hasDeepMedia && hasProducerOnboarding) {
    isEnterpriseLevel = true;
    level = 'both';
  } else if (hasAISearch && hasDeepMedia) {
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
    isPaid: hasAISearch || hasDeepMedia || hasProducerOnboarding,
    isProLevel,
    isEnterpriseLevel
  };
}
