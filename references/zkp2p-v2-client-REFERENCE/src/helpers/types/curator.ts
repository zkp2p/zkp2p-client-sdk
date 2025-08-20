
export type QuoteMaxTokenForFiatRequest = {
  paymentPlatforms: string[];
  fiatCurrency: string;
  user: string;
  recipient: string;
  destinationChainId: number;
  destinationToken: string;
  referrer?: string;
  useMultihop?: boolean;
  exactFiatAmount: string;
}

export type QuoteMinFiatForTokenRequest = {
  paymentPlatforms: string[];
  fiatCurrency: string;
  user: string;
  recipient: string;
  destinationChainId: number;
  destinationToken: string;
  referrer?: string;
  useMultihop?: boolean;
  exactTokenAmount: string;
}

export type IntentSignalRequest = {
  processorName: string;
  depositId: string;
  tokenAmount: string;
  payeeDetails: string;
  toAddress: string;
  fiatCurrencyCode: string;
  chainId: string;
}


export type SignalIntentResponse = {
  success: boolean;
  message: string;
  responseObject: {
    depositData: Record<string, any>;
    signedIntent: string;
  }
  statusCode: number
}

export type PostDepositDetailsRequest = {
  depositData: {
    [key: string]: string;
  };
  processorName: string;
}


export type PostDepositDetailsResponse = {
  success: boolean;
  message: string;
  responseObject: {
    id: number;
    processorName: string;
    depositData: {
      [key: string]: string;
    };
    hashedOnchainId: string;
    createdAt: string;
  };
  statusCode: number;
}

export type GetPayeeDetailsResponse = {
  success: boolean;
  message: string;
  responseObject: {
    id: number;
    processorName: string;
    depositData: {
      [key: string]: string;
    };
    hashedOnchainId: string;
    createdAt: string;
  };
  statusCode: number;
}

export type ValidatePayeeDetailsRequest = {
  processorName: string;
  depositData: { [key: string]: string };
}

export type ValidatePayeeDetailsResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  responseObject: boolean;
}

export type FiatResponse = {
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  countryCode: string;
}

export type TokenResponse = {
  token: string;
  decimals: number;
  name: string;
  symbol: string;
  chainId: number;
}

export type QuoteIntentResponse = {
  depositId: string;
  processorName: string;
  amount: string;
  toAddress: string;
  payeeDetails: string;
  processorIntentData: any;
  fiatCurrencyCode: string;
  chainId: string;
}

export type QuoteSingleResponse = {
  fiatAmount: string;
  fiatAmountFormatted: string;
  tokenAmount: string;
  tokenAmountFormatted: string;
  paymentMethod: string;
  payeeAddress: string;
  conversionRate: string;
  intent: QuoteIntentResponse;
}

export type QuoteFeesResponse = {
  zkp2pFee: string;
  zkp2pFeeFormatted: string;
  swapFee: string;
  swapFeeFormatted: string;
}

export type QuoteResponse = {
  message: string;
  success: boolean;
  responseObject: {
    fiat: FiatResponse;
    token: TokenResponse;
    quotes: QuoteSingleResponse[];
    fees: QuoteFeesResponse;
  }
  statusCode: number;
}

export type IntentStatsRequest = {
  depositIds: number[];
}

export type IntentStats = {
  id: number;
  totalIntents: number;
  signaledIntents: number;
  fulfilledIntents: number;
  prunedIntents: number;
}

export type IntentStatsResponse = {
  message: string;
  success: boolean;
  responseObject: IntentStats[];
  statusCode: number;
}

export const IntentStatus = {
  SIGNALED: "SIGNALED",
  FULFILLED: "FULFILLED",
  PRUNED: "PRUNED"
} as const;

export type IntentStatusType = typeof IntentStatus[keyof typeof IntentStatus];

export interface Intent {
  id: number;
  intentHash: string;
  status: IntentStatusType;
  depositId: string;
  verifier: string;
  owner: string;
  toAddress: string;
  amount: string;
  fiatCurrency: string;
  conversionRate: string;
  sustainabilityFee: string | null;
  verifierFee: string | null;
  signalTxHash: string;
  signalTimestamp: Date;
  fulfillTxHash: string | null;
  fulfillTimestamp: Date | null;
  pruneTxHash: string | null;
  prunedTimestamp: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DepositStatus = {
  ACTIVE: "ACTIVE",
  WITHDRAWN: "WITHDRAWN",
  CLOSED: "CLOSED"
} as const;

export type DepositStatus = typeof DepositStatus[keyof typeof DepositStatus];

export type VerifierCurrency = {
  id?: number;
  depositVerifierId?: number;
  currencyCode: string;
  conversionRate: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DepositVerifier = {
  id?: number;
  depositId: number;
  verifier: string;
  intentGatingService: string;
  payeeDetailsHash: string;
  data: string;
  createdAt?: Date;
  updatedAt?: Date;
  currencies: VerifierCurrency[];
};

export type Deposit = {
  id: number;
  depositor: string;
  token: string;
  amount: string;
  remainingDeposits: string;
  intentAmountMin: string;
  intentAmountMax: string;
  acceptingIntents: boolean;
  outstandingIntentAmount: string;
  availableLiquidity: string;
  status: DepositStatus;
  createdAt?: Date;
  updatedAt?: Date;
  verifiers: DepositVerifier[];
};

export interface DepositResponse {
  message: string;
  success: boolean;
  responseObject: Deposit;
  statusCode: number;
}