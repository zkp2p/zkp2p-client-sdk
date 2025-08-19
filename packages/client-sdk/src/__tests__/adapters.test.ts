import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGetQuote } from '../adapters/api';
import { ValidationError } from '../errors';

describe('api adapters', () => {
  afterEach(() => {
    (globalThis.fetch as any) = undefined;
    vi.restoreAllMocks();
  });

  it('rejects invalid quotesToReturn', async () => {
    await expect(
      apiGetQuote(
        {
          paymentPlatforms: ['wise'],
          fiatCurrency: 'USD',
          user: '0xuser',
          recipient: '0xrecip',
          destinationChainId: 8453,
          destinationToken: '0xusdc',
          amount: '100',
          quotesToReturn: 0,
        },
        'https://api.example'
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('uses exact-token endpoint when isExactFiat=false', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify({ message: 'ok', success: true, responseObject: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    (globalThis as any).fetch = fetchMock;

    await apiGetQuote(
      {
        paymentPlatforms: ['wise'],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecip',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        amount: '1',
        isExactFiat: false,
      },
      'https://api.example'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('/quote/exact-token');
  });
});

