import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Tag, Percent, Calendar, CheckCircle } from 'lucide-react';

interface DiscountCode {
  id: string;
  name: string;
  description: string;
  promotion_code: string;
  discount_percent: number;
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
          end_date,
          is_active,
          start_date,
          end_date
        `)
        .eq('discount_type', 'promotion_code')
        .eq('is_active', true)
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Discount Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading discount codes...</div>
        </CardContent>
      </Card>
    );
  }

  if (discountCodes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Discount Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No active discount codes available at the moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Available Discount Codes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {discountCodes.map((discount) => (
            <div
              key={discount.id}
              className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{discount.name}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Percent className="h-3 w-3 mr-1" />
                      {discount.discount_percent}% OFF
                    </Badge>
                    {isExpiringSoon(discount.end_date) && (
                      <Badge variant="destructive" className="text-xs">
                        Expires Soon
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {discount.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {formatDate(discount.end_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-white dark:bg-gray-800 border rounded-md px-3 py-2 font-mono text-sm">
                    {discount.promotion_code}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(discount.promotion_code)}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === discount.promotion_code ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>How to use:</strong> Copy a discount code and enter it during checkout to receive your discount!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscountCodesSection; 