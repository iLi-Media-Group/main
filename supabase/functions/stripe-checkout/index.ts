import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

// Function to get applicable discounts
async function getApplicableDiscounts(itemName: string, checkDate: string = new Date().toISOString().split('T')[0]) {
  console.log(`🔍 Discount Debug: Getting applicable discounts for ${itemName} on ${checkDate}`);
  const { data, error } = await supabase
    .rpc('get_applicable_discounts', {
      item_name: itemName,
      check_date: checkDate
    });

  if (error) {
    console.error('Error getting applicable discounts:', error);
    return null;
  }

  console.log(`🔍 Discount Debug: Found ${data?.length || 0} applicable discounts:`, data);
  return data;
}

// Function to calculate discounted price
async function calculateDiscountedPrice(originalPrice: number, itemName: string, checkDate: string = new Date().toISOString().split('T')[0], promotionCode?: string) {
  console.log(`🔍 Discount Debug: Calculating discounted price for ${itemName}, original price: ${originalPrice} cents, promotion code: ${promotionCode || 'none'}`);
  
  // Call the function with a single JSON object to avoid parameter order issues
  const { data, error } = await supabase
    .rpc('calculate_discounted_price', {
      p_original_price: originalPrice,
      item_name: itemName,
      check_date: checkDate,
      promotion_code_input: promotionCode || null
    });

  if (error) {
    console.error('Error calculating discounted price:', error);
    return {
      original_price: originalPrice,
      discount_percent: 0,
      discounted_price: originalPrice,
      discount_name: null,
      discount_description: null,
      discount_type: null,
      promotion_code: null
    };
  }

  console.log('🔍 Discount Debug: Discount calculation result:', data);
  return data;
}

// Mapping of price IDs to product names for discount lookup
const PRICE_TO_PRODUCT_MAPPING: Record<string, string> = {
  'price_1RdAeZR8RYA8TFzwVH3MHECa': 'single_track',
  'price_1RdAfER8RYA8TFzw7RrrNmtt': 'gold_access',
  'price_1RdAfXR8RYA8TFzwFZyaSREP': 'platinum_access',
  'price_1RdAfqR8RYA8TFzwKP7zrKsm': 'ultimate_access'
};

