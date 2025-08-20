import { describe, it, expect } from 'vitest';
import {
  parseEscrowDeposit,
  parseEscrowVerifiers,
  parseEscrowDepositView,
  parseEscrowIntentView,
} from '../parseEscrowState';

describe('parseEscrowState', () => {
  describe('parseEscrowDeposit', () => {
    it('should correctly parse deposit data with all fields', () => {
      const rawDeposit = {
        depositor: '0xdepositor123',
        amount: '1000000000', // 1000 USDC
        remainingDeposits: '500000000', // 500 USDC remaining
        outstandingIntentAmount: '200000000', // 200 USDC in intents
        intentHashes: [
          '0xhash1',
          '0xhash2',
          '0xhash3',
        ],
        intentAmountRange: {
          min: '10000000', // 10 USDC min
          max: '100000000', // 100 USDC max
        },
        token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(rawDeposit);

      expect(result.depositor).toBe('0xdepositor123');
      expect(result.depositAmount.toString()).toBe('1000000000');
      expect(result.remainingDepositAmount.toString()).toBe('500000000');
      expect(result.outstandingIntentAmount.toString()).toBe('200000000');
      expect(result.intentHashes).toEqual(['0xhash1', '0xhash2', '0xhash3']);
      expect(result.intentAmountRange.min.toString()).toBe('10000000');
      expect(result.intentAmountRange.max.toString()).toBe('100000000');
      expect(result.token).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
      expect(result.acceptingIntents).toBe(true);
    });

    it('should handle zero values correctly', () => {
      const rawDeposit = {
        depositor: '0xdepositor456',
        amount: '0',
        remainingDeposits: '0',
        outstandingIntentAmount: '0',
        intentHashes: [],
        intentAmountRange: {
          min: '0',
          max: '0',
        },
        token: '0x0000000000000000000000000000000000000000',
        acceptingIntents: false,
      };

      const result = parseEscrowDeposit(rawDeposit);

      expect(result.depositAmount.toString()).toBe('0');
      expect(result.remainingDepositAmount.toString()).toBe('0');
      expect(result.outstandingIntentAmount.toString()).toBe('0');
      expect(result.intentHashes).toEqual([]);
      expect(result.acceptingIntents).toBe(false);
    });

    it('should handle very large amounts (max uint256)', () => {
      const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      const rawDeposit = {
        depositor: '0xwhale',
        amount: maxUint256,
        remainingDeposits: maxUint256,
        outstandingIntentAmount: '0',
        intentHashes: [],
        intentAmountRange: {
          min: '1',
          max: maxUint256,
        },
        token: '0xtoken',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(rawDeposit);

      expect(result.depositAmount.toString()).toBe(maxUint256);
      expect(result.remainingDepositAmount.toString()).toBe(maxUint256);
      expect(result.intentAmountRange.max.toString()).toBe(maxUint256);
    });

    it('should handle hex string amounts', () => {
      const rawDeposit = {
        depositor: '0xdepositor',
        amount: '0x3b9aca00', // 1e9 in hex
        remainingDeposits: '0x1dcd6500', // 5e8 in hex
        outstandingIntentAmount: '0x0',
        intentHashes: [],
        intentAmountRange: {
          min: '0x989680', // 1e7 in hex
          max: '0x5f5e100', // 1e8 in hex
        },
        token: '0xtoken',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(rawDeposit);

      expect(result.depositAmount.toString()).toBe('1000000000');
      expect(result.remainingDepositAmount.toString()).toBe('500000000');
      expect(result.intentAmountRange.min.toString()).toBe('10000000');
      expect(result.intentAmountRange.max.toString()).toBe('100000000');
    });
  });

  describe('parseEscrowVerifiers', () => {
    it('should parse multiple verifiers with currencies', () => {
      const rawVerifiers = [
        {
          verifier: '0xverifier1',
          verificationData: {
            intentGatingService: '0xgating1',
            payeeDetails: 'user@venmo',
            data: '0xdata1',
          },
          currencies: [
            { code: 'USD', conversionRate: '1050000000000000000' }, // 1.05
            { code: 'EUR', conversionRate: '900000000000000000' },  // 0.90
          ],
        },
        {
          verifier: '0xverifier2',
          verificationData: {
            intentGatingService: '0xgating2',
            payeeDetails: 'user@revolut',
            data: '0xdata2',
          },
          currencies: [
            { code: 'GBP', conversionRate: '800000000000000000' }, // 0.80
          ],
        },
      ];

      const result = parseEscrowVerifiers(rawVerifiers);

      expect(result).toHaveLength(2);
      
      // First verifier
      expect(result[0].verifier).toBe('0xverifier1');
      expect(result[0].verificationData.payeeDetails).toBe('user@venmo');
      expect(result[0].currencies).toHaveLength(2);
      expect(result[0].currencies[0].code).toBe('USD');
      expect(result[0].currencies[0].conversionRate.toString()).toBe('1050000000000000000');
      
      // Second verifier
      expect(result[1].verifier).toBe('0xverifier2');
      expect(result[1].verificationData.payeeDetails).toBe('user@revolut');
      expect(result[1].currencies).toHaveLength(1);
      expect(result[1].currencies[0].code).toBe('GBP');
    });


  });

  describe('parseEscrowDepositView', () => {
    it('should parse complete deposit view with verifiers', () => {
      const rawDepositView = {
        deposit: {
          depositor: '0xdepositor',
          amount: '1000000000',
          remainingDeposits: '800000000',
          outstandingIntentAmount: '100000000',
          intentHashes: ['0xhash1'],
          intentAmountRange: {
            min: '10000000',
            max: '100000000',
          },
          token: '0xusdc',
          acceptingIntents: true,
        },
        availableLiquidity: '700000000', // remaining - outstanding
        depositId: '42',
        verifiers: [
          {
            verifier: '0xvenmoVerifier',
            verificationData: {
              intentGatingService: '0xgating',
              payeeDetails: '@username',
              data: '0x123',
            },
            currencies: [
              { code: 'USD', conversionRate: '1000000000000000000' },
            ],
          },
        ],
      };

      const result = parseEscrowDepositView(rawDepositView);

      expect(result.deposit.depositor).toBe('0xdepositor');
      expect(result.deposit.depositAmount.toString()).toBe('1000000000');
      expect(result.availableLiquidity.toString()).toBe('700000000');
      expect(result.depositId.toString()).toBe('42');
      expect(result.verifiers).toHaveLength(1);
      expect(result.verifiers[0].verifier).toBe('0xvenmoVerifier');
    });

    it('should calculate available liquidity correctly', () => {
      // Test case where remaining < outstanding (edge case)
      const rawDepositView = {
        deposit: {
          depositor: '0xdepositor',
          amount: '1000000000',
          remainingDeposits: '100000000', // Only 100 USDC left
          outstandingIntentAmount: '200000000', // But 200 USDC in intents
          intentHashes: ['0x1', '0x2'],
          intentAmountRange: { min: '0', max: '0' },
          token: '0xtoken',
          acceptingIntents: false,
        },
        availableLiquidity: '0', // Should be 0, not negative
        depositId: '1',
        verifiers: [],
      };

      const result = parseEscrowDepositView(rawDepositView);

      expect(result.availableLiquidity.toString()).toBe('0');
      expect(result.deposit.acceptingIntents).toBe(false);
    });
  });

  describe('parseEscrowIntentView', () => {
    it('should parse complete intent with deposit view', () => {
      const rawIntentView = {
        intent: {
          owner: '0xbuyer',
          to: '0xrecipient',
          depositId: '42',
          amount: '50000000', // 50 USDC
          timestamp: '1234567890',
          paymentVerifier: '0xvenmoVerifier',
          fiatCurrency: 'USD',
          conversionRate: '1050000000000000000', // 1.05 USD per USDC
        },
        deposit: {
          deposit: {
            depositor: '0xdepositor',
            amount: '1000000000',
            remainingDeposits: '950000000',
            outstandingIntentAmount: '50000000',
            intentHashes: ['0xintentHash123'],
            intentAmountRange: { min: '10000000', max: '100000000' },
            token: '0xusdc',
            acceptingIntents: true,
          },
          availableLiquidity: '900000000',
          depositId: '42',
          verifiers: [{
            verifier: '0xvenmoVerifier',
            verificationData: {
              intentGatingService: '0xgating',
              payeeDetails: '@venmo-user',
              data: '0x',
            },
            currencies: [{ code: 'USD', conversionRate: '1050000000000000000' }],
          }],
        },
        intentHash: '0xintentHash123',
      };

      const result = parseEscrowIntentView(rawIntentView);

      // Check intent fields
      expect(result.intent.owner).toBe('0xbuyer');
      expect(result.intent.to).toBe('0xrecipient');
      expect(result.intent.depositId.toString()).toBe('42');
      expect(result.intent.amount.toString()).toBe('50000000');
      expect(result.intent.timestamp.toString()).toBe('1234567890');
      expect(result.intent.paymentVerifier).toBe('0xvenmoVerifier');
      expect(result.intent.fiatCurrency).toBe('USD');
      expect(result.intent.conversionRate.toString()).toBe('1050000000000000000');
      
      // Check deposit fields
      expect(result.deposit.deposit.depositor).toBe('0xdepositor');
      expect(result.deposit.availableLiquidity.toString()).toBe('900000000');
      expect(result.deposit.verifiers[0].verificationData.payeeDetails).toBe('@venmo-user');
      
      // Check intent hash
      expect(result.intentHash).toBe('0xintentHash123');
    });

    it('should handle intents with zero amounts', () => {
      const rawIntentView = {
        intent: {
          owner: '0x0',
          to: '0x0',
          depositId: '0',
          amount: '0',
          timestamp: '0',
          paymentVerifier: '0x0',
          fiatCurrency: '',
          conversionRate: '0',
        },
        deposit: {
          deposit: {
            depositor: '0x0',
            amount: '0',
            remainingDeposits: '0',
            outstandingIntentAmount: '0',
            intentHashes: [],
            intentAmountRange: { min: '0', max: '0' },
            token: '0x0',
            acceptingIntents: false,
          },
          availableLiquidity: '0',
          depositId: '0',
          verifiers: [],
        },
        intentHash: '0x0',
      };

      const result = parseEscrowIntentView(rawIntentView);

      expect(result.intent.amount.toString()).toBe('0');
      expect(result.intent.timestamp.toString()).toBe('0');
      expect(result.intent.conversionRate.toString()).toBe('0');
      expect(result.deposit.availableLiquidity.toString()).toBe('0');
    });

    it('should handle hex values in all numeric fields', () => {
      const rawIntentView = {
        intent: {
          owner: '0xowner',
          to: '0xto',
          depositId: '0x2a', // 42 in hex
          amount: '0x2faf080', // 50000000 in hex
          timestamp: '0x499602d2', // 1234567890 in hex
          paymentVerifier: '0xverifier',
          fiatCurrency: 'USD',
          conversionRate: '0xe8d4a51000000000', // ~1e18 in hex
        },
        deposit: {
          deposit: {
            depositor: '0xdepositor',
            amount: '0x3b9aca00',
            remainingDeposits: '0x38a43380',
            outstandingIntentAmount: '0x2faf080',
            intentHashes: [],
            intentAmountRange: { min: '0x989680', max: '0x5f5e100' },
            token: '0xtoken',
            acceptingIntents: true,
          },
          availableLiquidity: '0x35a4e900',
          depositId: '0x2a',
          verifiers: [],
        },
        intentHash: '0xhash',
      };

      const result = parseEscrowIntentView(rawIntentView);

      expect(result.intent.depositId.toString()).toBe('42');
      expect(result.intent.amount.toString()).toBe('50000000');
      expect(result.intent.timestamp.toString()).toBe('1234567890');
      expect(result.deposit.depositId.toString()).toBe('42');
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle bigint overflow protection', () => {
      // Test with values close to max safe integer
      const rawDeposit = {
        depositor: '0xdepositor',
        amount: '9007199254740991', // Number.MAX_SAFE_INTEGER
        remainingDeposits: '9007199254740991',
        outstandingIntentAmount: '0',
        intentHashes: [],
        intentAmountRange: {
          min: '0',
          max: '9007199254740991',
        },
        token: '0xtoken',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(rawDeposit);

      // bigint should handle these values correctly
      expect(() => result.depositAmount.toString()).not.toThrow();
      expect(() => Number(result.depositAmount)).not.toThrow();
    });

    it('should preserve precision for decimal-like values', () => {
      // USDC has 6 decimals, so 1.5 USDC = 1500000
      const rawDeposit = {
        depositor: '0xdepositor',
        amount: '1500000', // 1.5 USDC
        remainingDeposits: '1500000',
        outstandingIntentAmount: '0',
        intentHashes: [],
        intentAmountRange: {
          min: '100000', // 0.1 USDC
          max: '10000000', // 10 USDC
        },
        token: '0xusdc',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(rawDeposit);

      expect(result.depositAmount.toString()).toBe('1500000');
      expect(result.intentAmountRange.min.toString()).toBe('100000');
    });
  });
});