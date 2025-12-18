// Minimal initial type surface for Offramp SDK
import type { AccessList, Address, AuthorizationList, Hash, WalletClient } from 'viem';
import type { CurrencyType } from '../utils/currency';

/**
 * Timeout configuration for different operation types
 */
export type TimeoutConfig = {
  /** API call timeout in milliseconds (default: 30000) */
  api?: number;
  /** Transaction timeout in milliseconds (default: 60000) */
  transaction?: number;
};

export type Zkp2pClientOptions = {
  walletClient: WalletClient;
  apiKey: string;
  chainId: number;
  environment?: 'production' | 'staging';
  baseApiUrl?: string;
  witnessUrl?: string;
  rpcUrl?: string;
  /** Optional bearer token for hybrid auth */
  authorizationToken?: string;
  /** Optional timeout configuration */
  timeouts?: TimeoutConfig;
};

/**
 * Callback function for transaction actions
 * @param params - Transaction callback parameters
 * @param params.hash - Transaction hash
 * @param params.data - Optional additional data from the transaction
 */
export type ActionCallback = (params: { hash: Hash; data?: unknown }) => void;

/**
 * Safe transaction overrides including ERC-8021 referrers.
 * Referrer codes are prepended before the Base builder code (bc_nbn6qkni).
 */
export type TxOverrides = {
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  value?: bigint;
  accessList?: AccessList;
  authorizationList?: AuthorizationList;
  /**
   * ERC-8021 referrer code(s) to prepend before the Base builder code.
   * Accepts a single code or multiple (e.g., ['zkp2p-bot', 'merchant-id']).
   */
  referrer?: string | string[];
};

/**
 * Parameters for fulfilling an intent with payment attestation
 */
export type FulfillIntentParams = {
  /** Hash of the intent to fulfill */
  intentHash: Hash;
  /** Attestation proof - object or stringified JSON from attestation service */
  proof: Record<string, unknown> | string;
  /** Optional attestation timestamp buffer override in milliseconds */
  timestampBufferMs?: number | string;
  /** Override the attestation service base URL */
  attestationServiceUrl?: string;
  /** Override the verifying contract (defaults to UnifiedPaymentVerifier) */
  verifyingContract?: Address;
  /** Optional hook payload passed to orchestrator */
  postIntentHookData?: `0x${string}`;
  /** Optional viem transaction overrides */
  txOverrides?: TxOverrides;
  /** Optional lifecycle callbacks */
  callbacks?: {
    onAttestationStart?: () => void;
    onTxSent?: (hash: Hash) => void;
    onTxMined?: (hash: Hash) => void;
  };
};

/**
 * Parameters for releasing funds back to the payer
 */
export type ReleaseFundsToPayerParams = {
  /** Hash of the intent to release funds for */
  intentHash: Hash;
  /** Callback when transaction is successfully sent */
  onSuccess?: ActionCallback;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when transaction is mined */
  onMined?: ActionCallback;
};

/**
 * Parameters for signaling an intent to use a deposit
 */
export type SignalIntentParams = {
  /** Payment processor name (e.g., 'wise', 'revolut') */
  processorName: string;
  /** ID of the deposit to use */
  depositId: string;
  /** Amount of tokens to transfer */
  tokenAmount: string;
  /** Payee details for the payment */
  payeeDetails: string;
  /** Recipient blockchain address */
  toAddress: string;
  /** Currency type for the payment */
  currency: CurrencyType;
  /** Callback when transaction is successfully sent */
  onSuccess?: ActionCallback;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when transaction is mined */
  onMined?: ActionCallback;
};

// (removed placeholder Create/Withdraw/Cancel types; see refined forms below)

/**
 * Request structure for signaling an intent via the API
 */
export type IntentSignalRequest = {
  /** Payment processor name */
  processorName: string;
  /** ID of the deposit */
  depositId: string;
  /** Amount of tokens */
  tokenAmount: string;
  /** Payee details */
  payeeDetails: string;
  /** Recipient address */
  toAddress: string;
  /** Fiat currency code */
  fiatCurrencyCode: string;
  /** Chain ID as string */
  chainId: string;
};

/**
 * Response from signaling an intent via the API
 */
export type SignalIntentResponse = {
  /** Whether the request was successful */
  success: boolean;
  /** Response message */
  message: string;
  /** Response object containing intent details */
  responseObject: {
    /** Deposit data associated with the intent */
    depositData: Record<string, string | number | boolean>;
    /** Signed intent string */
    signedIntent: string;
    /** Intent data details */
    intentData: {
      /** Deposit ID */
      depositId: string;
      /** Token amount */
      tokenAmount: string;
      /** Recipient address */
      recipientAddress: string;
      /** Verifier contract address */
      verifierAddress: string;
      /** Hash of the currency code */
      currencyCodeHash: string;
      /** Signature from the gating service */
      gatingServiceSignature: string;
    };
  };
  /** HTTP status code */
  statusCode: number;
};

