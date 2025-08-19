import { BigNumber } from 'ethers';

export interface EscrowRange {
  min: BigNumber;
  max: BigNumber;
}

export interface EscrowDeposit {
  depositor: string;
  token: string;
  depositAmount: BigNumber;
  intentAmountRange: EscrowRange;
  acceptingIntents: boolean;
  remainingDepositAmount: BigNumber;
  outstandingIntentAmount: BigNumber;
  intentHashes: string[];
}

export interface EscrowCurrency {
  code: string;
  conversionRate: BigNumber;
}

export interface EscrowDepositVerifierData {
  intentGatingService: string;
  payeeDetails: string;
  data: string;
}

export interface EscrowVerifierDataView {
  verifier: string;
  verificationData: EscrowDepositVerifierData;
  currencies: EscrowCurrency[];
}

export interface EscrowDepositView {
  depositId: BigNumber;
  deposit: EscrowDeposit;
  availableLiquidity: BigNumber;
  verifiers: EscrowVerifierDataView[];
}

export interface EscrowIntent {
  owner: string;
  to: string;
  depositId: BigNumber;
  amount: BigNumber;
  timestamp: BigNumber;
  paymentVerifier: string;
  fiatCurrency: string;
  conversionRate: BigNumber;
}

export interface EscrowIntentView {
  intentHash: string;
  intent: EscrowIntent;
  deposit: EscrowDepositView;
}

