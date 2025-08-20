export type SwapQuote = {
  depositId: number;
  hashedOnchainId: string;
  fiatAmount: bigint;
  usdcAmount: bigint;
  usdcToFiatRate: string;
  outputTokenAmount: bigint;
  outputTokenDecimals: number;
  outputTokenFormatted: string;
  outputTokenAmountInUsd?: string;
  gasFeesInUsd?: string;
  appFeeInUsd?: string;
  relayerFeeInUsd?: string;
  relayerGasFeesInUsd?: string;
  relayerServiceFeesInUsd?: string;
  usdcToTokenRate?: string;
  timeEstimate?: string;
};