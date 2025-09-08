export interface EscrowRange {
  min: bigint;
  max: bigint;
}

export interface EscrowDeposit {
  depositor: string;
  token: string;
  depositAmount: bigint;
  intentAmountRange: EscrowRange;
  acceptingIntents: boolean;
  remainingDepositAmount: bigint;
  outstandingIntentAmount: bigint;
  intentHashes: string[];
}

export interface EscrowCurrency {
  code: string;
  conversionRate: bigint;
}

export interface EscrowDepositVerifierData {
  intentGatingService: string;
  payeeDetails: string;
  data: string;
  // Optional enrichment from API when available
  paymentData?: {
    [key: string]: string;
  };
  // Optional enriched platform key (e.g., 'wise', 'revolut')
  paymentMethod?: string;
}

export interface EscrowVerifierDataView {
  verifier: string;
  verificationData: EscrowDepositVerifierData;
  currencies: EscrowCurrency[];
}

export interface EscrowDepositView {
  depositId: bigint;
  deposit: EscrowDeposit;
  availableLiquidity: bigint;
  verifiers: EscrowVerifierDataView[];
}

export interface EscrowIntent {
  owner: string;
  to: string;
  depositId: bigint;
  amount: bigint;
  timestamp: bigint;
  paymentVerifier: string;
  fiatCurrency: string;
  conversionRate: bigint;
  // Optional enriched data resolved via API for the selected verifier
  paymentData?: {
    [key: string]: string;
  };
  // Optional enriched platform key (e.g., 'wise', 'revolut')
  paymentMethod?: string;
}

export interface EscrowIntentView {
  intentHash: string;
  intent: EscrowIntent;
  deposit: EscrowDepositView;
}
