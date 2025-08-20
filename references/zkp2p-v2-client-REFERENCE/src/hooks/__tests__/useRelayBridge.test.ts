// Mock modules must be hoisted
const mockWallet = {
  address: '0xwallet',
  chainId: 1,
  walletClientType: 'privy',
  getEthereumProvider: vi.fn().mockResolvedValue({}),
};

const mockWalletClient = { address: '0xwallet' };

vi.mock('wagmi', () => ({
  useWalletClient: vi.fn(),
  usePublicClient: vi.fn(() => ({
    getBlock: vi.fn().mockResolvedValue({
      baseFeePerGas: BigInt(1000000000) // 1 gwei
    })
  })),
}));

// Mock Privy hooks
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(() => ({
    user: { wallet: { address: '0xwallet' } },
    authenticated: true,
  })),
  useWallets: vi.fn(() => ({
    wallets: [mockWallet],
  })),
}));

// Mock viem
vi.mock('viem', () => ({
  createWalletClient: vi.fn(() => mockWalletClient),
  custom: vi.fn(() => ({})),
}));

// Mock Relay SDK
vi.mock('@reservoir0x/relay-sdk', () => ({
  getClient: vi.fn(),
  Execute: {} as any,
  GetPriceParameters: {} as any,
  GetQuoteParameters: {} as any,
  ProgressData: {} as any,
}));

