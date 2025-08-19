import { describe, it, expect } from 'vitest';
import { mapConversionRatesToOnchain, type UICurrencyRate } from '../utils/currency';

describe('mapConversionRatesToOnchain', () => {
  it('maps nested UI rates to onchain format', () => {
    const groups: UICurrencyRate[][] = [
      [
        { currency: 'USD', conversionRate: '1000000' },
        { currency: 'EUR', conversionRate: '900000' },
      ],
      [
        { currency: 'GBP', conversionRate: '850000' },
      ],
    ];
    const mapped = mapConversionRatesToOnchain(groups, 2);
    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toHaveLength(2);
    expect(mapped[0][0].code.startsWith('0x')).toBe(true);
    expect(mapped[0][0].conversionRate).toBe(1000000n);
  });

  it('throws when expected group count mismatches', () => {
    const groups: UICurrencyRate[][] = [[{ currency: 'USD', conversionRate: '1' }]];
    expect(() => mapConversionRatesToOnchain(groups, 2)).toThrow(/must match processorNames/);
  });

  it('throws on invalid structure', () => {
    // @ts-expect-error testing runtime guard
    expect(() => mapConversionRatesToOnchain([])).toThrow(/nested array/);
  });

  it('throws on invalid currency code', () => {
    const groups = [[{ currency: 'XXX' as any, conversionRate: '1' }]];
    expect(() => mapConversionRatesToOnchain(groups)).toThrow(/Invalid currency/);
  });
});

