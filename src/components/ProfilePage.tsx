import React, { useState } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ClientProfile } from './ClientProfile';
import { ProducerProfile } from './ProducerProfile';
import { WhiteLabelClientProfile } from './WhiteLabelClientProfile';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { accountType } = useUnifiedAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(true);

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
          <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={handleClose}
                  className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <h1 className="text-3xl font-bold">Rights Holder Profile</h1>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 mb-4">
                  Profile management for rights holders is currently being developed.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Coming Soon</h3>
                    <p className="text-gray-300">
                      Rights holder profile management will include:
                    </p>
                    <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
                      <li>Company information</li>
                      <li>Contact details</li>
                      <li>Rights management preferences</li>
                      <li>Payment settings</li>
                      <li>Notification preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