Deno.serve(async (req) => {
  console.log('🔍 Checkout Debug: Function called');
  
  // Test the database function directly
  console.log('🔍 Testing database function directly...');
  const { data: testData, error: testError } = await supabase
    .rpc('calculate_discounted_price', {
      p_original_price: 999,
      item_name: 'single_track',
      check_date: new Date().toISOString().split('T')[0],
      promotion_code_input: null
    });
  
  if (testError) {
    console.error('🔍 Database function test failed:', testError);
  } else {
    console.log('🔍 Database function test successful:', testData);
  }
  
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode, metadata = {}, custom_amount, promotion_code } = await req.json();

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode, metadata, custom_amount },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
        metadata: 'object',
        custom_amount: 'optional_number',
      },
    );

    if (error) {
      return corsResponse({ error }, 400);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);

      return corsResponse({ error: 'Failed to fetch customer information' }, 500);
    }

    let customerId;

    /**
     * In case we don't have a mapping yet, the customer does not exist and we need to create one.
     */
    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);

        // Try to clean up both the Stripe customer and subscription record
        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to clean up after customer mapping error:', deleteError);
        }

        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: newCustomer.id,
          status: 'pending',
        });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);

          // Try to clean up the Stripe customer since we couldn't create the subscription
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
          }

          return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
        }
      }

      customerId = newCustomer.id;

      console.log(`Successfully set up new customer ${customerId} with subscription record`);
    } else {
      customerId = customer.customer_id;

      if (mode === 'subscription') {
        // Verify subscription exists for existing customer
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);

          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').upsert({
            customer_id: customerId,
            status: 'pending',
          }, { onConflict: 'customer_id' });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);

            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
          }
        }
      }
    }

    // Check if this is a subscription upgrade for an existing customer
    let activeSubscription = null;
    if (mode === 'subscription') {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
      if (subscriptions.data.length > 0) {
        activeSubscription = subscriptions.data[0];
      }
    }

    if (mode === 'subscription' && activeSubscription) {
      // User is upgrading: update the existing subscription with proration
      const updatedSubscription = await stripe.subscriptions.update(activeSubscription.id, {
        items: [{ id: activeSubscription.items.data[0].id, price: price_id }],
        proration_behavior: 'create_prorations',
      });
      // Create a Stripe invoice for the prorated amount
      const invoice = await stripe.invoices.create({ customer: customerId, subscription: updatedSubscription.id });
      // Return the hosted invoice URL for payment
      return corsResponse({ url: invoice.hosted_invoice_url });
    }

    let session;
    
    // Handle custom price for sync proposals
    if (price_id === 'price_custom' && custom_amount && mode === 'payment') {
      // Create a one-time price
      const product = await stripe.products.create({
        name: metadata.description || 'Custom Sync License',
        metadata: {
          proposal_id: metadata.proposal_id
        }
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: custom_amount,
        currency: 'usd',
      });
      
      // Create checkout session with the custom price
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode,
        success_url,
        cancel_url,
        metadata,
      });
    } else {
      // Check for applicable discounts
      const productName = PRICE_TO_PRODUCT_MAPPING[price_id];
      console.log(`🔍 Discount Debug: Checking discounts for price_id: ${price_id}, productName: ${productName}`);
      let couponId = null;
      let appliedDiscount: { name: string; description: string; percent: number } | null = null;

      if (productName) {
        // Get the original price from Stripe to calculate discount
        const price = await stripe.prices.retrieve(price_id);
        const originalAmount = price.unit_amount || 0;
        console.log(`🔍 Discount Debug: Original price amount: ${originalAmount} cents`);

        // Calculate discounted price (check for both automatic and promotion code discounts)
        const discountResult = await calculateDiscountedPrice(
          originalAmount, 
          productName, 
          new Date().toISOString().split('T')[0],
          promotion_code
        );
        console.log(`🔍 Discount Debug: Discount calculation result:`, discountResult);

        if (discountResult && discountResult.discount_percent > 0) {
          console.log(`🔍 Discount Debug: Creating Stripe coupon with ${discountResult.discount_percent}% discount`);
          // Create a coupon for the discount
          const coupon = await stripe.coupons.create({
            percent_off: discountResult.discount_percent,
            duration: mode === 'subscription' ? 'repeating' : 'once',
            duration_in_months: mode === 'subscription' ? 12 : undefined,
            name: discountResult.discount_name || `${productName} Discount`,
          });
          couponId = coupon.id;
          appliedDiscount = {
            name: discountResult.discount_name,
            description: discountResult.discount_description,
            percent: discountResult.discount_percent
          };
          console.log(`🔍 Discount Debug: Created coupon ${couponId} for discount:`, appliedDiscount);
        } else {
          console.log(`🔍 Discount Debug: No applicable discount found for ${productName}`);
        }
      } else {
        console.log(`🔍 Discount Debug: No product mapping found for price_id: ${price_id}`);
      }

      // Regular checkout session
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode,
        success_url,
        cancel_url,
        metadata: {
          ...metadata,
          applied_discount: appliedDiscount ? JSON.stringify(appliedDiscount) : '',
          coupon_id: couponId || ''
        },
        discounts: couponId ? [{ coupon: couponId }] : undefined,
        allow_promotion_codes: true, // Allow Stripe promotion codes
      });
    }

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType | 'object' | 'optional_number' };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    if (!expectation) continue; // Skip parameters that don't have expectations
    
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else if (expectation === 'object') {
      if (value != null && typeof value !== 'object') {
        return `Expected parameter ${parameter} to be an object got ${JSON.stringify(value)}`;
      }
    } else if (expectation === 'optional_number') {
      if (value != null && typeof value !== 'number') {
        return `Expected parameter ${parameter} to be a number got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}
