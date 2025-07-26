import React, { useState, useEffect } from 'react';
import { X, Copy, Gift } from 'lucide-react';

interface WelcomeDiscountModalProps {
  onClose: () => void;
}

export default function WelcomeDiscountModal({ onClose }: WelcomeDiscountModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the modal today
    const today = new Date().toDateString();
    const seenToday = localStorage.getItem('welcomeDiscountModalSeen') === today;
    
    if (!seenToday) {
      // Delay the modal appearance to avoid popup blockers
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenModal(true);
    // Mark as seen today
    localStorage.setItem('welcomeDiscountModalSeen', new Date().toDateString());
    onClose();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME30');
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl shadow-2xl border border-blue-500/20 max-w-md w-full p-6 text-white">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Gift size={32} />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-2">🎉 Welcome to MyBeatFi!</h3>
          
          {/* Description */}
          <p className="text-gray-300 mb-6">
            Get 30% off your purchase with our welcome discount!
          </p>

          {/* Discount Code */}
          <div className="bg-white/10 rounded-lg p-4 mb-6 border border-white/20">
            <p className="text-sm text-gray-300 mb-2">Use this code at checkout:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono font-bold text-xl bg-white/20 px-4 py-2 rounded-lg">
                WELCOME30
              </span>
              <button
                onClick={copyCode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Copy code"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Valid for all track purchases</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>No restrictions or hidden fees</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Can be used multiple times</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Valid for 30 days</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Got it!
            </button>
            <button
              onClick={() => {
                copyCode();
                handleClose();
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-colors font-semibold"
            >
              Copy & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 