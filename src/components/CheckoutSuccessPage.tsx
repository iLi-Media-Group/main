import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Music, Calendar, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserSubscription, getUserOrders, formatCurrency, formatDate, getMembershipPlanFromPriceId } from '../lib/stripe'; 
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [licenseCreated, setLicenseCreated] = useState(false);

  const sessionId = searchParams.get('session_id');
  const paymentMethod = searchParams.get('payment_method');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!sessionId) {
          navigate('/dashboard');
          return;
        }

        const _licenseCreated = false;

        // Refresh membership status
        if (user) {
          await refreshMembership();
        }

        // Handle Stripe payment
        // Get subscription details
        const subscription = await getUserSubscription();
        setSubscription(subscription);

        // If subscription data is missing or has invalid dates, try to get it directly from the subscriptions table
        if (subscription && (!subscription.price_id || !subscription.current_period_start || !subscription.current_period_end)) {
          console.log('Subscription data incomplete, trying direct query...');
          
          // Only query if user and user.id are defined
          if (user?.id) {
            // Get the customer ID first
            const { data: customerData } = await supabase
              .from('stripe_customers')
              .select('customer_id')
              .eq('user_id', user.id)
              .single();
            
            if (customerData?.customer_id) {
              // Query the subscriptions table directly
              const { data: directSubscription } = await supabase
                .from('stripe_subscriptions')
                .select('*')
                .eq('customer_id', customerData.customer_id)
                .single();
              
              console.log('Direct subscription data:', directSubscription);
              
              if (directSubscription && directSubscription.price_id && directSubscription.current_period_start) {
                // Update the subscription state with the direct data
                setSubscription({
                  ...subscription,
                  price_id: directSubscription.price_id,
                  current_period_start: directSubscription.current_period_start,
                  current_period_end: directSubscription.current_period_end,
                  status: directSubscription.status
                });
              }
            }
          } else {
            console.warn('User or user.id is undefined, skipping direct subscription query.');
          }
        }

        // Get order details
        const orders = await getUserOrders();
        const matchingOrder = orders.find(o => o.checkout_session_id === sessionId);
        
        if (matchingOrder) {
          setOrder(matchingOrder);

          // Check if a license was created for this order
          if (user) {
            const result = await supabase
              .from('sales')
              .select('*', { count: 'exact', head: true })
              .eq('transaction_id', matchingOrder.payment_intent_id);
            
            setLicenseCreated(result.count !== null && result.count > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching checkout data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, navigate, user, refreshMembership]);

  // Add helper to get license period
  function getLicensePeriod(licenseType: string, purchaseDate: string) {
    const start = new Date(purchaseDate);
    let end: string;
    switch (licenseType) {
      case 'Ultimate Access':
        end = 'Perpetual (No Expiration)';
        break;
      case 'Platinum Access':
        start.setFullYear(start.getFullYear() + 3);
        end = start.toLocaleDateString();
        break;
      case 'Gold Access':
      case 'Single Track':
      default:
        start.setFullYear(start.getFullYear() + 1);
        end = start.toLocaleDateString();
    }
    return end;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-500/20 p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {licenseCreated && order
              ? 'License Purchased!'
              : subscription && ['Ultimate Access', 'Platinum Access', 'Gold Access'].includes(getMembershipPlanFromPriceId(subscription.price_id))
                ? (subscription.subscription_status === 'active' && subscription.current_period_start === subscription.current_period_end
                    ? 'Subscription Activated!'
                    : 'Subscription Updated!')
                : subscription
                  ? 'Subscription Activated!'
                  : 'Payment Successful!'}
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            {licenseCreated && order
              ? `Your license has been purchased and is ready to use. You can view it in your dashboard.`
              : subscription && ['Ultimate Access', 'Platinum Access', 'Gold Access'].includes(getMembershipPlanFromPriceId(subscription.price_id))
                ? (subscription.subscription_status === 'active' && subscription.current_period_start === subscription.current_period_end
                    ? 'Your membership has been successfully activated. You now have access to all the features of your plan.'
                    : 'Your subscription has been updated. Your new plan period is shown below.')
                : subscription
                  ? 'Your membership has been successfully activated. You now have access to all the features of your plan.'
                  : `Your payment has been processed successfully.`}
          </p>
          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
            {licenseCreated && order ? (
              // Track License Order
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Music className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Plan:</span>
                  </div>
                  <span className="text-white font-medium">
                    {order.license_type || 'Single Track License'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Amount:</span>
                  </div>
                  <span className="text-white font-medium">
                    {formatCurrency(order.amount_total, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">License Period:</span>
                  </div>
                  <span className="text-white font-medium">
                    {order.order_date ? `${new Date(order.order_date).toLocaleDateString()} - ${getLicensePeriod(order.license_type || 'Single Track', order.order_date)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Purchase Date:</span>
                  </div>
                  <span className="text-white font-medium">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Your license has been created successfully. You can view it in your dashboard.
                  </p>
                </div>
              </div>
            ) : subscription ? (
              // Subscription Order
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Music className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Plan:</span>
                  </div>
                  <span className="text-white font-medium">
                    {getMembershipPlanFromPriceId(subscription.price_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Current Period:</span>
                  </div>
                  <span className="text-white font-medium">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white">Payment Method:</span>
                  </div>
                  <span className="text-white font-medium">
                    {subscription.payment_method_brand ? (
                      `${subscription.payment_method_brand.toUpperCase()} •••• ${subscription.payment_method_last4}`
                    ) : (
                      'Card'
                    )}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              to="/catalog"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Browse Music Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