/**
 * Request structure for posting deposit details
 */
export type PostDepositDetailsRequest = {
  /** Deposit data key-value pairs */
  depositData: { [key: string]: string };
  /** Payment processor name */
  processorName: string;
};

/**
 * Response from posting deposit details
 */
export type PostDepositDetailsResponse = {
  /** Whether the request was successful */
  success: boolean;
  message: string;
  responseObject: {
    id: number;
    processorName: string;
    depositData: { [key: string]: string };
    hashedOnchainId: string;
    createdAt: string;
  };
  statusCode: number;
};

/**
 * Alias types for clarity when registering payee details (makers/create)
 */
export type RegisterPayeeDetailsRequest = PostDepositDetailsRequest;
export type RegisterPayeeDetailsResponse = PostDepositDetailsResponse;

export type QuoteRequest = {
  paymentPlatforms: string[];
  fiatCurrency: string;
  user: string;
  recipient: string;
  destinationChainId: number;
  destinationToken: string;
  referrer?: string;
  useMultihop?: boolean;
  quotesToReturn?: number;
  amount: string;
  isExactFiat?: boolean;
  /** Optional filter: limit quotes to these escrow contracts */
  escrowAddresses?: string[];
};

export type FiatResponse = { currencyCode: string; currencyName: string; currencySymbol: string; countryCode: string };
export type TokenResponse = { token: string; decimals: number; name: string; symbol: string; chainId: number };
/**
 * Intent details within a quote response
 */
export type QuoteIntentResponse = {
  /** Deposit ID */
  depositId: string;
  /** Payment processor name */
  processorName: string;
  /** Amount to transfer */
  amount: string;
  /** Recipient address */
  toAddress: string;
  /** Payee details */
  payeeDetails: string;
  /** Processor-specific intent data */
  processorIntentData: Record<string, unknown>;
  /** Fiat currency code */
  fiatCurrencyCode: string;
  /** Chain ID */
  chainId: string;
};
export type QuoteSingleResponse = {
  fiatAmount: string;
  fiatAmountFormatted: string;
  tokenAmount: string;
  tokenAmountFormatted: string;
  paymentMethod: string;
  payeeAddress: string;
  conversionRate: string;
  intent: QuoteIntentResponse;
  payeeData?: Record<string, string>;
};
export type QuoteFeesResponse = { zkp2pFee: string; zkp2pFeeFormatted: string; swapFee: string; swapFeeFormatted: string };
export type QuoteResponse = {
  message: string;
  success: boolean;
  responseObject: { fiat: FiatResponse; token: TokenResponse; quotes: QuoteSingleResponse[]; fees: QuoteFeesResponse };
  statusCode: number;
};

/**
 * Request to fetch payee details
 * Prefer `processorName`; `platform` kept for backward compatibility.
 */
export type GetPayeeDetailsRequest = { hashedOnchainId: string; processorName: string };
export type GetPayeeDetailsResponse = {
  success: boolean;
  message: string;
  responseObject: {
    id: number;
    processorName: string;
    depositData: { [key: string]: string };
    hashedOnchainId: string;
    createdAt: string;
};
  statusCode: number;
};

// Makers list (presented)
export type ListPayeesRequest = { processorName?: string };
export type PresentedMaker = { id?: number; processorName: string; hashedOnchainId: string; createdAt: string };
export type ListPayeesResponse = { success: boolean; message: string; responseObject: PresentedMaker[]; statusCode: number };

export type ValidatePayeeDetailsRequest = {
  processorName: string;
  depositData: { [key: string]: string };
};

export type ValidatePayeeDetailsResponse = {
  success: boolean;
  message: string;
  responseObject: { isValid: boolean; errors?: string[] };
  statusCode: number;
};

// Onchain currency and deposit verifier types used in createDeposit action
export type OnchainCurrency = { code: `0x${string}`; conversionRate: bigint };
export type DepositVerifierData = {
  intentGatingService: `0x${string}`;
  payeeDetails: string;
  data: `0x${string}`;
};

// CreateDeposit refined inputs
export type Range = { min: bigint; max: bigint };
export type CreateDepositConversionRate = { currency: CurrencyType; conversionRate: string };
export type CreateDepositParams = {
  token: Address;
  amount: bigint;
  intentAmountRange: Range;
  conversionRates: CreateDepositConversionRate[][];
  processorNames: string[];
  depositData: { [key: string]: string }[];
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};

export type WithdrawDepositParams = {
  depositId: string | number | bigint;
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};

export type CancelIntentParams = {
  intentHash: Hash;
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};


// Historical Event Types (for deposits and intents)
export type DepositStatus = 'ACTIVE' | 'WITHDRAWN' | 'CLOSED';

