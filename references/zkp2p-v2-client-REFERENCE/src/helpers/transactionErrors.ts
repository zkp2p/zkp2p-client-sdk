import { BaseError } from 'viem';

/**
 * Parse transaction errors into user-friendly messages
 */
export const parseTransactionError = (error: Error | BaseError): string => {
  const message = error.message?.toLowerCase() || '';
  
  // User rejected
  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Transaction cancelled';
  }
  
  // Insufficient funds
  if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
    return 'Insufficient funds for transaction';
  }
  
  // Gas related
  if (message.includes('exceeds block gas limit')) {
    return 'Transaction too large for network';
  }
  
  if (message.includes('gas required exceeds allowance')) {
    return 'Gas limit too low';
  }
  
  // Nonce issues
  if (message.includes('nonce too low')) {
    return 'Transaction nonce error - please refresh and retry';
  }
  
  // Smart contract errors
  if (message.includes('execution reverted')) {
    // Try to extract revert reason
    const revertMatch = message.match(/reason: (.+?)(?:\n|$)/);
    if (revertMatch) {
      return `Transaction failed: ${revertMatch[1]}`;
    }
    return 'Transaction reverted by contract';
  }
  
  // Network issues
  if (message.includes('timeout') || message.includes('network')) {
    return 'Network error - please check your connection';
  }
  
  // Smart account specific
  if (message.includes('paymaster') && message.includes('failed')) {
    return 'Gas sponsorship unavailable - please try again';
  }
  
  if (message.includes('userOperation')) {
    return 'Smart account operation failed';
  }
  
  // If BaseError, try to use shortMessage
  if ('shortMessage' in error && error.shortMessage) {
    return error.shortMessage;
  }
  
  // Default
  return 'Transaction failed - please try again';
};

/**
 * Check if error is due to user rejection
 */
export const isUserRejectionError = (error: Error | BaseError): boolean => {
  const message = error.message?.toLowerCase() || '';
  return message.includes('user rejected') || message.includes('user denied');
};