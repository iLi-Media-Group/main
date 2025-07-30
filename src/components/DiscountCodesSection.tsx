import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Tag, Percent, Calendar, CheckCircle } from 'lucide-react';

interface DiscountCode {
  id: string;
  name: string;
  description: string;
  promotion_code: string;
  discount_percent: number;
  discount_type: string;
  end_date: string;
  is_active: boolean;
}

const DiscountCodesSection: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
          Loading discount codes...
        </div>
      </div>
    );
  }

  if (discountCodes.length === 0) {
    return null; // Don't show anything if no discount codes
  }

  // Show only the first active discount code in a compact format
  const discount = discountCodes[0];

  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border border-green-400 dark:border-green-500 rounded-lg px-4 py-3 max-w-md shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-white" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-white">
                  {discount.name}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  <Percent className="h-3 w-3 mr-1" />
                  {discount.discount_percent}% OFF
                </Badge>
                {isExpiringSoon(discount.end_date) && (
                  <Badge variant="destructive" className="text-xs">
                    Expires Soon
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-green-100 mt-1">
                <Calendar className="h-3 w-3" />
                Expires: {formatDate(discount.end_date)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white text-green-700 font-bold border rounded px-2 py-1 font-mono text-xs shadow-sm">
              {discount.promotion_code}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(discount.promotion_code)}
              className="text-xs h-6 px-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedCode === discount.promotion_code ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCodesSection; 