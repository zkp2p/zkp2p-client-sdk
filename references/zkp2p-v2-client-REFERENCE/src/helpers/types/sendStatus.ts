export const SendTransactionStatus = {
  DEFAULT: 'default',
  INVALID_RECIPIENT_ADDRESS: 'invalid_recipient_address',
  MISSING_AMOUNTS: 'missing_amounts',
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  TRANSACTION_SIGNING: 'transaction_signing',
  TRANSACTION_MINING: 'transaction_mining',
  VALID_FOR_ERC20_TRANSFER: 'valid_for_erc20_transfer',
  TRANSACTION_SUCCEEDED: 'transaction_succeeded',
  // Bridge-specific states
  FETCHING_BRIDGE_QUOTE: 'fetching_bridge_quote',
  BRIDGE_QUOTE_READY: 'bridge_quote_ready',
  WAITING_DESTINATION_TRANSACTION: 'waiting_destination_transaction',
  BRIDGE_COMPLETE: 'bridge_complete'
};

export type SendTransactionStatusType = typeof SendTransactionStatus[keyof typeof SendTransactionStatus];


export const FetchQuoteStatus = {
  DEFAULT: 'default',
  LOADING: 'loading',
  LOADED: 'loaded',
};

export type FetchQuoteStatusType = typeof FetchQuoteStatus[keyof typeof FetchQuoteStatus];
