import { vi } from 'vitest';

// Mock Escrow Contract
export const mockEscrowContract = {
  address: '0x1234567890123456789012345678901234567890',
  
  // Read methods
  depositCounter: vi.fn().mockResolvedValue(5n),
  intents: vi.fn().mockResolvedValue({
    on_ramp_address: '0xuser',
    to: '0xrecipient',
    deposit_id: 1n,
    amount: 1000000n, // 1 USDC
    status: 0, // OPEN
  }),
  deposits: vi.fn().mockResolvedValue({
    depositor_address: '0xdepositor',
    deposit_amount: 1000000000n, // 1000 USDC
    remaining_deposit_amount: 900000000n, // 900 USDC
    currency_id: 1n,
    min_amount_to_send: 100000n, // 0.1 USDC
    max_amount_to_send: 1000000n, // 1 USDC
  }),
  
  // Write methods
  createIntent: vi.fn().mockImplementation(async (amount, currencyId, platformId, to, options) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ 
        status: 1,
        transactionHash: '0xmocktxhash',
        blockNumber: 12345,
      }),
    };
  }),
  
  fulfillIntent: vi.fn().mockImplementation(async (intentId, depositId, payeeDetails) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    };
  }),
  
  releaseFundsToOnramper: vi.fn().mockImplementation(async (args) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    };
  }),
  
  // Gas estimation
  estimateGas: {
    createIntent: vi.fn().mockResolvedValue(150000n),
    fulfillIntent: vi.fn().mockResolvedValue(200000n),
    releaseFundsToOnramper: vi.fn().mockResolvedValue(300000n),
  },
  
  // Event filters
  filters: {
    IntentCreated: vi.fn(),
    IntentFulfilled: vi.fn(),
    FundsReleased: vi.fn(),
  },
  
  queryFilter: vi.fn().mockResolvedValue([]),
};

// Mock Verifier Contracts
export const createMockVerifierContract = (platform: string) => ({
  address: `0x${platform}verifier`,
  
  verifyProof: vi.fn().mockResolvedValue(true),
  
  validateSignatures: vi.fn().mockResolvedValue(true),
  
  estimateGas: {
    verifyProof: vi.fn().mockResolvedValue(500000n),
  },
});

// Mock Token Contract (USDC)
export const mockUSDCContract = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  
  // Read methods
  balanceOf: vi.fn().mockResolvedValue(10000000000n), // 10,000 USDC
  allowance: vi.fn().mockResolvedValue(0n),
  decimals: vi.fn().mockResolvedValue(6),
  symbol: vi.fn().mockResolvedValue('USDC'),
  
  // Write methods
  approve: vi.fn().mockImplementation(async (spender, amount) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    };
  }),
  
  transfer: vi.fn().mockImplementation(async (to, amount) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    };
  }),
  
  // Gas estimation
  estimateGas: {
    approve: vi.fn().mockResolvedValue(50000n),
    transfer: vi.fn().mockResolvedValue(60000n),
  },
};

// Helper to reset all mocks
export const resetContractMocks = () => {
  Object.values(mockEscrowContract).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });
  Object.values(mockEscrowContract.estimateGas).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });
  Object.values(mockUSDCContract).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });
  Object.values(mockUSDCContract.estimateGas).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });
};