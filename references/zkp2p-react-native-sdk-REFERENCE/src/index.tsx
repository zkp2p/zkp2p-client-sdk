import 'fast-text-encoding';

export { useZkp2p } from './hooks/useZkp2p';
export { Zkp2pProvider, Zkp2pContext } from './providers';
export { Zkp2pClient } from './client';
export { clearSession } from './utils/session';
export { DEPLOYED_ADDRESSES } from './utils/constants';
export { currencyInfo } from './utils/currency';

// Error handling exports
export {
  ZKP2PError,
  NetworkError,
  APIError,
  ContractError,
  ValidationError,
  ProofGenerationError,
  ErrorCode,
} from './errors';

export type {
  ExtractedMetadataList,
  NetworkEvent,
  ProviderSettings,
  ProofData,
  FlowState,
  InitiateOptions,
  AutoGenerateProofOptions,
  SignalIntentParams,
  FulfillIntentParams,
  SignalIntentResponse,
  WithdrawDepositParams,
  CancelIntentParams,
  ReleaseFundsToPayerParams,
  CreateDepositParams,
  PostDepositDetailsRequest,
  DepositVerifierData,
  Currency,
  IntentSignalRequest,
  QuoteRequest,
  QuoteResponse,
  GetPayeeDetailsRequest,
  GetPayeeDetailsResponse,
  AuthWVOverrides,
} from './types';
export type { ClearSessionOptions } from './utils/session';

export type { GnarkBridge, GnarkProofResult } from './bridges';
