import { NetworkError } from '../errors';

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message when timeout occurs
 * @returns Promise that rejects if timeout occurs
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new NetworkError(timeoutMessage, { timeout: timeoutMs }));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Default timeout values for different operation types
 */
export const DEFAULT_TIMEOUTS = {
  /** API call timeout (30 seconds) */
  API: 30000,
  /** Blockchain transaction timeout (60 seconds) */
  TRANSACTION: 60000,
  /** Proof generation timeout (120 seconds) */
  PROOF_GENERATION: 120000,
  /** Extension communication timeout (60 seconds) */
  EXTENSION: 60000,
} as const;