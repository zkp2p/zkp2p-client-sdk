import { useState, useCallback } from 'react';
import { type Hex } from 'viem';

export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';

interface TransactionState {
  signing: TransactionStatus;
  mining: TransactionStatus;
  hash: Hex | null;
  error: Error | null;
}

interface UseTransactionStatusReturn extends TransactionState {
  updateSigning: (status: TransactionStatus) => void;
  updateMining: (status: TransactionStatus) => void;
  setHash: (hash: Hex) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
  isLoading: boolean;
}

/**
 * Hook for managing transaction status state
 * @returns Object with transaction state and update methods
 */
export function useTransactionStatus(): UseTransactionStatusReturn {
  const [state, setState] = useState<TransactionState>({
    signing: 'idle',
    mining: 'idle',
    hash: null,
    error: null,
  });

  const updateSigning = useCallback((status: TransactionStatus) => {
    setState(prev => ({ ...prev, signing: status }));
  }, []);

  const updateMining = useCallback((status: TransactionStatus) => {
    setState(prev => ({ ...prev, mining: status }));
  }, []);

  const setHash = useCallback((hash: Hex) => {
    setState(prev => ({ ...prev, hash }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ 
      ...prev, 
      error,
      signing: error ? 'error' : prev.signing,
      mining: error ? 'error' : prev.mining
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      signing: 'idle',
      mining: 'idle',
      hash: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    updateSigning,
    updateMining,
    setHash,
    setError,
    reset,
    isLoading: state.signing === 'loading' || state.mining === 'loading',
  };
}