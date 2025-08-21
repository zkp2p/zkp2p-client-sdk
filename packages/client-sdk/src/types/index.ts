// Minimal initial type surface; will be expanded by porting from RN SDK
import type { Address, Hash, WalletClient } from 'viem';
import type { CurrencyType } from '../utils/currency';
import type { ReclaimProof } from '../utils/proofEncoding';

/**
 * Timeout configuration for different operation types
 */
export type TimeoutConfig = {
  /** API call timeout in milliseconds (default: 30000) */
  api?: number;
  /** Transaction timeout in milliseconds (default: 60000) */
  transaction?: number;
  /** Proof generation timeout in milliseconds (default: 120000) */
  proofGeneration?: number;
  /** Extension communication timeout in milliseconds (default: 60000) */
  extension?: number;
};

export type Zkp2pClientOptions = {
  walletClient: WalletClient;
  apiKey: string;
  chainId: number;
  baseApiUrl?: string;
  witnessUrl?: string;
  rpcUrl?: string;
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
 * Parameters for fulfilling an intent with payment proofs
 */
export type FulfillIntentParams = {
  /** Array of payment proofs from the provider */
  paymentProofs: ProofData[];
  /** Hash of the intent to fulfill */
  intentHash: Hash;
  /** Optional payment method identifier */
  paymentMethod?: number;
  /** Callback when transaction is successfully sent */
  onSuccess?: ActionCallback;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when transaction is mined */
  onMined?: ActionCallback;
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
};
export type QuoteFeesResponse = { zkp2pFee: string; zkp2pFeeFormatted: string; swapFee: string; swapFeeFormatted: string };
export type QuoteResponse = {
  message: string;
  success: boolean;
  responseObject: { fiat: FiatResponse; token: TokenResponse; quotes: QuoteSingleResponse[]; fees: QuoteFeesResponse };
  statusCode: number;
};

export type GetPayeeDetailsRequest = { hashedOnchainId: string; platform: string };
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

/**
 * Payment proof data structure
 */
export interface ProofData {
  /** Type of proof (currently only 'reclaim' supported) */
  proofType: 'reclaim';
  /** The actual proof object from Reclaim protocol */
  proof: ReclaimProof;
}

// Re-export ReclaimProof for consumers
export type { ReclaimProof };

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

// Extension types (ported structure)
export type ExtensionEventMessage = {
  origin: string;
  data: {
    type: string;
    status: string;
    proofId?: string;
    platform?: string;
    requestHistory?: {
      notaryRequests?: ExtensionNotaryProofRequest[];
      notaryRequest?: ExtensionNotaryProofRequest;
    };
  };
};

export type ExtensionEventVersionMessage = { origin: string; data: { type: string; status: string; version: string } };

export type ExtensionRequestMetadataMessage = {
  origin: string;
  data: { type: string; status: string; metadata: ExtensionRequestMetadata[]; platform: string; expiresAt: number; requestId: string };
};

export type ExtensionRequestMetadata = {
  recipient?: string;
  amount?: string;
  date?: string;
  currency?: string;
  paymentId?: string;
  type?: string;
  recipientName?: string;
  originalIndex: number;
  hidden: boolean;
};

export type ExtensionNotaryProofRequest = {
  body: string;
  headers: string;
  id: string;
  maxTranscriptSize: number;
  method: string;
  notaryUrl: string;
  proof: any;
  secretHeaders: string[];
  secretResps: string[];
  status: string;
  url: string;
  verification: any;
  metadata: any;
  websocketProxyUrl: string;
};

// On-chain views
export type { EscrowDepositView, EscrowIntentView } from './escrowViews';
