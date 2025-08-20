import { ErrorCategory } from '@helpers/types/errors';

/**
 * Simplified Bridge Error Handling
 * Removed speculative error categorization per ZKP2P-660
 * Keep only proven, actionable error types
 */

/**
 * Basic error types that are actually actionable
 */
export enum BridgeErrorType {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  NO_ROUTES = 'NO_ROUTES',
  NETWORK_ERROR = 'NETWORK_ERROR',
  USER_REJECTED = 'USER_REJECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Simple error message structure
 */
export interface BridgeErrorMessage {
  title: string;
  description: string;
  isRetryable: boolean;
}

/**
 * Basic error messages - removed speculative recovery actions
 */
export const bridgeErrorMessages: Record<BridgeErrorType, BridgeErrorMessage> = {
  [BridgeErrorType.INSUFFICIENT_BALANCE]: {
    title: 'Insufficient Balance',
    description: 'You do not have enough tokens to complete this transaction.',
    isRetryable: false,
  },
  
  [BridgeErrorType.NO_ROUTES]: {
    title: 'No Bridge Route Available',
    description: 'No route found for this token pair. The token may not be supported on the destination chain.',
    isRetryable: false,
  },
  
  [BridgeErrorType.NETWORK_ERROR]: {
    title: 'Network Error',
    description: 'A network error occurred. Please try again.',
    isRetryable: true,
  },
  
  [BridgeErrorType.USER_REJECTED]: {
    title: 'Transaction Cancelled',
    description: 'You cancelled the transaction.',
    isRetryable: false,
  },
  
  [BridgeErrorType.UNKNOWN_ERROR]: {
    title: 'Bridge Error',
    description: 'An error occurred during bridging. Please try again.',
    isRetryable: true,
  }
};

/**
 * Simple error categorization - removed pattern matching
 */
export function categorizeBridgeError(
  error: any,
  context?: {
    bridgeProvider?: 'relay' | 'bungee';
    retryCount?: number;
    transactionType?: 'quote' | 'execute';
  }
): BridgeErrorType {
  if (!error) return BridgeErrorType.UNKNOWN_ERROR;
  
  const errorMessage = typeof error === 'string' ? error : error.message || error.toString();
  const errorMessageLower = errorMessage.toLowerCase();
  
  // Only check for clear, unambiguous errors
  if (errorMessageLower.includes('insufficient') && errorMessageLower.includes('balance')) {
    return BridgeErrorType.INSUFFICIENT_BALANCE;
  }
  
  if (errorMessageLower.includes('no routes found') || errorMessageLower.includes('no route')) {
    return BridgeErrorType.NO_ROUTES;
  }
  
  if (errorMessageLower.includes('user rejected') || errorMessageLower.includes('user denied')) {
    return BridgeErrorType.USER_REJECTED;
  }
  
  if (errorMessageLower.includes('network error') || errorMessageLower.includes('fetch failed')) {
    return BridgeErrorType.NETWORK_ERROR;
  }
  
  // Check error codes if available
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
    return BridgeErrorType.USER_REJECTED;
  }
  
  return BridgeErrorType.UNKNOWN_ERROR;
}

/**
 * Get simple error message
 */
export function getBridgeErrorMessage(
  error: any,
  context?: {
    bridgeProvider?: 'relay' | 'bungee';
    retryCount?: number;
    transactionType?: 'quote' | 'execute';
    tokenSymbol?: string;
    networkName?: string;
  }
): BridgeErrorMessage & { category: ErrorCategory; severity: string } {
  const errorType = categorizeBridgeError(error, context);
  const baseMessage = bridgeErrorMessages[errorType];
  
  // Add context if available
  let description = baseMessage.description;
  if (context?.retryCount && context.retryCount > 0) {
    description += ` (Attempt ${context.retryCount + 1})`;
  }
  
  return {
    ...baseMessage,
    description,
    category: ErrorCategory.BRIDGE_ERROR,
    severity: baseMessage.isRetryable ? 'medium' : 'high',
  };
}

/**
 * Simple retry decision - removed complex logic
 */
export function shouldAutoRetryError(
  errorType: BridgeErrorType,
  retryCount: number,
  maxRetries: number = 3
): boolean {
  if (retryCount >= maxRetries) {
    return false;
  }
  
  return bridgeErrorMessages[errorType].isRetryable;
}

/**
 * Simple retry delay - removed exponential backoff complexity
 */
export function calculateRetryDelay(
  errorType: BridgeErrorType,
  retryCount: number,
  baseDelay: number = 2000
): number {
  // Simple linear delay: 2s, 4s, 6s, etc.
  return baseDelay * (retryCount + 1);
}