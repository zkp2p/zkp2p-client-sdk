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
// import paypalLogo from '@assets/images/platforms/paypal.png'; // Legal counsel advised not to use logo


// Define the Paypal payment configuration
const paypalSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.WEB_PAYMENT,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) =>
    `https://www.paypal.com/myaccount/transfer/homepage`,
  // Mobile deep link into PayPal app
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) =>
    `paypal://`,
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Make sure the "Your Send" amount is at least ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} after PayPal fees.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Ensure "Friends and Family" is selected as the recipient type. If "Goods and Services" is the only option, please DO NOT send the payment and report in the Help section. Please do not put zkp2p, crypto or any related terms in the payment notes or memo field.`;
  }
};

// Define the Paypal verification configuration
const paypalVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://www.paypal.com/myaccount/activities/filter/?q=ZnJlZV90ZXh0X3NlYXJjaD0mc3RhcnRfZGF0ZT0yMDI1LTAxLTAxJmVuZF9kYXRlPTIwMzAtMTItMzEmdHlwZT0mc3RhdHVzPSZjdXJyZW5jeT0mZmlsdGVyX2lkPSZpc3N1YW5jZV9wcm9kdWN0X25hbWU9JmFzc2V0X25hbWVzPSZhc3NldF9zeW1ib2xzPQ',
  actionType: 'transfer_paypal',
  actionPlatform: 'paypal',
  numPaymentsFetched: 10,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const formattedDate = params.date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const amount = (Number(params.amount)).toString();

    return {
      amount: amount,
      date: formattedDate,
      currency: params.currencyCode,
      paymentPlatform: PaymentPlatform.PAYPAL,
      paymentId: params.paymentId,
      recipient: params.email,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {

      //  {
      //     "recipient": "ben-renshaw@live.co.uk",
      //     "amount": "€0.20 EUR",
      //     "date": "2025-07-22T15:46:02.000Z",
      //     "paymentId": "4RW30482FJ726822N",
      //     "currency": "EUR",
      //     "type": "SEND_MONEY_SENT",
      //     "hidden": false,
      //     "originalIndex": 0
      // },
      const amountStr = metadata.amount?.split(' ')[0].slice(1) ?? '';
      const currencyStr = metadata.currency ?? '';
      const dateStr = metadata.date ?? '';  // Get just month and date
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
      console.error('Error parsing Paypal metadata', error);
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
    const amountStr = metadata.amount?.split(/\s+/)[0].slice(1) ?? '';
    const currencyStr = metadata.currency ?? '';

    if (metadata.type !== 'SEND_MONEY_SENT') {
      return '';
    }
    return `Sent ${amountStr} ${currencyStr} to ${metadata.recipient}`;
  }
};

// Define the Paypal deposit configuration
const paypalDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Paypal email",
  payeeDetailInputHelperText: "This is your Paypal email",
  payeeDetailValidationFailureMessage: "Make sure there are no typos in your email.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      paypalEmail: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.paypalEmail;
  }
};

// Export the complete Paypal platform configuration
export const paypalConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.PAYPAL,
  platformName: 'Paypal',
  platformCurrencies: [
    Currency.USD,
    Currency.EUR,
    Currency.GBP,
    Currency.SGD,
    Currency.NZD,
    Currency.AUD,
    Currency.CAD
  ],
  platformLogo: undefined as any, // paypalLogo - Legal counsel advised not to use logo
  platformColor: '#0070BA', // Paypal's brand blue color
  minFiatAmount: '0.1',   // 0.1 USD
  localeTimeString: 'en-US',
  depositConfig: paypalDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: paypalSendConfig,
      verifyConfig: paypalVerifyConfig
    }
  ]
};