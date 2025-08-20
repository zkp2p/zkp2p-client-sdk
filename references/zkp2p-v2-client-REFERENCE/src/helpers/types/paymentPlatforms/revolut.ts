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
import revolutLogo from '@assets/images/platforms/revolut.png';

// Define the Revolut payment configuration
const revolutSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (recipientId: string, sendCurrency?: CurrencyType, amountFiatToSend?: string) => `https://revolut.me/${recipientId}`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://revolut.me/${recipientId}`,
  supportsSendingPaymentOnWeb: false,
  showTroubleScanningQRCodeLink: false,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Please ensure you are sending ${currencyInfo[sendCurrency].currencyCode} directly and not performing a cross-currency conversion.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Use your existing Revolut account. Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment.`;
  }
};

// Define the Revolut verification configuration
const revolutVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://app.revolut.com/home',
  actionType: 'transfer_revolut',
  actionPlatform: 'revolut',
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
      paymentPlatform: PaymentPlatform.REVOLUT,
      paymentId: params.id,
      recipient: params.username,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      const amountUnits = Number(metadata.amount) * -1 / 100;
      const amountStr = parseFloat(amountUnits.toFixed(2)).toString();
      const dateStr = metadata.date ? new Date(metadata.date).toISOString() : '';
      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateStr,
        parsedDate: dateStr !== '',
        recipientId: metadata.recipient ?? '',
        parsedRecipientId: metadata.recipient ? true : false,
        currency: metadata.currency ?? '',
        parsedCurrency: metadata.currency ? true : false,
      };
    } catch (error) {
      console.error('Error parsing Revolut metadata', error);
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
    if (Number(metadata.amount) < 0) {
      const currencySymbol = currencyInfo[metadata.currency ?? '']?.currencySymbol ?? '';
      const revolutFormattedAmount = Number(metadata.amount) * -1 / 100;
      return `Sent ${currencySymbol}${revolutFormattedAmount} to ${metadata.recipient} `;
    } else {
      return ``;    // Not a send payment
    }
  }
};

// Define the Revolut deposit configuration
const revolutDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Revtag",
  payeeDetailInputHelperText: "This is your Revtag. Make sure you have set your Revtag to be publicly discoverable.",
  payeeDetailValidationFailureMessage: "Make sure you have set your Revtag to be publicly discoverable and there are no typos.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      revolutUsername: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.revolutUsername;
  }
};

// Export the complete Revolut platform configuration
export const revolutConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.REVOLUT,
  platformName: 'Revolut',
  platformLogo: revolutLogo,
  platformColor: '#000000', // Revolut's brand blue color
  platformCurrencies: [
    Currency.USD,
    Currency.EUR,
    Currency.GBP,
    Currency.SGD,
    Currency.NZD,
    Currency.AUD,
    Currency.CAD,
    Currency.HKD,
    Currency.MXN,
    Currency.SAR,
    Currency.AED,
    Currency.THB,
    Currency.TRY,
    Currency.PLN,
    Currency.CHF,
    Currency.ZAR,
    // 29 July 2025
    Currency.CZK,
    Currency.CNY,
    Currency.DKK,
    Currency.HUF,
    Currency.NOK,
    Currency.RON,
    Currency.SEK,
  ],
  minFiatAmount: '0.1',  // 0.1 USD/EUR/GBP
  localeTimeString: 'en-US',
  depositConfig: revolutDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: revolutSendConfig,
      verifyConfig: revolutVerifyConfig
    }
  ]
};
