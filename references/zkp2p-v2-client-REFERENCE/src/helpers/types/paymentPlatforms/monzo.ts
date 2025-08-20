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
import monzoLogo from '@assets/images/platforms/monzo.svg';


const monzoSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) =>
    `https://monzo.me/${recipientId}`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) =>
    `https://monzo.me/${recipientId}`,
  supportsSendingPaymentOnWeb: false,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Use the Monzo app to send payment. Do not pay via card.`;
  }
};

// Define the Monzo verification configuration
const monzoVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://web.monzo.com/',
  actionType: 'transfer_monzo',
  actionPlatform: 'monzo',
  numPaymentsFetched: 10,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const formattedDate = params.completedDate.toLocaleString('en-GB', {
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
      paymentPlatform: PaymentPlatform.MONZO,
      paymentId: params.TX_ID,
      recipient: params.userId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {

      // {
      //   "recipient": "anonuser_57c1d7936509faa069111d",
      //   "amount": -1649,
      //   "date": "2025-04-28T02:10:32.623Z",
      //   "paymentId": "tx_0000AtXFltJ9KVDNnNTLKj",
      //   "currency": "GBP",
      //   "hidden": false,
      //   "originalIndex": 20
      // }
      const amountUnits = Number(metadata.amount) * -1 / 100;
      const amountStr = parseFloat(amountUnits.toFixed(2)).toString();

      const currencyStr = metadata.currency ?? '';
      const dateStr = metadata.date ?? '';    // todo: figure out if we need to convert the date to UTC
      const recipientIdStr = metadata.recipient || '';

      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateStr,
        parsedDate: dateStr !== '',
        recipientId: recipientIdStr,
        parsedRecipientId: recipientIdStr !== '',
        currency: currencyStr,
        parsedCurrency: currencyStr !== '',
      };
    } catch (error) {
      console.error('Error parsing Monzo metadata', error);
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
    if (
      Number(metadata.amount) < 0
      && metadata.recipientName
      && metadata.recipientName !== undefined
      && metadata.recipientName !== ''
    ) {
      const currencySymbol = currencyInfo[metadata.currency ?? '']?.currencySymbol ?? '';
      const monzoFormattedAmount = Number(metadata.amount) * -1 / 100;
      return `Sent ${currencySymbol}${monzoFormattedAmount} to ${metadata.recipientName} `;
    } else {
      return ``;
    }
  },
  reverseTransactionHistoryOrder: true
};

// Define the Monzo deposit configuration
const monzoDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Monzo.me username",
  payeeDetailInputHelperText: "This is your Monzo.me username",
  payeeDetailValidationFailureMessage: "Make sure there are no typos in your username.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      monzoMeUsername: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.monzoMeUsername;
  }
};

// Export the complete Monzo platform configuration
export const monzoConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.MONZO,
  platformName: 'Monzo',
  platformCurrencies: [
    Currency.GBP
  ],
  platformLogo: monzoLogo,
  platformColor: '#FC427B',
  minFiatAmount: '0.1',   // 0.1 GBP
  localeTimeString: 'en-GB',
  depositConfig: monzoDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: monzoSendConfig,
      verifyConfig: monzoVerifyConfig
    }
  ]
};