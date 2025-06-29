// Paystack configuration
// Use environment variable if available, otherwise fall back to the test key
// In production, this should always come from environment variables
const envPublicKey = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY;
export const PAYSTACK_PUBLIC_KEY = envPublicKey || 'pk_test_c713d2a0aef25e7e2d93340b57f0d26b68bb5ce6';

// Log warning if using fallback key
if (!envPublicKey) {
  console.warn('Using fallback Paystack public key. Set VITE_PAYSTACK_PUBLIC_KEY in your environment variables for production.');
}

// Paystack API endpoints (these are accessed through our backend proxy)
export const PAYSTACK_API = {
  initialize: '/api/payment/paystack/initialize',
  verify: '/api/payment/paystack/verify',
  channels: '/api/payment/paystack/channels',
};

// Mobile money networks supported in Ghana
export const MOBILE_MONEY_NETWORKS = [
  { 
    id: 'mtn', 
    name: 'MTN Mobile Money', 
    color: 'bg-yellow-500',
    logo: '/network-logos/mtn-logo.png',
    bgColor: '#FFD700'
  },
  { 
    id: 'telecel', 
    name: 'Telecel Cash', 
    color: 'bg-red-600',
    logo: '/network-logos/telecel-logo.png',
    bgColor: '#E31E24'
  },
  { 
    id: 'airtel', 
    name: 'AirtelTigo Money', 
    color: 'bg-blue-600',
    logo: '/network-logos/airteltigo-logo.png',
    bgColor: '#E31E24'
  }
];
