// contracts-v2 resolution utilities for the SDK
// Centralizes addresses/ABIs import from @zkp2p/contracts-v2 and environment switching

import type { Abi } from 'abitype';

// Typed JSON imports from the contracts-v2 package
// Addresses
// Note: the published package provides per-network JSONs; keep imports lean to avoid bundling everything.
// Base mainnet
// @ts-expect-error: contracts-v2 JSON modules are untyped
import baseAddresses from '@zkp2p/contracts-v2/addresses/base';
// Base Sepolia
// @ts-expect-error: contracts-v2 JSON modules are untyped
import baseSepoliaAddresses from '@zkp2p/contracts-v2/addresses/baseSepolia';
// Base Staging (custom env used by the reference client)
// @ts-expect-error: contracts-v2 JSON modules are untyped
import baseStagingAddresses from '@zkp2p/contracts-v2/addresses/baseStaging';

// ABIs
// @ts-expect-error: contracts-v2 JSON modules are untyped
import EscrowBase from '@zkp2p/contracts-v2/abis/base/Escrow.json';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import EscrowBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/Escrow.json';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import OrchestratorBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/Orchestrator.json';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import UnifiedPaymentVerifierBaseSepolia from '@zkp2p/contracts-v2/abis/baseSepolia/UnifiedPaymentVerifier.json';

// Staging ABIs
// @ts-expect-error: contracts-v2 JSON modules are untyped
import EscrowBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/Escrow.json';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import OrchestratorBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/Orchestrator.json';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import UnifiedPaymentVerifierBaseStaging from '@zkp2p/contracts-v2/abis/baseStaging/UnifiedPaymentVerifier.json';

// Constants (for USDC, etc.)
// @ts-expect-error: contracts-v2 JSON modules are untyped
import baseConstants from '@zkp2p/contracts-v2/constants/base';
// @ts-expect-error: contracts-v2 JSON modules are untyped
import baseStagingConstants from '@zkp2p/contracts-v2/constants/baseStaging';

export type V2ContractAddresses = {
  escrow: `0x${string}`;
  orchestrator?: `0x${string}`;
  unifiedPaymentVerifier?: `0x${string}`;
  usdc?: `0x${string}`;
};

export type V2ContractAbis = {
  escrow: Abi;
  orchestrator?: Abi;
  unifiedPaymentVerifier?: Abi;
};

export type RuntimeEnv = 'production' | 'staging';

// ChainId -> network key used by contracts-v2 package
export function networkKeyFromChainId(chainId: number): 'base' | 'base_sepolia' {
  if (chainId === 84532) return 'base_sepolia';
  return 'base';
}

export function getContractsV2(chainId: number, env: RuntimeEnv = 'production'): { addresses: V2ContractAddresses; abis: V2ContractAbis } {
  const key = networkKeyFromChainId(chainId);

  const addressesByKey: Record<'base' | 'base_sepolia', V2ContractAddresses> = {
    base: {
      escrow: (baseAddresses.contracts?.Escrow ?? '') as `0x${string}`,
      usdc: (baseConstants as any).USDC,
    },
    base_sepolia: {
      escrow: (baseSepoliaAddresses.contracts?.Escrow ?? '') as `0x${string}`,
      orchestrator: (baseSepoliaAddresses.contracts?.Orchestrator ?? '') as `0x${string}`,
      unifiedPaymentVerifier: (baseSepoliaAddresses.contracts?.UnifiedPaymentVerifier ?? '') as `0x${string}`,
    },
  };

  const abisByKey: Record<'base' | 'base_sepolia', V2ContractAbis> = {
    base: { escrow: EscrowBase as unknown as Abi },
    base_sepolia: {
      escrow: EscrowBaseSepolia as unknown as Abi,
      orchestrator: OrchestratorBaseSepolia as unknown as Abi,
      unifiedPaymentVerifier: UnifiedPaymentVerifierBaseSepolia as unknown as Abi,
    },
  };

  // Staging overrides (custom addresses/abis)
  if (env === 'staging') {
    return {
      addresses: {
        escrow: (baseStagingAddresses.contracts?.Escrow ?? '') as `0x${string}`,
        orchestrator: (baseStagingAddresses.contracts?.Orchestrator ?? '') as `0x${string}`,
        unifiedPaymentVerifier: (baseStagingAddresses.contracts?.UnifiedPaymentVerifier ?? '') as `0x${string}`,
        usdc: (baseStagingConstants as any).USDC,
      },
      abis: {
        escrow: EscrowBaseStaging as unknown as Abi,
        orchestrator: OrchestratorBaseStaging as unknown as Abi,
        unifiedPaymentVerifier: UnifiedPaymentVerifierBaseStaging as unknown as Abi,
      },
    };
  }

  return { addresses: addressesByKey[key], abis: abisByKey[key] };
}

export function orchestratorAvailable(addresses: V2ContractAddresses, abis: V2ContractAbis): boolean {
  return Boolean(addresses.orchestrator && abis.orchestrator);
}

