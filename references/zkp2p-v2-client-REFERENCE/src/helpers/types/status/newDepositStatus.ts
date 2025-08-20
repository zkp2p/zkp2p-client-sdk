export const NewDepositTransactionStatus = {
  DEFAULT: 'default',
  MISSING_PAYEE_DETAILS: 'missing_payee_details',
  MISSING_AMOUNTS: 'missing_amounts',
  MISSING_MIN_MAX_AMOUNTS: 'missing_min_max_amounts',
  MISSING_PLATFORMS: 'missing_platforms',
  INVALID_PLATFORM_CURRENCY_RATES: 'invalid_platform_currency_rates',
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  VALIDATE_PAYEE_DETAILS: 'validate_payee_details',
  POSTING_PAYEE_DETAILS: 'posting_payee_details',
  INVALID_PAYEE_DETAILS: 'invalid_payee_details',
  APPROVAL_REQUIRED: 'approval_required',
  TRANSACTION_SIGNING: 'transaction_signing',
  TRANSACTION_MINING: 'transaction_mining',
  CONVENIENCE_FEE_INVALID: 'convenience_fee_invalid',
  MIN_DEPOSIT_THRESHOLD_NOT_MET: 'min_deposit_threshold_not_met',
  MAX_PER_ORDER_GREATER_THAN_DEPOSIT_AMOUNT: 'max_per_order_greater_than_deposit_amount',
  MIN_PER_ORDER_GREATER_THAN_MAX_PER_ORDER: 'min_per_order_greater_than_max_per_order',
  MIN_PER_ORDER_LESS_THAN_MINIMUM_AMOUNT: 'min_per_order_less_than_minimum_amount',
  VALID: 'valid',
  TRANSACTION_SUCCEEDED: 'transaction_succeeded'
};

export type NewDepositTransactionStatusType = typeof NewDepositTransactionStatus[keyof typeof NewDepositTransactionStatus];