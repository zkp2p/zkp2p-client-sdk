import { PRECISION, SECONDS_IN_DAY } from "./constants";

import { PaymentPlatform, paymentPlatformInfo, PaymentPlatformType } from "./types";
import { EscrowIntentView } from "@helpers/types";
import { tokenUnitsToReadable } from "@helpers/units";
import { getCurrencyInfoFromHash } from "@helpers/types";
import { usdcInfo } from "@helpers/types/tokens";
import { INTENT_EXPIRATION_PERIOD_IN_SECONDS } from "@helpers/constants";
import { formatUnits } from "viem";

export interface ParsedIntentData {
  depositId: string;
  paymentPlatform: string;
  depositorOnchainPayeeDetails: string;
  receiveToken: string;
  amountTokenToReceive: string;
  sendCurrency: string;
  amountFiatToSend: string;
  expirationTimestamp: string;
  intentTimestamp: string;
  recipientAddress: string;
}


export const parseIntentData = (intentView: EscrowIntentView, addressToPlatform: { [key: string]: PaymentPlatformType }): ParsedIntentData => {
  const receiveTokenAddress = intentView.deposit.deposit.token;
  const receiveToken = usdcInfo.tokenId;    // hardcoded for now
  const tokenDecimals = usdcInfo.decimals;
  const receiveTokenAmount = intentView.intent.amount;

  // Calculate amount of fiat to send
  const tokenToFiatConversionRate = intentView.intent.conversionRate;
  const amountFiatToSend = calculateFiatFromRequestedUSDC(
    receiveTokenAmount,
    tokenToFiatConversionRate,
    tokenDecimals
  );

  const intentTimestamp = intentView.intent.timestamp.toString();

  // Calculate expiration timestamp
  const expirationTimestamp = formatExpiration(intentView.intent.timestamp);

  const recipientAddress = intentView.intent.to;

  const sendCurrency = getCurrencyInfoFromHash(intentView.intent.fiatCurrency)?.currencyCode || '';

  const verifier = intentView?.deposit.verifiers.filter(
    (v: any) => v.verifier === intentView?.intent.paymentVerifier
  )[0];
  const depositorOnchainPayeeDetails = verifier?.verificationData.payeeDetails || '';

  const paymentPlatform = addressToPlatform[intentView?.intent.paymentVerifier] || PaymentPlatform.VENMO;

  // Format amount with correct decimal delimiter based on platform locale
  const platformLocale = paymentPlatformInfo[paymentPlatform].localeTimeString;
  const readableAmountFiatToSend = formatUnits(amountFiatToSend, tokenDecimals);
  const parsedFloat = parseFloat(readableAmountFiatToSend);
  const roundedToTwoDecimals = (Math.ceil(parsedFloat * 100) / 100).toFixed(2);

  // Then just use Intl.NumberFormat for locale-specific formatting (commas, periods)
  const amountFiatToSendInReadable = new Intl.NumberFormat(platformLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true  // For thousand separators
  }).format(Number(roundedToTwoDecimals));

  const sanitizedIntent: ParsedIntentData = {
    depositId: intentView.deposit.depositId.toString(),
    paymentPlatform: paymentPlatform,
    depositorOnchainPayeeDetails,
    receiveToken: receiveToken,
    amountTokenToReceive: tokenUnitsToReadable(receiveTokenAmount, tokenDecimals),
    amountFiatToSend: amountFiatToSendInReadable,
    intentTimestamp,
    expirationTimestamp,
    recipientAddress,
    sendCurrency
  };

  return sanitizedIntent;
}


export const calculateFiatFromRequestedUSDC = (tokenAmount: bigint, tokenToFiatConversionRate: bigint, tokenDecimals: number): bigint => {
  const rawFiatAmount = (tokenAmount * tokenToFiatConversionRate) / PRECISION;
  const pennyInTokenUnits = BigInt(10 ** (tokenDecimals - 2));
  const remainder = rawFiatAmount % pennyInTokenUnits;

  if (remainder > 0n) {
    return rawFiatAmount - remainder + pennyInTokenUnits;
  } else {
    return rawFiatAmount;
  }
};

export const calculateUSDCFromFiat = (fiatAmount: bigint, tokenToFiatConversionRate: bigint, tokenDecimals: number): bigint => {
  // Since 1 USDC = conversionRate fiat
  // USDC amount = fiatAmount / conversionRate
  // We need to maintain precision by multiplying first then dividing
  const fiatWithPrecision = fiatAmount * PRECISION;
  const rawTokenAmount = fiatWithPrecision / tokenToFiatConversionRate;
  
  // Round down to the nearest unit (no rounding up for user input)
  return rawTokenAmount;
};

export function calculateExpiration(unixTimestamp: bigint, timePeriod: bigint): bigint {
  return unixTimestamp + timePeriod;
}

export function formatExpiration(unixTimestamp: bigint): string {
  const unixTimestampPlusOneDay = calculateExpiration(unixTimestamp, SECONDS_IN_DAY);

  const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  if (currentTimestamp > unixTimestampPlusOneDay) {
    return "Expired";
  } else {
    const date = new Date(Number(unixTimestampPlusOneDay) * 1000);
    const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }).split('/').slice(0, 2).join('/');

    return `${formattedTime} on ${formattedDate}`;
  }
}

export function calculateRemainingTimeForExpiration(timestamp: Date): string {
  // Calculate expiration (24 hours from timestamp)
  const expirationDate = new Date(timestamp);
  expirationDate.setSeconds(expirationDate.getSeconds() + INTENT_EXPIRATION_PERIOD_IN_SECONDS);
  const now = new Date();

  // If already expired
  if (now >= expirationDate) {
    return "Expired";
  }

  // Calculate time difference in milliseconds
  const timeDiff = expirationDate.getTime() - now.getTime();

  // Calculate hours and minutes left
  const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft === 0) {
    return `${minutesLeft}m left`;
  }

  return `${hoursLeft}h ${minutesLeft}m left`;
}

