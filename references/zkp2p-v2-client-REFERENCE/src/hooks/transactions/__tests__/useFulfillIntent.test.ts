// Mock modules must be hoisted
// Mock context hook
vi.mock('@hooks/contexts/useSmartContracts', () => ({
  default: vi.fn(),
}));

// Mock usePrivyTransaction
vi.mock('@hooks/usePrivyTransaction', () => ({
  default: vi.fn(),
}));

// Mock viem - use importOriginal to get real keccak256
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(),
    http: vi.fn()
  };
});


// Mock viem/actions
vi.mock('viem/actions', () => ({
  simulateContract: vi.fn(),
}));

// Mock alchemyRpcUrl
vi.mock('../../../index', () => ({
  alchemyRpcUrl: 'https://mock-alchemy-url.com',
}));

// Mock wagmi config
vi.mock('../../../config/wagmi', () => ({
  getDefaultChain: vi.fn(() => ({ id: 1, name: 'mainnet' })),
}));

// Mock useSmartAccount
vi.mock('@hooks/contexts/useSmartAccount', () => ({
  default: vi.fn(() => ({
    isSmartAccountEnabled: false,
    eip7702AuthorizationStatus: 'idle',
    smartAccountAddress: null,
  })),
}));

// Mock useAccount
vi.mock('@hooks/contexts/useAccount', () => ({
  default: vi.fn(() => ({
    loggedInEthereumAddress: '0x1234567890123456789012345678901234567890',
  })),
}));

