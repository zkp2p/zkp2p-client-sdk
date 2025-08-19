// Minimal initial type surface; will be expanded by porting from RN SDK
import type { Address, Hash, WalletClient } from 'viem';
import type { CurrencyType } from '../utils/currency';

export type Zkp2pClientOptions = {
  walletClient: WalletClient;
  apiKey: string;
  chainId: number;
  baseApiUrl?: string;
  witnessUrl?: string;
  rpcUrl?: string;
};

export type ActionCallback = (params: { hash: Hash; data?: any }) => void;

export type FulfillIntentParams = {
  paymentProofs: any[];
  intentHash: Hash;
  paymentMethod?: number;
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};

export type ReleaseFundsToPayerParams = {
  intentHash: Hash;
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};

export type SignalIntentParams = {
  processorName: string;
  depositId: string;
  tokenAmount: string;
  payeeDetails: string;
  toAddress: string;
  currency: CurrencyType;
  onSuccess?: ActionCallback;
  onError?: (error: Error) => void;
  onMined?: ActionCallback;
};

// (removed placeholder Create/Withdraw/Cancel types; see refined forms below)

export type IntentSignalRequest = {
  processorName: string;
  depositId: string;
  tokenAmount: string;
  payeeDetails: string;
  toAddress: string;
  fiatCurrencyCode: string;
  chainId: string;
};

export type SignalIntentResponse = {
  success: boolean;
  message: string;
  responseObject: {
    depositData: Record<string, any>;
    signedIntent: string;
    intentData: {
      depositId: string;
      tokenAmount: string;
      recipientAddress: string;
      verifierAddress: string;
      currencyCodeHash: string;
      gatingServiceSignature: string;
    };
  };
  statusCode: number;
};

export type PostDepositDetailsRequest = {
  depositData: { [key: string]: string };
  processorName: string;
};

export type PostDepositDetailsResponse = {
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
export type QuoteIntentResponse = {
  depositId: string;
  processorName: string;
  amount: string;
  toAddress: string;
  payeeDetails: string;
  processorIntentData: any;
  fiatCurrencyCode: string;
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

// Onchain currency and deposit verifier types used in createDeposit action
export type OnchainCurrency = { code: `0x${string}`; conversionRate: bigint };
export type DepositVerifierData = {
  intentGatingService: `0x${string}`;
  payeeDetails: string;
  data: `0x${string}`;
};

// CreateDeposit refined inputs
export type Range = { min: bigint; max: bigint };
export type CreateDepositConversionRate = { currency: string; conversionRate: string };
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
