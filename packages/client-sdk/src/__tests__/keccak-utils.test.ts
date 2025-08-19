import { describe, it, expect } from 'vitest';
import { keccak256, currencyKeccak256, sha256 } from '../utils/keccak';
import { currencyInfo } from '../utils/currency';

describe('keccak and hashing utils', () => {
  it('produces 0x-prefixed hashes of expected length', () => {
    const k = keccak256('hello');
    const c = currencyKeccak256('USD');
    const s = sha256('hello');
    for (const v of [k, c, s]) {
      expect(v.startsWith('0x')).toBe(true);
      expect(v.length).toBe(66);
    }
  });

  it('currency hash matches currencyInfo mapping', () => {
    expect(currencyInfo.USD.currencyCodeHash).toBe(currencyKeccak256('USD'));
    expect(currencyInfo.EUR.currencyCodeHash).toBe(currencyKeccak256('EUR'));
  });

  it('keccak differs from sha256 for the same input', () => {
    const k = keccak256('USD');
    const s = sha256('USD');
    expect(k).not.toBe(s);
  });
});
