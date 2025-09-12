import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WelcomeDiscountBannerProps {
  onClose: () => void;
}

export default function WelcomeDiscountBanner({ onClose }: WelcomeDiscountBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenBanner, setHasSeenBanner] = useState(false);

  useEffect(() => {
    // Check if user has seen the banner today
    const today = new Date().toDateString();
    const seenToday = localStorage.getItem('welcomeDiscountBannerSeen') === today;
    
    if (!seenToday) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenBanner(true);
    // Mark as seen today
    localStorage.setItem('welcomeDiscountBannerSeen', new Date().toDateString());
    onClose();
  };

  const copyCode = () => {
    navigator.clipboard.writeText('WELCOME30');
    // You could add a toast notification here
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">🎉 Welcome to MyBeatFi!</h3>
          <p className="text-sm mb-3">
            Use code <span className="font-mono font-bold bg-white/20 px-2 py-1 rounded">WELCOME30</span> for 30% off your first purchase!
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={copyCode}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Copy Code
            </button>
            <span className="text-xs opacity-80">Valid for 30 days</span>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
} 