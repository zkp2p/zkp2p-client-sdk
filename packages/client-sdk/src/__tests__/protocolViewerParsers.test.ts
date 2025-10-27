import { describe, it, expect } from 'vitest';
import { parseDepositView, parseIntentView } from '../utils/protocolViewerParsers';

describe('ProtocolViewer parsers', () => {
  it('parses deposit view with bigint fields', () => {
    const raw = {
      depositId: '1',
      availableLiquidity: '1000',
      intentHashes: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ],
      deposit: {
        depositor: '0x0000000000000000000000000000000000000001',
        delegate: '0x0000000000000000000000000000000000000002',
        token: '0x0000000000000000000000000000000000000003',
        amount: '10',
        intentAmountRange: { min: '1', max: '10' },
        acceptingIntents: true,
        remainingDeposits: '10',
        outstandingIntentAmount: '0',
        makerProtocolFee: '0',
        reservedMakerFees: '0',
        accruedMakerFees: '0',
        accruedReferrerFees: '0',
        intentGuardian: '0x0000000000000000000000000000000000000004',
        referrer: '0x0000000000000000000000000000000000000005',
        referrerFee: '0',
      },
      paymentMethods: [
        {
          paymentMethod: '0x706d7468696e6700000000000000000000000000000000000000000000000000',
          verificationData: {
            intentGatingService: '0x0000000000000000000000000000000000000006',
            payeeDetails: '0x00',
            data: '0x',
          },
          currencies: [{ code: '0x555344', minConversionRate: '1000000' }],
        },
      ],
    };
    const parsed = parseDepositView(raw);
    expect(parsed.depositId).toBe(1n);
    expect(parsed.availableLiquidity).toBe(1000n);
    expect(parsed.deposit.amount).toBe(10n);
    expect(parsed.paymentMethods[0]?.currencies[0]?.minConversionRate).toBe(1000000n);
  });

  it('parses intent view with bigint fields', () => {
    const raw = {
      intentHash: '0x01',
      intent: {
        owner: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
        escrow: '0x0000000000000000000000000000000000000003',
        depositId: '2',
        amount: '5',
        timestamp: '123',
        paymentMethod: '0x706d',
        fiatCurrency: '0x555344',
        conversionRate: '1000000',
        referrer: '0x0000000000000000000000000000000000000004',
        referrerFee: '0',
        postIntentHook: '0x0000000000000000000000000000000000000000',
        data: '0x',
      },
      deposit: {
        depositId: '2',
        deposit: {
          depositor: '0x0', delegate: '0x0', token: '0x0', amount: '0',
          intentAmountRange: { min: '0', max: '0' }, acceptingIntents: true, remainingDeposits: '0', outstandingIntentAmount: '0',
          makerProtocolFee: '0', reservedMakerFees: '0', accruedMakerFees: '0', accruedReferrerFees: '0', intentGuardian: '0x0', referrer: '0x0', referrerFee: '0'
        },
        availableLiquidity: '0',
        paymentMethods: [],
        intentHashes: [],
      }
    };
    const parsed = parseIntentView(raw);
    expect(parsed.intent.depositId).toBe(2n);
    expect(parsed.intent.amount).toBe(5n);
    expect(parsed.intent.conversionRate).toBe(1000000n);
  });
});

