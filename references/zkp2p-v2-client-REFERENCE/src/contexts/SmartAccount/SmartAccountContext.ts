import { createContext } from 'react';
import type { KernelAccountClient } from '@zerodev/sdk';
import type { Address } from 'viem';

export interface SmartAccountContextType {
  kernelClient: KernelAccountClient<any, any> | null;
  smartAccountAddress: Address | null;
  isInitializing: boolean;
  isSmartAccountEnabled: boolean;
  eip7702AuthorizationStatus: 'idle' | 'pending' | 'authorized' | 'failed' | 'unauthorized';
  authorize7702: () => Promise<void>;
  error: Error | null;
  eoa7702Support: boolean | null; // true if supports EIP-7702, false if doesn't, null if not checked/Privy wallet
}

export const SmartAccountContext = createContext<SmartAccountContextType>({
  kernelClient: null,
  smartAccountAddress: null,
  isInitializing: false,
  isSmartAccountEnabled: false,
  eip7702AuthorizationStatus: 'idle',
  authorize7702: async () => {},
  error: null,
  eoa7702Support: null,
});