// Mock gas helper functions
vi.mock('@helpers/gas', () => ({
  getDynamicGasPricing: vi.fn().mockResolvedValue({
    priority: BigInt(1000000000), // 1 gwei
    max: BigInt(2000000000), // 2 gwei
    baseFee: BigInt(1000000000),
    isCongested: false
  }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Execute, GetPriceParameters, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk';

import { useWalletClient } from 'wagmi';
import { getClient } from '@reservoir0x/relay-sdk';
import { createWalletClient } from 'viem';
import useRelayBridge, { ParsedQuoteData, parseExecuteQuoteResponse } from '../bridge/useRelayBridge';

describe('useRelayBridge', () => {
  const mockWalletClient = { address: '0xwallet' };
  const mockClient = {
    actions: {
      getPrice: vi.fn(),
      getQuote: vi.fn(),
      execute: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as any);
    vi.mocked(getClient).mockReturnValue(mockClient as any);
    // Mock createWalletClient to return immediately
    vi.mocked(createWalletClient).mockReturnValue(mockWalletClient as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('parseExecuteQuoteResponse', () => {
    it('should parse quote response correctly', () => {
      const mockQuoteRes: Execute = {
        details: {
          currencyIn: {
            amountFormatted: '100.00',
            amountUsd: '100.00',
          },
          currencyOut: {
            amountFormatted: '0.025',
            amountUsd: '95.50',
          },
          recipient: '0xrecipient',
          timeEstimate: 120,
        },
        fees: {
          gas: { amountUsd: '2.50' },
          app: { amountUsd: '1.00' },
          relayer: { amountUsd: '0.50' },
        },
      } as any;

      const result = parseExecuteQuoteResponse(mockQuoteRes, '0xETH');

      expect(result).toEqual({
        token: '0xETH',
        inAmountUsdcFormatted: '100.00',
        outAmountFormatted: '0.025',
        outAmountInUsd: '95.50',
        recipientAddress: '0xrecipient',
        totalGasFeesInUsd: '2.50',
        zkp2pFeeInUsd: '1.00',
        relayerFeeInUsd: '0.50',
        serviceTimeSeconds: 120,
        totalFeesInUsd: undefined, // Note: totalFeesInUsd is not calculated in the function
      });
    });

    it('should handle missing optional fields', () => {
      const mockQuoteRes: Execute = {
        details: {
          currencyIn: {
            amountFormatted: '50.00',
          },
          currencyOut: {
            amountFormatted: '0.012',
            amountUsd: '48.00',
          },
        },
        fees: {},
      } as any;

      const result = parseExecuteQuoteResponse(mockQuoteRes, '0xMATIC');

      expect(result).toEqual({
        token: '0xMATIC',
        inAmountUsdcFormatted: '50.00',
        outAmountFormatted: '0.012',
        outAmountInUsd: '48.00',
        recipientAddress: '',
        totalGasFeesInUsd: '0',
        zkp2pFeeInUsd: '0',
        relayerFeeInUsd: '0',
        serviceTimeSeconds: 0,
        totalFeesInUsd: undefined,
      });
    });
  });

  describe('getRelayPrice', () => {
    it('should fetch price successfully', async () => {
      const mockPriceParams: GetPriceParameters = {
        user: '0xuser',
        recipient: '0xrecipient',
        originChainId: 8453, // Base
        destinationChainId: 137, // Polygon
        amount: '100000000', // 100 USDC
        originCurrency: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        destinationCurrency: '0x0000000000000000000000000000000000000000', // Native token
        tradeType: 'EXACT_INPUT',
      };

      const mockPriceResponse = {
        price: '0.025',
        priceUsd: '95.00',
        fees: { total: '3.50' },
      };

      mockClient.actions.getPrice.mockResolvedValueOnce(mockPriceResponse);

      const { result } = renderHook(() => useRelayBridge());

      const price = await act(async () => {
        return await result.current.getRelayPrice(mockPriceParams);
      });

      expect(price).toEqual(mockPriceResponse);
      expect(mockClient.actions.getPrice).toHaveBeenCalledWith({
        ...mockPriceParams,
        options: {
          appFees: [{
            recipient: '0x0bC26FF515411396DD588Abd6Ef6846E04470227',
            fee: '0',
          }],
        },
      });
    });

    it('should throw "No routes found" error to trigger fallback', async () => {
      const mockPriceParams: GetPriceParameters = {
        user: '0xuser',
        recipient: '0xrecipient',
        originChainId: 8453,
        destinationChainId: 1,
        amount: '100000000',
        originCurrency: '0xusdc',
        destinationCurrency: '0xrandom',
        tradeType: 'EXACT_INPUT',
      };

      const noRoutesError = new Error('No routes found');
      mockClient.actions.getPrice.mockRejectedValueOnce(noRoutesError);

      const { result } = renderHook(() => useRelayBridge());

      await expect(async () => {
        await act(async () => {
          await result.current.getRelayPrice(mockPriceParams);
        });
      }).rejects.toThrow('No routes found');
    });

    it('should throw other errors', async () => {
      const mockPriceParams: GetPriceParameters = {
        user: '0xuser',
        recipient: '0xrecipient',
        originChainId: 8453,
        destinationChainId: 137,
        amount: '100000000',
        originCurrency: '0xusdc',
        destinationCurrency: '0xmatic',
        tradeType: 'EXACT_INPUT',
      };

      const networkError = new Error('Network error');
      mockClient.actions.getPrice.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useRelayBridge());

      await expect(async () => {
        await act(async () => {
          await result.current.getRelayPrice(mockPriceParams);
        });
      }).rejects.toThrow('Network error');
    });

  });

  describe('getRelayQuote', () => {
    it('should fetch quote successfully', async () => {
      const mockQuoteParams: GetQuoteParameters = {
        chainId: 8453,
        toChainId: 137,
        amount: '100000000',
        currency: '0xusdc',
        toCurrency: '0x0000000000000000000000000000000000000000',
        tradeType: 'EXACT_INPUT',
        recipient: '0xrecipient',
      };

      const mockQuoteResponse = {
        quote: '0.025',
        details: {
          currencyOut: { amountFormatted: '0.025' },
        },
        steps: [],
      };

      mockClient.actions.getQuote.mockResolvedValueOnce(mockQuoteResponse);

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const quote = await act(async () => {
        return await result.current.getRelayQuote(mockQuoteParams);
      });

      expect(quote).toEqual(mockQuoteResponse);
      expect(mockClient.actions.getQuote).toHaveBeenCalledWith({
        wallet: { address: '0xwallet' },
        ...mockQuoteParams,
        options: {
          referrer: 'zkp2p.xyz',
          userOperationGasOverhead: 300000,
          appFees: [{
            recipient: '0x0bC26FF515411396DD588Abd6Ef6846E04470227',
            fee: '0',
          }],
        },
      });
    });

    it('should handle quote errors', async () => {
      const mockQuoteParams: GetQuoteParameters = {
        chainId: 8453,
        toChainId: 137,
        amount: '100000000',
        currency: '0xusdc',
        toCurrency: '0xmatic',
        tradeType: 'EXACT_INPUT',
        recipient: '0xrecipient',
      };

      const quoteError = new Error('Insufficient liquidity');
      mockClient.actions.getQuote.mockRejectedValueOnce(quoteError);

      const { result } = renderHook(() => useRelayBridge());

      await expect(async () => {
        await act(async () => {
          await result.current.getRelayQuote(mockQuoteParams);
        });
      }).rejects.toThrow('Insufficient liquidity');
    });
  });

  describe('executeRelayQuote', () => {
    it('should execute quote successfully with gas adjustments', async () => {
      const mockQuote: Execute = {
        steps: [
          {
            items: [
              {
                data: {
                  maxPriorityFeePerGas: '500000000', // 0.5 gwei - too low
                  maxFeePerGas: '1000000000', // 1 gwei - too low
                },
              },
            ],
          },
        ],
      } as any;

      const onProgress = vi.fn();
      const mockExecuteResponse = { hash: '0xtxhash' };

      mockClient.actions.execute.mockResolvedValueOnce(mockExecuteResponse);

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const executeResult = await act(async () => {
        return await result.current.executeRelayQuote(mockQuote, onProgress);
      });

      expect(executeResult).toEqual(mockExecuteResponse);
      
      // Check gas was adjusted (using fallback values: 2 gwei priority, 4 gwei max)
      const executedQuote = mockClient.actions.execute.mock.calls[0][0].quote;
      expect(executedQuote.steps[0].items[0].data.maxPriorityFeePerGas).toBe('2000000000');
      expect(executedQuote.steps[0].items[0].data.maxFeePerGas).toBe('4000000000');
    });

    it('should not adjust gas fees if already sufficient', async () => {
      const mockQuote: Execute = {
        steps: [
          {
            items: [
              {
                data: {
                  maxPriorityFeePerGas: '2000000000', // 2 gwei - sufficient
                  maxFeePerGas: '3000000000', // 3 gwei - sufficient
                },
              },
            ],
          },
        ],
      } as any;

      mockClient.actions.execute.mockResolvedValueOnce({ hash: '0xtxhash' });

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.executeRelayQuote(mockQuote);
      });

      const executedQuote = mockClient.actions.execute.mock.calls[0][0].quote;
      expect(executedQuote.steps[0].items[0].data.maxPriorityFeePerGas).toBe('2000000000'); // unchanged, meets minimum
      expect(executedQuote.steps[0].items[0].data.maxFeePerGas).toBe('4000000000'); // adjusted to meet minimum
    });

    it('should handle progress callbacks', async () => {
      const mockQuote: Execute = { steps: [] } as any;
      const onProgress = vi.fn();
      const mockProgressData: ProgressData = {
        currentStep: 1,
        totalSteps: 3,
        stepProgress: 50,
      } as any;

      mockClient.actions.execute.mockImplementation(({ onProgress: executeOnProgress }) => {
        // Simulate progress callback
        executeOnProgress?.(mockProgressData);
        return Promise.resolve({ hash: '0xtxhash' });
      });

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.executeRelayQuote(mockQuote, onProgress);
      });

      expect(onProgress).toHaveBeenCalledWith(mockProgressData);
    });

    it('should handle execution errors', async () => {
      const mockQuote: Execute = { steps: [] } as any;
      const executionError = new Error('User rejected transaction');

      mockClient.actions.execute.mockRejectedValueOnce(executionError);

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await expect(async () => {
        await act(async () => {
          await result.current.executeRelayQuote(mockQuote);
        });
      }).rejects.toThrow('User rejected transaction');
    });

  });


  describe('edge cases', () => {
    it('should handle BigInt conversion for gas fees', async () => {
      const mockQuote: Execute = {
        steps: [
          {
            items: [
              {
                data: {
                  maxPriorityFeePerGas: '0', // Edge case: zero gas
                  maxFeePerGas: undefined, // Edge case: undefined
                },
              },
            ],
          },
        ],
      } as any;

      mockClient.actions.execute.mockResolvedValueOnce({ hash: '0xtxhash' });

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.executeRelayQuote(mockQuote);
      });

      const executedQuote = mockClient.actions.execute.mock.calls[0][0].quote;
      expect(executedQuote.steps[0].items[0].data.maxPriorityFeePerGas).toBe('2000000000'); // fallback minimum
      expect(executedQuote.steps[0].items[0].data.maxFeePerGas).toBe('4000000000'); // fallback minimum
    });

    it('should use dynamic gas pricing when available', async () => {
      // Mock higher gas pricing for congested network
      const { getDynamicGasPricing } = await import('@helpers/gas');
      (getDynamicGasPricing as any).mockResolvedValueOnce({
        priority: BigInt(3000000000), // 3 gwei - higher due to congestion
        max: BigInt(6000000000), // 6 gwei - higher due to congestion
        baseFee: BigInt(2500000000),
        isCongested: true
      });

      const mockQuote: Execute = {
        steps: [
          {
            items: [
              {
                data: {
                  maxPriorityFeePerGas: '1000000000', // 1 gwei - lower than dynamic pricing
                  maxFeePerGas: '2000000000', // 2 gwei - lower than dynamic pricing
                },
              },
            ],
          },
        ],
      } as any;

      mockClient.actions.execute.mockResolvedValueOnce({ hash: '0xtxhash' });

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.executeRelayQuote(mockQuote);
      });

      const executedQuote = mockClient.actions.execute.mock.calls[0][0].quote;
      // Should use the higher dynamic pricing values
      expect(executedQuote.steps[0].items[0].data.maxPriorityFeePerGas).toBe('3000000000');
      expect(executedQuote.steps[0].items[0].data.maxFeePerGas).toBe('6000000000');
    });

    it('should handle dynamic gas pricing failure gracefully', async () => {
      // Mock dynamic gas pricing failure
      const { getDynamicGasPricing } = await import('@helpers/gas');
      (getDynamicGasPricing as any).mockRejectedValueOnce(new Error('Network error'));

      const mockQuote: Execute = {
        steps: [
          {
            items: [
              {
                data: {
                  maxPriorityFeePerGas: '500000000', // 0.5 gwei - low
                  maxFeePerGas: '1000000000', // 1 gwei - low
                },
              },
            ],
          },
        ],
      } as any;

      mockClient.actions.execute.mockResolvedValueOnce({ hash: '0xtxhash' });

      const { result } = renderHook(() => useRelayBridge());

      // Wait a bit for the wallet client to be initialized
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.executeRelayQuote(mockQuote);
      });

      const executedQuote = mockClient.actions.execute.mock.calls[0][0].quote;
      // Should use fallback values (2 gwei priority, 4 gwei max)
      expect(executedQuote.steps[0].items[0].data.maxPriorityFeePerGas).toBe('2000000000');
      expect(executedQuote.steps[0].items[0].data.maxFeePerGas).toBe('4000000000');
    });

  });
});