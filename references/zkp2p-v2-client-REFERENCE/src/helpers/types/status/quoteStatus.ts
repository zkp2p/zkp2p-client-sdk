export const QuoteState = {
  DEFAULT: 'default',
  EXCEEDS_ORDER_COUNT: 'exceeds-order-count',
  INVALID_FIAT_CURRENCY: 'invalid-fiat-currency',
  AMOUNT_BELOW_TRANSFER_MIN: 'amount-below-transfer-min',
  INVALID_RECIPIENT_ADDRESS: 'invalid-recipient-address',
  PLATFORM_NOT_SUPPORTED_ON_MOBILE: 'platform-not-supported-on-mobile',
  FETCHING_QUOTE: 'fetching-quote',
  FAILED_TO_FETCH_QUOTE: 'failed-to-fetch-quote',
  TOO_MANY_REQUESTS_FAILED_TO_FETCH_QUOTE: 'too-many-requests-failed-to-fetch-quote',
  FETCH_QUOTE_SUCCESS: 'fetch-quote-success',
  FETCHING_SIGNED_INTENT: 'fetching-signed-intent',
  FAILED_TO_FETCH_SIGNED_INTENT: 'failed-to-fetch-signed-intent',
  SIGNAL_INTENT_TRANSACTION_LOADING: 'transaction-loading',
  SIGNAL_INTENT_TRANSACTION_MINING: 'transaction-mining',
  SIGNAL_INTENT_TRANSACTION_FAILED: 'transaction-failed',
  DONE: 'done',
  MAINTENANCE: 'maintenance',
};


export type QuoteStateType = typeof QuoteState[keyof typeof QuoteState];