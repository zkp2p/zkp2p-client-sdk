/**
 * Contract resolution utilities for the SDK.
 *
 * Provides access to deployed contract addresses and ABIs for different
 * networks (Base, Base Sepolia) and environments (production, staging).
 *
 * @module contracts
 */

import type { Abi } from 'abitype';

// Typed imports from @zkp2p/contracts-v2 (module declarations provided in src/@types)
// Use *Raw suffix for imports that need runtime normalization (addresses, constants)
import baseAddressesRaw from '@zkp2p/contracts-v2/addresses/base';
import baseSepoliaAddressesRaw from '@zkp2p/contracts-v2/addresses/baseSepolia';
import baseStagingAddressesRaw from '@zkp2p/contracts-v2/addresses/baseStaging';

import EscrowBase from '@zkp2p/contracts-v2/abis/base/Escrow.json';
import OrchestratorBase from '@zkp2p/contracts-v2/abis/base/Orchestrator.json';
import ProtocolViewerBase from '@zkp2p/contracts-v2/abis/base/ProtocolViewer.json';
import UnifiedPaymentVerifierBase from '@zkp2p/contracts-v2/abis/base/UnifiedPaymentVerifier.json';

import EscrowBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/Escrow.json';
import OrchestratorBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/Orchestrator.json';
import ProtocolViewerBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/ProtocolViewer.json';
import UnifiedPaymentVerifierBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/UnifiedPaymentVerifier.json';

import EscrowBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/Escrow.json';
import OrchestratorBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/Orchestrator.json';
import UnifiedPaymentVerifierBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/UnifiedPaymentVerifier.json';
import ProtocolViewerBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/ProtocolViewer.json';

import baseConstantsRaw from '@zkp2p/contracts-v2/constants/base';
import baseStagingConstantsRaw from '@zkp2p/contracts-v2/constants/baseStaging';
// Payment methods catalogs (JSON). Import statically so ESM bundlers include the data.
// These modules are present in @zkp2p/contracts-v2; tsconfig sets resolveJsonModule: true
import basePaymentMethodsRaw from '@zkp2p/contracts-v2/paymentMethods/base.json';
import baseSepoliaPaymentMethodsRaw from '@zkp2p/contracts-v2/paymentMethods/baseSepolia.json';
import baseStagingPaymentMethodsRaw from '@zkp2p/contracts-v2/paymentMethods/baseStaging.json';

// ---------------------------------------------------------------------------
// Runtime normalization helpers for ESM/CJS interoperability
// ---------------------------------------------------------------------------
// In certain runtimes (tsx, Node ESM), deep imports from @zkp2p/contracts-v2
// resolve as { default: [Getter] } or { default: { contracts: {...} } } instead
// of the expected shape. These helpers unwrap the actual data regardless of shape.

/**
 * Normalize address module shape. Handles:
 * - { contracts: {...} } (direct)
 * - { default: { contracts: {...} } } (wrapped)
 * - { default: [Getter] } (lazy)
 */
function unwrapAddresses(mod: unknown): { name?: string; chainId?: number; contracts?: Record<string, `0x${string}`> } {
  if (!mod) return {} as ReturnType<typeof unwrapAddresses>;
  const m = mod as Record<string, unknown>;
  // Direct shape
  if (m.contracts) return m as ReturnType<typeof unwrapAddresses>;
  // Wrapped shape
  if ((m.default as Record<string, unknown>)?.contracts) return m.default as ReturnType<typeof unwrapAddresses>;
  // Lazy getter shape
  try {
    const d = typeof m.default === 'function' ? (m.default as () => unknown)() : m.default;
    if ((d as Record<string, unknown>)?.contracts) return d as ReturnType<typeof unwrapAddresses>;
  } catch {
    // ignore
  }
  return m as ReturnType<typeof unwrapAddresses>;
}

/**
 * Normalize payment methods module shape. Handles:
 * - { methods: {...} } (direct)
 * - { default: { methods: {...} } } (wrapped)
 * - { default: [Getter] } (lazy)
 */
function unwrapMethods(mod: unknown): { methods?: Record<string, { paymentMethodHash: `0x${string}`; currencies?: `0x${string}`[] }> } {
  if (!mod) return {} as ReturnType<typeof unwrapMethods>;
  const m = mod as Record<string, unknown>;
  if (m.methods) return m as ReturnType<typeof unwrapMethods>;
  if ((m.default as Record<string, unknown>)?.methods) return m.default as ReturnType<typeof unwrapMethods>;
  try {
    const d = typeof m.default === 'function' ? (m.default as () => unknown)() : m.default;
    if ((d as Record<string, unknown>)?.methods) return d as ReturnType<typeof unwrapMethods>;
  } catch {
    // ignore
  }
  return m as ReturnType<typeof unwrapMethods>;
}

