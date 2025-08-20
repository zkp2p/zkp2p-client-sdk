import { CurrencyType } from '../currency';
import { ExtensionRequestMetadata } from '@helpers/types';

// Platforms that can be used to send payments
export const PaymentPlatform = {
  VENMO: "venmo",
  CASHAPP: "cashapp",
  REVOLUT: "revolut",
  WISE: "wise",
  MERCADO_PAGO: "mercadopago",
  ZELLE: "zelle",
  PAYPAL: "paypal",
  MONZO: "monzo",
};

export const paymentPlatforms = [...Object.values(PaymentPlatform)];
export type PaymentPlatformType = typeof PaymentPlatform[keyof typeof PaymentPlatform];


// Payment platform enums and interfaces
export enum PaymentPlatformDefaultPaymentMode {
  QR_CODE = "QR_CODE",
  WEB_PAYMENT = "WEB_PAYMENT",
}

export interface ParsedPaymentDetails {
  amount: string;
  parsedAmount: boolean; // whether the amount was successfully parsed
  date: string;
  parsedDate: boolean; // whether the date was successfully parsed
  recipientId: string;
  parsedRecipientId: boolean; // whether the recipientId was successfully parsed
  currency: string;
  parsedCurrency: boolean; // whether the currency was successfully parsed
}

export interface ProofExtractedParameters {
  amount: string;
  recipient: string;
  currency: string;
  paymentPlatform: string;
  date: string;
  paymentId: string;
  intentHash: string;
  providerHash: string;
}


export interface SendPaymentConfig {
  paymentMethodName?: string;
  paymentMethodIcon?: string;
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode;
  useCustomQRCode?: boolean;
  payeeDetailPrefix?: string;
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => string;
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => string;
  supportsSendingPaymentOnWeb: boolean;
  showTroubleScanningQRCodeLink: boolean;
  sendPaymentWarning?: (sendCurrency: CurrencyType, amountFiatToSend: string) => string;
  sendPaymentInfo?: (sendCurrency: CurrencyType, amountFiatToSend: string) => string;
}

export interface PaymentVerificationConfig {
  authLink: string;
  actionType: string;
  actionPlatform: string;
  numPaymentsFetched: number;
  minExtensionVersion: string;
  supportsAppclip: boolean;
  parseExtractedParameters: (parameters: string) => ProofExtractedParameters;
  parseMetadata: (metadata: ExtensionRequestMetadata) => ParsedPaymentDetails;
  reverseTransactionHistoryOrder?: boolean;
  getSubjectText: (metadata: ExtensionRequestMetadata) => string;
  totalProofs: number;
}


export interface PlatformDepositConfig {
  depositRequiresApproval: boolean;
  payeeDetailInputPlaceholder: string;
  payeeDetailInputHelperText: string;
  payeeDetailValidationFailureMessage: string;
  getDepositData: (payeeDetails: string, telegramUsername?: string) => { [key: string]: string };
  getPayeeDetail: (data: { [key: string]: string }) => string;
}

export interface PaymentPlatformConfig {
  platformId: PaymentPlatformType;
  platformLogo?: string;
  platformName: string;
  platformCurrencies: CurrencyType[];
  minFiatAmount: string
  localeTimeString: string;
  platformIcon?: string;
  platformColor?: string; // Platform's brand color for fallback logo background

  // One deposit config per platform
  depositConfig: PlatformDepositConfig;

  hasMultiplePaymentMethods: boolean;
  // Multiple payment methods per platform
  paymentMethods: Array<{
    sendConfig: SendPaymentConfig,
    verifyConfig: PaymentVerificationConfig
  }>
}