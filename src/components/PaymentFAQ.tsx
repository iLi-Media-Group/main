import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CreditCard, Coins, DollarSign, Shield, Clock, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'payment-methods' | 'crypto' | 'billing' | 'security';
}

const PAYMENT_FAQ_ITEMS: FAQItem[] = [
  // Payment Methods
  {
    category: 'payment-methods',
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and cryptocurrency payments including USDC (USD Coin). All payments are processed securely through Stripe."
  },
  {
    category: 'payment-methods',
    question: "Can I use a debit card?",
    answer: "Yes, you can use any debit card that has a Visa, Mastercard, American Express, or Discover logo. Debit cards work the same way as credit cards for our payment processing."
  },
  {
    category: 'payment-methods',
    question: "Do you accept international payments?",
    answer: "Yes, we accept payments from customers worldwide. All prices are displayed in USD, and your bank will handle the currency conversion if needed."
  },

  // Crypto Payments
  {
    category: 'crypto',
    question: "How do crypto payments work?",
    answer: "When you select crypto payment, you'll be able to pay with USDC (USD Coin). The payment is processed through Stripe's secure crypto payment system. You'll receive an invoice and can complete the payment using your crypto wallet."
  },
  {
    category: 'crypto',
    question: "What cryptocurrencies do you accept?",
    answer: "We currently accept USDC (USD Coin) for crypto payments. USDC is a stablecoin pegged to the US dollar, so the value remains stable during transactions."
  },
  {
    category: 'crypto',
    question: "How do I pay with crypto?",
    answer: "1. Select 'Subscribe' on any plan\n2. Choose 'USDC' as your payment method in Stripe Checkout\n3. You'll receive an invoice via email\n4. Pay the invoice using your crypto wallet\n5. Your subscription will be activated once payment is confirmed"
  },
  {
    category: 'crypto',
    question: "What happens with crypto subscription renewals?",
    answer: "For crypto subscriptions, Stripe will automatically send you an invoice for each renewal period. You'll receive an email notification and can pay the invoice using USDC. Your subscription will continue once the invoice is paid."
  },

  // Billing
  {
    category: 'billing',
    question: "When will I be charged?",
    answer: "For credit/debit card payments, you'll be charged immediately upon purchase. For crypto payments, you'll receive an invoice and your subscription will be activated once you complete the payment."
  },
  {
    category: 'billing',
    question: "How do subscription renewals work?",
    answer: "Subscriptions automatically renew on the same date each month/year. For card payments, we'll charge your card automatically. For crypto payments, you'll receive an invoice via email that you can pay manually."
  },
  {
    category: 'billing',
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time from your dashboard. You'll continue to have access until the end of your current billing period. No refunds are provided for partial months."
  },
  {
    category: 'billing',
    question: "What if my payment fails?",
    answer: "If your card payment fails, we'll retry the payment a few times. If crypto payment fails, you can retry paying the invoice. You'll receive email notifications about any payment issues."
  },

  // Security
  {
    category: 'security',
    question: "Is my payment information secure?",
    answer: "Yes, we use Stripe for all payment processing, which is PCI DSS compliant and uses bank-level security. We never store your credit card information on our servers."
  },
  {
    category: 'security',
    question: "Do you store my crypto wallet information?",
    answer: "No, we don't store any crypto wallet information. Crypto payments are processed through Stripe's secure system, and you maintain full control of your wallet."
  },
  {
    category: 'security',
    question: "What if I have a billing dispute?",
    answer: "If you have any billing issues, please contact our support team. We're committed to resolving any payment problems quickly and fairly."
  }
];

interface PaymentFAQProps {
  showAll?: boolean;
  maxItems?: number;
}

export function PaymentFAQ({ showAll = false, maxItems }: PaymentFAQProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'payment-methods', name: 'Payment Methods', icon: CreditCard },
    { id: 'crypto', name: 'Crypto Payments', icon: Coins },
    { id: 'billing', name: 'Billing & Renewals', icon: DollarSign },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? PAYMENT_FAQ_ITEMS 
    : PAYMENT_FAQ_ITEMS.filter(item => item.category === selectedCategory);

  const displayItems = maxItems ? filteredItems.slice(0, maxItems) : filteredItems;

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <HelpCircle className="w-6 h-6 text-purple-400 mr-2" />
          Payment FAQ
        </h2>
        <p className="text-gray-400">
          Find answers to common questions about our payment methods and billing process.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-white font-medium">{item.question}</span>
              {expandedItems.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedItems.has(index) && (
              <div className="px-6 pb-4">
                <p className="text-gray-300 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {maxItems && filteredItems.length > maxItems && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setSelectedCategory(selectedCategory)}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${filteredItems.length - maxItems} More Questions`}
          </button>
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-medium mb-1">Still have questions?</h3>
            <p className="text-gray-300 text-sm">
              Our support team is here to help with any payment or billing questions. 
              Contact us and we'll get back to you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 