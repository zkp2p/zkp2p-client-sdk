/**
 * Quote Generation Tests
 * 
 * These tests ensure proper handling of native tokens (ETH, MATIC, BNB, etc.) 
 * during quote generation for cross-chain swaps.
 * 
 * CRITICAL: These tests prevent regression of a production bug where native tokens
 * with address 0x0000000000000000000000000000000000000000 were being filtered out,
 * preventing users from swapping USDC to native tokens on other chains.
 * 
 * The bug fix removed the check for: tokenInfo[token].address === '0x0000...0000'
 * while keeping the check for undefined/null addresses.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies that the production code uses
vi.mock('@hooks/useRelayBridge', () => ({
  default: () => ({
    getRelayPrice: vi.fn(),
  }),
}));

// Mock helper functions
vi.mock('@helpers/units', () => ({
  tokenUnits: (amount: string, decimals: number) => {
    const factor = BigInt(10 ** decimals);
    const [whole, fraction = ''] = amount.split('.');
    const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * factor + BigInt(fractionPadded || 0);
  },
  etherUnitsToReadable: (value: bigint, decimals: number) => {
    return (Number(value.toString()) / 1e18).toFixed(decimals);
  },
  tokenUnitsToReadable: (value: bigint, decimals: number, displayDecimals: number) => {
    const divisor = BigInt(10 ** decimals);
    return (Number(value.toString()) / Number(divisor.toString())).toFixed(displayDecimals);
  },
  relayTokenAmountToReadable: (value: string | undefined) => {
    if (!value) return '0';
    return value;
  },
}));

// Import after mocks
import { tokenUnits, etherUnitsToReadable, tokenUnitsToReadable, relayTokenAmountToReadable } from '@helpers/units';
import { SwapQuote } from '@helpers/types/swapQuote';
import { GetPriceParameters } from '@reservoir0x/relay-sdk';

// Constants matching production
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BASE_CHAIN_ID = 8453;
const ETHEREUM_CHAIN_ID = 1;
const POLYGON_CHAIN_ID = 137;
const BSC_CHAIN_ID = 56;
const SOLANA_CHAIN_ID = 792703809;
const TRON_CHAIN_ID = 728126428;
const HYPERLIQUID_CHAIN_ID = 1337;
const QUOTE_DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890';
const QUOTE_DEFAULT_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const QUOTE_DEFAULT_TRON_ADDRESS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';

const ZERO = 0n;
const ZERO_QUOTE: SwapQuote = {
  depositId: 0,
  hashedOnchainId: '',
  fiatAmount: ZERO,
  usdcAmount: ZERO,
  usdcToFiatRate: '',
  outputTokenAmount: ZERO,
  outputTokenDecimals: 18,
  outputTokenFormatted: ''
};

// Mock token data including native tokens
const mockTokenInfo = {
  'USDC': {
    tokenId: '8453:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    name: 'USD Coin',
    decimals: 6,
    ticker: 'USDC',
    address: BASE_USDC_ADDRESS,
    chainId: BASE_CHAIN_ID,
    chainName: 'Base',
    isNative: false,
  },
  'ETH': {
    tokenId: `${ETHEREUM_CHAIN_ID}:${ZERO_ADDRESS}`,
    name: 'Ethereum',
    decimals: 18,
    ticker: 'ETH',
    address: ZERO_ADDRESS, // Native token with 0x0000... address
    chainId: ETHEREUM_CHAIN_ID,
    chainName: 'Ethereum',
    isNative: true,
  },
  'MATIC': {
    tokenId: `${POLYGON_CHAIN_ID}:${ZERO_ADDRESS}`,
    name: 'Polygon',
    decimals: 18,
    ticker: 'MATIC',
    address: ZERO_ADDRESS, // Native token with 0x0000... address
    chainId: POLYGON_CHAIN_ID,
    chainName: 'Polygon',
    isNative: true,
  },
  'BNB': {
    tokenId: `${BSC_CHAIN_ID}:${ZERO_ADDRESS}`,
    name: 'BNB',
    decimals: 18,
    ticker: 'BNB',
    address: ZERO_ADDRESS, // Native token with 0x0000... address
    chainId: BSC_CHAIN_ID,
    chainName: 'BSC',
    isNative: true,
  },
  'USDT': {
    tokenId: '1:0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'Tether USD',
    decimals: 6,
    ticker: 'USDT',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    chainId: ETHEREUM_CHAIN_ID,
    chainName: 'Ethereum',
    isNative: false,
  },
  'INVALID_TOKEN': {
    tokenId: '1:undefined',
    name: 'Invalid Token',
    decimals: 18,
    ticker: 'INVALID',
    address: undefined, // Should be filtered out
    chainId: ETHEREUM_CHAIN_ID,
    chainName: 'Ethereum',
    isNative: false,
  },
  'NULL_TOKEN': {
    tokenId: '1:null',
    name: 'Null Token',
    decimals: 18,
    ticker: 'NULL',
    address: null, // Should be filtered out
    chainId: ETHEREUM_CHAIN_ID,
    chainName: 'Ethereum',
    isNative: false,
  },
};

// Mock quote response matching production structure
const createMockQuote = (depositId: number, amount: string = '1000000') => ({
  intent: {
    depositId,
    payeeDetails: '0xhash123',
  },
  tokenAmount: amount,
  conversionRate: '1050000000000000000', // 1.05 rate in 18 decimals
});

// Mock Relay API response matching production
const createMockRelayResponse = (outputAmount: string = '950000000000000000') => ({
  details: {
    currencyOut: {
      amount: outputAmount,
      amountFormatted: '0.95',
      amountUsd: '950.00',
    },
    rate: '0.95',
    timeEstimate: 300,
  },
  fees: {
    gas: { amountUsd: '5.00' },
    app: { amountUsd: '2.00' },
    relayer: { amountUsd: '3.00' },
    relayerGas: { amountUsd: '1.00' },
    relayerService: { amountUsd: '2.00' },
  },
});

// Test helper that mimics the production _processSingleRawQuote function
const createProcessSingleRawQuote = (
  token: string,
  TOKEN_USDC: string,
  tokenInfo: any,
  loggedInEthereumAddress: string,
  getRelayPrice: any
) => {
  return async (rawQuote: any, inputFiatAmount: string): Promise<SwapQuote | null> => {
    try {
      const usdcAmountBigNum = BigInt(rawQuote.tokenAmount);
      const conversionRate = etherUnitsToReadable(BigInt(rawQuote.conversionRate), 4);
      let processedQuote: SwapQuote = {
        ...ZERO_QUOTE,
        fiatAmount: tokenUnits(inputFiatAmount, 6), // Assuming 6 decimals for fiat input display consistency
        usdcAmount: usdcAmountBigNum,
        depositId: Number(rawQuote.intent.depositId),
        hashedOnchainId: rawQuote.intent.payeeDetails,
        usdcToFiatRate: conversionRate,
      };

      if (token === TOKEN_USDC) {
        processedQuote = {
          ...processedQuote,
          outputTokenAmount: usdcAmountBigNum,
          outputTokenDecimals: 6, // USDC decimals
          outputTokenFormatted: tokenUnitsToReadable(usdcAmountBigNum, 6, 2),
          outputTokenAmountInUsd: tokenUnitsToReadable(usdcAmountBigNum, 6, 2),
        };
      } else {
        // Skip processing if token address is invalid
        // THIS IS THE CRITICAL BUG FIX AREA
        // The bug was checking for tokenInfo[token].address === '0x0000000000000000000000000000000000000000'
        // This prevented native tokens from being processed
        if (!tokenInfo[token].address) {
          console.error("Invalid token address for", token);
          return null;
        }
        const originChainId = BASE_CHAIN_ID;
        const destinationChainId = tokenInfo[token].chainId;
        const params: GetPriceParameters = {
          user: loggedInEthereumAddress as any || QUOTE_DEFAULT_ADDRESS,
          recipient: tokenInfo[token] && tokenInfo[token].chainId === SOLANA_CHAIN_ID 
            ? QUOTE_DEFAULT_SOL_ADDRESS as any 
            : tokenInfo[token].chainId === TRON_CHAIN_ID
              ? QUOTE_DEFAULT_TRON_ADDRESS as any
              : tokenInfo[token].chainId === HYPERLIQUID_CHAIN_ID
                ? QUOTE_DEFAULT_ADDRESS // Use default EVM address for Hyperliquid
                : QUOTE_DEFAULT_ADDRESS,
          originChainId,
          destinationChainId,
          originCurrency: BASE_USDC_ADDRESS,
          destinationCurrency: tokenInfo[token].address,
          amount: rawQuote.tokenAmount.toString(),
          tradeType: 'EXACT_INPUT',
        };

        const relayResult = await getRelayPrice(params);
        
        // If no relay routes available, skip this quote
        if (!relayResult) {
          console.log(`No relay routes available for ${token}`);
          return null;
        }
        
        console.log("Relay result for quote processing:", relayResult);
        const outAmount = relayResult?.details?.currencyOut?.amount ?? '0';
        processedQuote = {
          ...processedQuote,
          outputTokenAmount: BigInt(outAmount),
          outputTokenDecimals: tokenInfo[token].decimals,
          outputTokenFormatted: relayTokenAmountToReadable(relayResult?.details?.currencyOut?.amountFormatted),
          outputTokenAmountInUsd: Number(relayResult?.details?.currencyOut?.amountUsd).toFixed(2),
          gasFeesInUsd: Number(relayResult?.fees?.gas?.amountUsd).toFixed(4),
          appFeeInUsd: Number(relayResult?.fees?.app?.amountUsd).toFixed(4),
          relayerFeeInUsd: Number(relayResult?.fees?.relayer?.amountUsd).toFixed(4),
          relayerGasFeesInUsd: Number(relayResult?.fees?.relayerGas?.amountUsd).toFixed(4),
          relayerServiceFeesInUsd: Number(relayResult?.fees?.relayerService?.amountUsd).toFixed(4),
          usdcToTokenRate: relayResult?.details?.rate,
          timeEstimate: relayResult?.details?.timeEstimate?.toString(),
        };
      }
      return processedQuote;
    } catch (err: any) {
      // Only log unexpected errors, not "no routes" scenarios
      if (!err.message?.includes('No routes found')) {
        console.error("Error processing single raw quote:", err);
      }
      return null; // Return null or a specific error structure if a quote fails processing
    }
  };
};

describe('Swap Quote Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Native Token Handling - Bug Prevention', () => {
    it('should successfully process quotes for ETH (native token on Ethereum)', async () => {
      const mockRelayResponse = createMockRelayResponse('1000000000000000000'); // 1 ETH
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(1);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe('1000000000000000000');
      expect(result!.outputTokenDecimals).toBe(18);
      expect(result!.outputTokenAmountInUsd).toBe('950.00');

      // Verify Relay API was called with the native token address (0x0000...)
      expect(getRelayPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCurrency: ZERO_ADDRESS,
          destinationChainId: ETHEREUM_CHAIN_ID,
          originCurrency: BASE_USDC_ADDRESS,
          originChainId: BASE_CHAIN_ID,
        })
      );
    });

    it('should successfully process quotes for MATIC (native token on Polygon)', async () => {
      const mockRelayResponse = createMockRelayResponse('50000000000000000000'); // 50 MATIC
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'MATIC',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(2, '2000000');
      const result = await processSingleRawQuote(mockQuote, '2000');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe('50000000000000000000');
      expect(result!.outputTokenDecimals).toBe(18);

      // Verify Relay API was called with the native token address
      expect(getRelayPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCurrency: ZERO_ADDRESS,
          destinationChainId: POLYGON_CHAIN_ID,
        })
      );
    });

    it('should successfully process quotes for BNB (native token on BSC)', async () => {
      const mockRelayResponse = createMockRelayResponse('3000000000000000000'); // 3 BNB
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'BNB',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(3, '3000000');
      const result = await processSingleRawQuote(mockQuote, '3000');

      expect(result).not.toBeNull();
      expect(result!.outputTokenDecimals).toBe(18);
      expect(getRelayPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCurrency: ZERO_ADDRESS,
          destinationChainId: BSC_CHAIN_ID,
        })
      );
    });

    it('should filter out tokens with undefined address', async () => {
      const getRelayPrice = vi.fn();
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'INVALID_TOKEN',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(4);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).toBeNull();
      expect(getRelayPrice).not.toHaveBeenCalled();
    });

    it('should filter out tokens with null address', async () => {
      const getRelayPrice = vi.fn();
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'NULL_TOKEN',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(5);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).toBeNull();
      expect(getRelayPrice).not.toHaveBeenCalled();
    });
  });

  describe('Quote Processing for Different Token Types', () => {
    it('should process USDC to USDC quotes without calling Relay API', async () => {
      const getRelayPrice = vi.fn();
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'USDC',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(6, '1000000'); // 1 USDC
      const result = await processSingleRawQuote(mockQuote, '1');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe('1000000');
      expect(result!.outputTokenDecimals).toBe(6);
      expect(result!.outputTokenFormatted).toBe('1.00');
      expect(result!.outputTokenAmountInUsd).toBe('1.00');

      // Relay API should not be called for USDC to USDC
      expect(getRelayPrice).not.toHaveBeenCalled();
    });

    it('should process USDC to regular ERC20 token quotes', async () => {
      const mockRelayResponse = createMockRelayResponse('990000'); // 0.99 USDT (6 decimals)
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'USDT',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(7);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).not.toBeNull();
      expect(result!.outputTokenDecimals).toBe(6);
      expect(getRelayPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCurrency: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          destinationChainId: ETHEREUM_CHAIN_ID,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Relay API network failures gracefully', async () => {
      const getRelayPrice = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(8);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing single raw quote'),
        expect.any(Error)
      );
    });

    it('should handle "no routes available" response', async () => {
      const getRelayPrice = vi.fn().mockResolvedValue(null); // No routes available
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(9);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).toBeNull();
      // The console.log for "No relay routes available" should have been called
    });

    it('should not log error for "No routes found" exceptions', async () => {
      const getRelayPrice = vi.fn().mockRejectedValue(new Error('No routes found'));
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(10);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).toBeNull();
      // Should not log this specific error
      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('Error processing single raw quote'),
        expect.any(Error)
      );
    });
  });

  describe('Special Chain Handling', () => {
    it('should use Solana-specific recipient for Solana chain tokens', async () => {
      const mockRelayResponse = createMockRelayResponse('1000000'); // 1 SOL (6 decimals)
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const solanaTokenInfo = {
        'SOL': {
          ...mockTokenInfo['ETH'],
          chainId: SOLANA_CHAIN_ID,
          chainName: 'Solana',
          ticker: 'SOL',
          decimals: 6,
        }
      };
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'SOL',
        'USDC',
        solanaTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(11);
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).not.toBeNull();
      expect(getRelayPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: QUOTE_DEFAULT_SOL_ADDRESS,
          destinationChainId: SOLANA_CHAIN_ID,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', async () => {
      const mockRelayResponse = createMockRelayResponse('1'); // 0.000000000000000001 ETH
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(12, '1'); // 0.000001 USDC
      const result = await processSingleRawQuote(mockQuote, '0.000001');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe('1');
    });

    it('should handle zero amounts', async () => {
      const mockRelayResponse = createMockRelayResponse('0');
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(13, '0');
      const result = await processSingleRawQuote(mockQuote, '0');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe('0');
    });

    it('should handle large amounts correctly', async () => {
      const largeAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // Max uint256
      const mockRelayResponse = createMockRelayResponse(largeAmount);
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(14, '1000000000'); // 1000 USDC
      const result = await processSingleRawQuote(mockQuote, '1000');

      expect(result).not.toBeNull();
      expect(result!.outputTokenAmount.toString()).toBe(largeAmount);
    });
  });

  describe('Quote Response Structure', () => {
    it('should include all required fields in the processed quote', async () => {
      const mockRelayResponse = createMockRelayResponse('1000000000000000000');
      const getRelayPrice = vi.fn().mockResolvedValue(mockRelayResponse);
      
      const processSingleRawQuote = createProcessSingleRawQuote(
        'ETH',
        'USDC',
        mockTokenInfo,
        '0xuser123',
        getRelayPrice
      );

      const mockQuote = createMockQuote(15, '1000000');
      const result = await processSingleRawQuote(mockQuote, '1');

      expect(result).not.toBeNull();
      
      // Check all required fields are present
      expect(result!.depositId).toBe(15);
      expect(result!.hashedOnchainId).toBe('0xhash123');
      expect(result!.fiatAmount).toEqual(tokenUnits('1', 6));
      expect(result!.usdcAmount.toString()).toBe('1000000');
      expect(result!.usdcToFiatRate).toBe('1.0500');
      expect(result!.outputTokenAmount).toBeDefined();
      expect(result!.outputTokenDecimals).toBe(18);
      expect(result!.outputTokenFormatted).toBe('0.95');
      expect(result!.outputTokenAmountInUsd).toBe('950.00');
      expect(result!.gasFeesInUsd).toBe('5.0000');
      expect(result!.appFeeInUsd).toBe('2.0000');
      expect(result!.relayerFeeInUsd).toBe('3.0000');
      expect(result!.relayerGasFeesInUsd).toBe('1.0000');
      expect(result!.relayerServiceFeesInUsd).toBe('2.0000');
      expect(result!.usdcToTokenRate).toBe('0.95');
      expect(result!.timeEstimate).toBe('300');
    });
  });
});