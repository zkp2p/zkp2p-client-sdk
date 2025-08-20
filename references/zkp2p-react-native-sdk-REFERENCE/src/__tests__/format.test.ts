import { toDecimalString } from '../utils/format';

describe('toDecimalString', () => {
  it('converts 0x hex to decimal', () => {
    expect(toDecimalString('0x0')).toBe('0');
    expect(toDecimalString('0x1')).toBe('1');
    expect(toDecimalString('0x0a')).toBe('10');
    expect(toDecimalString('0xFF')).toBe('255');
    expect(toDecimalString('0x1234567890abcdef')).toBe(
      BigInt('0x1234567890abcdef').toString(10)
    );
  });

  it('converts non-prefixed hex to decimal', () => {
    expect(toDecimalString('ff')).toBe('255');
    expect(toDecimalString('0a')).toBe('10');
    expect(toDecimalString('ABCDEF')).toBe('11259375');
    expect(toDecimalString('123abc')).toBe(BigInt('0x123abc').toString(10));
  });

  it('handles 0X uppercase prefix as hex', () => {
    expect(toDecimalString('0XFF')).toBe('255');
  });

  it('passes through invalid hex-like strings', () => {
    expect(toDecimalString('zz')).toBe('zz');
  });

  it('returns decimal as-is', () => {
    expect(toDecimalString('0')).toBe('0');
    expect(toDecimalString('42')).toBe('42');
    expect(toDecimalString('001')).toBe('001');
  });

  it('handles bigint input', () => {
    expect(toDecimalString(123n)).toBe('123');
  });

  it('passes through non-matching strings', () => {
    expect(toDecimalString('not-a-number')).toBe('not-a-number');
  });
});
