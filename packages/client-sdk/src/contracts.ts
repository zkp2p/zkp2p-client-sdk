// V3 contracts resolution utilities for the SDK
// Centralizes addresses/ABIs import from @zkp2p/contracts-v2 (package providing v3 deployments) and environment switching

import type { Abi } from 'abitype';

// Typed imports from @zkp2p/contracts-v2 (module declarations provided in src/@types)
import baseAddresses from '@zkp2p/contracts-v2/addresses/base';
import baseSepoliaAddresses from '@zkp2p/contracts-v2/addresses/baseSepolia';
import baseStagingAddresses from '@zkp2p/contracts-v2/addresses/baseStaging';

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

import baseConstants from '@zkp2p/contracts-v2/constants/base';
import baseStagingConstants from '@zkp2p/contracts-v2/constants/baseStaging';
// paymentMethods deep paths may not be exported; resolve them at runtime in getPaymentMethodsCatalog()

export type V2ContractAddresses = {
  escrow: `0x${string}`;
  orchestrator?: `0x${string}`;
  unifiedPaymentVerifier?: `0x${string}`;
  protocolViewer?: `0x${string}`;
  usdc?: `0x${string}`;
};

export type V2ContractAbis = {
  escrow: Abi;
  orchestrator?: Abi;
  unifiedPaymentVerifier?: Abi;
  protocolViewer?: Abi;
};

export type RuntimeEnv = 'production' | 'staging';

// ChainId -> network key used by contracts-v2 package
export function networkKeyFromChainId(chainId: number): 'base' | 'base_sepolia' {
  if (chainId === 84532) return 'base_sepolia';
  return 'base';
}

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

export type PaymentMethodCatalog = Record<string, { paymentMethodHash: `0x${string}`; currencies?: `0x${string}`[] }>;

export function getPaymentMethodsCatalog(chainId: number, env: RuntimeEnv = 'production'): PaymentMethodCatalog {
  const isBaseSepolia = networkKeyFromChainId(chainId) === 'base_sepolia';
  // Prefer explicit JSON paths so bundlers include the data
  try {
    if (env === 'staging') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@zkp2p/contracts-v2/paymentMethods/baseStaging.json');
      return (mod?.methods ?? mod?.default?.methods ?? {}) as PaymentMethodCatalog;
    }
    if (isBaseSepolia) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@zkp2p/contracts-v2/paymentMethods/baseSepolia.json');
      return (mod?.methods ?? mod?.default?.methods ?? {}) as PaymentMethodCatalog;
    }
    // Base mainnet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@zkp2p/contracts-v2/paymentMethods/base.json');
    return (mod?.methods ?? mod?.default?.methods ?? {}) as PaymentMethodCatalog;
  } catch {
    return {} as PaymentMethodCatalog;
  }
}

// Gating service address per environment/network (aligns with reference RN SDK)
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
