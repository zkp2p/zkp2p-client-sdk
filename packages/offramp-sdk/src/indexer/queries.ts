/**
 * GraphQL queries for Hasura-backed ZKP2P indexer
 */

const DEPOSIT_FIELDS = `
  id
  chainId
  escrowAddress
  depositId
  depositor
  token
  remainingDeposits
  intentAmountMin
  intentAmountMax
  acceptingIntents
  status
  outstandingIntentAmount
  totalAmountTaken
  totalWithdrawn
  successRateBps
  totalIntents
  signaledIntents
  fulfilledIntents
  prunedIntents
  blockNumber
  timestamp
  txHash
  updatedAt
`;

export const DEPOSITS_QUERY = /* GraphQL */ `
  query GetDeposits(
    $where: Deposit_bool_exp
    $order_by: [Deposit_order_by!]
    $limit: Int
    $offset: Int
  ) {
    Deposit(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      ${DEPOSIT_FIELDS}
    }
  }
`;

export const DEPOSITS_BY_IDS_QUERY = /* GraphQL */ `
  query GetDepositsByIds($ids: [String!]) {
    Deposit(where: { id: { _in: $ids } }) {
      ${DEPOSIT_FIELDS}
    }
  }
`;

export const DEPOSIT_RELATIONS_QUERY = /* GraphQL */ `
  query GetDepositRelations($depositIds: [String!]) {
    DepositPaymentMethod(where: { depositId: { _in: $depositIds } }) {
      id
      chainId
      depositIdOnContract
      depositId
      paymentMethodHash
      verifierAddress
      intentGatingService
      payeeDetailsHash
      active
    }
    MethodCurrency(where: { depositId: { _in: $depositIds } }) {
      id
      chainId
      depositIdOnContract
      depositId
      paymentMethodHash
      currencyCode
      minConversionRate
    }
  }
`;

export const PAYMENT_METHODS_BY_PAYEE_HASH_QUERY = /* GraphQL */ `
  query GetPaymentMethodsByPayeeHash(
    $where: DepositPaymentMethod_bool_exp!
    $limit: Int
  ) {
    DepositPaymentMethod(where: $where, limit: $limit) {
      id
      chainId
      depositIdOnContract
      depositId
      paymentMethodHash
      verifierAddress
      intentGatingService
      payeeDetailsHash
      active
    }
  }
`;

export const DEPOSIT_WITH_RELATIONS_QUERY = /* GraphQL */ `
  query GetDepositWithRelations($id: String!) {
    Deposit_by_pk(id: $id) {
      ${DEPOSIT_FIELDS}
    }
    DepositPaymentMethod(where: { depositId: { _eq: $id } }) {
      id
      chainId
      depositIdOnContract
      depositId
      paymentMethodHash
      verifierAddress
      intentGatingService
      payeeDetailsHash
      active
    }
    MethodCurrency(where: { depositId: { _eq: $id } }) {
      id
      chainId
      depositIdOnContract
      depositId
      paymentMethodHash
      currencyCode
      minConversionRate
    }
  }
`;

export const INTENTS_QUERY = /* GraphQL */ `
  query GetIntents(
    $where: Intent_bool_exp
    $order_by: [Intent_order_by!]
    $limit: Int
    $offset: Int
  ) {
    Intent(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      intentHash
      depositId
      orchestratorAddress
      verifier
      owner
      toAddress
      amount
      fiatCurrency
      conversionRate
      status
      isExpired
      signalTimestamp
      expiryTime
      fulfillTimestamp
      pruneTimestamp
      updatedAt
      signalTxHash
      fulfillTxHash
      pruneTxHash
      paymentMethodHash
      paymentAmount
      paymentCurrency
      paymentTimestamp
      paymentId
      releasedAmount
      takerAmountNetFees
    }
  }
`;

export const EXPIRED_INTENTS_QUERY = /* GraphQL */ `
  query GetExpiredIntents(
    $now: numeric!
    $limit: Int
    $depositIds: [String!]
  ) {
    Intent(
      where: {
        status: { _eq: "SIGNALED" }
        expiryTime: { _lt: $now }
        depositId: { _in: $depositIds }
      }
      order_by: { expiryTime: asc }
      limit: $limit
    ) {
      id
      intentHash
      depositId
      owner
      toAddress
      amount
      expiryTime
      isExpired
      updatedAt
      paymentMethodHash
    }
  }
`;

export const INTENT_FULFILLMENTS_QUERY = /* GraphQL */ `
  query GetFulfilledIntents($intentHashes: [String!]) {
    Orchestrator_V21_IntentFulfilled(
      where: { intentHash: { _in: $intentHashes } }
    ) {
      intentHash
      isManualRelease
      fundsTransferredTo
    }
  }
`;

export const FULFILLMENT_AND_PAYMENT_QUERY = /* GraphQL */ `
  query PaymentVerificationForFulfilledIntent($intentHash: String!) {
    Orchestrator_V21_IntentFulfilled(
      where: { intentHash: { _eq: $intentHash } }
    ) {
      id
      intentHash
      amount
      isManualRelease
      fundsTransferredTo
    }
    UnifiedVerifier_V21_PaymentVerified(
      where: { intentHash: { _eq: $intentHash } }
    ) {
      id
      intentHash
      method
      currency
      amount
      timestamp
      paymentId
      payeeId
    }
  }
`;
