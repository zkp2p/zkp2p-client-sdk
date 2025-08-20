// Mock modules must be hoisted
// Mock context hook
vi.mock('@hooks/contexts/useSmartContracts', () => ({
  default: vi.fn(),
}));

// Mock usePrivyTransaction
vi.mock('@hooks/usePrivyTransaction', () => ({
  default: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Import mocked modules
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import useSignalIntent from '../useSignalIntent';

describe('useSignalIntent', () => {
  const mockEscrowAddress = '0x1234567890123456789012345678901234567890';
  const mockEscrowAbi = [{ name: 'signalIntent', type: 'function' }];
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
  });

  describe('successful intent creation', () => {
    it('should handle complete successful flow from preparation to mining', async () => {
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

      const { result } = renderHook(() => useSignalIntent(onSuccess, onError));

      // Set all required inputs
      act(() => {
        result.current.setDepositIdInput(123);
        result.current.setTokenAmountInput('1000000');
        result.current.setRecipientAddressInput('0xrecipient');
        result.current.setVerifierAddressInput('0xverifier');
        result.current.setCurrencyCodeHashInput('0xcurrencyhash');
        result.current.setGatingServiceSignatureInput('0xsignature');
      });

      // Enable writing
      act(() => {
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      // Trigger write
      await act(async () => {
        const writeResult = await result.current.writeSignalIntentAsync();
        expect(writeResult).toEqual({ hash: mockTxHash });
      });

      // Verify the contract call
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: mockEscrowAddress,
        abi: mockEscrowAbi,
        functionName: 'signalIntent',
        args: [
          BigInt(123),
          BigInt(1000000),
          '0xrecipient',
          '0xverifier',
          '0xcurrencyhash',
          '0xsignature',
        ],
      });

      // Simulate transaction success
      act(() => {
        triggerSuccess?.(mockTxHash);
      });

      // Verify success callback and final state
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          transactionHash: mockTxHash,
        });
        // The hook should have processed the success callback
        expect(result.current.transactionHash).toBe(mockTxHash);
      });
    });
  });

  describe('error handling', () => {
    it('should handle preparation errors gracefully', async () => {
      const onError = vi.fn();
      const error = new Error('Insufficient balance');
      
      // Mock error in writeContractAsync
      mockWriteContractAsync.mockRejectedValue(error);
      
      // Create a custom mock implementation for this test
      let triggerError: ((error: Error) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerError = props.onError;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useSignalIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setDepositIdInput(1);
        result.current.setTokenAmountInput('1000000');
        result.current.setRecipientAddressInput('0xrecipient');
        result.current.setVerifierAddressInput('0xverifier');
        result.current.setCurrencyCodeHashInput('0xcurrencyhash');
        result.current.setGatingServiceSignatureInput('0xsignature');
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeSignalIntentAsync();
      });

      // Simulate error callback
      act(() => {
        triggerError?.(error);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
        expect(result.current.signSignalIntentTransactionStatus).toBe('error');
        expect(result.current.mineSignalIntentTransactionStatus).toBe('error');
      });
    });

    it('should handle transaction write failures', async () => {
      const onError = vi.fn();
      const error = new Error('User rejected transaction');
      
      mockWriteContractAsync.mockRejectedValue(error);

      const { result } = renderHook(() => useSignalIntent(undefined, onError));

      // Set inputs and enable
      act(() => {
        result.current.setDepositIdInput(1);
        result.current.setTokenAmountInput('1000000');
        result.current.setRecipientAddressInput('0xrecipient');
        result.current.setVerifierAddressInput('0xverifier');
        result.current.setCurrencyCodeHashInput('0xcurrencyhash');
        result.current.setGatingServiceSignatureInput('0xsignature');
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      // Attempt write - should handle error internally
      await act(async () => {
        await result.current.writeSignalIntentAsync();
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

      const { result } = renderHook(() => useSignalIntent(undefined, onError));

      // Set inputs
      act(() => {
        result.current.setDepositIdInput(1);
        result.current.setTokenAmountInput('1000000');
        result.current.setRecipientAddressInput('0xrecipient');
        result.current.setVerifierAddressInput('0xverifier');
        result.current.setCurrencyCodeHashInput('0xcurrencyhash');
        result.current.setGatingServiceSignatureInput('0xsignature');
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeSignalIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Smart contracts not initialized',
        })
      );
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

      const { result } = renderHook(() => useSignalIntent(undefined, onError));

      // Verify loading state updates
      expect(result.current.signSignalIntentTransactionStatus).toBe('success');
      expect(result.current.mineSignalIntentTransactionStatus).toBe('loading');

      // Simulate mining error
      const miningError = new Error('Transaction reverted');
      act(() => {
        triggerError?.(miningError);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(miningError);
        expect(result.current.signSignalIntentTransactionStatus).toBe('error');
        expect(result.current.mineSignalIntentTransactionStatus).toBe('error');
      });
    });
  });

  describe('input validation', () => {
    it('should not enable preparation without all required inputs', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useSignalIntent(undefined, onError));

      // Enable without setting inputs
      act(() => {
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      // Attempt write
      await act(async () => {
        await result.current.writeSignalIntentAsync();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required parameters for signaling intent',
        })
      );
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should reset preparation flag after successful transaction', async () => {
      const onSuccess = vi.fn();
      
      mockWriteContractAsync.mockResolvedValue(mockTxHash);
      
      let triggerSuccess: ((hash: string) => void) | null = null;
      vi.mocked(usePrivyTransaction).mockImplementation((props: any) => {
        triggerSuccess = props.onSuccess;
        return createMockPrivyTransaction();
      });

      const { result } = renderHook(() => useSignalIntent(onSuccess));

      // Set inputs and enable
      act(() => {
        result.current.setDepositIdInput(1);
        result.current.setTokenAmountInput('1000000');
        result.current.setRecipientAddressInput('0xrecipient');
        result.current.setVerifierAddressInput('0xverifier');
        result.current.setCurrencyCodeHashInput('0xcurrencyhash');
        result.current.setGatingServiceSignatureInput('0xsignature');
        result.current.setShouldConfigureSignalIntentWrite(true);
      });

      expect(result.current.shouldConfigureSignalIntentWrite).toBe(true);

      // Execute transaction
      await act(async () => {
        await result.current.writeSignalIntentAsync();
      });

      // Simulate success
      act(() => {
        triggerSuccess?.(mockTxHash);
      });

      await waitFor(() => {
        expect(result.current.shouldConfigureSignalIntentWrite).toBe(false);
      });
    });
  });
});