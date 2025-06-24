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
    id: 'prod_SYHE7EhWwzmgdg',
    name: 'Ultimate Access',
    description: 'Unlimited annual subscription',
    priceId: 'price_1RdAfqR8RYA8TFzwKP7zrKsm',
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
    id: 'prod_SYHDBYWlrQJsjI',
    name: 'Platinum Access',
    description: 'Unlimited track use',
    priceId: 'price_1RdAfXR8RYA8TFzwFZyaSREP ',
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
    id: 'prod_SYHD3D1jEwjgnb',
    name: 'Gold Access',
    description: '10 tracks per month',
    priceId: 'price_1RdAfER8RYA8TFzw7RrrNmtt',
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
    id: 'prod_SYHCZgM5UBmn3C',
    name: 'Single Track',
    description: 'Pay per track',
    priceId: 'price_1RdAeZR8RYA8TFzwVH3MHECa',
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
