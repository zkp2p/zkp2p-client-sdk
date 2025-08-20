import { NetworkError, APIError, ContractError, ErrorCode } from './index';

// Parse API error responses
export function parseAPIError(
  response: Response,
  responseText?: string
): APIError {
  let message = `Request failed: ${response.statusText}`;

  // Try to parse error message from response
  try {
    const errorData = responseText ? JSON.parse(responseText) : {};
    if (errorData.error || errorData.message) {
      message = errorData.error || errorData.message;
    }
  } catch {
    // If response is not JSON, use the text directly if it's short
    if (responseText && responseText.length < 200) {
      message = responseText;
    }
  }

  // Determine specific message based on status
  if (response.status === 429) {
    message = 'Too many requests. Please try again later.';
  }

  return new APIError(message, response.status, { url: response.url });
}

// Parse contract errors from viem/ethers
export function parseContractError(error: any): ContractError {
  let message = 'Transaction failed';
  let reason: string | undefined;

  // Handle viem errors
  if (error.shortMessage) {
    message = error.shortMessage;
  }

  // Extract revert reason
  if (error.reason) {
    reason = error.reason;
    message = `Transaction reverted: ${reason}`;
  } else if (error.data?.message) {
    reason = error.data.message;
    message = `Transaction failed: ${reason}`;
  }

  // Check for common errors
  if (
    error.message?.includes('insufficient funds') ||
    error.message?.includes('insufficient balance')
  ) {
    return new ContractError(
      'Insufficient balance for transaction',
      'INSUFFICIENT_BALANCE'
    );
  }

  return new ContractError(message, reason, {
    txHash: error.transactionHash,
    ...error.details,
  });
}

// Simple retry utility for network errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Only retry network errors and rate limits
      const isRetryable =
        error instanceof NetworkError ||
        (error instanceof APIError && error.code === ErrorCode.RATE_LIMIT);

      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff for rate limits
      const waitTime =
        error instanceof APIError && error.code === ErrorCode.RATE_LIMIT
          ? delay * Math.pow(2, i)
          : delay;

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}
