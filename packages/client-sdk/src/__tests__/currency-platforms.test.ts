import { describe, it, expect } from 'vitest';
import { currencyInfo } from '../utils/currency';
import { PAYMENT_PLATFORMS } from '../types';

describe('supported currencies and platforms', () => {
  it('includes v2 client currencies added beyond RN base', () => {
    for (const code of ['CZK','DKK','HUF','INR','NOK','PHP','RON','SEK'] as const) {
      const info = (currencyInfo as any)[code];
      expect(info, `missing currency ${code}`).toBeTruthy();
      expect(info.currencyCode).toBe(code);
      expect(info.currencyCodeHash?.startsWith('0x')).toBe(true);
    }
  });

  it('exposes PayPal and Monzo in PAYMENT_PLATFORMS', () => {
    expect(PAYMENT_PLATFORMS).toContain('paypal');
    expect(PAYMENT_PLATFORMS).toContain('monzo');
  });
});

