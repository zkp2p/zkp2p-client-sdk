import { describe, it, expect, vi } from 'vitest';
import { parseAPIError, withRetry } from '../errors/utils';
import { APIError, NetworkError } from '../errors';

describe('errors utilities', () => {
  it('parseAPIError prefers JSON message/error fields', () => {
    const res = new Response('{"message":"bad request"}', { status: 400, statusText: 'Bad Request' });
    const err = parseAPIError(res, '{"message":"bad request"}');
    expect(err).toBeInstanceOf(APIError);
    expect(err.message).toBe('bad request');
    expect(err.status).toBe(400);
  });

  it('parseAPIError falls back to plain text when not JSON', () => {
    const res = new Response('plain error', { status: 500, statusText: 'Internal' });
    const err = parseAPIError(res, 'plain error');
    expect(err.message).toBe('plain error');
  });

  it('parseAPIError overrides message for 429 rate limit', () => {
    const res = new Response('anything', { status: 429, statusText: 'Too Many Requests' });
    const err = parseAPIError(res, 'ignored');
    expect(err.message).toMatch(/Too many requests/i);
  });

  it('withRetry retries on NetworkError and then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError('offline'))
      .mockRejectedValueOnce(new NetworkError('offline'))
      .mockResolvedValueOnce('ok');

    const start = Date.now();
    const result = await withRetry(fn as any, 3, 10);
    const duration = Date.now() - start;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThanOrEqual(20);
  });

  it('withRetry does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new APIError('bad', 400));
    await expect(withRetry(fn as any, 3, 10)).rejects.toBeInstanceOf(APIError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

