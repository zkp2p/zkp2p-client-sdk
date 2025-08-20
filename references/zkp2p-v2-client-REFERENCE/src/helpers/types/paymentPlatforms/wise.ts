import { Currency, CurrencyType, currencyInfo } from '../currency';
import { ExtensionRequestMetadata } from '@helpers/types';
import {
  PaymentPlatform,
  PaymentPlatformDefaultPaymentMode,
  ProofExtractedParameters,
  ParsedPaymentDetails,
  PaymentPlatformConfig,
  SendPaymentConfig,
  PaymentVerificationConfig,
  PlatformDepositConfig
} from './types';
import wiseLogo from '@assets/images/platforms/wise.png';

// Define the Wise payment configuration
const wiseSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://wise.com/pay/me/${recipientId}`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://wise.com/pay/me/${recipientId}`,
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `You can send any currency. But ensure recipient gets at least ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} after fees in a single payment.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Please do not put zkp2p, crypto or any related terms in the payment notes or memo field.`;
  }
};

// Define the Wise verification configuration
const wiseVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://wise.com/all-transactions?direction=OUTGOING',
  actionType: 'transfer_wise',
  actionPlatform: 'wise',
  numPaymentsFetched: 20,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const date = new Date(Number(params.completedDate));
    const formattedDate = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const amount = (Number(params.amount.replace('-', '')) / 100).toString();

    return {
      amount: amount,
      date: formattedDate,
      currency: params.currency,
      paymentPlatform: PaymentPlatform.WISE,
      paymentId: params.id,
      recipient: params.username,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      // Parse amount and currency from the amount field (e.g., "1 USD", "1 950 EUR", "54,02 USD")
      const amountParts = (metadata.amount ?? '').split(' ');

      // Last part is currency, everything else is the amount
      const currency = amountParts.pop() || metadata.currency || '';

      // Join the remaining parts and remove spaces to handle thousand separators
      let amountStr = amountParts.join('').replace(/\s+/g, '');

      // Handle various international number formats
      if (amountStr) {
        // Check if we have both comma and period in the number
        if (amountStr.includes(',') && amountStr.includes('.')) {
          // Determine which is the decimal separator by position (last one is usually decimal)
          const lastCommaIndex = amountStr.lastIndexOf(',');
          const lastDotIndex = amountStr.lastIndexOf('.');

          if (lastCommaIndex > lastDotIndex) {
            // European format: comma is decimal separator (e.g., "1.005,10")
            amountStr = amountStr.replace(/\./g, '').replace(',', '.');
          } else {
            // US/UK format: period is decimal separator (e.g., "1,005.10")
            amountStr = amountStr.replace(/,/g, '');
          }
        } else if (amountStr.includes(',')) {
          // Only commas, assume it's a decimal separator
          amountStr = amountStr.replace(',', '.');
        }
        // If only periods or no separators, the format is already correct
      }

      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: metadata.date ?? '',
        parsedDate: metadata.date ? true : false,
        recipientId: metadata.recipient?.replace(/<[^>]*>?/gm, '') ?? '',
        parsedRecipientId: false,     // cause above is name and not wisetag
        currency: currency,
        parsedCurrency: currency !== '',
      };
    } catch (error) {
      console.error('Error parsing Wise metadata', error);
      return {
        amount: '',
        parsedAmount: false,
        date: '',
        parsedDate: false,
        recipientId: '',
        parsedRecipientId: false,
        currency: '',
        parsedCurrency: false,
      };
    }
  },
  getSubjectText: (metadata: ExtensionRequestMetadata): string => {
    const recipient = metadata.recipient?.replace(/<[^>]*>?/gm, '') ?? '';
    const amount = metadata.amount?.replace(/<[^>]*>?/gm, '') ?? '';
    return `Sent ${amount} to ${recipient}`;
  }
};

// Define the Wise deposit configuration
const wiseDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: true,
  payeeDetailInputPlaceholder: "Enter your Wisetag without @",
  payeeDetailInputHelperText: "This is your Wisetag. Do not include the @ symbol.",
  payeeDetailValidationFailureMessage: "Make sure there are no typos. Do not include the @ symbol.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      wisetag: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.wisetag;
  }
};

// Export the complete Wise platform configuration
export const wiseConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.WISE,
  platformName: 'Wise',
  platformLogo: wiseLogo,
  platformColor: '#163300', // Wise's brand blue color
  platformCurrencies: [
    Currency.USD,
    Currency.CNY,
    Currency.EUR,
    Currency.GBP,
    Currency.AUD,
    Currency.NZD,
    Currency.CAD,
    Currency.AED,
    Currency.CHF,
    Currency.ZAR,
    Currency.SGD,
    Currency.ILS,
    Currency.HKD,
    Currency.JPY,
    Currency.PLN,
    Currency.TRY,
    Currency.IDR,
    Currency.KES,
    Currency.MYR,
    Currency.MXN,
    Currency.THB,
    Currency.VND,
    Currency.UGX,
    // 29 July 2025
    Currency.CZK,
    Currency.DKK,
    Currency.HUF,
    Currency.INR,
    Currency.NOK,
    Currency.PHP,
    Currency.RON,
    Currency.SEK,
  ],
  minFiatAmount: '0.1',   // 0.1 USD
  localeTimeString: 'en-US',
  depositConfig: wiseDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: wiseSendConfig,
      verifyConfig: wiseVerifyConfig
    }
  ]
};