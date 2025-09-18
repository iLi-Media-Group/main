import React from 'react';
import { PlaylistManager } from './PlaylistManager';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

export function PlaylistManagerWrapper() {
  const { accountType } = useUnifiedAuth();
  
  return <PlaylistManager accountType={accountType} />;
}
