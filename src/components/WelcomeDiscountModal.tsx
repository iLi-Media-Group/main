import React, { useState, useEffect } from 'react';
import { X, Copy, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WelcomeDiscountModalProps {
  onClose: () => void;
}

interface Discount {
  id: string;
  name: string;
  promotion_code: string;
  discount_percent: number;
  description?: string;
}

export default function WelcomeDiscountModal({ onClose }: WelcomeDiscountModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active promotion code discounts
    const fetchDiscounts = async () => {
      try {
        console.log('🔍 WelcomeDiscountModal: Fetching discounts...');
        const today = new Date().toISOString().split('T')[0];
        console.log('🔍 WelcomeDiscountModal: Today is:', today);
        
        const { data, error } = await supabase
          .from('discounts')
          .select('id, name, promotion_code, discount_percent, description, start_date, end_date, is_active')
          .eq('discount_type', 'promotion_code')
          .eq('is_active', true);

        if (error) {
          console.error('🔍 WelcomeDiscountModal: Error fetching discounts:', error);
        } else {
          console.log('🔍 WelcomeDiscountModal: Raw discounts data:', data);
          
          // Filter by date range manually
          const activeDiscounts = data?.filter(discount => {
            const startDate = new Date(discount.start_date);
            const endDate = new Date(discount.end_date);
            const currentDate = new Date();
            
            const isActive = currentDate >= startDate && currentDate <= endDate;
            console.log(`🔍 WelcomeDiscountModal: Discount ${discount.promotion_code}: start=${discount.start_date}, end=${discount.end_date}, isActive=${isActive}`);
            
            return isActive;
          }) || [];
          
          console.log('🔍 WelcomeDiscountModal: Active discounts:', activeDiscounts);
          setDiscounts(activeDiscounts);
        }
      } catch (error) {
        console.error('🔍 WelcomeDiscountModal: Error fetching discounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  useEffect(() => {
    // Only show modal if we have discounts and user hasn't seen it today
    console.log('🔍 WelcomeDiscountModal: Checking modal visibility...');
    console.log('🔍 WelcomeDiscountModal: loading=', loading);
    console.log('🔍 WelcomeDiscountModal: discounts.length=', discounts.length);
    
    if (!loading && discounts.length > 0) {
      const today = new Date().toDateString();
      const seenToday = localStorage.getItem('welcomeDiscountModalSeen') === today;
      
      console.log('🔍 WelcomeDiscountModal: today=', today);
      console.log('🔍 WelcomeDiscountModal: seenToday=', seenToday);
      
      if (!seenToday) {
        console.log('🔍 WelcomeDiscountModal: Setting timer to show modal in 2 seconds...');
        // Delay the modal appearance to avoid popup blockers
        const timer = setTimeout(() => {
          console.log('🔍 WelcomeDiscountModal: Showing modal now!');
          setIsVisible(true);
        }, 2000); // Show after 2 seconds

        return () => clearTimeout(timer);
      } else {
        console.log('🔍 WelcomeDiscountModal: User has already seen modal today');
      }
    } else {
      console.log('🔍 WelcomeDiscountModal: Not showing modal - loading or no discounts');
    }
  }, [loading, discounts]);

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenModal(true);
    // Mark as seen today
    localStorage.setItem('welcomeDiscountModalSeen', new Date().toDateString());
    onClose();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (!isVisible || loading || discounts.length === 0) {
    console.log('🔍 WelcomeDiscountModal: Not rendering modal:');
    console.log('🔍 WelcomeDiscountModal: isVisible=', isVisible);
    console.log('🔍 WelcomeDiscountModal: loading=', loading);
    console.log('🔍 WelcomeDiscountModal: discounts.length=', discounts.length);
    return null;
  }

  // Use the first available discount
  const discount = discounts[0];

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
            Get {discount.discount_percent}% off your purchase with our welcome discount!
          </p>

          {/* Discount Code */}
          <div className="bg-white/10 rounded-lg p-4 mb-6 border border-white/20">
            <p className="text-sm text-gray-300 mb-2">Use this code at checkout:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono font-bold text-xl bg-white/20 px-4 py-2 rounded-lg">
                {discount.promotion_code}
              </span>
              <button
                onClick={() => copyCode(discount.promotion_code)}
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
                copyCode(discount.promotion_code);
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