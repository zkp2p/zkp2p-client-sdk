/**
 * Indexer entity types (GraphQL schema-aligned)
 */

export type DepositStatus = 'ACTIVE' | 'CLOSED';

export interface DepositEntity {
  id: string;                // escrowAddress_depositId
  chainId: number;
  escrowAddress: string;
  depositId: string;         // BigInt as string
  depositor: string;
  token: string;
  remainingDeposits: string; // BigInt as string
  intentAmountMin: string;   // BigInt as string
  intentAmountMax: string;   // BigInt as string
  acceptingIntents: boolean;
  status: DepositStatus;
  outstandingIntentAmount: string; // BigInt as string
  totalAmountTaken: string;        // BigInt as string
  totalWithdrawn: string;          // BigInt as string
  successRateBps?: number;
  totalIntents: number;
  signaledIntents: number;
  fulfilledIntents: number;
  prunedIntents: number;
  blockNumber: string;       // BigInt as string
  timestamp: string;         // BigInt as string
  txHash: string;
  updatedAt: string;         // BigInt as string
}

export interface DepositPaymentMethodEntity {
  id: string;                // escrowAddress_depositId_paymentMethodHash
  chainId: number;
  depositIdOnContract: string; // BigInt as string
  depositId: string;         // references Deposit.id
  paymentMethodHash: string;
  verifierAddress: string;
  intentGatingService: string;
  payeeDetailsHash: string;
  active: boolean;
}

export interface MethodCurrencyEntity {
  id: string;                // escrowAddress_depositId_paymentMethodHash_currencyCode
  chainId: number;
  depositIdOnContract: string; // BigInt as string
  depositId: string;         // references Deposit.id
  paymentMethodHash: string;
  currencyCode: string;
  minConversionRate: string; // BigInt as string
}

export type IntentStatus = 'SIGNALED' | 'FULFILLED' | 'PRUNED' | 'MANUALLY_RELEASED';

export interface IntentEntity {
  id: string;                // chainId_intentHash
  intentHash: string;
  depositId: string;         // references Deposit.id
  orchestratorAddress: string;
  verifier: string;
  owner: string;
  toAddress: string;
  amount: string;            // BigInt as string
  fiatCurrency: string;
  conversionRate: string;    // BigInt as string
  status: IntentStatus;
  isExpired: boolean;        // Set by off-chain reconciler when expiryTime has passed
  signalTimestamp: string;   // seconds as string
  expiryTime?: string;
  fulfillTimestamp?: string | null;
  pruneTimestamp?: string | null;
  updatedAt?: string | null;
  signalTxHash: string;
  fulfillTxHash?: string | null;
  pruneTxHash?: string | null;
  paymentMethodHash?: string | null;
  // Verified payment details (from UnifiedVerifier_V21_PaymentVerified)
  paymentAmount?: string | null;      // Actual fiat amount paid (may be partial)
  paymentCurrency?: string | null;    // Actual currency paid (may differ from fiatCurrency)
  paymentTimestamp?: string | null;   // When payment was made (from proof)
  paymentId?: string | null;          // External payment ID (platform-specific)
  // Released amounts
  releasedAmount?: string | null;     // Actual USDC released (gross, before protocol fees)
  takerAmountNetFees?: string | null; // Actual USDC taker received (net, after fees)
}

export interface DepositWithRelations extends DepositEntity {
  paymentMethods?: DepositPaymentMethodEntity[];
  currencies?: MethodCurrencyEntity[];
  intents?: IntentEntity[];
}

export interface IntentFulfilledEntity {
  intentHash: string;
  isManualRelease: boolean;
  fundsTransferredTo?: string | null;
}
