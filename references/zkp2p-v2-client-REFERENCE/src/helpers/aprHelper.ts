
const USDC_PRECISION = 10n ** 6n;
const ETHER_PRECISION = 10n ** 18n;

/*
  Calculate the APR for a given deposit amount
  @param availableAmount: bigint - The amount of the deposit in USDC decimals
  @param conversionRateUSDC: bigint - The conversion rate of the deposit to USDC in ether units
  @param currencyPriceUSD: number - The price of the currency in USD with 2 decimal places
  @param platformAverageDailyVolume: number - The average daily volume of the platform
  @param platformCurrentLiquidity: number - The current liquidity of the platform
  @returns number - The APR for the deposit
*/
export const calculateAPR = (
  availableAmount: bigint,
  conversionRateUSDC: bigint,
  currencyPriceUSD: number,
  platformAverageDailyVolume: number,
  platformCurrentLiquidity: number
) => {
  // Validate inputs to prevent division by zero and invalid calculations
  if (platformCurrentLiquidity <= 0 || platformAverageDailyVolume <= 0) {
    return {
      apr: null,
      spread: 0
    };
  }

  if (currencyPriceUSD <= 0) {
    return {
      apr: null,
      spread: 0
    };
  }

  // Convert BigInt values to numbers for fractional arithmetic
  const depositAmountReadable = Number(availableAmount) / Number(USDC_PRECISION);
  const currentLiquidityReadable = Number(platformCurrentLiquidity);
  const dailyVolumeReadable = Number(platformAverageDailyVolume);

  // Convert conversion rate from ether units to a readable number
  const conversionRateReadable = Number(conversionRateUSDC) / Number(ETHER_PRECISION);

  // New APR calculation based on the specified formula
  // days per cycle = (total liquidity / daily volume)
  const daysPerCycle = currentLiquidityReadable / dailyVolumeReadable;

  // number of cycles = 365 / days per cycle
  const numberOfCycles = 365 / daysPerCycle;

  // spread = (conversion rate - actual rate) / actual rate
  const spread = (conversionRateReadable - currencyPriceUSD) / currencyPriceUSD;

  if (spread < 0) {
    return {
      apr: null,
      spread: Number((spread * 100).toFixed(3))
    };
  }

  // fees made per cycle = deposit amount * spread
  const feesPerCycle = depositAmountReadable * spread;

  // total fees made in a year = fees made per cycle * number of cycles
  const totalFeesPerYear = feesPerCycle * numberOfCycles;

  // apr = (total fees / deposit amount) * 100
  const apr = (totalFeesPerYear / depositAmountReadable) * 100;

  return {
    apr: Number(apr.toFixed(2)),
    spread: Number((spread * 100).toFixed(3))
  };
};
