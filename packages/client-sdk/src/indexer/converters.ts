import type { DepositWithRelations, IntentEntity } from './types';
import type { EscrowDepositView, EscrowIntentView } from '../types';

const ZERO = '0x0000000000000000000000000000000000000000';

function toBigInt(value: string | number | bigint | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  try { return typeof value === 'bigint' ? value : BigInt(value); } catch { return 0n; }
}

function normalizeAddress(value?: string | null): string {
  if (!value) return ZERO;
  return value.startsWith('0x') ? value : ZERO;
}

export function extractDepositId(compositeId: string): string {
  const parts = compositeId.split('_');
  return parts[1] || '0';
}

export function createCompositeDepositId(escrowAddress: string, depositId: string | bigint): string {
  return `${escrowAddress.toLowerCase()}_${depositId.toString()}`;
}

export function convertIndexerDepositToEscrowView(deposit: DepositWithRelations, _chainId: number, _escrowAddress: string): EscrowDepositView {
  const paymentMethods = deposit.paymentMethods ?? [];
  const currencies = deposit.currencies ?? [];

  const currenciesByPaymentMethod = new Map<string, typeof currencies>();
  for (const c of currencies) {
    const bucket = currenciesByPaymentMethod.get(c.paymentMethodHash) ?? [];
    bucket.push(c);
    currenciesByPaymentMethod.set(c.paymentMethodHash, bucket);
  }

  const verifiers = paymentMethods.map(pm => ({
    verifier: normalizeAddress(pm.verifierAddress),
    verificationData: {
      intentGatingService: normalizeAddress(pm.intentGatingService),
      payeeDetails: pm.payeeDetailsHash ?? '',
      data: '' as `0x${string}`,
    },
    currencies: (currenciesByPaymentMethod.get(pm.paymentMethodHash) ?? []).map(cur => ({
      code: cur.currencyCode as `0x${string}`,
      conversionRate: toBigInt(cur.minConversionRate),
    })),
    methodHash: pm.paymentMethodHash as `0x${string}`,
  }));

  const uniqueIntentHashes = new Set((deposit.intents ?? []).map(i => i.intentHash));
  const remaining = toBigInt(deposit.remainingDeposits);
  const outstanding = toBigInt(deposit.outstandingIntentAmount);
  const available = deposit.availableLiquidity != null ? toBigInt(deposit.availableLiquidity) : remaining;

  const depositAmount = remaining + outstanding + toBigInt(deposit.totalAmountTaken ?? 0) + toBigInt(deposit.totalWithdrawn ?? 0);

  return {
    depositId: toBigInt(deposit.depositId),
    deposit: {
      depositor: normalizeAddress(deposit.depositor),
      token: normalizeAddress(deposit.token),
      depositAmount,
      intentAmountRange: { min: toBigInt(deposit.intentAmountMin), max: toBigInt(deposit.intentAmountMax) },
      acceptingIntents: Boolean(deposit.acceptingIntents),
      remainingDepositAmount: remaining,
      outstandingIntentAmount: outstanding,
      intentHashes: Array.from(uniqueIntentHashes),
    },
    availableLiquidity: available,
    verifiers,
  };
}

export function convertDepositsForLiquidity(deposits: DepositWithRelations[], chainId: number, escrowAddress: string): EscrowDepositView[] {
  return deposits
    .filter(d => d.depositor && d.depositor.toLowerCase() !== ZERO && d.acceptingIntents && toBigInt(d.availableLiquidity) > 0n && d.status === 'ACTIVE')
    .map(d => convertIndexerDepositToEscrowView(d, chainId, escrowAddress));
}

export function convertIndexerIntentsToEscrowViews(intents: IntentEntity[], depositViewsById: Map<string, EscrowDepositView>): EscrowIntentView[] {
  const result: EscrowIntentView[] = [];
  for (const intent of intents) {
    const depositView = depositViewsById.get(intent.depositId.toLowerCase());
    if (!depositView) continue;
    const rawDepositId = extractDepositId(intent.depositId);
    result.push({
      intentHash: intent.intentHash as `0x${string}`,
      intent: {
        owner: normalizeAddress(intent.owner),
        to: normalizeAddress(intent.toAddress),
        depositId: toBigInt(rawDepositId),
        amount: toBigInt(intent.amount),
        timestamp: toBigInt(intent.signalTimestamp),
        paymentVerifier: normalizeAddress(intent.verifier),
        fiatCurrency: intent.fiatCurrency,
        conversionRate: toBigInt(intent.conversionRate),
      },
      deposit: depositView,
    });
  }
  return result;
}
