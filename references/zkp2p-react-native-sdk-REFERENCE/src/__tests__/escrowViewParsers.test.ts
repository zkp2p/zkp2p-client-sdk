import { BigNumber } from 'ethers';
import {
  parseEscrowDeposit,
  parseEscrowVerifiers,
  parseEscrowDepositView,
  parseEscrowIntentView,
} from '../utils/escrowViewParsers';

describe('EscrowViewParsers', () => {
  describe('parseEscrowDeposit', () => {
    it('should parse deposit data correctly', () => {
      const depositData = {
        depositor: '0x1234567890abcdef1234567890abcdef12345678',
        amount: '1000000000000000000', // 1 ETH in wei
        remainingDeposits: '500000000000000000', // 0.5 ETH
        outstandingIntentAmount: '200000000000000000', // 0.2 ETH
        intentHashes: ['0xhash1', '0xhash2'],
        intentAmountRange: {
          min: '100000000000000000', // 0.1 ETH
          max: '300000000000000000', // 0.3 ETH
        },
        token: '0xtoken1234567890abcdef1234567890abcdef12',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(depositData);

      expect(result.depositor).toBe(depositData.depositor);
      expect(result.depositAmount).toEqual(BigNumber.from(depositData.amount));
      expect(result.remainingDepositAmount).toEqual(
        BigNumber.from(depositData.remainingDeposits)
      );
      expect(result.outstandingIntentAmount).toEqual(
        BigNumber.from(depositData.outstandingIntentAmount)
      );
      expect(result.intentHashes).toEqual(depositData.intentHashes);
      expect(result.intentAmountRange.min).toEqual(
        BigNumber.from(depositData.intentAmountRange.min)
      );
      expect(result.intentAmountRange.max).toEqual(
        BigNumber.from(depositData.intentAmountRange.max)
      );
      expect(result.token).toBe(depositData.token);
      expect(result.acceptingIntents).toBe(true);
    });

    it('should handle zero values', () => {
      const depositData = {
        depositor: '0x0000000000000000000000000000000000000000',
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

      const result = parseEscrowDeposit(depositData);

      expect(result.depositAmount.isZero()).toBe(true);
      expect(result.remainingDepositAmount.isZero()).toBe(true);
      expect(result.outstandingIntentAmount.isZero()).toBe(true);
      expect(result.intentAmountRange.min.isZero()).toBe(true);
      expect(result.intentAmountRange.max.isZero()).toBe(true);
      expect(result.intentHashes).toEqual([]);
      expect(result.acceptingIntents).toBe(false);
    });

    it('should handle very large numbers', () => {
      const depositData = {
        depositor: '0x1234567890abcdef1234567890abcdef12345678',
        amount:
          '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        remainingDeposits: '1000000000000000000000000', // 1 million ETH
        outstandingIntentAmount: '999999999999999999999999',
        intentHashes: ['0xhash1'],
        intentAmountRange: {
          min: '1',
          max: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        },
        token: '0xtoken1234567890abcdef1234567890abcdef12',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(depositData);

      expect(result.depositAmount.toString()).toBe(depositData.amount);
      expect(result.intentAmountRange.max.toString()).toBe(
        depositData.intentAmountRange.max
      );
    });

    it('should handle hex string amounts', () => {
      const depositData = {
        depositor: '0x1234567890abcdef1234567890abcdef12345678',
        amount: '0xde0b6b3a7640000', // 1 ETH in hex
        remainingDeposits: '0x6f05b59d3b20000', // 0.5 ETH in hex
        outstandingIntentAmount: '0x2c68af0bb140000', // 0.2 ETH in hex
        intentHashes: [],
        intentAmountRange: {
          min: '0x16345785d8a0000', // 0.1 ETH in hex
          max: '0x429d069189e0000', // 0.3 ETH in hex
        },
        token: '0xtoken1234567890abcdef1234567890abcdef12',
        acceptingIntents: true,
      };

      const result = parseEscrowDeposit(depositData);

      expect(
        result.depositAmount.eq(BigNumber.from('1000000000000000000'))
      ).toBe(true);
      expect(
        result.remainingDepositAmount.eq(BigNumber.from('500000000000000000'))
      ).toBe(true);
    });
  });

  describe('parseEscrowVerifiers', () => {
    it('should parse verifiers array correctly', () => {
      const verifiersRaw = [
        {
          verifier: '0xverifier1',
          verificationData: {
            intentGatingService: '0xgatingservice1',
            payeeDetails: 'user@example.com',
            data: '0xdata1',
          },
          currencies: [
            { code: 'USD', conversionRate: '1000000' },
            { code: 'EUR', conversionRate: '1200000' },
          ],
        },
        {
          verifier: '0xverifier2',
          verificationData: {
            intentGatingService: '0xgatingservice2',
            payeeDetails: 'user2@example.com',
            data: '0xdata2',
          },
          currencies: [{ code: 'GBP', conversionRate: '1300000' }],
        },
      ];

      const result = parseEscrowVerifiers(verifiersRaw);

      expect(result).toHaveLength(2);
      expect(result[0]?.verifier).toBe('0xverifier1');
      expect(result[0]?.verificationData.payeeDetails).toBe('user@example.com');
      expect(result[0]?.currencies).toHaveLength(2);
      expect(result[0]?.currencies[0]?.code).toBe('USD');
      expect(result[0]?.currencies[0]?.conversionRate).toEqual(
        BigNumber.from('1000000')
      );
      expect(result[1]?.currencies[0]?.code).toBe('GBP');
    });

    it('should handle empty verifiers array', () => {
      const result = parseEscrowVerifiers([]);
      expect(result).toEqual([]);
    });

    it('should handle verifiers with empty currencies', () => {
      const verifiersRaw = [
        {
          verifier: '0xverifier1',
          verificationData: {
            intentGatingService: '0xgatingservice1',
            payeeDetails: '',
            data: '0x',
          },
          currencies: [],
        },
      ];

      const result = parseEscrowVerifiers(verifiersRaw);

      expect(result[0]?.currencies).toEqual([]);
      expect(result[0]?.verificationData.payeeDetails).toBe('');
      expect(result[0]?.verificationData.data).toBe('0x');
    });

    it('should handle hex conversion rates', () => {
      const verifiersRaw = [
        {
          verifier: '0xverifier1',
          verificationData: {
            intentGatingService: '0xgatingservice1',
            payeeDetails: 'user@example.com',
            data: '0xdata1',
          },
          currencies: [
            { code: 'USD', conversionRate: '0xf4240' }, // 1000000 in hex
            { code: 'EUR', conversionRate: '0x124f80' }, // 1200000 in hex
          ],
        },
      ];

      const result = parseEscrowVerifiers(verifiersRaw);

      expect(result[0]?.currencies[0]?.conversionRate.toNumber()).toBe(1000000);
      expect(result[0]?.currencies[1]?.conversionRate.toNumber()).toBe(1200000);
    });
  });

  describe('parseEscrowDepositView', () => {
    it('should parse complete deposit view correctly', () => {
      const depositViewRaw = {
        deposit: {
          depositor: '0x1234567890abcdef1234567890abcdef12345678',
          amount: '1000000000000000000',
          remainingDeposits: '500000000000000000',
          outstandingIntentAmount: '200000000000000000',
          intentHashes: ['0xhash1'],
          intentAmountRange: {
            min: '100000000000000000',
            max: '300000000000000000',
          },
          token: '0xtoken1234567890abcdef1234567890abcdef12',
          acceptingIntents: true,
        },
        availableLiquidity: '300000000000000000',
        depositId: '12345',
        verifiers: [
          {
            verifier: '0xverifier1',
            verificationData: {
              intentGatingService: '0xgatingservice1',
              payeeDetails: 'user@example.com',
              data: '0xdata1',
            },
            currencies: [{ code: 'USD', conversionRate: '1000000' }],
          },
        ],
      };

      const result = parseEscrowDepositView(depositViewRaw);

      expect(result.deposit.depositor).toBe(depositViewRaw.deposit.depositor);
      expect(result.availableLiquidity).toEqual(
        BigNumber.from(depositViewRaw.availableLiquidity)
      );
      expect(result.depositId).toEqual(
        BigNumber.from(depositViewRaw.depositId)
      );
      expect(result.verifiers).toHaveLength(1);
      expect(result.verifiers[0]?.verifier).toBe('0xverifier1');
    });

    it('should handle deposit view with no verifiers', () => {
      const depositViewRaw = {
        deposit: {
          depositor: '0x1234567890abcdef1234567890abcdef12345678',
          amount: '1000',
          remainingDeposits: '1000',
          outstandingIntentAmount: '0',
          intentHashes: [],
          intentAmountRange: {
            min: '0',
            max: '1000',
          },
          token: '0xtoken1234567890abcdef1234567890abcdef12',
          acceptingIntents: false,
        },
        availableLiquidity: '1000',
        depositId: '1',
        verifiers: [],
      };

      const result = parseEscrowDepositView(depositViewRaw);

      expect(result.verifiers).toEqual([]);
      expect(result.deposit.acceptingIntents).toBe(false);
    });
  });

  describe('parseEscrowIntentView', () => {
    it('should parse intent view with deposit correctly', () => {
      const intentWithDepositRaw = {
        intent: {
          owner: '0xowner1234567890abcdef1234567890abcdef12',
          to: '0xto1234567890abcdef1234567890abcdef123456',
          depositId: '123',
          amount: '100000000000000000', // 0.1 ETH
          timestamp: '1234567890',
          paymentVerifier: '0xverifier1234567890abcdef1234567890abcdef',
          fiatCurrency: 'USD',
          conversionRate: '1000000',
        },
        deposit: {
          deposit: {
            depositor: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '1000000000000000000',
            remainingDeposits: '500000000000000000',
            outstandingIntentAmount: '100000000000000000',
            intentHashes: ['0xhash1', '0xhash2'],
            intentAmountRange: {
              min: '100000000000000000',
              max: '300000000000000000',
            },
            token: '0xtoken1234567890abcdef1234567890abcdef12',
            acceptingIntents: true,
          },
          availableLiquidity: '400000000000000000',
          depositId: '123',
          verifiers: [
            {
              verifier: '0xverifier1234567890abcdef1234567890abcdef',
              verificationData: {
                intentGatingService: '0xgatingservice1',
                payeeDetails: 'user@example.com',
                data: '0xdata1',
              },
              currencies: [{ code: 'USD', conversionRate: '1000000' }],
            },
          ],
        },
        intentHash:
          '0xintentHash1234567890abcdef1234567890abcdef1234567890abcdef123456',
      };

      const result = parseEscrowIntentView(intentWithDepositRaw);

      expect(result.intent.owner).toBe(intentWithDepositRaw.intent.owner);
      expect(result.intent.to).toBe(intentWithDepositRaw.intent.to);
      expect(result.intent.depositId).toEqual(BigNumber.from('123'));
      expect(result.intent.amount).toEqual(
        BigNumber.from(intentWithDepositRaw.intent.amount)
      );
      expect(result.intent.timestamp).toEqual(
        BigNumber.from(intentWithDepositRaw.intent.timestamp)
      );
      expect(result.intent.paymentVerifier).toBe(
        intentWithDepositRaw.intent.paymentVerifier
      );
      expect(result.intent.fiatCurrency).toBe('USD');
      expect(result.intent.conversionRate).toEqual(
        BigNumber.from(intentWithDepositRaw.intent.conversionRate)
      );
      expect(result.deposit.depositId).toEqual(BigNumber.from('123'));
      expect(result.intentHash).toBe(intentWithDepositRaw.intentHash);
    });

    it('should handle intent with minimal data', () => {
      const intentWithDepositRaw = {
        intent: {
          owner: '0x0000000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000000',
          depositId: '0',
          amount: '0',
          timestamp: '0',
          paymentVerifier: '0x0000000000000000000000000000000000000000',
          fiatCurrency: '',
          conversionRate: '0',
        },
        deposit: {
          deposit: {
            depositor: '0x0000000000000000000000000000000000000000',
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
          },
          availableLiquidity: '0',
          depositId: '0',
          verifiers: [],
        },
        intentHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const result = parseEscrowIntentView(intentWithDepositRaw);

      expect(result.intent.amount.isZero()).toBe(true);
      expect(result.intent.timestamp.isZero()).toBe(true);
      expect(result.intent.conversionRate.isZero()).toBe(true);
      expect(result.intent.fiatCurrency).toBe('');
      expect(result.deposit.verifiers).toEqual([]);
    });

    it('should handle hex values in intent data', () => {
      const intentWithDepositRaw = {
        intent: {
          owner: '0xowner1234567890abcdef1234567890abcdef12',
          to: '0xto1234567890abcdef1234567890abcdef123456',
          depositId: '0x7b', // 123 in hex
          amount: '0x16345785d8a0000', // 0.1 ETH in hex
          timestamp: '0x499602d2', // 1234567890 in hex
          paymentVerifier: '0xverifier1234567890abcdef1234567890abcdef',
          fiatCurrency: 'EUR',
          conversionRate: '0x124f80', // 1200000 in hex
        },
        deposit: {
          deposit: {
            depositor: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '0xde0b6b3a7640000',
            remainingDeposits: '0x6f05b59d3b20000',
            outstandingIntentAmount: '0x16345785d8a0000',
            intentHashes: [],
            intentAmountRange: {
              min: '0x16345785d8a0000',
              max: '0x429d069189e0000',
            },
            token: '0xtoken1234567890abcdef1234567890abcdef12',
            acceptingIntents: true,
          },
          availableLiquidity: '0x58d15e176280000',
          depositId: '0x7b',
          verifiers: [],
        },
        intentHash:
          '0xintentHash1234567890abcdef1234567890abcdef1234567890abcdef123456',
      };

      const result = parseEscrowIntentView(intentWithDepositRaw);

      expect(result.intent.depositId.toNumber()).toBe(123);
      expect(
        result.intent.amount.eq(BigNumber.from('100000000000000000'))
      ).toBe(true);
      expect(result.intent.timestamp.toNumber()).toBe(1234567890);
      expect(result.intent.conversionRate.toNumber()).toBe(1200000);
    });
  });
});
