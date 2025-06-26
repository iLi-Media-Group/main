import { supabase } from './supabase';

export interface WhiteLabelCheckoutOptions {
  plan: 'starter' | 'pro' | 'enterprise';
  features: string[];
  customerEmail: string;
  customerName: string;
  companyName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface WhiteLabelPricing {
  originalSetupCost: number;
  finalSetupCost: number;
  monthlyCost: number;
  appliedDiscount: {
    name: string;
    description: string;
    percent: number;
  } | null;
  bundleDiscount: number;
  features: string[];
}

export interface WhiteLabelCheckoutResponse {
  sessionId: string;
  url: string;
  pricing: WhiteLabelPricing;
}

export async function createWhiteLabelCheckout(options: WhiteLabelCheckoutOptions): Promise<WhiteLabelCheckoutResponse> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/white-label-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        plan: options.plan,
        features: options.features,
        customer_email: options.customerEmail,
        customer_name: options.customerName,
        company_name: options.companyName || '',
        success_url: options.successUrl || `${window.location.origin}/white-label/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: options.cancelUrl || `${window.location.origin}/white-label`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create white label checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating white label checkout session:', error);
    throw error;
  }
}

// Function to get applicable discounts for display
export async function getApplicableDiscounts(itemName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_applicable_discounts', {
        item_name: itemName,
        check_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error getting applicable discounts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting applicable discounts:', error);
    return [];
  }
}

// Function to calculate discounted price for display
export async function calculateDiscountedPrice(originalPrice: number, itemName: string): Promise<{
  original_price: number;
  discount_percent: number;
  discounted_price: number;
  discount_name: string | null;
  discount_description: string | null;
}> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_discounted_price', {
        original_price: originalPrice,
        item_name: itemName,
        check_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error calculating discounted price:', error);
      return {
        original_price: originalPrice,
        discount_percent: 0,
        discounted_price: originalPrice,
        discount_name: null,
        discount_description: null
      };
    }

    return data?.[0] || {
      original_price: originalPrice,
      discount_percent: 0,
      discounted_price: originalPrice,
      discount_name: null,
      discount_description: null
    };
  } catch (error) {
    console.error('Error calculating discounted price:', error);
    return {
      original_price: originalPrice,
      discount_percent: 0,
      discounted_price: originalPrice,
      discount_name: null,
      discount_description: null
    };
  }
} 