import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseIntentData,
  calculateFiatFromRequestedUSDC,
  calculateExpiration,
  formatExpiration,
  calculateRemainingTimeForExpiration,
} from '../intentHelper';
import { PaymentPlatform } from '../types';
import { PRECISION, SECONDS_IN_DAY, INTENT_EXPIRATION_PERIOD_IN_SECONDS } from '../constants';

describe('intentHelper', () => {
  describe('calculateFiatFromRequestedUSDC', () => {
    const USDC_DECIMALS = 6;

    it('should calculate exact fiat amount when no rounding needed', () => {
      // 100 USDC at 1:1 rate
      const tokenAmount = 100000000n; // 100 USDC
      const conversionRate = 1000000000000000000n; // 1.0 in 18 decimals
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('100000000'); // 100.00 USDC
    });

    it('should round up to nearest penny when remainder exists', () => {
      // 100.001 USDC should round up to 100.01
      const tokenAmount = 100001000n; // 100.001 USDC
      const conversionRate = 1000000000000000000n; // 1.0
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('100010000'); // 100.01 USDC
    });

    it('should handle different conversion rates', () => {
      // 100 USDC at 1.35 SGD/USD rate
      const tokenAmount = 100000000n; // 100 USDC
      const conversionRate = 1350000000000000000n; // 1.35
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('135000000'); // 135.00 SGD
    });

    it('should round up fractional pennies with conversion rate', () => {
      // 10.50 USDC at 1.33 rate = 13.965, should round up to 13.97
      const tokenAmount = 10500000n; // 10.50 USDC
      const conversionRate = 1330000000000000000n; // 1.33
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('13970000'); // 13.97
    });

    it('should handle very small amounts', () => {
      // 0.01 USDC
      const tokenAmount = 10000n; // 0.01 USDC
      const conversionRate = 1000000000000000000n; // 1.0
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('10000'); // 0.01
    });

    it('should handle zero amount', () => {
      const tokenAmount = 0n;
      const conversionRate = 1000000000000000000n;
      
      const result = calculateFiatFromRequestedUSDC(tokenAmount, conversionRate, USDC_DECIMALS);
      
      expect(result.toString()).toBe('0');
    });
  });

  describe('calculateExpiration', () => {
    it('should add time period to timestamp', () => {
      const timestamp = 1700000000n; // Unix timestamp
      const timePeriod = 86400n; // 1 day in seconds
      
      const result = calculateExpiration(timestamp, timePeriod);
      
      expect(result.toString()).toBe('1700086400');
    });

    it('should handle zero time period', () => {
      const timestamp = 1700000000n;
      const timePeriod = 0n;
      
      const result = calculateExpiration(timestamp, timePeriod);
      
      expect(result.toString()).toBe('1700000000');
    });
  });

  describe('formatExpiration', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000); // Nov 14, 2023
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should format future expiration correctly', () => {
      // Timestamp that expires in the future
      const timestamp = 1700000000n; // Same as mocked now
      
      const result = formatExpiration(timestamp);
      
      // Should show time 24 hours from the timestamp
      // Accept both 12-hour (with AM/PM) and 24-hour formats
      expect(result).toMatch(/(\d{1,2}:\d{2} [AP]M|\d{1,2}:\d{2}) on \d{1,2}\/\d{1,2}/);
    });

    it('should return "Expired" for past timestamps', () => {
      // Timestamp from 2 days ago
      const timestamp = 1699827200n; // 2 days before mocked now
      
      const result = formatExpiration(timestamp);
      
      expect(result).toBe('Expired');
    });

    it('should handle edge case at exact expiration', () => {
      // Timestamp exactly 24 hours ago (formatExpiration adds 24 hours, not 6)
      const timestamp = BigInt(1700000000 - 86400);
      
      const result = formatExpiration(timestamp);
      
      // This should NOT be expired because formatExpiration adds 24 hours
      // Accept both 12-hour (with AM/PM) and 24-hour formats
      expect(result).toMatch(/(\d{1,2}:\d{2} [AP]M|\d{1,2}:\d{2}) on \d{1,2}\/\d{1,2}/);
    });
  });

  describe('calculateRemainingTimeForExpiration', () => {
    beforeEach(() => {
      // Mock Date constructor to return fixed time
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1700000000000));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show hours and minutes for future expiration', () => {
      // Intent created 2 hours ago (6 hour expiration)
      const timestamp = new Date(1700000000000 - 2 * 60 * 60 * 1000);
      
      const result = calculateRemainingTimeForExpiration(timestamp);
      
      expect(result).toBe('4h 0m left'); // 6 - 2 = 4 hours left
    });

    it('should show only minutes when less than 1 hour left', () => {
      // Intent created 5 hours 30 minutes ago
      const timestamp = new Date(1700000000000 - 5.5 * 60 * 60 * 1000);
      
      const result = calculateRemainingTimeForExpiration(timestamp);
      
      expect(result).toBe('30m left');
    });

    it('should return "Expired" for expired intents', () => {
      // Intent created 7 hours ago
      const timestamp = new Date(1700000000000 - 7 * 60 * 60 * 1000);
      
      const result = calculateRemainingTimeForExpiration(timestamp);
      
      expect(result).toBe('Expired');
    });

    it('should handle exact expiration time', () => {
      // Intent created exactly 6 hours ago
      const timestamp = new Date(1700000000000 - INTENT_EXPIRATION_PERIOD_IN_SECONDS * 1000);
      
      const result = calculateRemainingTimeForExpiration(timestamp);
      
      expect(result).toBe('Expired');
    });

    it('should handle fresh intent', () => {
      // Intent created just now
      const timestamp = new Date(1700000000000);
      
      const result = calculateRemainingTimeForExpiration(timestamp);
      
      expect(result).toBe('6h 0m left');
    });
  });

  describe('parseIntentData', () => {
    const mockIntentView = {
      intent: {
        intentId: 1n,
        amount: 100000000n, // 100 USDC
        conversionRate: 1350000000000000000n, // 1.35 SGD/USD
        timestamp: 1700000000n,
        to: '0xrecipient',
        fiatCurrency: '0xc241cc1f9752d2d53d1ab67189223a3f330e48b75f73ebf86f50b2c78fe8df88', // SGD hash
        paymentVerifier: '0xverifier',
      },
      deposit: {
        depositId: 1n,
        deposit: {
          token: '0xusdc',
        },
        verifiers: [{
          verifier: '0xverifier',
          verificationData: {
            payeeDetails: 'user@venmo',
          },
        }],
      },
    };

    const addressToPlatform = {
      '0xverifier': PaymentPlatform.VENMO,
    };

    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should parse intent data correctly', () => {
      const result = parseIntentData(mockIntentView as any, addressToPlatform);

      expect(result).toEqual({
        depositId: '1',
        paymentPlatform: PaymentPlatform.VENMO,
        depositorOnchainPayeeDetails: 'user@venmo',
        receiveToken: '8453:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        amountTokenToReceive: '100.00',
        amountFiatToSend: '135.00', // 100 * 1.35
        intentTimestamp: '1700000000',
        expirationTimestamp: expect.stringMatching(/(\d{1,2}:\d{2} [AP]M|\d{1,2}:\d{2}) on \d{1,2}\/\d{1,2}/),
        recipientAddress: '0xrecipient',
        sendCurrency: 'SGD',
      });
    });

    it('should handle platform-specific locale formatting', () => {
      // Test with Wise (uses de-DE locale)
      const wiseAddressToPlatform = {
        '0xverifier': PaymentPlatform.WISE,
      };
      
      // Large amount to test thousand separators
      const largeAmountIntent = {
        ...mockIntentView,
        intent: {
          ...mockIntentView.intent,
          amount: 1234560000n, // 1234.56 USDC
        },
      };

      const result = parseIntentData(largeAmountIntent as any, wiseAddressToPlatform);

      // Wise uses en-US locale
      expect(result.amountFiatToSend).toBe('1,666.66'); // 1234.56 * 1.35 = 1666.656 rounded up
    });

    it('should handle missing verifier data', () => {
      const intentWithNoVerifier = {
        ...mockIntentView,
        deposit: {
          ...mockIntentView.deposit,
          verifiers: [],
        },
      };

      const result = parseIntentData(intentWithNoVerifier as any, addressToPlatform);

      expect(result.depositorOnchainPayeeDetails).toBe('');
    });

    it('should default to VENMO for unknown payment platforms', () => {
      const emptyAddressToPlatform = {};

      const result = parseIntentData(mockIntentView as any, emptyAddressToPlatform);

      expect(result.paymentPlatform).toBe(PaymentPlatform.VENMO);
    });

    it('should handle rounding in fiat amount calculation', () => {
      // Amount that will require rounding
      const intentWithRounding = {
        ...mockIntentView,
        intent: {
          ...mockIntentView.intent,
          amount: 10123456n, // 10.123456 USDC
          conversionRate: 1333000000000000000n, // 1.333
        },
      };

      const result = parseIntentData(intentWithRounding as any, addressToPlatform);

      // 10.123456 * 1.333 = 13.494566848, rounded up to nearest cent = 13.50
      expect(result.amountFiatToSend).toBe('13.50');
    });
  });
});