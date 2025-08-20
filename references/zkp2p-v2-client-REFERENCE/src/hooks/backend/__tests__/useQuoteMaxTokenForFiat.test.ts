// Mock modules must be hoisted
vi.mock('lodash/debounce', () => ({
  default: vi.fn((fn: any) => {
    // Return the function directly without debouncing for tests
    const mockDebounced = (...args: any[]) => fn(...args);
    // Add cancel method that debounce provides
    mockDebounced.cancel = vi.fn();
    mockDebounced.flush = vi.fn();
    return mockDebounced;
  }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import React from 'react';

import useQuoteMaxTokenForExactFiat from '../useQuoteMaxTokenForFiat';
import { QuoteMaxTokenForFiatRequest, QuoteResponse } from '@helpers/types/curator';
import { PaymentPlatform } from '@helpers/types';

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock fetch
global.fetch = vi.fn();

describe('useQuoteMaxTokenForFiat', () => {
  const mockApiUrl = 'https://api.test.com';
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.stubEnv('VITE_CURATOR_API_URL', mockApiUrl);
    (global.fetch as any).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('successful quote fetching', () => {
    it('should fetch quote successfully with default quotesToReturn', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
        exactFiatAmount: '100.00', // $100
      };
      
      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'USD',
            currencyName: 'US Dollar',
            currencySymbol: '$',
            countryCode: 'US'
          },
          token: {
            token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [
            {
              fiatAmount: '100.00',
              fiatAmountFormatted: '$100.00',
              tokenAmount: '95238095',
              tokenAmountFormatted: '95.24',
              paymentMethod: 'venmo',
              payeeAddress: '@venmo-user1',
              conversionRate: '1.05',
              intent: {
                depositId: '1',
                processorName: 'venmo',
                amount: '95238095',
                toAddress: '0xrecipient',
                payeeDetails: '@venmo-user1',
                processorIntentData: {},
                fiatCurrencyCode: 'USD',
                chainId: '8453'
              }
            },
            {
              fiatAmount: '100.00',
              fiatAmountFormatted: '$100.00',
              tokenAmount: '94339622',
              tokenAmountFormatted: '94.34',
              paymentMethod: 'venmo',
              payeeAddress: '@venmo-user2',
              conversionRate: '1.06',
              intent: {
                depositId: '2',
                processorName: 'venmo',
                amount: '94339622',
                toAddress: '0xrecipient',
                payeeDetails: '@venmo-user2',
                processorIntentData: {},
                fiatCurrencyCode: 'USD',
                chainId: '8453'
              }
            }
          ],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();

      // Ensure fetchQuote is available
      expect(result.current.fetchQuote).toBeDefined();
      expect(typeof result.current.fetchQuote).toBe('function');

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/v1/quote/exact-fiat?quotesToReturn=5`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRequest),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.responseObject.quotes).toHaveLength(2);
    });

    it('should fetch quote with custom quotesToReturn parameter', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.REVOLUT],
        fiatCurrency: 'EUR',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '50.00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Success',
          success: true,
          statusCode: 200,
          responseObject: {
            fiat: {
              currencyCode: 'EUR',
              currencyName: 'Euro',
              currencySymbol: '€',
              countryCode: 'EU'
            },
            token: {
              token: '0xusdc',
              decimals: 6,
              name: 'USD Coin',
              symbol: 'USDC',
              chainId: 8453
            },
            quotes: [],
            fees: {
              zkp2pFee: '0',
              zkp2pFeeFormatted: '0',
              swapFee: '0',
              swapFeeFormatted: '0'
            }
          }
        }),
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest, 10);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/v1/quote/exact-fiat?quotesToReturn=10`,
        expect.any(Object)
      );
    });

    it('should handle empty quotes response', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.WISE],
        fiatCurrency: 'GBP',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '1000.00',
      };

      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'GBP',
            currencyName: 'British Pound',
            currencySymbol: '£',
            countryCode: 'GB'
          },
          token: {
            token: '0xusdc',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.responseObject.quotes).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(networkError);
      expect(result.current.data).toBeNull();
    });

    it('should handle API error responses', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid fiat amount',
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch: Bad Request');
    });

    it('should handle 404 not found errors', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xunknown',
        exactFiatAmount: '100.00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'No quotes available',
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.error?.message).toBe('Failed to fetch: Not Found');
    });

    it('should handle malformed JSON responses', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.error?.message).toContain('Invalid JSON');
    });
  });

  describe('loading states', () => {
    it('should manage loading state correctly', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'USD',
            currencyName: 'US Dollar',
            currencySymbol: '$',
            countryCode: 'US'
          },
          token: {
            token: '0xusdc',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      // Start the fetch
      act(() => {
        result.current.fetchQuote(mockRequest);
      });

      // The loading state is set synchronously, but due to debounce it may not be immediate
      // We need to wait for the state update
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockResponse);
      });
    });
  });

  describe('edge cases', () => {
    it('hook should initialize properly', () => {
      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current).not.toBeNull();
      expect(result.current.fetchQuote).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('should handle very small fiat amounts', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '0.01', // 1 cent
      };

      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'USD',
            currencyName: 'US Dollar',
            currencySymbol: '$',
            countryCode: 'US'
          },
          token: {
            token: '0xusdc',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [{
            fiatAmount: '0.01',
            fiatAmountFormatted: '$0.01',
            tokenAmount: '9524',
            tokenAmountFormatted: '0.0095',
            paymentMethod: 'venmo',
            payeeAddress: '@user',
            conversionRate: '1.05',
            intent: {
              depositId: '1',
              processorName: 'venmo',
              amount: '9524',
              toAddress: '0xrecipient',
              payeeDetails: '@user',
              processorIntentData: {},
              fiatCurrencyCode: 'USD',
              chainId: '8453'
            }
          }],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle very large fiat amounts', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '999999.99', // Nearly $1M
      };

      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'USD',
            currencyName: 'US Dollar',
            currencySymbol: '$',
            countryCode: 'US'
          },
          token: {
            token: '0xusdc',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [{
            fiatAmount: '999999.99',
            fiatAmountFormatted: '$999,999.99',
            tokenAmount: '952380942857',
            tokenAmountFormatted: '952,380.94',
            paymentMethod: 'venmo',
            payeeAddress: '@whale',
            conversionRate: '1.05',
            intent: {
              depositId: '1',
              processorName: 'venmo',
              amount: '952380942857',
              toAddress: '0xrecipient',
              payeeDetails: '@whale',
              processorIntentData: {},
              fiatCurrencyCode: 'USD',
              chainId: '8453'
            }
          }],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      expect(result.current.fetchQuote).toBeDefined();

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should reset error state on successful fetch', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      expect(result.current.fetchQuote).toBeDefined();

      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.error).toBeTruthy();

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Success',
          success: true,
          statusCode: 200,
          responseObject: {
            fiat: {
              currencyCode: 'USD',
              currencyName: 'US Dollar',
              currencySymbol: '$',
              countryCode: 'US'
            },
            token: {
              token: '0xusdc',
              decimals: 6,
              name: 'USD Coin',
              symbol: 'USDC',
              chainId: 8453
            },
            quotes: [],
            fees: {
              zkp2pFee: '0',
              zkp2pFeeFormatted: '0',
              swapFee: '0',
              swapFeeFormatted: '0'
            }
          }
        }),
      });

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle quotes with negative conversion rates', async () => {
      const mockRequest: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      const mockResponse: QuoteResponse = {
        message: 'Success',
        success: true,
        statusCode: 200,
        responseObject: {
          fiat: {
            currencyCode: 'USD',
            currencyName: 'US Dollar',
            currencySymbol: '$',
            countryCode: 'US'
          },
          token: {
            token: '0xusdc',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            chainId: 8453
          },
          quotes: [{
            fiatAmount: '100.00',
            fiatAmountFormatted: '$100.00',
            tokenAmount: '105000000',
            tokenAmountFormatted: '105.00',
            paymentMethod: 'venmo',
            payeeAddress: '@user',
            conversionRate: '-0.05',
            intent: {
              depositId: '1',
              processorName: 'venmo',
              amount: '105000000',
              toAddress: '0xrecipient',
              payeeDetails: '@user',
              processorIntentData: {},
              fiatCurrencyCode: 'USD',
              chainId: '8453'
            }
          }],
          fees: {
            zkp2pFee: '0',
            zkp2pFeeFormatted: '0',
            swapFee: '0',
            swapFeeFormatted: '0'
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      expect(result.current.fetchQuote).toBeDefined();

      await act(async () => {
        result.current.fetchQuote(mockRequest);
      });

      // Should still return the data, validation happens elsewhere
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockRequest1: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.VENMO],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '100.00',
      };

      const mockRequest2: QuoteMaxTokenForFiatRequest = {
        paymentPlatforms: [PaymentPlatform.REVOLUT],
        fiatCurrency: 'EUR',
        user: '0xuser',
        recipient: '0xrecipient',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        exactFiatAmount: '200.00',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Success',
            success: true,
            statusCode: 200,
            responseObject: {
              fiat: {
                currencyCode: 'USD',
                currencyName: 'US Dollar',
                currencySymbol: '$',
                countryCode: 'US'
              },
              token: {
                token: '0xusdc',
                decimals: 6,
                name: 'USD Coin',
                symbol: 'USDC',
                chainId: 8453
              },
              quotes: [{
                fiatAmount: '100.00',
                fiatAmountFormatted: '$100.00',
                tokenAmount: '95238095',
                tokenAmountFormatted: '95.24',
                paymentMethod: 'venmo',
                payeeAddress: '@user1',
                conversionRate: '1.05',
                intent: {
                  depositId: '1',
                  processorName: 'venmo',
                  amount: '95238095',
                  toAddress: '0xrecipient',
                  payeeDetails: '@user1',
                  processorIntentData: {},
                  fiatCurrencyCode: 'USD',
                  chainId: '8453'
                }
              }],
              fees: {
                zkp2pFee: '0',
                zkp2pFeeFormatted: '0',
                swapFee: '0',
                swapFeeFormatted: '0'
              }
            }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Success',
            success: true,
            statusCode: 200,
            responseObject: {
              fiat: {
                currencyCode: 'EUR',
                currencyName: 'Euro',
                currencySymbol: '€',
                countryCode: 'EU'
              },
              token: {
                token: '0xusdc',
                decimals: 6,
                name: 'USD Coin',
                symbol: 'USDC',
                chainId: 8453
              },
              quotes: [{
                fiatAmount: '200.00',
                fiatAmountFormatted: '€200.00',
                tokenAmount: '188679245',
                tokenAmountFormatted: '188.68',
                paymentMethod: 'revolut',
                payeeAddress: '@user2',
                conversionRate: '1.06',
                intent: {
                  depositId: '2',
                  processorName: 'revolut',
                  amount: '188679245',
                  toAddress: '0xrecipient',
                  payeeDetails: '@user2',
                  processorIntentData: {},
                  fiatCurrencyCode: 'EUR',
                  chainId: '8453'
                }
              }],
              fees: {
                zkp2pFee: '0',
                zkp2pFeeFormatted: '0',
                swapFee: '0',
                swapFeeFormatted: '0'
              }
            }
          }),
        });

      const { result } = renderHook(() => useQuoteMaxTokenForExactFiat(), { wrapper });

      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      expect(result.current.fetchQuote).toBeDefined();

      // Start both requests
      const promise1 = act(async () => {
        result.current.fetchQuote(mockRequest1);
      });

      const promise2 = act(async () => {
        result.current.fetchQuote(mockRequest2);
      });

      await Promise.all([promise1, promise2]);

      // Should have data from the last request
      expect(result.current.data?.responseObject.quotes[0].intent.depositId).toBe('2');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

});