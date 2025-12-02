/**
 * Payment method resolution utilities.
 *
 * These functions convert between human-readable payment platform names
 * (e.g., 'wise', 'revolut') and their on-chain bytes32 hashes.
 *
 * @module paymentResolution
 */

import { ensureBytes32, asciiToBytes32 } from './bytes32';
import type { PaymentMethodCatalog } from '../contracts';

// Optional JSON maps from @zkp2p/contracts-v2 (only provided on some envs)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import baseSepoliaPaymentMethods from '@zkp2p/contracts-v2/paymentMethods/baseSepolia';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import baseStagingPaymentMethods from '@zkp2p/contracts-v2/paymentMethods/baseStaging';

type NetworkKey = 'base' | 'base_sepolia';
type RuntimeEnv = 'production' | 'staging';

function getPaymentMethodMap(env: RuntimeEnv, network: NetworkKey): Record<string, { paymentMethodHash: `0x${string}` }> | null {
  if (env === 'staging') {
    const m = (baseStagingPaymentMethods?.methods ?? {}) as Record<string, { paymentMethodHash: `0x${string}` }>;
    return m && Object.keys(m).length ? m : null;
  }
  if (network === 'base_sepolia') {
    const m = (baseSepoliaPaymentMethods?.methods ?? {}) as Record<string, { paymentMethodHash: `0x${string}` }>;
    return m && Object.keys(m).length ? m : null;
  }
  return null;
}

/**
 * Resolves a payment method hash from a human-readable name.
 *
 * First attempts to look up the hash from contracts-v2 payment method maps.
 * Falls back to keccak256(name) when maps are unavailable.
 *
 * **Warning**: The fallback may not match on-chain mappings. Prefer using
 * `resolvePaymentMethodHashFromCatalog` with an explicit catalog.
 *
 * @param nameOrBytes - Payment method name ('wise') or existing bytes32 hash
 * @param opts.env - Runtime environment ('production' | 'staging')
 * @param opts.network - Network key ('base' | 'base_sepolia')
 * @returns bytes32 payment method hash
 *
 * @example
 * ```typescript
 * const hash = resolvePaymentMethodHash('wise', { env: 'production' });
 * ```
 */
export function resolvePaymentMethodHash(
  nameOrBytes: string,
  opts: { env?: RuntimeEnv; network?: NetworkKey } = {}
): `0x${string}` {
  const { env = 'production', network = 'base' } = opts;
  if (nameOrBytes.startsWith('0x')) return ensureBytes32(nameOrBytes) as `0x${string}`;
  const mapping = getPaymentMethodMap(env, network);
  if (mapping) {
    const key = nameOrBytes.toLowerCase();
    const entry = mapping[key];
    if (entry?.paymentMethodHash) return entry.paymentMethodHash;
  }
  // Fallback: hash ascii name to bytes32
  return ensureBytes32(nameOrBytes, { hashIfAscii: true });
}

/**
 * Encodes a fiat currency code into bytes32 format (ASCII right-padded).
 *
 * If the input is already a hex string (0x-prefixed), it's normalized to bytes32.
 * Otherwise, the currency code is converted to uppercase ASCII bytes32.
 *
 * @param codeOrBytes - Currency code ('USD') or existing bytes32 hash
 * @returns bytes32 encoded currency
 *
 * @example
 * ```typescript
 * const bytes = resolveFiatCurrencyBytes32('USD');
 * // Returns: 0x5553440000000000000000000000000000000000000000000000000000000000
 * ```
 */
export function resolveFiatCurrencyBytes32(codeOrBytes: string): `0x${string}` {
  if (codeOrBytes.startsWith('0x')) return ensureBytes32(codeOrBytes) as `0x${string}`;
  return asciiToBytes32(codeOrBytes.toUpperCase());
}

/**
 * Resolves a payment method hash from a provided catalog.
 *
 * This is the recommended method for resolving payment methods as it uses
 * the exact catalog from `getPaymentMethodsCatalog()`, ensuring consistency
 * with on-chain registrations.
 *
 * @param processorName - Payment platform name ('wise', 'revolut', etc.)
 * @param catalog - Payment method catalog from `getPaymentMethodsCatalog()`
 * @returns bytes32 payment method hash
 * @throws Error with available processors if not found
 *
 * @example
 * ```typescript
 * import { getPaymentMethodsCatalog, resolvePaymentMethodHashFromCatalog } from '@zkp2p/offramp-sdk';
 *
 * const catalog = getPaymentMethodsCatalog(8453, 'production');
 * const hash = resolvePaymentMethodHashFromCatalog('wise', catalog);
 * ```
 */
export function resolvePaymentMethodHashFromCatalog(
  processorName: string,
  catalog: Record<string, { paymentMethodHash: `0x${string}`; currencies?: `0x${string}`[] }>
): `0x${string}` {
  if (!processorName) {
    throw new Error('processorName is required to resolve paymentMethodHash');
  }
  if (processorName.startsWith('0x')) {
    return ensureBytes32(processorName) as `0x${string}`;
  }
  const key = processorName.toLowerCase();
  const entry = catalog?.[key];
  if (entry?.paymentMethodHash) return entry.paymentMethodHash;

  const available = Object.keys(catalog || {}).sort().join(', ');
  throw new Error(
    available
      ? `Unknown processorName: ${processorName}. Available: ${available}`
      : `Unknown processorName: ${processorName}. The payment methods catalog is empty or unavailable.`
  );
}

/**
 * Reverse-lookup: converts a payment method hash back to its name.
 *
 * @param hash - The payment method hash (bytes32)
 * @param catalog - Payment method catalog from `getPaymentMethodsCatalog()`
 * @returns Payment platform name (e.g., 'wise') or undefined if not found
 *
 * @example
 * ```typescript
 * const name = resolvePaymentMethodNameFromHash('0x...', catalog);
 * console.log(name); // "wise"
 * ```
 */
export function resolvePaymentMethodNameFromHash(
  hash: string,
  catalog: PaymentMethodCatalog
): string | undefined {
  if (!hash) return undefined;
  const target = ensureBytes32(hash) as `0x${string}`;
  for (const [name, entry] of Object.entries(catalog || {})) {
    if (entry?.paymentMethodHash?.toLowerCase() === target.toLowerCase()) return name;
  }
  return undefined;
}
