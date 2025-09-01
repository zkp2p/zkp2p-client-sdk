import { APIError, NetworkError } from './index';

export function parseAPIError(response: Response, responseText?: string): APIError {
  let message = `Request failed: ${response.statusText}`;
  try {
    const parsed = responseText ? JSON.parse(responseText) : undefined;
    if (parsed && (parsed.error || parsed.message)) {
      message = parsed.error || parsed.message;
    }
  } catch {
    if (responseText && responseText.length < 200) message = responseText;
  }
  if (response.status === 429) {
    message = 'Too many requests. Please try again later.';
  }
  return new APIError(message, response.status, { url: response.url });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  timeoutMs?: number
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Apply timeout if specified
      if (timeoutMs) {
        const { withTimeout } = await import('../utils/timeout');
        return await withTimeout(fn(), timeoutMs, `Operation timed out after ${timeoutMs}ms`);
      }
      return await fn();
    } catch (err) {
      lastErr = err;
      const isNetwork = err instanceof NetworkError;
      const isRateLimit = err instanceof APIError && err.status === 429;
      const retryable = isNetwork || isRateLimit;
      if (!retryable || i === maxRetries - 1) throw err;
      const base = isRateLimit ? delayMs * Math.pow(2, i) : delayMs;
      const jitter = Math.floor(Math.random() * Math.min(1000, base));
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
  throw lastErr as Error;
}
