import React, { useState, useEffect } from 'react';
import { Copy, Gift, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Discount {
  id: string;
  name: string;
  promotion_code: string;
  discount_percent: number;
  description?: string;
  end_date: string;
}

export default function DiscountBanner() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        console.log('🔍 DiscountBanner: Fetching discounts...');
        
        const { data, error } = await supabase
          .from('discounts')
          .select('id, name, promotion_code, discount_percent, description, start_date, end_date, is_active')
          .eq('discount_type', 'promotion_code')
          .eq('is_active', true);

        if (error) {
          console.error('🔍 DiscountBanner: Error fetching discounts:', error);
        } else {
          console.log('🔍 DiscountBanner: Raw discounts data:', data);
          
          // Filter by date range manually
          const activeDiscounts = data?.filter(discount => {
            const startDate = new Date(discount.start_date);
            const endDate = new Date(discount.end_date);
            const currentDate = new Date();
            
            const isActive = currentDate >= startDate && currentDate <= endDate;
            console.log(`🔍 DiscountBanner: Discount ${discount.promotion_code}: start=${discount.start_date}, end=${discount.end_date}, isActive=${isActive}`);
            
            return isActive;
          }) || [];
          
          console.log('🔍 DiscountBanner: Active discounts:', activeDiscounts);
          setDiscounts(activeDiscounts);
        }
      } catch (error) {
        console.error('🔍 DiscountBanner: Error fetching discounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
      console.log('🔍 DiscountBanner: Copied code:', code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (loading || discounts.length === 0 || !isVisible) {
    return null;
  }

  // Use the first available discount
  const discount = discounts[0];
  const endDate = new Date(discount.end_date);
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500/20 rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Gift size={24} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              🎉 {discount.name}
            </h3>
            <p className="text-blue-200 text-sm mb-2">
              Get {discount.discount_percent}% off your purchase!
            </p>
            
            {/* Discount Code */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300">Use code:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-lg bg-white/20 px-3 py-1 rounded text-white">
                  {discount.promotion_code}
                </span>
                <button
                  onClick={() => copyCode(discount.promotion_code)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy code"
                >
                  <Copy size={16} className="text-blue-300" />
                </button>
              </div>
            </div>
            
            {/* Expiry info */}
            <p className="text-xs text-blue-300 mt-2">
              {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expires today'}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Dismiss"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
} 