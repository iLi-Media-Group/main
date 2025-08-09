import { supabase } from './supabase';

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription', trackId?: string, customData?: any, customSuccessUrl?: string) {
  try {
    // Get the current session - this implicitly handles refresh
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('You must be logged in to make a purchase');
    }

    // Prepare metadata for the checkout session
    let checkoutMetadata = customData || {};
    if (trackId) {
      checkoutMetadata.track_id = trackId;
    }

    // Extract custom_amount from customData if it exists
    const customAmount = customData?.amount;
    
    // Remove amount from metadata to avoid duplication
    if (checkoutMetadata.amount) {
      delete checkoutMetadata.amount;
    }

    const requestBody: any = {
      price_id: priceId,
      success_url: customSuccessUrl || `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`,
      mode,
      metadata: checkoutMetadata,
      payment_method_types: ['card', 'us_bank_account', 'customer_balance']
    };

    // Only add custom_amount if it exists and price_id is 'price_custom'
    if (customAmount && priceId === 'price_custom') {
      requestBody.custom_amount = customAmount;
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Add the missing createStripeCheckout function that uses our Edge Function
export async function createStripeCheckout({
  productId,
  name,
  description,
  price,
  successUrl,
  cancelUrl,
  metadata
}: {
  productId: string;
  name: string;
  description: string;
  price: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: any;
}) {
  try {
    // Get the current session - this implicitly handles refresh
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('You must be logged in to make a purchase');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: 'price_custom',
        custom_amount: Math.round(price * 100), // Convert to cents
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          product_id: productId,
          name,
          description,
          ...metadata
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getUserSubscription() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function getUserOrders() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function cancelUserSubscription() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('You must be logged in to cancel your subscription');
    }
    const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/functions/v1/cancel-stripe-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to cancel subscription');
    }
    return result;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

export async function resumeUserSubscription() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('You must be logged in to resume your subscription');
    }
    const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/functions/v1/resume-stripe-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to resume subscription');
    }
    return result;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function getMembershipPlanFromPriceId(priceId: string) {
  switch (priceId) {
    case 'price_1RdAfqR8RYA8TFzwKP7zrKsm':
      return 'Ultimate Access';
    case 'price_1RdAfXR8RYA8TFzwFZyaSREP':
      return 'Platinum Access';
    case 'price_1RdAfER8RYA8TFzw7RrrNmtt':
      return 'Gold Access';
    case 'price_1RdAeZR8RYA8TFzwVH3MHECa':
      return 'Single Track';
    default:
      return 'Unknown Plan';
  }
}
