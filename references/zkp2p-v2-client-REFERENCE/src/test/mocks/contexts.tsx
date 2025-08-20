import React from 'react';
import { vi } from 'vitest';

// Mock Account Context
export const mockAccountContext = {
  isLoggedIn: true,
  loggedInEOA: '0x1234567890123456789012345678901234567890',
  loginStatus: 'success' as const,
  userUsdcBalance: 10000000000n, // 10,000 USDC
  userChainId: 8453, // Base mainnet
  signOut: vi.fn(),
  login: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
};

// Mock Smart Contracts Context
export const mockSmartContractsContext = {
  escrowContractAddress: '0xescrow',
  usdcContractAddress: '0xusdc',
  escrowContract: null, // Will be set to mockEscrowContract when needed
  usdcContract: null, // Will be set to mockUSDCContract when needed
  isConnected: true,
  signer: {
    getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  },
};

// Mock Escrow Context
export const mockEscrowContext = {
  depositCounter: 5,
  intents: [],
  intentCounts: new Map(),
  deposits: [],
  fetchEscrowData: vi.fn(),
  isLoading: false,
};

// Mock Deposits Context
export const mockDepositsContext = {
  deposits: [
    {
      id: '1',
      depositor_address: '0xdepositor1',
      deposit_amount: 1000000000n, // 1000 USDC
      remaining_deposit_amount: 900000000n, // 900 USDC
      currency_id: 1n,
      min_amount_to_send: 100000n, // 0.1 USDC
      max_amount_to_send: 1000000n, // 1 USDC
      created_at: new Date(),
      orders: [],
    },
  ],
  fetchDeposits: vi.fn(),
  isLoading: false,
};

// Mock Backend Context
export const mockBackendContext = {
  apiUrl: 'http://localhost:8080',
  fetchQuote: vi.fn().mockResolvedValue({
    amount: '1000000',
    rate: '1.0',
    expiresAt: Date.now() + 300000, // 5 minutes
  }),
  validatePayeeDetails: vi.fn().mockResolvedValue({ valid: true }),
  submitProof: vi.fn().mockResolvedValue({ success: true }),
};

// Create mock providers
export const createMockProviders = (children: React.ReactNode) => {
  return <>{children}</>;
};

// Helper to create context wrapper with custom values
export const createContextWrapper = (contextOverrides?: {
  account?: Partial<typeof mockAccountContext>;
  smartContracts?: Partial<typeof mockSmartContractsContext>;
  escrow?: Partial<typeof mockEscrowContext>;
  deposits?: Partial<typeof mockDepositsContext>;
  backend?: Partial<typeof mockBackendContext>;
}) => {
  const AccountContext = React.createContext(mockAccountContext);
  const SmartContractsContext = React.createContext(mockSmartContractsContext);
  const EscrowContext = React.createContext(mockEscrowContext);
  const DepositsContext = React.createContext(mockDepositsContext);
  const BackendContext = React.createContext(mockBackendContext);

  return ({ children }: { children: React.ReactNode }) => (
    <AccountContext.Provider value={{ ...mockAccountContext, ...contextOverrides?.account }}>
      <SmartContractsContext.Provider value={{ ...mockSmartContractsContext, ...contextOverrides?.smartContracts }}>
        <EscrowContext.Provider value={{ ...mockEscrowContext, ...contextOverrides?.escrow }}>
          <DepositsContext.Provider value={{ ...mockDepositsContext, ...contextOverrides?.deposits }}>
            <BackendContext.Provider value={{ ...mockBackendContext, ...contextOverrides?.backend }}>
              {children}
            </BackendContext.Provider>
          </DepositsContext.Provider>
        </EscrowContext.Provider>
      </SmartContractsContext.Provider>
    </AccountContext.Provider>
  );
};