import { ensureBytes32, asciiToBytes32 } from './bytes32';

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
 * Resolve a payment method hash from a human-readable name where possible using contracts-v2 maps.
 * Falls back to keccak256(name) when maps are unavailable (be careful: this may not match on-chain mapping).
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
 * Encode a fiat currency code (e.g., 'USD', 'EUR') into bytes32 (ASCII padded).
 */
export function resolveFiatCurrencyBytes32(codeOrBytes: string): `0x${string}` {
  if (codeOrBytes.startsWith('0x')) return ensureBytes32(codeOrBytes) as `0x${string}`;
  return asciiToBytes32(codeOrBytes.toUpperCase());
}

