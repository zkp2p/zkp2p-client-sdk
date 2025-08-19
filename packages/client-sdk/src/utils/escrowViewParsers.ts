import {
  type EscrowCurrency,
  type EscrowDeposit,
  type EscrowDepositView,
  type EscrowVerifierDataView,
  type EscrowIntent,
  type EscrowIntentView,
} from '../types/escrowViews';
import { BigNumber } from 'ethers';

export function parseEscrowDeposit(depositData: any): EscrowDeposit {
  return {
    depositor: depositData.depositor,
    depositAmount: BigNumber.from(depositData.amount),
    remainingDepositAmount: BigNumber.from(depositData.remainingDeposits),
    outstandingIntentAmount: BigNumber.from(depositData.outstandingIntentAmount),
    intentHashes: depositData.intentHashes,
    intentAmountRange: {
      min: BigNumber.from(depositData.intentAmountRange.min),
      max: BigNumber.from(depositData.intentAmountRange.max),
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
      conversionRate: BigNumber.from(c.conversionRate),
    })),
  }));
}

export function parseEscrowDepositView(depositViewRaw: any): EscrowDepositView {
  return {
    deposit: parseEscrowDeposit(depositViewRaw.deposit),
    availableLiquidity: BigNumber.from(depositViewRaw.availableLiquidity),
    depositId: BigNumber.from(depositViewRaw.depositId),
    verifiers: parseEscrowVerifiers(depositViewRaw.verifiers),
  };
}

export function parseEscrowIntentView(intentWithDepositRaw: any): EscrowIntentView {
  const intentData = intentWithDepositRaw.intent;
  const depositViewData = intentWithDepositRaw.deposit;

  const intent: EscrowIntent = {
    owner: intentData.owner,
    to: intentData.to,
    depositId: BigNumber.from(intentData.depositId),
    amount: BigNumber.from(intentData.amount),
    timestamp: BigNumber.from(intentData.timestamp),
    paymentVerifier: intentData.paymentVerifier,
    fiatCurrency: intentData.fiatCurrency,
    conversionRate: BigNumber.from(intentData.conversionRate),
  };

  const depositView: EscrowDepositView = parseEscrowDepositView(depositViewData);

  return {
    intent,
    deposit: depositView,
    intentHash: intentWithDepositRaw.intentHash,
  };
}

