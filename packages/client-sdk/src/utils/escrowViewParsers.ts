import {
  type EscrowCurrency,
  type EscrowDeposit,
  type EscrowDepositView,
  type EscrowVerifierDataView,
  type EscrowIntent,
  type EscrowIntentView,
} from '../types/escrowViews';
// Convert numeric-like values to bigint consistently
function toBigInt(v: any): bigint {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') return BigInt(v);
  // viem may return hex strings for bytes32[], but for uints it returns bigint
  // For unknown objects (e.g., BN), try valueOf/toString
  if (v && typeof v.toString === 'function') return BigInt(v.toString());
  throw new Error('Unsupported numeric type for bigint conversion');
}

export function parseEscrowDeposit(depositData: any): EscrowDeposit {
  return {
    depositor: depositData.depositor,
    depositAmount: toBigInt(depositData.amount),
    remainingDepositAmount: toBigInt(depositData.remainingDeposits),
    outstandingIntentAmount: toBigInt(depositData.outstandingIntentAmount),
    intentHashes: depositData.intentHashes,
    intentAmountRange: {
      min: toBigInt(depositData.intentAmountRange.min),
      max: toBigInt(depositData.intentAmountRange.max),
    },
    token: depositData.token,
    acceptingIntents: depositData.acceptingIntents,
  };
}

export function parseEscrowVerifiers(verifiersRaw: any[]): EscrowVerifierDataView[] {
  return verifiersRaw.map((v: any) => ({
    verifier: v.verifier,
    verificationData: {
      intentGatingService: v.verificationData.intentGatingService,
      payeeDetails: v.verificationData.payeeDetails,
      data: v.verificationData.data,
    },
    currencies: v.currencies.map((c: EscrowCurrency) => ({
      code: c.code,
      conversionRate: toBigInt(c.conversionRate),
    })),
  }));
}

export function parseEscrowDepositView(depositViewRaw: any): EscrowDepositView {
  return {
    deposit: parseEscrowDeposit(depositViewRaw.deposit),
    availableLiquidity: toBigInt(depositViewRaw.availableLiquidity),
    depositId: toBigInt(depositViewRaw.depositId),
    verifiers: parseEscrowVerifiers(depositViewRaw.verifiers),
  };
}

export function parseEscrowIntentView(intentWithDepositRaw: any): EscrowIntentView {
  const intentData = intentWithDepositRaw.intent;
  const depositViewData = intentWithDepositRaw.deposit;

  const intent: EscrowIntent = {
    owner: intentData.owner,
    to: intentData.to,
    depositId: toBigInt(intentData.depositId),
    amount: toBigInt(intentData.amount),
    timestamp: toBigInt(intentData.timestamp),
    paymentVerifier: intentData.paymentVerifier,
    fiatCurrency: intentData.fiatCurrency,
    conversionRate: toBigInt(intentData.conversionRate),
  };

  const depositView: EscrowDepositView = parseEscrowDepositView(depositViewData);

  return {
    intent,
    deposit: depositView,
    intentHash: intentWithDepositRaw.intentHash,
  };
}
