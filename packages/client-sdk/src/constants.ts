/**
 * Comprehensive constants export for ZKP2P SDK
 * This file re-exports all public constants for easier access
 */

// Payment platforms
export { PAYMENT_PLATFORMS } from './types';
export type { PaymentPlatformType } from './types';

// Currencies
export { Currency, currencyInfo } from './utils/currency';
export type { CurrencyType, CurrencyData } from './utils/currency';

// Contract addresses and deployment info
export { DEPLOYED_ADDRESSES } from './utils/constants';

// API URLs
export { DEFAULT_BASE_API_URL, DEFAULT_WITNESS_URL } from './utils/constants';

// Chain IDs
export const SUPPORTED_CHAIN_IDS = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  SCROLL_MAINNET: 534352,
  HARDHAT: 31337,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];

// Payment platform metadata
export const PLATFORM_METADATA = {
  venmo: {
    name: 'Venmo',
    displayName: 'Venmo',
    logo: '💵',
    requiredProofs: 1,
  },
  revolut: {
    name: 'Revolut',
    displayName: 'Revolut',
    logo: '💳',
    requiredProofs: 1,
  },
  cashapp: {
    name: 'CashApp',
    displayName: 'Cash App',
    logo: '💸',
    requiredProofs: 1,
  },
  wise: {
    name: 'Wise',
    displayName: 'Wise',
    logo: '🌍',
    requiredProofs: 2,
  },
  mercadopago: {
    name: 'MercadoPago',
    displayName: 'Mercado Pago',
    logo: '💰',
    requiredProofs: 1,
  },
  zelle: {
    name: 'Zelle',
    displayName: 'Zelle',
    logo: '💲',
    requiredProofs: 1,
  },
  paypal: {
    name: 'PayPal',
    displayName: 'PayPal',
    logo: '💙',
    requiredProofs: 1,
  },
  monzo: {
    name: 'Monzo',
    displayName: 'Monzo',
    logo: '🏦',
    requiredProofs: 1,
  },
} as const;

// Token metadata
export const TOKEN_METADATA = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
} as const;
