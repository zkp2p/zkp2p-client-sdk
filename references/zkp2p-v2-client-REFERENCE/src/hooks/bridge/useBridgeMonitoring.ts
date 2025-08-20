import { useCallback, useRef } from 'react';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory } from '@helpers/types/errors';

export type BridgeProvider = 'RELAY' | 'BUNGEE';

/**
 * Minimal bridge monitoring - only tracks active attempts for debugging
 * Removed all metrics collection per ZKP2P-660
 */
export interface BridgeAttempt {
  id: string;
  provider: BridgeProvider;
  status: 'pending' | 'success' | 'failed';
  sourceTxHash?: string;
  destinationTxHash?: string;
  error?: string; // Simple error message, not categorized
  startTime: number;
  endTime?: number;
  transactionContext?: {
    fromChain?: number;
    toChain?: number;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    recipient?: string;
  };
}

/**
 * Minimal bridge monitoring hook
 * Only tracks active attempts for debugging, no metrics collection
 */
export function useBridgeMonitoring() {
  const { logError } = useErrorLogger();
  const activeAttemptsRef = useRef<Map<string, BridgeAttempt>>(new Map());

  /**
   * Generate unique attempt ID
   */
  const generateAttemptId = useCallback((): string => {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Start tracking a new bridge attempt
   */
  const startBridgeAttempt = useCallback((
    provider: BridgeProvider,
    transactionType: string, // Keep for compatibility but don't use
    transactionContext?: BridgeAttempt['transactionContext']
  ): string => {
    const attemptId = generateAttemptId();
    const attempt: BridgeAttempt = {
      id: attemptId,
      provider,
      status: 'pending',
      startTime: Date.now(),
      transactionContext,
    };

    activeAttemptsRef.current.set(attemptId, attempt);
    
    console.log(`[BRIDGE_MONITORING] Started ${provider}:`, attemptId);
    
    return attemptId;
  }, [generateAttemptId]);

  /**
   * Update an existing bridge attempt
   */
  const updateBridgeAttempt = useCallback((
    attemptId: string,
    updates: {
      status?: 'pending' | 'success' | 'failed';
      costs?: any; // Ignored
    }
  ): void => {
    const attempt = activeAttemptsRef.current.get(attemptId);
    if (!attempt) {
      console.warn(`[BRIDGE_MONITORING] Attempt ${attemptId} not found`);
      return;
    }

    if (updates.status) {
      attempt.status = updates.status;
    }

    activeAttemptsRef.current.set(attemptId, attempt);
    console.log(`[BRIDGE_MONITORING] Updated ${attemptId}`);
  }, []);

  /**
   * Complete a bridge attempt successfully
   */
  const completeBridgeAttempt = useCallback((
    attemptId: string,
    finalData?: {
      sourceTxHash?: string;
      destinationTxHash?: string;
      costs?: any; // Ignored
    }
  ): void => {
    const attempt = activeAttemptsRef.current.get(attemptId);
    if (!attempt) {
      console.warn(`[BRIDGE_MONITORING] Attempt ${attemptId} not found for completion`);
      return;
    }

    attempt.status = 'success';
    attempt.endTime = Date.now();
    attempt.sourceTxHash = finalData?.sourceTxHash;
    attempt.destinationTxHash = finalData?.destinationTxHash;

    const duration = attempt.endTime - attempt.startTime;
    console.log(`[BRIDGE_MONITORING] Completed ${attempt.provider}:`, attemptId, `${duration}ms`);
    
    // Remove from active attempts after logging
    activeAttemptsRef.current.delete(attemptId);
  }, []);

  /**
   * Mark a bridge attempt as failed
   */
  const failBridgeAttempt = useCallback((
    attemptId: string,
    error: {
      code?: string;
      message: string;
      category?: ErrorCategory;
    }
  ): void => {
    const attempt = activeAttemptsRef.current.get(attemptId);
    if (!attempt) {
      console.warn(`[BRIDGE_MONITORING] Attempt ${attemptId} not found for failure`);
      return;
    }

    attempt.status = 'failed';
    attempt.endTime = Date.now();
    attempt.error = error.message;

    const duration = attempt.endTime - attempt.startTime;
    
    // Simple error logging
    logError(
      `Bridge ${attempt.provider} failed`,
      error.category || ErrorCategory.BRIDGE_ERROR,
      {
        attemptId,
        provider: attempt.provider,
        error: error.message,
        duration,
      }
    );

    console.error(`[BRIDGE_MONITORING] Failed ${attempt.provider}:`, attemptId, error.message);
    
    // Remove from active attempts after logging
    activeAttemptsRef.current.delete(attemptId);
  }, [logError]);

  /**
   * Increment retry count (just for logging)
   */
  const incrementRetryCount = useCallback((attemptId: string): void => {
    console.log(`[BRIDGE_MONITORING] Retry for attempt ${attemptId}`);
  }, []);

  return {
    // Core tracking functions only
    startBridgeAttempt,
    updateBridgeAttempt,
    completeBridgeAttempt,
    failBridgeAttempt,
    incrementRetryCount,
  };
}

export default useBridgeMonitoring;