/**
 * SDK Constants
 *
 * This module exports all public constants for the SDK including:
 * - Payment platforms (Wise, Venmo, Revolut, etc.)
 * - Currencies (USD, EUR, GBP, etc.)
 * - Chain IDs and network configuration
 * - Token metadata
 *
 * @module constants
 */

// Payment platforms
export { PAYMENT_PLATFORMS, type PaymentPlatformType } from './types';

// Currencies
export { Currency, currencyInfo } from './utils/currency';
export type { CurrencyType, CurrencyData } from './utils/currency';

// Contract addresses and deployment info
export { DEPLOYED_ADDRESSES } from './utils/constants';

// API URLs
export { DEFAULT_BASE_API_URL, DEFAULT_WITNESS_URL } from './utils/constants';

/**
 * Supported blockchain chain IDs.
 *
 * @example
 * ```typescript
 * import { SUPPORTED_CHAIN_IDS } from '@zkp2p/offramp-sdk';
 *
 * const client = new OfframpClient({
 *   chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
 *   // ...
 * });
 * ```
 */
export const SUPPORTED_CHAIN_IDS = {
  /** Base mainnet (8453) */
  BASE_MAINNET: 8453,
  /** Base Sepolia testnet (84532) */
  BASE_SEPOLIA: 84532,
  /** Scroll mainnet (534352) */
  SCROLL_MAINNET: 534352,
  /** Local Hardhat network (31337) */
  HARDHAT: 31337,
} as const;

/**
 * Union type of supported chain IDs.
 */
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];

/**
 * Metadata for each supported payment platform.
 *
 * Includes display names, logos, and the number of proofs required
 * for payment verification.
 */
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

/**
 * Token metadata for supported tokens.
 */
export const TOKEN_METADATA = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
} as const;

/**
 * Attestation service configuration for each payment platform.
 *
 * Maps platform names to their corresponding action types for the
 * attestation service endpoints.
 *
 * @internal Used internally by fulfillIntent
 */
export const PLATFORM_ATTESTATION_CONFIG: Record<string, { actionType: string; actionPlatform: string }> = {
  wise: { actionType: 'transfer_wise', actionPlatform: 'wise' },
  venmo: { actionType: 'transfer_venmo', actionPlatform: 'venmo' },
  revolut: { actionType: 'transfer_revolut', actionPlatform: 'revolut' },
  cashapp: { actionType: 'transfer_cashapp', actionPlatform: 'cashapp' },
  mercadopago: { actionType: 'transfer_mercadopago', actionPlatform: 'mercadopago' },
  paypal: { actionType: 'transfer_paypal', actionPlatform: 'paypal' },
  monzo: { actionType: 'transfer_monzo', actionPlatform: 'monzo' },
  zelle: { actionType: 'transfer_zelle', actionPlatform: 'zelle' },
} as const;

/**
 * Resolves attestation platform configuration for a given payment platform.
 *
 * @param platformName - The payment platform name (e.g., 'wise', 'venmo', 'zelle-citi')
 * @returns Attestation configuration with actionType and actionPlatform
 * @throws Error if the platform is not supported
 *
 * @internal Used internally by fulfillIntent
 */
export function resolvePlatformAttestationConfig(platformName: string): { actionType: string; actionPlatform: string } {
  const normalized = platformName.toLowerCase();
  // Handle zelle variants (zelle-citi, zelle-boa, zelle-chase) by normalizing to base 'zelle' for config lookup
  const key = normalized.startsWith('zelle-') ? 'zelle' : normalized;
  const config = PLATFORM_ATTESTATION_CONFIG[key];
  if (!config) {
    throw new Error(`Unknown payment platform: ${platformName}`);
  }
  // For zelle variants, preserve the full platform name for the attestation service URL
  // Each variant (zelle-citi, zelle-boa, zelle-chase) has its own attestation endpoint
  if (normalized.startsWith('zelle-')) {
    return { actionType: config.actionType, actionPlatform: normalized };
  }
  return config;
}