export type Deposit = {
  id: string;
  owner: string;
  amount: string;
  minimumIntent: string;
  maximumIntent: string;
  status: DepositStatus;
  updatedAt: Date;
  createdAt: Date;
  processorPaymentData: Array<{
    processor: string;
    paymentDetailsHash: string;
    isHashed: boolean;
    paymentDetails: string;
    updatedAt: Date;
    createdAt: Date;
  }>;
};

// API Intent status per v1 Orders API
export type ApiIntentStatus = 'SIGNALED' | 'FULFILLED' | 'PRUNED';

export type Intent = {
  id: number;
  intentHash: string;
  depositId: string;
  verifier: string;
  owner: string;
  toAddress: string;
  amount: string;
  fiatCurrency: string;
  conversionRate: string;
  sustainabilityFee: string | null;
  verifierFee: string | null;
  status: ApiIntentStatus;
  signalTxHash: string;
  signalTimestamp: Date;
  fulfillTxHash: string | null;
  fulfillTimestamp: Date | null;
  pruneTxHash: string | null;
  prunedTimestamp: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GetOwnerIntentsRequest = {
  ownerAddress: string;
  status?: ApiIntentStatus | ApiIntentStatus[];
};

export type GetOwnerIntentsResponse = {
  success: boolean;
  message: string;
  responseObject: Intent[];
  statusCode: number;
};

// Orders API types
export type GetIntentsByDepositRequest = {
  depositId: string;
  status?: ApiIntentStatus | ApiIntentStatus[];
};

export type GetIntentsByDepositResponse = {
  success: boolean;
  message: string;
  responseObject: Intent[];
  statusCode: number;
};

export type GetIntentsByTakerRequest = {
  takerAddress: string;
  status?: ApiIntentStatus | ApiIntentStatus[];
};

export type GetIntentsByTakerResponse = {
  success: boolean;
  message: string;
  responseObject: Intent[];
  statusCode: number;
};

export type GetIntentsByRecipientRequest = {
  recipientAddress: string;
  status?: ApiIntentStatus | ApiIntentStatus[];
};

export type GetIntentsByRecipientResponse = {
  success: boolean;
  message: string;
  responseObject: Intent[];
  statusCode: number;
};

export type GetIntentByHashRequest = {
  intentHash: string;
};

export type GetIntentByHashResponse = {
  success: boolean;
  message: string;
  responseObject: Intent;
  statusCode: number;
};

// Deposits API types aligned with v1
export type DepositVerifierCurrency = { id?: number; depositVerifierId?: number; currencyCode: string; conversionRate: string; createdAt?: Date; updatedAt?: Date };
export type DepositVerifier = { id?: number; depositId: number; verifier: string; intentGatingService: string; payeeDetailsHash: string; data: string; createdAt?: Date; updatedAt?: Date; currencies: DepositVerifierCurrency[] };
export type ApiDeposit = {
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
  status: 'ACTIVE' | 'WITHDRAWN' | 'CLOSED';
  totalIntents: number;
  signaledIntents: number;
  fulfilledIntents: number;
  prunedIntents: number;
  createdAt?: Date;
  updatedAt?: Date;
  verifiers: DepositVerifier[];
};

export type GetOwnerDepositsRequest = {
  ownerAddress: string;
  /** Optional status filter: 'ACTIVE' | 'WITHDRAWN' | 'CLOSED' */
  status?: DepositStatus;
};

export type GetOwnerDepositsResponse = {
  success: boolean;
  message: string;
  responseObject: ApiDeposit[];
  statusCode: number;
};

export type GetDepositByIdRequest = { depositId: string };
export type GetDepositByIdResponse = { success: boolean; message: string; responseObject: ApiDeposit; statusCode: number };

// Intent/order statistics returned by `/deposits/order-stats`
export type OrderStats = {
  id: number;
  totalIntents: number;
  signaledIntents: number;
  fulfilledIntents: number;
  prunedIntents: number;
};

// Kept for backward compatibility
export type DepositIntentStatistics = OrderStats;
export type GetDepositsOrderStatsRequest = { depositIds: number[] };
export type GetDepositsOrderStatsResponse = { success: boolean; message: string; responseObject: OrderStats[]; statusCode: number };

// Currency domain (ISO) and on-chain currency mapping
export { Currency } from '../utils/currency';
export type { CurrencyType } from '../utils/currency';

// Payment platforms (derived as a closed union for safety)
export const PAYMENT_PLATFORMS = [
  'wise',
  'venmo',
  'revolut',
  'cashapp',
  'mercadopago',
  'zelle',
  'paypal',
  'monzo',
] as const;
export type PaymentPlatformType = typeof PAYMENT_PLATFORMS[number];


// On-chain views
export type { EscrowDepositView, EscrowIntentView } from './escrowViews';
