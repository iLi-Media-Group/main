export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  mode: 'payment' | 'subscription';
  price: number;
  features: string[];
  popular?: boolean;
  interval: string;
}

export const PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_Sr3SamNQMmkZtJ',
    name: 'Ultimate Access',
    description: 'Unlimited annual subscription',
    priceId: 'price_1RvLLRA4Yw5viczUCAGuLpKh',
    mode: 'subscription',
    price: 499.99,
    interval: 'year',
    features: [
      'Unlimited track downloads',
      'Non-exclusive license',
      'Commercial use',
      'Worldwide rights',
      'Lifetime access to downloaded tracks',
      'Priority support',
      'No time limit on track usage'
    ],
    popular: false,
    cryptoEnabled: true
  },
  {
    id: 'prod_Sr3R3SYbxCHMFY',
    name: 'Platinum Access',
    description: 'Unlimited track use',
    priceId: 'price_1RvLKcA4Yw5viczUItn56P2m',
    mode: 'subscription',
    price: 59.99,
    interval: 'month',
    features: [
      'Unlimited track downloads',
      'Non-exclusive license',
      'Commercial use',
      'Worldwide rights',
      'Lifetime access to downloaded tracks',
      'Priority support',
      '3 year usage limit'
    ],
    popular: true,
    cryptoEnabled: true
  },
  {
    id: 'prod_Sr3QvEVJcx1tQM',
    name: 'Gold Access',
    description: '10 tracks per month',
    priceId: 'price_1RvLJyA4Yw5viczUwdHhIYAQ',
    mode: 'subscription',
    price: 34.99,
    interval: 'month',
    features: [
      '10 track downloads per month',
      'Non-exclusive license',
      'Commercial use',
      'Worldwide rights',
      'Lifetime access to downloaded tracks',
      'Email support',
      '1 year usage limit'
    ],
    popular: false,
    cryptoEnabled: true
  },
  {
    id: 'prod_Sr3Q4LEWMEvGAd',
    name: 'Single Track',
    description: 'Pay per track',
    priceId: 'price_1RvLJCA4Yw5viczUrWeCZjom',
    mode: 'payment',
    price: 9.99,
    interval: 'track',
    features: [
      'Single track download',
      'Non-exclusive license',
      'Commercial use',
      'Worldwide rights',
      'Lifetime access',
      'Basic support',
      '1 year usage limit'
    ],
    popular: false,
    cryptoEnabled: true
  }
];
