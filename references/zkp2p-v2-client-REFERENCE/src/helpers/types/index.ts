export { ProofGenerationStatus, ValidatePaymentStatus, ReclaimProofError } from './status/proofGenerationStatus';
export type { ProofGenerationStatusType, ValidatePaymentStatusType, ReclaimProofErrorType } from './status/proofGenerationStatus';

export { TransactionStatus } from './status/transactionStatus';
export type { TransactionStatusType } from './status/transactionStatus';

export { NewDepositTransactionStatus } from './status/newDepositStatus';
export type { NewDepositTransactionStatusType } from './status/newDepositStatus';

export { SendTransactionStatus, FetchQuoteStatus } from './sendStatus';
export type { SendTransactionStatusType, FetchQuoteStatusType } from './sendStatus';

export { LoginStatus } from './loginStatus';
export type { LoginStatusType } from './loginStatus';

// 
// Platform, Currency, Token
//

export { PaymentPlatform, paymentPlatforms, paymentPlatformInfo } from './paymentPlatforms';
export type { PaymentPlatformType } from './paymentPlatforms/types';

export { Currency, currencyInfo, currencies, getCurrencyInfoFromHash } from './currency';
export type { CurrencyType } from './currency';

//
// Escrow and Proof 
//

export type { Proof, ClaimInfo, CompleteClaimData, SignedClaim } from './proxyProof';
export { parseExtensionProof, encodeProofAsBytes } from './proxyProof';

export type { Abi, AbiEntry } from './smartContracts';

export type {
  EscrowCurrency,
  EscrowDeposit,
  EscrowDepositVerifierData,
  EscrowDepositView,
  EscrowIntent,
  EscrowIntentView,
  EscrowRange,
  EscrowVerifierDataView
} from './escrow';

//
// Curator
//

export type {
  IntentSignalRequest,
  SignalIntentResponse,
  PostDepositDetailsRequest,
  PostDepositDetailsResponse,
  QuoteMaxTokenForFiatRequest,
  QuoteResponse,
  QuoteMinFiatForTokenRequest,
  GetPayeeDetailsResponse
} from './curator'

//
// Extension
//

export type {
  ExtensionEventMessage,
  ExtensionEventVersionMessage,
  ExtensionRequestMetadataMessage,
  ExtensionRequestMetadata,
  ExtensionNotaryProofRequest,
} from './browserExtension'
export { ExtensionPostMessage, ExtensionReceiveMessage } from './browserExtension'

export { MODALS } from './modals';

export type { Address } from 'viem';

//
// Error Types
//

export { ErrorCategory, generateCorrelationId, createErrorLog, createEnhancedErrorLog } from './errors';
export type { ErrorContext, RollbarErrorLog } from './errors';

//
// Bridge Types
//

export { BridgeProvider } from './bridge';
export type {
  BridgeProviderCapabilities,
  ChainSupport,
  BridgeProviderConfig,
  BridgeConfig,
  BridgeProviderSelection,
  UnifiedBridgeProvider,
  BridgeExecutionContext,
  ProviderHealthStatus,
  BridgeAttemptMetadata
} from './bridge';
