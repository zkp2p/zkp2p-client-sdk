import { apiGetQuote } from '../adapters/api';
import type { QuoteRequest } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('apiGetQuote', () => {
  const mockBaseUrl = 'https://api.example.com';
  const mockResponse = {
    success: true,
    message: 'Success',
    responseObject: {
      fiat: { currencyCode: 'USD' },
      token: { symbol: 'USDC' },
      quotes: [
        { tokenAmount: '1000000', fiatAmount: '1.00' },
        { tokenAmount: '2000000', fiatAmount: '2.00' },
        { tokenAmount: '3000000', fiatAmount: '3.00' },
      ],
      fees: { zkp2pFee: '0.01' },
    },
    statusCode: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  it('should pass quotesToReturn as query parameter for exact fiat', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '100',
      quotesToReturn: 3,
    };

    await apiGetQuote(request, mockBaseUrl);

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/quote/exact-fiat?quotesToReturn=3`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"exactFiatAmount":"100"'),
      })
    );

    // Verify quotesToReturn is not in the body
    const bodyStr = (global.fetch as jest.Mock).mock.calls[0][1].body;
    expect(bodyStr).not.toContain('"quotesToReturn"');
  });

  it('should pass quotesToReturn as query parameter for exact token', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '1000000',
      isExactFiat: false,
      quotesToReturn: 2,
    };

    await apiGetQuote(request, mockBaseUrl);

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/quote/exact-token?quotesToReturn=2`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"exactTokenAmount":"1000000"'),
      })
    );
  });

  it('should not include query parameter when quotesToReturn is not provided', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '100',
    };

    await apiGetQuote(request, mockBaseUrl);

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/quote/exact-fiat`,
      expect.any(Object)
    );
  });

  it('should pass quotesToReturn and trust API to handle limiting', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '100',
      quotesToReturn: 2,
    };

    await apiGetQuote(request, mockBaseUrl);

    // Simply verify the parameter was passed correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('?quotesToReturn=2'),
      expect.any(Object)
    );
  });

  it('should validate quotesToReturn parameter', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '100',
      quotesToReturn: 0, // Invalid
    };

    await expect(apiGetQuote(request, mockBaseUrl)).rejects.toThrow(
      'quotesToReturn must be a positive integer'
    );
  });

  it('should default isExactFiat to true', async () => {
    const request: QuoteRequest = {
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 1,
      destinationToken: '0xUSDC',
      amount: '100',
    };

    await apiGetQuote(request, mockBaseUrl);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/quote/exact-fiat'),
      expect.any(Object)
    );
  });
});
