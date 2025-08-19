import { describe, it, expect } from 'vitest';
import { parseEscrowDeposit, parseEscrowDepositView, parseEscrowIntentView, parseEscrowVerifiers } from '../utils/escrowViewParsers';

describe('escrow view parsers', () => {
  it('parses EscrowDeposit raw object into BigNumber fields', () => {
    const raw = {
      depositor: '0xabc',
      amount: '1000',
      remainingDeposits: '500',
      outstandingIntentAmount: '200',
      intentHashes: ['0x1', '0x2'],
      intentAmountRange: { min: '1', max: '2' },
      token: '0xusdc',
      acceptingIntents: true,
    };
    const parsed = parseEscrowDeposit(raw);
    expect(parsed.depositAmount.toString()).toBe('1000');
    expect(parsed.intentAmountRange.min.toString()).toBe('1');
    expect(parsed.acceptingIntents).toBe(true);
  });

  it('parses verifiers with currency conversion rates', () => {
    const raw = [
      {
        verifier: '0xv',
        verificationData: { intentGatingService: '0xg', payeeDetails: 'pd', data: '0x00' },
        currencies: [ { code: '0x11', conversionRate: '100' } ],
      },
    ];
    const parsed = parseEscrowVerifiers(raw as any);
    expect(parsed[0].verificationData.intentGatingService).toBe('0xg');
    expect(parsed[0].currencies[0].conversionRate.toString()).toBe('100');
  });

  it('parses EscrowDepositView with nested verifiers', () => {
    const raw = {
      deposit: {
        depositor: '0xabc', amount: '1', remainingDeposits: '1', outstandingIntentAmount: '0',
        intentHashes: [], intentAmountRange: { min: '0', max: '0' }, token: '0xusdc', acceptingIntents: false,
      },
      availableLiquidity: '10',
      depositId: '7',
      verifiers: [],
    };
    const parsed = parseEscrowDepositView(raw);
    expect(parsed.availableLiquidity.toString()).toBe('10');
    expect(parsed.depositId.toString()).toBe('7');
  });

  it('parses EscrowIntentView with intent and deposit', () => {
    const raw = {
      intent: {
        owner: '0xowner', to: '0xto', depositId: '1', amount: '2', timestamp: '3',
        paymentVerifier: '0xpv', fiatCurrency: '0x00', conversionRate: '100'
      },
      deposit: {
        deposit: {
          depositor: '0xabc', amount: '1', remainingDeposits: '1', outstandingIntentAmount: '0',
          intentHashes: [], intentAmountRange: { min: '0', max: '0' }, token: '0xusdc', acceptingIntents: false,
        },
        availableLiquidity: '10', depositId: '7', verifiers: [],
      },
      intentHash: '0xhash'
    };
    const parsed = parseEscrowIntentView(raw);
    expect(parsed.intent.amount.toString()).toBe('2');
    expect(parsed.intentHash).toBe('0xhash');
  });
});

