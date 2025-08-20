import { vi } from 'vitest';

/**
 * Comprehensive failure scenario mocks for testing error handling
 * These mocks simulate real-world contract failures and edge cases
 */

// Common contract errors
export const ContractErrors = {
  INSUFFICIENT_ALLOWANCE: new Error('execution reverted: ERC20: insufficient allowance'),
  INSUFFICIENT_BALANCE: new Error('execution reverted: ERC20: transfer amount exceeds balance'),
  INTENT_ALREADY_EXISTS: new Error('execution reverted: Intent already exists'),
  INTENT_EXPIRED: new Error('execution reverted: Intent has expired'),
  INVALID_PROOF: new Error('execution reverted: Invalid proof'),
  UNAUTHORIZED: new Error('execution reverted: Unauthorized'),
  SLIPPAGE_EXCEEDED: new Error('execution reverted: Slippage tolerance exceeded'),
  GAS_ESTIMATION_FAILED: new Error('cannot estimate gas; transaction may fail or may require manual gas limit'),
  NETWORK_ERROR: new Error('network error: could not connect to node'),
  TIMEOUT_ERROR: new Error('timeout: transaction was not mined within 750 seconds'),
  NONCE_TOO_LOW: new Error('nonce too low'),
  REPLACEMENT_UNDERPRICED: new Error('replacement fee too low'),
  USER_REJECTED: new Error('user rejected transaction'),
};

// Transaction failure scenarios
export const mockTransactionFailures = {
  // Simulate a failed transaction that reverts
  revertedTransaction: () => ({
    hash: '0xfailed',
    wait: vi.fn().mockRejectedValue(ContractErrors.INSUFFICIENT_ALLOWANCE),
  }),

  // Simulate a transaction that times out
  timedOutTransaction: () => ({
    hash: '0xtimeout',
    wait: vi.fn().mockRejectedValue(ContractErrors.TIMEOUT_ERROR),
  }),

  // Simulate a transaction that fails to mine
  failedMiningTransaction: () => ({
    hash: '0xnotmined',
    wait: vi.fn().mockResolvedValue({
      status: 0, // Failed status
      transactionHash: '0xnotmined',
      blockNumber: null,
    }),
  }),

  // Simulate user rejection
  userRejectedTransaction: () => {
    throw ContractErrors.USER_REJECTED;
  },
};

// Gas estimation failures
export const mockGasEstimationFailures = {
  // Simulate gas estimation failure
  failEstimation: () => {
    throw ContractErrors.GAS_ESTIMATION_FAILED;
  },

  // Simulate extremely high gas estimation
  highGasEstimation: () => ({
    toString: () => '10000000000000000', // Very high gas
  }),
};

// Network-related failures
export const mockNetworkFailures = {
  // Simulate network disconnection
  networkError: () => {
    throw ContractErrors.NETWORK_ERROR;
  },

  // Simulate rate limiting
  rateLimitError: () => {
    throw new Error('429: Too many requests');
  },

  // Simulate RPC node failure
  rpcFailure: () => {
    throw new Error('JsonRpcProvider failed to detect network');
  },
};

// Contract state failures
export const mockContractStateFailures = {
  // Simulate contract paused
  contractPaused: () => {
    throw new Error('execution reverted: Contract is paused');
  },

  // Simulate invalid contract address
  invalidContract: () => {
    throw new Error('contract not deployed');
  },

  // Simulate wrong network
  wrongNetwork: () => {
    throw new Error('execution reverted: Wrong chain ID');
  },
};

// Helper to apply failure scenarios to mocked contracts
export const applyFailureScenario = (mockContract: any, scenario: string) => {
  switch (scenario) {
    case 'INSUFFICIENT_ALLOWANCE':
      mockContract.createIntent.mockImplementationOnce(() => 
        mockTransactionFailures.revertedTransaction()
      );
      break;

    case 'TIMEOUT':
      mockContract.createIntent.mockImplementationOnce(() => 
        mockTransactionFailures.timedOutTransaction()
      );
      break;

    case 'USER_REJECTED':
      mockContract.createIntent.mockImplementationOnce(() => 
        mockTransactionFailures.userRejectedTransaction()
      );
      break;

    case 'GAS_ESTIMATION_FAILED':
      mockContract.estimateGas.createIntent.mockImplementationOnce(() =>
        mockGasEstimationFailures.failEstimation()
      );
      break;

    case 'NETWORK_ERROR':
      mockContract.createIntent.mockImplementationOnce(() =>
        mockNetworkFailures.networkError()
      );
      break;

    case 'CONTRACT_PAUSED':
      mockContract.createIntent.mockImplementationOnce(() =>
        mockContractStateFailures.contractPaused()
      );
      break;

    case 'FAILED_MINING':
      mockContract.createIntent.mockImplementationOnce(() =>
        mockTransactionFailures.failedMiningTransaction()
      );
      break;

    default:
      throw new Error(`Unknown failure scenario: ${scenario}`);
  }
};

// Mock contract read failures
export const mockReadFailures = {
  // Simulate contract read timeout
  readTimeout: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Read timeout')), 100);
    });
  },

  // Simulate invalid data return
  invalidData: () => {
    throw new Error('call revert exception');
  },

  // Simulate zero address return
  zeroAddress: () => '0x0000000000000000000000000000000000000000',

  // Simulate malformed data
  malformedData: () => {
    throw new Error('data out-of-bounds');
  },
};

// Proof validation failures
export const mockProofFailures = {
  // Invalid proof structure
  invalidProofStructure: () => ({
    proof: 'invalid',
    signatures: [],
    witnesses: [],
  }),

  // Missing signatures
  missingSignatures: () => ({
    proof: JSON.stringify({ claimData: {} }),
    signatures: [], // Empty signatures
    witnesses: [{ id: '0xwitness1', url: 'https://witness1.com' }],
  }),

  // Invalid witness
  invalidWitness: () => ({
    proof: JSON.stringify({ claimData: {} }),
    signatures: ['0xsig1'],
    witnesses: [{ id: '0x0000000000000000000000000000000000000000', url: '' }],
  }),

  // Expired proof
  expiredProof: () => ({
    proof: JSON.stringify({
      claimData: {
        timestampS: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
      },
    }),
    signatures: ['0xsig1'],
    witnesses: [{ id: '0xwitness1', url: 'https://witness1.com' }],
  }),
};

// Create a test helper for sequential failures
export const createFailureSequence = (failures: (() => any)[]) => {
  let callCount = 0;
  return vi.fn().mockImplementation(() => {
    if (callCount < failures.length) {
      const failure = failures[callCount];
      callCount++;
      return failure();
    }
    // After all failures, return success
    return {
      hash: '0xsuccess',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    };
  });
};

// Helpers for testing retry logic
export const mockRetryScenarios = {
  // Fail twice, then succeed
  failTwiceThenSucceed: () => {
    let attempts = 0;
    return vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw ContractErrors.NETWORK_ERROR;
      }
      return {
        hash: '0xsuccess',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      };
    });
  },

  // Alternating failures
  alternatingFailures: () => {
    let attempts = 0;
    return vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts % 2 === 1) {
        throw ContractErrors.NETWORK_ERROR;
      }
      return {
        hash: '0xsuccess',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      };
    });
  },
};