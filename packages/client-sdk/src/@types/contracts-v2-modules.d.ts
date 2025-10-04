// Ambient module declarations for @zkp2p/contracts-v2 deep exports
// Provides type-safety for addresses, constants, ABIs, and payment methods

import type { Abi } from 'abitype';

declare module '@zkp2p/contracts-v2/addresses/*' {
  const data: {
    name: string;
    chainId: number;
    contracts: Record<string, `0x${string}`>;
  };
  export default data;
}

declare module '@zkp2p/contracts-v2/constants/*' {
  const constants: Record<string, unknown> & { USDC?: `0x${string}` };
  export default constants;
}

declare module '@zkp2p/contracts-v2/abis/*/*.json' {
  const abi: Abi;
  export default abi;
}

// Support importing via the per-network ABI index re-exports as well
declare module '@zkp2p/contracts-v2/abis/*' {
  export const Escrow: Abi;
  export const Orchestrator: Abi;
  export const ProtocolViewer: Abi;
  export const UnifiedPaymentVerifier: Abi;
  export const EscrowRegistry: Abi;
  export const PaymentVerifierRegistry: Abi;
  export const PostIntentHookRegistry: Abi;
  export const RelayerRegistry: Abi;
  export const SimpleAttestationVerifier: Abi;
}

declare module '@zkp2p/contracts-v2/paymentMethods/*' {
  export type PaymentMethods = {
    methods: Record<string, { paymentMethodHash: `0x${string}`; currencies?: `0x${string}`[] }>;
  };
  const pm: PaymentMethods;
  export default pm;
}

// Fallback catch-all to satisfy module resolution under bundler settings
declare module '@zkp2p/contracts-v2/*' {
  const anyExport: any;
  export default anyExport;
}