/**
 * Normalize constants module shape (for USDC address, etc.)
 */
function unwrapConstants(mod: unknown): Record<string, unknown> {
  if (!mod) return {};
  const m = mod as Record<string, unknown>;
  if (m.USDC) return m;
  if ((m.default as Record<string, unknown>)?.USDC) return m.default as Record<string, unknown>;
  try {
    const d = typeof m.default === 'function' ? (m.default as () => unknown)() : m.default;
    if ((d as Record<string, unknown>)?.USDC) return d as Record<string, unknown>;
  } catch {
    // ignore
  }
  return m;
}

// Apply runtime normalization to all imports
const baseAddresses = unwrapAddresses(baseAddressesRaw);
const baseSepoliaAddresses = unwrapAddresses(baseSepoliaAddressesRaw);
const baseStagingAddresses = unwrapAddresses(baseStagingAddressesRaw);
const basePaymentMethods = unwrapMethods(basePaymentMethodsRaw);
const baseSepoliaPaymentMethods = unwrapMethods(baseSepoliaPaymentMethodsRaw);
const baseStagingPaymentMethods = unwrapMethods(baseStagingPaymentMethodsRaw);
const baseConstants = unwrapConstants(baseConstantsRaw);
const baseStagingConstants = unwrapConstants(baseStagingConstantsRaw);

/**
 * Contract addresses for a specific deployment.
 */
export type V2ContractAddresses = {
  /** Escrow contract (holds deposits and manages intents) */
  escrow: `0x${string}`;
  /** Orchestrator contract (handles intent signaling and fulfillment) */
  orchestrator?: `0x${string}`;
  /** UnifiedPaymentVerifier contract (verifies payment proofs) */
  unifiedPaymentVerifier?: `0x${string}`;
  /** ProtocolViewer contract (batch read operations) */
  protocolViewer?: `0x${string}`;
  /** USDC token address */
  usdc?: `0x${string}`;
};

/**
 * Contract ABIs for a specific deployment.
 */
export type V2ContractAbis = {
  escrow: Abi;
  orchestrator?: Abi;
  unifiedPaymentVerifier?: Abi;
  protocolViewer?: Abi;
};

/**
 * Runtime environment: 'production' for mainnet, 'staging' for testnet/dev.
 */
export type RuntimeEnv = 'production' | 'staging';

/**
 * Converts a chain ID to its network key.
 * @internal
 */
export function networkKeyFromChainId(chainId: number): 'base' | 'base_sepolia' {
  if (chainId === 84532) return 'base_sepolia';
  return 'base';
}

/**
 * Retrieves deployed contract addresses and ABIs for a given chain and environment.
 *
 * @param chainId - The chain ID (8453 for Base, 84532 for Base Sepolia)
 * @param env - Runtime environment ('production' or 'staging')
 * @returns Object containing addresses and ABIs
 *
 * @example
 * ```typescript
 * import { getContracts } from '@zkp2p/offramp-sdk';
 *
 * const { addresses, abis } = getContracts(8453, 'production');
 * console.log(addresses.escrow);  // "0x..."
 * console.log(addresses.usdc);    // "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
 * ```
 */