// Mock useErrorLogger
vi.mock('@hooks/useErrorLogger', () => ({
  useErrorLogger: vi.fn(() => ({
    logError: vi.fn(),
  })),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createPublicClient, http } from 'viem';
import { simulateContract } from 'viem/actions';

// Import mocked modules
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import useSmartAccount from '@hooks/contexts/useSmartAccount';
import useAccount from '@hooks/contexts/useAccount';
import { useErrorLogger } from '@hooks/useErrorLogger';
import useFulfillIntent from '../useFulfillIntent';
import { getDefaultChain } from '../../../config/wagmi';

describe('useFulfillIntent', () => {
  const mockEscrowAddress = '0x1234567890123456789012345678901234567890';
  const mockEscrowAbi = [{ name: 'fulfillIntent', type: 'function' }];
  const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  
  // Create mock for usePrivyTransaction
  const mockWriteContractAsync = vi.fn();
  const mockExecuteBatch = vi.fn();
  const mockSendTransaction = vi.fn();
  const createMockPrivyTransaction = (overrides = {}) => ({
    writeContractAsync: mockWriteContractAsync,
    executeBatch: mockExecuteBatch,
    sendTransaction: mockSendTransaction,
    isLoading: false,
    error: null,
    userOpHash: null,
    isUsingGasSponsorship: false,
    willPayGas: true,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(useSmartContracts).mockReturnValue({
      escrowAddress: mockEscrowAddress,
      escrowAbi: mockEscrowAbi,
    } as any);

    // Default mock for usePrivyTransaction
    vi.mocked(usePrivyTransaction).mockReturnValue(createMockPrivyTransaction());
    
    // Reset the mock function
    mockWriteContractAsync.mockReset();
    
    // Setup default viem mocks
    const mockPublicClient = {
      simulateContract: vi.fn(),
    };
    vi.mocked(createPublicClient).mockReturnValue(mockPublicClient as any);
    vi.mocked(http).mockReturnValue({} as any);
    vi.mocked(simulateContract).mockResolvedValue({} as any);
  });

  describe('simulation flow', () => {
    it('should simulate transaction before signing', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      
      // Mock successful simulation and transaction
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      const { result } = renderHook(() => useFulfillIntent(onSuccess, onError));

      // Initially idle
      expect(result.current.simulationStatus).toBe('idle');
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(false);

      // Set required inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
      });

      // Enable writing
      act(() => {
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Trigger write - should simulate first
      await act(async () => {
        const writeResult = await result.current.writeFulfillIntentAsync();
        expect(writeResult).toEqual({ hash: mockTxHash });
      });

      // Verify simulation was called
      expect(simulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          simulateContract: expect.any(Function),
        }),
        {
          address: mockEscrowAddress,
          abi: mockEscrowAbi,
          functionName: 'fulfillIntent',
          args: ['0xproofdata', '0xintentHash123'],
          account: '0x1234567890123456789012345678901234567890',
        }
      );

      // Verify simulation success
      expect(result.current.simulationStatus).toBe('success');
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(true);

      // Verify contract was called after successful simulation
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: mockEscrowAddress,
        abi: mockEscrowAbi,
        functionName: 'fulfillIntent',
        args: ['0xproofdata', '0xintentHash123'],
      });
    });

    it('should handle simulation failure and prevent transaction', async () => {
      const onError = vi.fn();
      const simulationError = new Error('Simulation failed: Invalid proof');
      
      // Mock simulation failure
      vi.mocked(simulateContract).mockRejectedValue(simulationError);
      
      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs and enable
      act(() => {
        result.current.setPaymentProofInput('0xinvalidproof');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write - should fail at simulation
      await act(async () => {
        const writeResult = await result.current.writeFulfillIntentAsync();
        expect(writeResult).toBeUndefined();
      });

      // Verify simulation was attempted
      expect(simulateContract).toHaveBeenCalled();

      // Verify transaction was NOT attempted
      expect(mockWriteContractAsync).not.toHaveBeenCalled();

      // Verify error handling
      expect(result.current.simulationStatus).toBe('error');
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(false);
      expect(result.current.prepareFulfillIntentError).toBe(simulationError);
      expect(result.current.isWriteFulfillIntentPrepareError).toBe(true);
      expect(onError).toHaveBeenCalledWith(simulationError);
    });

    it('should reset simulation status when inputs change', async () => {
      const { result } = renderHook(() => useFulfillIntent());

      // Set initial inputs and simulate
      act(() => {
        result.current.setPaymentProofInput('0xproofdata1');
        result.current.setIntentHashInput('0xintentHash1');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Mock successful simulation
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockResolvedValue(mockTxHash);

      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      expect(result.current.simulationStatus).toBe('success');
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(true);

      // Change inputs - should reset simulation
      act(() => {
        result.current.setPaymentProofInput('0xproofdata2');
      });

      expect(result.current.simulationStatus).toBe('idle');
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(false);
    });

    it('should show simulating status during simulation', async () => {
      const { result } = renderHook(() => useFulfillIntent());

      // Set inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Mock simulation that takes time
      let resolveSimulation: ((value: any) => void) | null = null;
      const simulationPromise = new Promise((resolve) => {
        resolveSimulation = resolve;
      });
      vi.mocked(simulateContract).mockReturnValue(simulationPromise as any);

      // Start write
      let writePromise: Promise<any>;
      act(() => {
        writePromise = result.current.writeFulfillIntentAsync();
      });

      // Check simulating status
      expect(result.current.simulationStatus).toBe('simulating');
      expect(result.current.isPreparingTransaction).toBe(true);

      // Resolve simulation
      act(() => {
        resolveSimulation!({});
      });

      // Mock successful write
      mockWriteContractAsync.mockResolvedValue(mockTxHash);

      await act(async () => {
        await writePromise;
      });

      expect(result.current.simulationStatus).toBe('success');
    });
  });

  describe('successful proof submission', () => {
    it('should handle complete successful flow from proof submission to mining', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      
      // Mock successful transaction
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      // Create a custom mock implementation for this test
      let triggerSuccess: ((hash: string) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerSuccess = props.onSuccess;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useFulfillIntent(onSuccess, onError));

      // Set required inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
      });

      // Enable writing
      act(() => {
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Mock successful simulation
      vi.mocked(simulateContract).mockResolvedValue({} as any);

      // Trigger write
      await act(async () => {
        const writeResult = await result.current.writeFulfillIntentAsync();
        expect(writeResult).toEqual({ hash: mockTxHash });
      });

      // Verify the contract call
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: mockEscrowAddress,
        abi: mockEscrowAbi,
        functionName: 'fulfillIntent',
        args: ['0xproofdata', '0xintentHash123'],
      });

      // Simulate transaction success
      act(() => {
        triggerSuccess?.(mockTxHash);
      });

      // Verify success callback and state updates
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          transactionHash: mockTxHash,
        });
      });
      
      expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(true);
      expect(result.current.transactionHash).toBe(mockTxHash);
    });
  });

  describe('error handling', () => {
    it('should handle preparation errors gracefully', async () => {
      const onError = vi.fn();
      const error = new Error('Invalid proof data');
      
      // Mock successful simulation but error in writeContractAsync
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockRejectedValue(error);
      
      // Create a custom mock implementation for this test
      let triggerError: ((error: Error) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerError = props.onError;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Simulate error callback
      act(() => {
        triggerError?.(error);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
        expect(result.current.signFulfillIntentTransactionStatus).toBe('error');
        expect(result.current.mineFulfillIntentTransactionStatus).toBe('error');
        expect(result.current.isWriteFulfillIntentPrepareError).toBe(true);
        expect(result.current.prepareFulfillIntentError).toBe(error);
      });
    });

    it('should handle transaction write failures after successful simulation', async () => {
      const onError = vi.fn();
      const error = new Error('User rejected transaction');
      
      // Mock successful simulation but error in write
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockRejectedValue(error);

      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs and enable
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write - should handle error internally
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // The hook catches the error and doesn't throw it
      expect(mockWriteContractAsync).toHaveBeenCalled();
    });

    it('should handle missing smart contracts', async () => {
      const onError = vi.fn();
      
      // Mock missing smart contracts
      vi.mocked(useSmartContracts).mockReturnValue({
        escrowAddress: null,
        escrowAbi: null,
      } as any);

      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Smart contracts not initialized',
        })
      );
      
      // Should not attempt simulation without contracts
      expect(simulateContract).not.toHaveBeenCalled();
    });

    it('should handle network errors during simulation', async () => {
      const onError = vi.fn();
      const networkError = new Error('Network error: Could not connect to RPC');
      
      // Mock network error during simulation
      vi.mocked(simulateContract).mockRejectedValue(networkError);
      
      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Verify error handling
      expect(onError).toHaveBeenCalledWith(networkError);
      expect(result.current.simulationStatus).toBe('error');
      expect(result.current.prepareFulfillIntentError).toBe(networkError);
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });

    it('should differentiate between simulation and execution errors', async () => {
      const onError = vi.fn();
      const simulationError = new Error('Simulation failed: Insufficient funds');
      const executionError = new Error('Execution failed: Gas too low');
      
      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Test 1: Simulation error
      vi.mocked(simulateContract).mockRejectedValue(simulationError);
      
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(simulationError);
      expect(result.current.simulationStatus).toBe('error');
      expect(result.current.prepareFulfillIntentError).toBe(simulationError);

      // Reset for test 2
      vi.clearAllMocks();
      act(() => {
        result.current.setShouldConfigureFulfillIntentWrite(false);
      });

      // Test 2: Execution error after successful simulation
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockRejectedValue(executionError);
      
      // Create a custom mock implementation for execution error
      let triggerError: ((error: Error) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerError = props.onError;
        return createMockPrivyTransaction();
      });

      act(() => {
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Trigger the execution error
      act(() => {
        triggerError?.(executionError);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(executionError);
        expect(result.current.simulationStatus).toBe('error'); // Set to error in onError callback
        expect(result.current.prepareFulfillIntentError).toBe(executionError);
      });
    });

    it('should handle proof verification failures', async () => {
      const onError = vi.fn();
      const error = new Error('Proof verification failed');
      
      // Mock successful simulation but verification failure in write
      vi.mocked(simulateContract).mockResolvedValue({} as any);
      mockWriteContractAsync.mockRejectedValue(error);
      
      let triggerError: ((error: Error) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerError = props.onError;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setPaymentProofInput('0xinvalidproof');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Simulate error
      act(() => {
        triggerError?.(error);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
        expect(result.current.isWriteFulfillIntentPrepareError).toBe(true);
      });
    });

    it('should handle transaction mining failures', async () => {
      const onError = vi.fn();
      
      // Mock successful write but failed mining
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      // Update mock to simulate loading state
      let triggerError: ((error: Error) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerError = props.onError;
        return createMockPrivyTransaction({
          isLoading: true,
          userOpHash: '0xuserop',
        });
      });

      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Verify loading state updates
      expect(result.current.signFulfillIntentTransactionStatus).toBe('success');
      expect(result.current.mineFulfillIntentTransactionStatus).toBe('loading');
      expect(result.current.isPreparingTransaction).toBe(false);

      // Simulate mining error
      const miningError = new Error('Transaction reverted');
      act(() => {
        triggerError?.(miningError);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(miningError);
        expect(result.current.signFulfillIntentTransactionStatus).toBe('error');
        expect(result.current.mineFulfillIntentTransactionStatus).toBe('error');
      });
    });
  });

  describe('input validation', () => {
    it('should not proceed without payment proof', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Only set intent hash
      act(() => {
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required parameters for fulfilling intent',
        })
      );
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });

    it('should not proceed without intent hash', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFulfillIntent(undefined, onError));

      // Only set payment proof
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required parameters for fulfilling intent',
        })
      );
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should manage loading states correctly during transaction flow', async () => {
      const onSuccess = vi.fn();
      
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      // Start with idle state
      vi.mocked(usePrivyTransaction).mockReturnValue(
        createMockPrivyTransaction()
      );

      const { result, rerender } = renderHook(() => useFulfillIntent(onSuccess));

      // Initially idle
      expect(result.current.signFulfillIntentTransactionStatus).toBe('idle');
      expect(result.current.mineFulfillIntentTransactionStatus).toBe('idle');
      expect(result.current.isPreparingTransaction).toBe(false);

      // Mock loading state without userOpHash (preparation phase)
      vi.mocked(usePrivyTransaction).mockReturnValue(
        createMockPrivyTransaction({
          isLoading: true,
        })
      );
      rerender();

      expect(result.current.signFulfillIntentTransactionStatus).toBe('loading');
      expect(result.current.mineFulfillIntentTransactionStatus).toBe('idle');
      expect(result.current.isPreparingTransaction).toBe(true);

      // Mock with userOpHash (signing done, mining in progress)
      vi.mocked(usePrivyTransaction).mockReturnValue(
        createMockPrivyTransaction({
          isLoading: true,
          userOpHash: '0xuserop',
        })
      );
      rerender();

      expect(result.current.signFulfillIntentTransactionStatus).toBe('success');
      expect(result.current.mineFulfillIntentTransactionStatus).toBe('loading');
      expect(result.current.isPreparingTransaction).toBe(false);
    });

    it('should reset preparation flag after successful transaction', async () => {
      const onSuccess = vi.fn();
      
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      let triggerSuccess: ((hash: string) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerSuccess = props.onSuccess;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useFulfillIntent(onSuccess));

      // Set inputs and enable
      act(() => {
        result.current.setPaymentProofInput('0xproofdata');
        result.current.setIntentHashInput('0xintentHash123');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Mock successful simulation
      vi.mocked(simulateContract).mockResolvedValue({} as any);

      // Execute transaction
      await act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Simulate success
      act(() => {
        triggerSuccess?.(mockTxHash);
      });

      await waitFor(() => {
        expect(result.current.isWriteFulfillIntentSimulationSuccess).toBe(true);
        expect(onSuccess).toHaveBeenCalledWith({ transactionHash: mockTxHash });
      });
    });

    it('should handle multiple rapid simulation requests', async () => {
      const { result } = renderHook(() => useFulfillIntent());

      // Set initial inputs
      act(() => {
        result.current.setPaymentProofInput('0xproofdata1');
        result.current.setIntentHashInput('0xintentHash1');
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      // Mock simulation with delay
      let simulationCount = 0;
      vi.mocked(simulateContract).mockImplementation(async () => {
        simulationCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return {} as any;
      });

      // Start first write
      const promise1 = act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      // Immediately change inputs and start second write
      act(() => {
        result.current.setPaymentProofInput('0xproofdata2');
      });

      act(() => {
        result.current.setShouldConfigureFulfillIntentWrite(true);
      });

      const promise2 = act(async () => {
        await result.current.writeFulfillIntentAsync();
      });

      await Promise.all([promise1, promise2]);

      // Should have attempted simulation for both
      expect(simulationCount).toBeGreaterThanOrEqual(2);
    });
  });

});