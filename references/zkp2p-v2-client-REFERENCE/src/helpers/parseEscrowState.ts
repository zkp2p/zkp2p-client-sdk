import {
  EscrowCurrency,
  EscrowDeposit,
  EscrowDepositView,
  EscrowVerifierDataView,
  EscrowIntent,
  EscrowIntentView,
} from '@helpers/types/escrow';

/**
 * Parses raw deposit struct data returned from the contract into an EscrowDeposit.
 */
export function parseEscrowDeposit(depositData: any): EscrowDeposit {
  return {
    depositor: depositData.depositor,
    depositAmount: BigInt(depositData.amount),
    remainingDepositAmount: BigInt(depositData.remainingDeposits),
    outstandingIntentAmount: BigInt(depositData.outstandingIntentAmount),
    intentHashes: depositData.intentHashes,
    intentAmountRange: {
      min: BigInt(depositData.intentAmountRange.min),
      max: BigInt(depositData.intentAmountRange.max),
    },
    token: depositData.token,
    acceptingIntents: depositData.acceptingIntents,
  };
}

/**
 * Parses raw verifier data into an EscrowVerifierDataView array.
 */
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
      conversionRate: BigInt(c.conversionRate),
    })),
  }));
}

/**
 * Parses raw deposit view data returned from the contract into an EscrowDepositView.
 */
export function parseEscrowDepositView(depositViewRaw: any): EscrowDepositView {
  return {
    deposit: parseEscrowDeposit(depositViewRaw.deposit),
    availableLiquidity: BigInt(depositViewRaw.availableLiquidity),
    depositId: BigInt(depositViewRaw.depositId),
    verifiers: parseEscrowVerifiers(depositViewRaw.verifiers),
  };
}

/**
 * Parses raw intent with deposit data (as returned from getIntents) into an EscrowIntentView.
 */
export function parseEscrowIntentView(intentWithDepositRaw: any): EscrowIntentView {
  const intentData = intentWithDepositRaw.intent;
  const depositViewData = intentWithDepositRaw.deposit;

  const intent: EscrowIntent = {
    owner: intentData.owner,
    to: intentData.to,
    depositId: BigInt(intentData.depositId),
    amount: BigInt(intentData.amount),
    timestamp: BigInt(intentData.timestamp),
    paymentVerifier: intentData.paymentVerifier,
    fiatCurrency: intentData.fiatCurrency,
    conversionRate: BigInt(intentData.conversionRate),
  };

  const depositView: EscrowDepositView = parseEscrowDepositView(depositViewData);

  return {
    intent,
    deposit: depositView,
    intentHash: intentWithDepositRaw.intentHash,
  };
}