export function getContracts(chainId: number, env: RuntimeEnv = 'production'): { addresses: V2ContractAddresses; abis: V2ContractAbis } {
  const key = networkKeyFromChainId(chainId);

  const addressesByKey: Record<'base' | 'base_sepolia', V2ContractAddresses> = {
    base: {
      escrow: (baseAddresses.contracts?.Escrow ?? '') as `0x${string}`,
      orchestrator: (baseAddresses.contracts?.Orchestrator ?? '') as `0x${string}`,
      unifiedPaymentVerifier: (baseAddresses.contracts?.UnifiedPaymentVerifier ?? '') as `0x${string}`,
      protocolViewer: (baseAddresses.contracts?.ProtocolViewer ?? '') as `0x${string}`,
      usdc: (baseConstants as any).USDC,
    },
    base_sepolia: {
      escrow: (baseSepoliaAddresses.contracts?.Escrow ?? '') as `0x${string}`,
      orchestrator: (baseSepoliaAddresses.contracts?.Orchestrator ?? '') as `0x${string}`,
      unifiedPaymentVerifier: (baseSepoliaAddresses.contracts?.UnifiedPaymentVerifier ?? '') as `0x${string}`,
      protocolViewer: (baseSepoliaAddresses.contracts?.ProtocolViewer ?? '') as `0x${string}`,
      // Prefer mock USDC when available on testnet
      usdc: (baseSepoliaAddresses.contracts as any)?.USDCMock as `0x${string}` | undefined,
    },
  };

  const abisByKey: Record<'base' | 'base_sepolia', V2ContractAbis> = {
    base: {
      escrow: EscrowBase as unknown as Abi,
      orchestrator: OrchestratorBase as unknown as Abi,
      unifiedPaymentVerifier: UnifiedPaymentVerifierBase as unknown as Abi,
      protocolViewer: ProtocolViewerBase as unknown as Abi,
    },
    base_sepolia: {
      escrow: EscrowBaseSepolia as unknown as Abi,
      orchestrator: OrchestratorBaseSepolia as unknown as Abi,
      unifiedPaymentVerifier: UnifiedPaymentVerifierBaseSepolia as unknown as Abi,
      protocolViewer: ProtocolViewerBaseSepolia as unknown as Abi,
    },
  };

  // Staging overrides (custom addresses/abis)
  if (env === 'staging') {
    return {
      addresses: {
        escrow: (baseStagingAddresses.contracts?.Escrow ?? '') as `0x${string}`,
        orchestrator: (baseStagingAddresses.contracts?.Orchestrator ?? '') as `0x${string}`,
        unifiedPaymentVerifier: (baseStagingAddresses.contracts?.UnifiedPaymentVerifier ?? '') as `0x${string}`,
        protocolViewer: (baseStagingAddresses.contracts?.ProtocolViewer ?? '') as `0x${string}`,
        usdc: (baseStagingConstants as any).USDC,
      },
      abis: {
        escrow: EscrowBaseStaging as unknown as Abi,
        orchestrator: OrchestratorBaseStaging as unknown as Abi,
        unifiedPaymentVerifier: UnifiedPaymentVerifierBaseStaging as unknown as Abi,
        protocolViewer: ProtocolViewerBaseStaging as unknown as Abi,
      },
    };
  }

  return { addresses: addressesByKey[key], abis: abisByKey[key] };
}

/**
 * Catalog of payment methods with their hashes and supported currencies.
 */
export type PaymentMethodCatalog = Record<string, { paymentMethodHash: `0x${string}`; currencies?: `0x${string}`[] }>;

/**
 * Retrieves the payment methods catalog for a given chain and environment.
 *
 * The catalog maps payment platform names (e.g., 'wise', 'revolut') to their
 * on-chain hashes and supported currency hashes.
 *
 * @param chainId - The chain ID
 * @param env - Runtime environment
 * @returns Payment method catalog keyed by platform name
 *
 * @example
 * ```typescript
 * import { getPaymentMethodsCatalog } from '@zkp2p/offramp-sdk';
 *
 * const catalog = getPaymentMethodsCatalog(8453, 'production');
 * console.log(Object.keys(catalog)); // ['wise', 'venmo', 'revolut', ...]
 * console.log(catalog.wise.paymentMethodHash); // "0x..."
 * console.log(catalog.wise.currencies); // ["0x...", "0x..."] (currency hashes)
 * ```
 */
export function getPaymentMethodsCatalog(chainId: number, env: RuntimeEnv = 'production'): PaymentMethodCatalog {
  const isBaseSepolia = networkKeyFromChainId(chainId) === 'base_sepolia';
  const src = env === 'staging'
    ? (baseStagingPaymentMethods as any)
    : (isBaseSepolia ? (baseSepoliaPaymentMethods as any) : (basePaymentMethods as any));
  const methods = (src?.methods ?? src?.default?.methods ?? {}) as PaymentMethodCatalog;
  return methods;
}

/**
 * Returns the gating service address for a given chain and environment.
 *
 * The gating service signs intent parameters before they can be submitted
 * on-chain, providing an additional validation layer.
 *
 * @param chainId - The chain ID
 * @param env - Runtime environment
 * @returns Gating service signer address
 */
export function getGatingServiceAddress(chainId: number, env: RuntimeEnv = 'production'): `0x${string}` {
  // Base Staging & Production share the same gating service in current deployments
  if (env === 'staging') {
    return '0x396D31055Db28C0C6f36e8b36f18FE7227248a97' as `0x${string}`;
  }
  // Testnets / Base Sepolia often use a dev signer (Hardhat 0)
  if (networkKeyFromChainId(chainId) === 'base_sepolia') {
    return '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;
  }
  // Base mainnet (production)
  return '0x396D31055Db28C0C6f36e8b36f18FE7227248a97' as `0x${string}`;
}
