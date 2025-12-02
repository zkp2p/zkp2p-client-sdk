/**
 * @zkp2p/offramp-sdk
 *
 * Offramp SDK by Peer - TypeScript SDK for deposit management,
 * liquidity provision, and fiat off-ramping on Base.
 *
 * **RPC-first architecture**: All primary queries use on-chain reads via ProtocolViewer
 * for instant, real-time data with no indexer lag. Advanced historical queries are
 * available via `client.indexer.*`.
 *
 * @example
 * ```typescript
 * import { OfframpClient, Currency } from '@zkp2p/offramp-sdk';
 *
 * const client = new OfframpClient({
 *   walletClient,
 *   chainId: 8453,
 * });
 *
 * // Query deposits (RPC - instant, real-time)
 * const deposits = await client.getDeposits();
 * const deposit = await client.getDeposit(42n);
 *
 * // Query intents (RPC - instant, real-time)
 * const intents = await client.getIntents();
 *
 * // Create a deposit
 * await client.createDeposit({
 *   token: USDC_ADDRESS,
 *   amount: 10000000000n,
 *   intentAmountRange: { min: 100000n, max: 1000000000n },
 *   processorNames: ['wise', 'revolut'],
 *   depositData: [{ email: 'you@example.com' }, { tag: '@you' }],
 *   conversionRates: [[{ currency: Currency.USD, conversionRate: '1.02' }]],
 * });
 *
 * // Advanced indexer queries (for historical/filtered data)
 * const activeDeposits = await client.indexer.getDeposits({ status: 'ACTIVE' });
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Main Client
// =============================================================================

export { Zkp2pClient as OfframpClient } from './client/Zkp2pClient';
export { Zkp2pClient } from './client/Zkp2pClient';

// =============================================================================
// Client Types
// =============================================================================

export type {
  // Client configuration
  Zkp2pClientOptions,
  TimeoutConfig,
  ActionCallback,

  // Deposit operations
  CreateDepositParams,
  CreateDepositConversionRate,
  Range,
  WithdrawDepositParams,

  // Intent operations
  SignalIntentParams,
  FulfillIntentParams,
  ReleaseFundsToPayerParams,
  CancelIntentParams,

  // API types
  QuoteRequest,
  QuoteResponse,
  QuoteSingleResponse,
  QuoteIntentResponse,
  QuoteFeesResponse,
  FiatResponse,
  TokenResponse,

  // Deposit API types
  ApiDeposit,
  DepositVerifier,
  DepositVerifierCurrency,
  DepositStatus,
  GetOwnerDepositsRequest,
  GetOwnerDepositsResponse,
  GetDepositByIdRequest,
  GetDepositByIdResponse,

  // Intent API types
  Intent,
  ApiIntentStatus,
  GetOwnerIntentsRequest,
  GetOwnerIntentsResponse,
  GetIntentsByDepositRequest,
  GetIntentsByDepositResponse,
  GetIntentByHashRequest,
  GetIntentByHashResponse,

  // Payee details API
  ValidatePayeeDetailsRequest,
  ValidatePayeeDetailsResponse,
  PostDepositDetailsRequest,
  PostDepositDetailsResponse,
  RegisterPayeeDetailsRequest,
  RegisterPayeeDetailsResponse,
  GetPayeeDetailsRequest,
  GetPayeeDetailsResponse,

  // On-chain types
  OnchainCurrency,
  DepositVerifierData,
  EscrowDepositView,
  EscrowIntentView,

  // Statistics
  OrderStats,
  DepositIntentStatistics,
} from './types';

// =============================================================================
// Indexer
// =============================================================================

export { IndexerClient, defaultIndexerEndpoint } from './indexer/client';
export { IndexerDepositService } from './indexer/service';
export {
  createCompositeDepositId,
  convertIndexerDepositToEscrowView,
  convertDepositsForLiquidity,
  convertIndexerIntentsToEscrowViews,
} from './indexer/converters';
export {
  fetchFulfillmentAndPayment as fetchIndexerFulfillmentAndPayment,
} from './indexer/intentVerification';

// Indexer types
export type {
  DepositEntity as IndexerDeposit,
  IntentEntity as IndexerIntent,
  DepositWithRelations as IndexerDepositWithRelations,
  IntentFulfilledEntity as IndexerIntentFulfilled,
  DepositPaymentMethodEntity as IndexerDepositPaymentMethod,
  MethodCurrencyEntity as IndexerMethodCurrency,
  IntentStatus as IndexerIntentStatus,
} from './indexer/types';
export type {
  DepositFilter as IndexerDepositFilter,
  PaginationOptions as IndexerDepositPagination,
  DepositOrderField as IndexerDepositOrderField,
  OrderDirection as IndexerDepositOrderDirection,
} from './indexer/service';
export type { DeploymentEnv as IndexerDeploymentEnv } from './indexer/client';
export type {
  FulfillmentRecord as IndexerFulfillmentRecord,
  PaymentVerifiedRecord as IndexerPaymentVerifiedRecord,
  FulfillmentAndPaymentResponse as IndexerFulfillmentAndPaymentResponse,
} from './indexer/intentVerification';

// =============================================================================
// API Adapters
// =============================================================================

export {
  apiValidatePayeeDetails,
  apiPostDepositDetails,
  apiGetPayeeDetails,
} from './adapters/api';

// =============================================================================
// Constants
// =============================================================================

export { PAYMENT_PLATFORMS, PLATFORM_METADATA, SUPPORTED_CHAIN_IDS, TOKEN_METADATA } from './constants';
export type { PaymentPlatformType, SupportedChainId } from './constants';

// =============================================================================
// Currency Utilities
// =============================================================================

export {
  Currency,
  currencyInfo,
  getCurrencyInfoFromHash,
  getCurrencyInfoFromCountryCode,
  getCurrencyCodeFromHash,
  isSupportedCurrencyHash,
  mapConversionRatesToOnchainMinRate,
} from './utils/currency';
export type { CurrencyType, CurrencyData } from './utils/currency';

// =============================================================================
// Payment Resolution
// =============================================================================

export {
  resolvePaymentMethodHash,
  resolveFiatCurrencyBytes32,
  resolvePaymentMethodHashFromCatalog,
  resolvePaymentMethodNameFromHash,
} from './utils/paymentResolution';

// =============================================================================
// Contract Helpers
// =============================================================================

export { getContracts, getPaymentMethodsCatalog, getGatingServiceAddress } from './contracts';
export type { RuntimeEnv, PaymentMethodCatalog } from './contracts';

// =============================================================================
// Byte Utilities
// =============================================================================

export { ensureBytes32, asciiToBytes32 } from './utils/bytes32';

// =============================================================================
// Protocol Viewer Types (RPC responses)
// =============================================================================

export {
  parseDepositView,
  parseIntentView,
  enrichPvDepositView,
  enrichPvIntentView,
} from './utils/protocolViewerParsers';

export type {
  PV_DepositView as DepositView,
  PV_Deposit as Deposit,
  PV_PaymentMethodData as PaymentMethodData,
  PV_Currency as DepositCurrency,
  PV_IntentView as IntentView,
  PV_Intent as OnchainIntent,
} from './utils/protocolViewerParsers';

// =============================================================================
// Logging
// =============================================================================

export { logger, setLogLevel } from './utils/logger';
export type { LogLevel } from './utils/logger';

// =============================================================================
// Errors
// =============================================================================

export * from './errors';
