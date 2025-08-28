import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Tag, Percent, Calendar, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscountCode {
  id: string;
  name: string;
  description: string;
  promotion_code: string;
  discount_percent: number;
  discount_type: string;
  applies_to: string[];
  end_date: string;
  is_active: boolean;
}

const DiscountCodesSection: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          id,
          name,
          description,
          promotion_code,
          discount_percent,
          discount_type,
          applies_to,
          end_date,
          is_active,
          start_date,
          end_date
        `)
        .eq('discount_type', 'promotion_code')
        .eq('is_active', true)
        .not('promotion_code', 'is', null) // Only show discounts with promotion codes
        .gte('end_date', new Date().toISOString().split('T')[0]) // Only show codes that haven't expired
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching discount codes:', error);
        return;
      }

      setDiscountCodes(data || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  const getAppliesToText = (appliesTo: string[]) => {
    if (!appliesTo || appliesTo.length === 0) return 'All plans';
    
    const planNames: { [key: string]: string } = {
      'single_track': 'Single Track',
      'gold_access': 'Gold Access',
      'platinum_access': 'Platinum Access',
      'ultimate_access': 'Ultimate Access',
      'all': 'All plans',
      'pro': 'Pro plans',
      'starter': 'Starter plans'
    };

    if (appliesTo.includes('all')) return 'All plans';
    
    const planTexts = appliesTo.map(plan => planNames[plan] || plan).join(', ');
    return planTexts;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % discountCodes.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + discountCodes.length) % discountCodes.length);
  };

  if (loading) {
    return (
      <div className="h-full">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Tag className="w-4 h-4 mr-2 text-green-400" />
            Active Discounts
          </h3>
        </div>
        <div className="flex justify-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
            Loading discount codes...
          </div>
        </div>
      </div>
    );
  }

  if (discountCodes.length === 0) {
    return (
      <div className="h-full">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Tag className="w-4 h-4 mr-2 text-green-400" />
            Active Discounts
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">No active discounts available</p>
        </div>
      </div>
    );
  }

  // Show multiple discounts in a compact horizontal layout
  if (discountCodes.length <= 3) {
    return (
      <div className="h-full">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Tag className="w-4 h-4 mr-2 text-green-400" />
            Active Discounts
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {discountCodes.map((discount) => (
            <div key={discount.id} className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border border-green-400 dark:border-green-500 rounded-lg px-3 py-3 shadow-lg flex-shrink-0 min-w-[200px]">
              <div className="flex flex-col gap-2">
                {/* Header - Compact */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-white" />
                    <span className="font-medium text-xs text-white truncate">
                      {discount.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-1 py-0">
                    <Percent className="h-2 w-2 mr-1" />
                    {discount.discount_percent}%
                  </Badge>
                </div>

                {/* Applies to - Compact */}
                <div className="text-xs text-green-100">
                  <span className="font-medium">Applies to:</span> {getAppliesToText(discount.applies_to)}
                </div>

                {/* Promotion code and copy button - Compact */}
                <div className="flex items-center gap-1">
                  <div className="bg-white text-green-700 font-bold border rounded px-2 py-1 font-mono text-xs shadow-sm flex-1 text-center">
                    {discount.promotion_code}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(discount.promotion_code)}
                    className="text-xs h-6 px-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <Copy className="h-2 w-2" />
                  </Button>
                </div>

                {/* Expiry - Compact */}
                <div className="flex items-center gap-1 text-xs text-green-100">
                  <Calendar className="h-2 w-2" />
                  <span>Expires: {formatDate(discount.end_date)}</span>
                  {isExpiringSoon(discount.end_date) && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show carousel for 4+ discounts
  return (
    <div className="h-full">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Tag className="w-4 h-4 mr-2 text-green-400" />
          Active Discounts
        </h3>
      </div>
      <div className="relative">
        {/* Navigation Arrows - Outside Container */}
        {discountCodes.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors shadow-lg z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors shadow-lg z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Carousel Container */}
        <div className="overflow-hidden rounded-lg">
          <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {discountCodes.map((discount) => (
              <div key={discount.id} className="w-full flex-shrink-0 px-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border border-green-400 dark:border-green-500 rounded-lg px-4 py-3 shadow-lg">
                  <div className="flex flex-col gap-2">
                    {/* Header - Compact */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-white" />
                        <span className="font-medium text-xs text-white truncate">
                          {discount.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-1 py-0">
                        <Percent className="h-2 w-2 mr-1" />
                        {discount.discount_percent}%
                      </Badge>
                    </div>

                    {/* Applies to - Compact */}
                    <div className="text-xs text-green-100">
                      <span className="font-medium">Applies to:</span> {getAppliesToText(discount.applies_to)}
                    </div>

                    {/* Promotion code and copy button - Compact */}
                    <div className="flex items-center gap-1">
                      <div className="bg-white text-green-700 font-bold border rounded px-2 py-1 font-mono text-xs shadow-sm flex-1 text-center">
                        {discount.promotion_code}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(discount.promotion_code)}
                        className="text-xs h-6 px-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    </div>

                    {/* Expiry - Compact */}
                    <div className="flex items-center gap-1 text-xs text-green-100">
                      <Calendar className="h-2 w-2" />
                      <span>Expires: {formatDate(discount.end_date)}</span>
                      {isExpiringSoon(discount.end_date) && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {discountCodes.length > 1 && (
          <div className="flex justify-center mt-3 gap-1">
            {discountCodes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-green-400' : 'bg-green-200/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountCodesSection; 