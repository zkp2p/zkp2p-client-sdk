import { describe, it, expect } from 'vitest';
import { calculateAPR } from '../aprHelper';

describe('aprHelper', () => {
  describe('calculateAPR', () => {
    const USDC_PRECISION = 10n ** 6n;
    const ETHER_PRECISION = 10n ** 18n;

    it('should calculate correct APR for positive spread', () => {
      // Test case: 1000 USDC deposit
      const availableAmount = 1000n * USDC_PRECISION;
      // Conversion rate: 1.05 (5% spread)
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000; // $10k daily volume
      const platformCurrentLiquidity = 100000; // $100k liquidity

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Days per cycle = 100k / 10k = 10 days
      // Number of cycles = 365 / 10 = 36.5
      // Spread = (1.05 - 1.0) / 1.0 = 0.05 (5%)
      // Fees per cycle = 1000 * 0.05 = 50
      // Total fees per year = 50 * 36.5 = 1825
      // APR = (1825 / 1000) * 100 = 182.5%

      expect(result.apr).toBe(182.5);
      expect(result.spread).toBe(5.0);
    });

    it('should return null APR for negative spread', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      // Conversion rate: 0.95 (negative 5% spread)
      const conversionRateUSDC = BigInt(0.95e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(-5.0);
    });

    it('should handle zero spread correctly', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      // Conversion rate exactly matches currency price
      const conversionRateUSDC = BigInt(1e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBe(0);
      expect(result.spread).toBe(0);
    });

    it('should handle very small deposit amounts', () => {
      // 0.01 USDC deposit
      const availableAmount = BigInt(0.01e6);
      const conversionRateUSDC = BigInt(1.1e18); // 10% spread
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBe(365); // 10% spread * 36.5 cycles = 365%
      expect(result.spread).toBe(10.0);
    });

    it('should handle large deposit amounts', () => {
      // 1 million USDC deposit
      const availableAmount = 1000000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.02e18); // 2% spread
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 50000;
      const platformCurrentLiquidity = 500000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Days per cycle = 500k / 50k = 10 days
      // Number of cycles = 365 / 10 = 36.5
      // APR = 2% * 36.5 = 73%

      expect(result.apr).toBe(73);
      expect(result.spread).toBe(2.0);
    });

    it('should handle different currency prices', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      // Conversion rate: 1.38 SGD per USD
      const conversionRateUSDC = BigInt(1.38e18);
      const currencyPriceUSD = 1.32; // Actual SGD/USD rate
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Spread = (1.38 - 1.32) / 1.32 = 0.0454545... ≈ 4.545%
      expect(result.spread).toBe(4.545);
      // APR = 4.545% * 36.5 = 165.89%
      expect(result.apr).toBe(165.91);
    });

    it('should handle high frequency trading (high daily volume)', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 100000; // Same as liquidity
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Days per cycle = 100k / 100k = 1 day
      // Number of cycles = 365 / 1 = 365
      // APR = 5% * 365 = 1825%

      expect(result.apr).toBe(1825);
      expect(result.spread).toBe(5.0);
    });

    it('should handle low frequency trading (low daily volume)', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 1000; // Very low volume
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Days per cycle = 100k / 1k = 100 days
      // Number of cycles = 365 / 100 = 3.65
      // APR = 5% * 3.65 = 18.25%

      expect(result.apr).toBe(18.25);
      expect(result.spread).toBe(5.0);
    });

    it('should handle edge case with zero daily volume', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 0;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      // Should return null APR due to validation

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });

    it('should handle zero liquidity', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 0;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });

    it('should handle zero currency price', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });

    it('should handle negative daily volume', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = -10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });

    it('should handle negative liquidity', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      const conversionRateUSDC = BigInt(1.05e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = -100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });

    it('should handle precision correctly for small spreads', () => {
      const availableAmount = 1000n * USDC_PRECISION;
      // Very small spread: 0.1%
      const conversionRateUSDC = BigInt(1.001e18);
      const currencyPriceUSD = 1.0;
      const platformAverageDailyVolume = 10000;
      const platformCurrentLiquidity = 100000;

      const result = calculateAPR(
        availableAmount,
        conversionRateUSDC,
        currencyPriceUSD,
        platformAverageDailyVolume,
        platformCurrentLiquidity
      );

      expect(result.spread).toBe(0.1);
      expect(result.apr).toBe(3.65); // 0.1% * 36.5 = 3.65%
    });
  });
});