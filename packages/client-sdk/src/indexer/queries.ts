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
  amount
  remainingDeposits
  intentAmountMin
  intentAmountMax
  acceptingIntents
  status
  outstandingIntentAmount
  availableLiquidity
  totalAmountTaken
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
      signalTimestamp
      expiryTime
      fulfillTimestamp
      pruneTimestamp
      updatedAt
      signalTxHash
      fulfillTxHash
      pruneTxHash
      paymentMethodHash
    }
  }
`;
