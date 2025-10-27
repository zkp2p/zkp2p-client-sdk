function toBigInt(v: any): bigint {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') return BigInt(v);
  if (v && typeof v.toString === 'function') return BigInt(v.toString());
  throw new Error('Unsupported numeric type for bigint conversion');
}

export type PV_Deposit = {
  depositor: string;
  delegate: string;
  token: string;
  amount: bigint;
  intentAmountRange: { min: bigint; max: bigint };
  acceptingIntents: boolean;
  remainingDeposits: bigint;
  outstandingIntentAmount: bigint;
  makerProtocolFee: bigint;
  reservedMakerFees: bigint;
  accruedMakerFees: bigint;
  accruedReferrerFees: bigint;
  intentGuardian: string;
  referrer: string;
  referrerFee: bigint;
};

export type PV_Currency = { code: string; minConversionRate: bigint };
export type PV_PaymentMethodData = {
  paymentMethod: string; // bytes32
  verificationData: {
    intentGatingService: string;
    payeeDetails: string; // bytes32
    data: string; // bytes
  };
  currencies: PV_Currency[];
};

export type PV_DepositView = {
  depositId: bigint;
  deposit: PV_Deposit;
  availableLiquidity: bigint;
  paymentMethods: PV_PaymentMethodData[];
  intentHashes: string[];
};

export type PV_Intent = {
  owner: string;
  to: string;
  escrow: string;
  depositId: bigint;
  amount: bigint;
  timestamp: bigint;
  paymentMethod: string; // bytes32
  fiatCurrency: string; // bytes32
  conversionRate: bigint;
  referrer: string;
  referrerFee: bigint;
  postIntentHook: string;
  data: string;
};

export type PV_IntentView = {
  intentHash: string;
  intent: PV_Intent;
  deposit: Omit<PV_DepositView, 'intentHashes'>;
};

export function parseDepositView(raw: any): PV_DepositView {
  return {
    depositId: toBigInt(raw.depositId),
    deposit: {
      depositor: raw.deposit.depositor,
      delegate: raw.deposit.delegate,
      token: raw.deposit.token,
      amount: toBigInt(raw.deposit.amount),
      intentAmountRange: {
        min: toBigInt(raw.deposit.intentAmountRange.min),
        max: toBigInt(raw.deposit.intentAmountRange.max),
      },
      acceptingIntents: raw.deposit.acceptingIntents,
      remainingDeposits: toBigInt(raw.deposit.remainingDeposits),
      outstandingIntentAmount: toBigInt(raw.deposit.outstandingIntentAmount),
      makerProtocolFee: toBigInt(raw.deposit.makerProtocolFee ?? 0),
      reservedMakerFees: toBigInt(raw.deposit.reservedMakerFees ?? 0),
      accruedMakerFees: toBigInt(raw.deposit.accruedMakerFees ?? 0),
      accruedReferrerFees: toBigInt(raw.deposit.accruedReferrerFees ?? 0),
      intentGuardian: raw.deposit.intentGuardian,
      referrer: raw.deposit.referrer,
      referrerFee: toBigInt(raw.deposit.referrerFee ?? 0),
    },
    availableLiquidity: toBigInt(raw.availableLiquidity),
    paymentMethods: (raw.paymentMethods || []).map((pm: any) => ({
      paymentMethod: pm.paymentMethod,
      verificationData: {
        intentGatingService: pm.verificationData.intentGatingService,
        payeeDetails: pm.verificationData.payeeDetails,
        data: pm.verificationData.data,
      },
      currencies: (pm.currencies || []).map((c: any) => ({
        code: c.code,
        minConversionRate: toBigInt(c.minConversionRate),
      })),
    })),
    intentHashes: raw.intentHashes || [],
  };
}

export function parseIntentView(raw: any): PV_IntentView {
  const parsedDeposit = parseDepositView(raw.deposit);
  const deposit: Omit<PV_DepositView, 'intentHashes'> = {
    depositId: parsedDeposit.depositId,
    deposit: parsedDeposit.deposit,
    availableLiquidity: parsedDeposit.availableLiquidity,
    paymentMethods: parsedDeposit.paymentMethods,
  };
  return {
    intentHash: raw.intentHash,
    intent: {
      owner: raw.intent.owner,
      to: raw.intent.to,
      escrow: raw.intent.escrow,
      depositId: toBigInt(raw.intent.depositId),
      amount: toBigInt(raw.intent.amount),
      timestamp: toBigInt(raw.intent.timestamp),
      paymentMethod: raw.intent.paymentMethod,
      fiatCurrency: raw.intent.fiatCurrency,
      conversionRate: toBigInt(raw.intent.conversionRate),
      referrer: raw.intent.referrer,
      referrerFee: toBigInt(raw.intent.referrerFee ?? 0),
      postIntentHook: raw.intent.postIntentHook,
      data: raw.intent.data,
    },
    deposit,
  };
}

// Enrichment helpers for dashboards/explorers
import { getPaymentMethodsCatalog, type RuntimeEnv } from '../contracts';
import { resolvePaymentMethodNameFromHash } from './paymentResolution';
import { getCurrencyInfoFromHash } from './currency';

export function enrichPvDepositView(view: PV_DepositView, chainId: number, env: RuntimeEnv = 'production') {
  const catalog = getPaymentMethodsCatalog(chainId, env);
  return {
    ...view,
    paymentMethods: view.paymentMethods.map((pm) => ({
      ...pm,
      processorName: resolvePaymentMethodNameFromHash(pm.paymentMethod, catalog),
      currencies: pm.currencies.map((c) => ({
        ...c,
        currencyInfo: getCurrencyInfoFromHash(c.code),
      })),
    })),
  };
}

export function enrichPvIntentView(view: PV_IntentView, chainId: number, env: RuntimeEnv = 'production') {
  const catalog = getPaymentMethodsCatalog(chainId, env);
  return {
    ...view,
    intent: {
      ...view.intent,
      processorName: resolvePaymentMethodNameFromHash(view.intent.paymentMethod, catalog),
      currencyInfo: getCurrencyInfoFromHash(view.intent.fiatCurrency),
    },
    deposit: enrichPvDepositView(view.deposit as any, chainId, env),
  } as any;
}
