// Script to create WELCOME30 coupon in Stripe
// Run this with: node create_stripe_coupon_via_api.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createWelcomeCoupon() {
  try {
    // Create the WELCOME30 coupon in Stripe
    const coupon = await stripe.coupons.create({
      id: 'WELCOME30',
      name: 'Welcome Discount',
      percent_off: 30,
      duration: 'once',
      duration_in_months: null,
      max_redemptions: null, // Unlimited
      redeem_by: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
      metadata: {
        description: 'Use this code for a discount on your purchase!',
        applies_to: 'single_track,gold_access,platinum_access,ultimate_access'
      }
    });

    console.log('✅ WELCOME30 coupon created successfully in Stripe:');
    console.log('Coupon ID:', coupon.id);
    console.log('Name:', coupon.name);
    console.log('Percent off:', coupon.percent_off);
    console.log('Duration:', coupon.duration);
    console.log('Valid until:', new Date(coupon.redeem_by * 1000).toISOString());

    return coupon;
  } catch (error) {
    if (error.code === 'resource_already_exists') {
      console.log('⚠️  WELCOME30 coupon already exists in Stripe');
      return null;
    } else {
      console.error('❌ Error creating WELCOME30 coupon:', error.message);
      throw error;
    }
  }
}

// Run the function
createWelcomeCoupon()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 