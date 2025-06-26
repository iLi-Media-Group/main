import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'MyBeatFi White Label',
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
  const { data, error } = await supabase
    .rpc('get_applicable_discounts', {
      item_name: itemName,
      check_date: checkDate
    });

  if (error) {
    console.error('Error getting applicable discounts:', error);
    return null;
  }

  return data;
}

// Function to calculate discounted price
async function calculateDiscountedPrice(originalPrice: number, itemName: string, checkDate: string = new Date().toISOString().split('T')[0]) {
  const { data, error } = await supabase
    .rpc('calculate_discounted_price', {
      original_price: originalPrice,
      item_name: itemName,
      check_date: checkDate
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
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { 
      plan, 
      features, 
      success_url, 
      cancel_url, 
      customer_email,
      customer_name,
      company_name 
    } = await req.json();

    // Validate required parameters
    if (!plan || !success_url || !cancel_url || !customer_email) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return corsResponse({ error: 'Invalid plan' }, 400);
    }

    // Plan pricing (in cents)
    const planPricing = {
      starter: { setup: 99900, monthly: 4900 }, // $999 setup, $49/month
      pro: { setup: 500000, monthly: 29900 },   // $5000 setup, $299/month
      enterprise: { setup: 2500000, monthly: 0 } // $25,000 setup, custom monthly
    };

    // Feature pricing (in cents)
    const featurePricing = {
      producer_applications: 24900, // $249
      ai_recommendations: 24900,    // $249
      deep_media_search: 24900      // $249
    };

    // Calculate base setup cost
    let setupCost = planPricing[plan].setup;
    let monthlyCost = planPricing[plan].monthly;

    // Add feature costs (if not included in plan)
    const includedFeatures = {
      starter: [],
      pro: ['producer_applications'],
      enterprise: ['producer_applications', 'ai_recommendations', 'deep_media_search']
    };

    const selectedFeatures = features || [];
    const additionalFeatures = selectedFeatures.filter(f => !includedFeatures[plan].includes(f));
    
    additionalFeatures.forEach(feature => {
      if (featurePricing[feature]) {
        setupCost += featurePricing[feature];
      }
    });

    // Apply bundle discount for multiple features
    let bundleDiscount = 0;
    if (additionalFeatures.length === 2) {
      bundleDiscount = 4900; // $49 discount
    } else if (additionalFeatures.length === 3) {
      bundleDiscount = 14800; // $148 discount
    }

    setupCost -= bundleDiscount;

    // Get applicable discounts from database
    const discountResults = await Promise.all([
      calculateDiscountedPrice(setupCost, plan, new Date().toISOString().split('T')[0]),
      ...additionalFeatures.map(feature => 
        calculateDiscountedPrice(featurePricing[feature], feature, new Date().toISOString().split('T')[0])
      )
    ]);

    // Apply the best discount (highest percentage)
    let finalSetupCost = setupCost;
    let appliedDiscount = null;
    let totalDiscountAmount = 0;

    discountResults.forEach(result => {
      if (result.discount_percent > 0) {
        const discountAmount = (result.original_price * result.discount_percent) / 100;
        if (discountAmount > totalDiscountAmount) {
          totalDiscountAmount = discountAmount;
          finalSetupCost = result.discounted_price;
          appliedDiscount = {
            name: result.discount_name,
            description: result.discount_description,
            percent: result.discount_percent
          };
        }
      }
    });

    // Create or get Stripe customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('email', customer_email)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name,
        metadata: {
          company: company_name || '',
          plan: plan,
          features: selectedFeatures.join(','),
          white_label_customer: 'true'
        }
      });
      customerId = customer.id;

      // Store customer in database
      await supabase.from('stripe_customers').insert({
        user_id: null, // White label customers don't have user accounts initially
        customer_id: customer.id,
        email: customer_email,
        name: customer_name,
        company: company_name
      });
    }

    // Create Stripe product for this white label setup
    const product = await stripe.products.create({
      name: `White Label ${plan.charAt(0).toUpperCase() + plan.slice(1)} Setup`,
      description: `White Label music licensing platform setup for ${company_name || customer_name}`,
      metadata: {
        plan: plan,
        features: selectedFeatures.join(','),
        customer_email: customer_email,
        customer_name: customer_name,
        company_name: company_name || ''
      }
    });

    // Create Stripe price for setup fee
    const setupPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(finalSetupCost), // Ensure it's an integer
      currency: 'usd',
      metadata: {
        type: 'setup_fee',
        plan: plan,
        original_amount: setupCost,
        discount_amount: setupCost - finalSetupCost,
        applied_discount: appliedDiscount ? JSON.stringify(appliedDiscount) : ''
      }
    });

    // Create line items
    const lineItems = [
      {
        price: setupPrice.id,
        quantity: 1,
      }
    ];

    // Add monthly subscription if applicable
    let couponId = null;
    if (monthlyCost > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: monthlyCost,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          type: 'monthly_fee',
          plan: plan
        }
      });

      lineItems.push({
        price: monthlyPrice.id,
        quantity: 1,
      });

      // If there is a discount, create a coupon for the subscription
      if (appliedDiscount && appliedDiscount.percent > 0) {
        // Only apply to the first year (12 months)
        const coupon = await stripe.coupons.create({
          percent_off: appliedDiscount.percent,
          duration: 'repeating',
          duration_in_months: 12,
          name: appliedDiscount.name || 'White Label Discount',
        });
        couponId = coupon.id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: monthlyCost > 0 ? 'subscription' : 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        type: 'white_label_setup',
        plan: plan,
        features: selectedFeatures.join(','),
        customer_email: customer_email,
        customer_name: customer_name,
        company_name: company_name || '',
        setup_cost: finalSetupCost.toString(),
        monthly_cost: monthlyCost.toString(),
        applied_discount: appliedDiscount ? JSON.stringify(appliedDiscount) : '',
        bundle_discount: bundleDiscount.toString(),
        coupon_id: couponId || ''
      },
      payment_method_types: ['card'],
      allow_promotion_codes: true, // Allow Stripe promotion codes
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      discounts: couponId ? [{ coupon: couponId }] : undefined
    });

    console.log(`Created white label checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url,
      pricing: {
        originalSetupCost: setupCost / 100,
        finalSetupCost: finalSetupCost / 100,
        monthlyCost: monthlyCost / 100,
        appliedDiscount: appliedDiscount,
        bundleDiscount: bundleDiscount / 100,
        features: selectedFeatures
      }
    });

  } catch (error: any) {
    console.error(`White label checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
}); 