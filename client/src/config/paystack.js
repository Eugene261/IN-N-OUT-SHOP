// Paystack configuration
export const PAYSTACK_PUBLIC_KEY = 'pk_test_c713d2a0aef25e7e2d93340b57f0d26b68bb5ce6';

// Paystack API endpoints (these are accessed through our backend proxy)
export const PAYSTACK_API = {
  initialize: '/api/payment/paystack/initialize',
  verify: '/api/payment/paystack/verify',
  channels: '/api/payment/paystack/channels',
};

// Mobile money networks supported in Ghana
export const MOBILE_MONEY_NETWORKS = [
  { id: 'mtn', name: 'MTN Mobile Money', color: 'bg-yellow-500' },
  { id: 'vodafone', name: 'Vodafone Cash', color: 'bg-red-600' },
  { id: 'airtel', name: 'AirtelTigo Money', color: 'bg-blue-600' }
];
