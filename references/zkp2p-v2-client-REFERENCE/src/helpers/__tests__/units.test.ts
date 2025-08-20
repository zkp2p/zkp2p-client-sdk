import { describe, it, expect } from 'vitest';
import {
  etherUnits,
  usdcUnits,
  tokenUnits,
  etherUnitsToReadable,
  tokenUnitsToReadable,
  tokenUnitsToReadableWithMaxDecimals,
  relayTokenAmountToReadable,
} from '../units';

describe('units', () => {
  describe('etherUnits', () => {
    it('should convert number to ether units', () => {
      const result = etherUnits(1);
      expect(result.toString()).toBe('1000000000000000000');
    });

    it('should convert string to ether units', () => {
      const result = etherUnits('1.5');
      expect(result.toString()).toBe('1500000000000000000');
    });

    it('should convert bigint to ether units', () => {
      const result = etherUnits(2n);
      expect(result.toString()).toBe('2000000000000000000');
    });


    it('should handle decimals', () => {
      const result = etherUnits('0.000001');
      expect(result.toString()).toBe('1000000000000');
    });
  });

  describe('usdcUnits', () => {
    it('should convert number to USDC units (6 decimals)', () => {
      const result = usdcUnits(1);
      expect(result.toString()).toBe('1000000');
    });

    it('should convert string to USDC units', () => {
      const result = usdcUnits('100.5');
      expect(result.toString()).toBe('100500000');
    });

    it('should handle small amounts', () => {
      const result = usdcUnits('0.000001');
      expect(result.toString()).toBe('1');
    });

  });

  describe('tokenUnits', () => {
    it('should convert to custom decimal units', () => {
      // 8 decimal token
      const result = tokenUnits(1, 8);
      expect(result.toString()).toBe('100000000');
    });

    it('should handle 18 decimal tokens', () => {
      const result = tokenUnits('0.5', 18);
      expect(result.toString()).toBe('500000000000000000');
    });

    it('should handle 0 decimal tokens', () => {
      const result = tokenUnits(100, 0);
      expect(result.toString()).toBe('100');
    });
  });

  describe('etherUnitsToReadable', () => {
    it('should format ether units to readable string', () => {
      const result = etherUnitsToReadable('1000000000000000000');
      expect(result).toBe('1');
    });

    it('should respect decimalsToDisplay parameter', () => {
      const result = etherUnitsToReadable('1234560000000000000', 4);
      expect(result).toBe('1.2346');
    });


    it('should handle very small amounts', () => {
      const result = etherUnitsToReadable('1000000000000', 6);
      expect(result).toBe('0.000001');
    });
  });

  describe('tokenUnitsToReadable', () => {
    it('should format USDC units to readable string', () => {
      const result = tokenUnitsToReadable('1000000', 6);
      expect(result).toBe('1.00');
    });

    it('should format with custom decimals', () => {
      const result = tokenUnitsToReadable('123456789', 6, 4);
      expect(result).toBe('123.4567');
    });

    it('should handle bigint input', () => {
      const result = tokenUnitsToReadable(5500000n, 6);
      expect(result).toBe('5.50');
    });

    it('should floor instead of round', () => {
      const result = tokenUnitsToReadable('1999999', 6, 2);
      expect(result).toBe('1.99'); // Not 2.00
    });
  });

  describe('tokenUnitsToReadableWithMaxDecimals', () => {
    it('should handle regular numbers', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('1500000', 6, 2);
      expect(result).toBe('1.5');
    });

    it('should remove trailing zeros', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('1000000', 6, 4);
      expect(result).toBe('1');
    });

    it('should handle zero', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('0', 6);
      expect(result).toBe('0');
    });

    it('should handle very small numbers with scientific notation', () => {
      // 0.000000000077327284 (7.7327284e-11)
      const result = tokenUnitsToReadableWithMaxDecimals('77327284', 18);
      expect(result).toBe('0.0000000000773');
    });

    it('should show 3 significant digits for small numbers', () => {
      // 0.0000123 should show as 0.0000123
      const result = tokenUnitsToReadableWithMaxDecimals('12300', 9);
      expect(result).toBe('0.0000123');
    });

    it('should handle numbers just below 0.001', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('999', 6);
      expect(result).toBe('0.000999');
    });

    it('should handle numbers just above 0.001', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('1001', 6);
      expect(result).toBe('0');
    });

    it('should handle large numbers', () => {
      const result = tokenUnitsToReadableWithMaxDecimals('123456789000', 6, 2);
      expect(result).toBe('123456.79');
    });
  });

  describe('relayTokenAmountToReadable', () => {
    it('should handle undefined input', () => {
      const result = relayTokenAmountToReadable(undefined);
      expect(result).toBe('0');
    });

    it('should handle zero', () => {
      const result = relayTokenAmountToReadable('0');
      expect(result).toBe('0');
    });

    it('should handle regular numbers with 3 decimal places', () => {
      const result = relayTokenAmountToReadable('1.23456');
      expect(result).toBe('1.235');
    });

    it('should handle small numbers with significant digits', () => {
      const result = relayTokenAmountToReadable('0.0000123');
      expect(result).toBe('0.0000123');
    });

    it('should handle numbers at 0.001 threshold', () => {
      const result = relayTokenAmountToReadable('0.001');
      expect(result).toBe('0.001');
    });

    it('should handle numbers just below 0.001', () => {
      const result = relayTokenAmountToReadable('0.0009999');
      expect(result).toBe('0.001000');
    });

    it('should handle large numbers', () => {
      const result = relayTokenAmountToReadable('123456.789');
      expect(result).toBe('123456.789');
    });

    it('should handle string numbers', () => {
      const result = relayTokenAmountToReadable('5.5');
      expect(result).toBe('5.500');
    });
  });
});