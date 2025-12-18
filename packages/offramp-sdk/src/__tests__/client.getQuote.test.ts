import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';
import * as api from '../adapters/api';

// Mock the API functions
vi.mock('../adapters/api');

describe('Zkp2pClient.getQuote', () => {
  let client: Zkp2pClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup wallet client with a test private key
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    // Create client with API key
    client = new Zkp2pClient({
      walletClient,
      apiKey: mockApiKey,
      chainId: 8453,
    });
  });

  it('should call apiGetQuote with apiKey and authorizationToken', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [],
        fees: { zkp2pFee: '0.01', zkp2pFeeFormatted: '0.01 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };

    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse);

    await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '100',
    });

    // Verify apiGetQuote was called with apiKey (4th arg) and authToken (5th arg)
    expect(api.apiGetQuote).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(Number),
      mockApiKey,        // apiKey should be passed
      undefined          // no authorizationToken in this client
    );
  });

  it('should extract maker.depositData into payeeData', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [
          {
            fiatAmount: '100',
            fiatAmountFormatted: '$100.00',
            tokenAmount: '100000000',
            tokenAmountFormatted: '100.00',
            paymentMethod: 'Venmo',
            payeeAddress: '0x123',
            conversionRate: '1.00',
            intent: {
              depositId: 'deposit-1',
              processorName: 'venmo',
              amount: '100000000',
              toAddress: '0x123',
              payeeDetails: 'hashed-id-1',
              processorIntentData: {},
              fiatCurrencyCode: 'USD',
              chainId: '8453',
            },
            // /v2/quote returns maker object with depositData when authenticated
            maker: {
              processorName: 'venmo',
              depositData: {
                venmoUsername: '@alice-venmo',
                email: 'alice@example.com',
              },
              hashedOnchainId: 'hashed-id-1',
              isBusiness: false,
            },
          },
        ],
        fees: { zkp2pFee: '0.01', zkp2pFeeFormatted: '0.01 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };

    // Mock API response
    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse);

    // Call getQuote
    const result = await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '100',
    });

    // Verify apiGetQuote was called
    expect(api.apiGetQuote).toHaveBeenCalledTimes(1);

    // Verify maker.depositData was extracted into payeeData
    expect(result.responseObject.quotes[0]?.payeeData).toEqual({
      venmoUsername: '@alice-venmo',
      email: 'alice@example.com',
    });
  });

  it('should handle quotes without maker data (unauthenticated)', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [
          {
            fiatAmount: '100',
            fiatAmountFormatted: '$100.00',
            tokenAmount: '100000000',
            tokenAmountFormatted: '100.00',
            paymentMethod: 'Venmo',
            payeeAddress: '0x123',
            conversionRate: '1.00',
            intent: {
              depositId: 'deposit-1',
              processorName: 'venmo',
              amount: '100000000',
              toAddress: '0x123',
              payeeDetails: 'hashed-id-1',
              processorIntentData: {},
              fiatCurrencyCode: 'USD',
              chainId: '8453',
            },
            // No maker object when unauthenticated
          },
        ],
        fees: { zkp2pFee: '0.01', zkp2pFeeFormatted: '0.01 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };

    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse);

    const result = await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '100',
    });

    // payeeData should be undefined when maker is not present
    expect(result.responseObject.quotes[0]?.payeeData).toBeUndefined();
  });

  it('should handle empty quotes array', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [],
        fees: { zkp2pFee: '0.00', zkp2pFeeFormatted: '0.00 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };

    // Mock API response
    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse);

    // Call getQuote
    const result = await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '100',
    });

    // Verify response is returned
    expect(result.responseObject.quotes).toEqual([]);
  });

  it('defaults escrowAddresses to native escrow when not provided', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [],
        fees: { zkp2pFee: '0.00', zkp2pFeeFormatted: '0.00 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };
    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse as any);

    await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '50',
    });

    expect(api.apiGetQuote).toHaveBeenCalledTimes(1);
    const forwarded = vi.mocked(api.apiGetQuote).mock.calls[0]?.[0] as any;
    expect(Array.isArray(forwarded.escrowAddresses)).toBe(true);
    expect(forwarded.escrowAddresses?.length).toBe(1);
    expect(forwarded.escrowAddress).toBeUndefined();
  });

  it('preserves caller-provided escrowAddresses (no clobber)', async () => {
    const mockQuoteResponse = {
      success: true,
      message: 'Success',
      responseObject: {
        fiat: { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', countryCode: 'US' },
        token: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
        quotes: [],
        fees: { zkp2pFee: '0.00', zkp2pFeeFormatted: '0.00 USDC', swapFee: '0', swapFeeFormatted: '0 USDC' },
      },
      statusCode: 200,
    };
    vi.mocked(api.apiGetQuote).mockResolvedValue(mockQuoteResponse as any);

    const customEscrows = ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'];
    await client.getQuote({
      paymentPlatforms: ['venmo'],
      fiatCurrency: 'USD',
      user: '0x123',
      recipient: '0x456',
      destinationChainId: 8453,
      destinationToken: 'USDC',
      amount: '50',
      escrowAddresses: customEscrows,
    } as any);

    expect(api.apiGetQuote).toHaveBeenCalledTimes(1);
    const forwarded = vi.mocked(api.apiGetQuote).mock.calls[0]?.[0] as any;
    expect(forwarded.escrowAddresses).toEqual(customEscrows);
  });

  it('handles API errors gracefully', async () => {
    const mockError = new Error('API request failed');
    vi.mocked(api.apiGetQuote).mockRejectedValue(mockError);

    await expect(
      client.getQuote({
        paymentPlatforms: ['venmo'],
        fiatCurrency: 'USD',
        user: '0x123',
        recipient: '0x456',
        destinationChainId: 8453,
        destinationToken: 'USDC',
        amount: '100',
      })
    ).rejects.toThrow('API request failed');
  });
});
