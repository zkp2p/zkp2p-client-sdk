/**
 * Indexer entity types (GraphQL schema-aligned)
 */

export type DepositStatus = 'ACTIVE' | 'CLOSED' | 'WITHDRAWN';

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
  totalAmountTaken?: string;       // BigInt as string
  totalWithdrawn?: string;         // BigInt as string
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
  signalTimestamp: string;   // seconds as string
  fulfillTimestamp?: string | null;
  pruneTimestamp?: string | null;
  updatedAt?: string | null;
  signalTxHash: string;
  fulfillTxHash?: string | null;
  pruneTxHash?: string | null;
  paymentMethodHash?: string | null;
}

export interface DepositWithRelations extends DepositEntity {
  paymentMethods?: DepositPaymentMethodEntity[];
  currencies?: MethodCurrencyEntity[];
  intents?: IntentEntity[];
}
