import React, { useState } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ClientProfile } from './ClientProfile';
import { ProducerProfile } from './ProducerProfile';
import { WhiteLabelClientProfile } from './WhiteLabelClientProfile';
import { RightsHolderProfile } from './RightsHolderProfile';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, accountType, loading } = useUnifiedAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(true);

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleClose = () => {
    setIsProfileOpen(false);
    navigate(-1); // Go back to previous page
  };

  const handleProfileUpdate = () => {
    // Profile was updated successfully
    console.log('Profile updated successfully');
  };

  const renderProfileComponent = () => {
    switch (accountType) {
      case 'rights_holder':
        return (
          <RightsHolderProfile
            onClose={handleClose}
            onProfileUpdated={handleProfileUpdate}
          />
        );
      
      case 'white_label':
        return <WhiteLabelClientProfile />;
      
      case 'producer':
      case 'admin,producer':
        return (
          <ProducerProfile
            isOpen={isProfileOpen}
            onClose={handleClose}
            onProfileUpdated={handleProfileUpdate}
          />
        );
      
      case 'client':
      default:
        return (
          <ClientProfile
            onClose={handleClose}
            onUpdate={handleProfileUpdate}
          />
        );
    }
  };

  return renderProfileComponent();
}
