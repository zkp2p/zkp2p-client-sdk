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
// import venmoLogo from '@assets/images/platforms/venmo.svg'; // Legal counsel advised not to use logo

// Define the Venmo payment configuration
const venmoSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://account.venmo.com/pay?recipients=${recipientId}&note=🎁&amount=${amountFiatToSend?.replace(',', '')}`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `venmo://paycharge?txn=pay&recipients=${recipientId}&note=🎁&amount=${amountFiatToSend?.replace(',', '')}`,
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Please do NOT toggle the "Turn on for purchases" option.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment. Double-check the username before confirming.`;
  }
};

// Define the Venmo verification configuration
const venmoVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://account.venmo.com/?feed=mine',
  actionType: 'transfer_venmo',
  actionPlatform: 'venmo',
  numPaymentsFetched: 10,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const date = new Date(params.date + 'Z');
    const formattedDate = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const amount = (Number(params.amount.replace('-', ''))).toString();

    return {
      amount: amount,
      date: formattedDate,
      currency: 'USD',
      paymentPlatform: PaymentPlatform.VENMO,
      paymentId: params.paymentId,
      recipient: params.receiverId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      const amountStr = metadata.amount?.replace(/[^0-9.]/g, '') ?? '';
      const dateStr = `${metadata.date ?? ''}Z`;  // Add Z to make it UTC
      const recipientIdStr = metadata.recipient || '';
      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateStr,
        parsedDate: dateStr !== '',
        recipientId: recipientIdStr,
        parsedRecipientId: recipientIdStr !== '',
        currency: Currency.USD,
        parsedCurrency: true,
      };
    } catch (error) {
      console.error('Error parsing Venmo metadata', error);
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
    const venmoStringSplit = metadata.amount?.split(' ') ?? [];
    return venmoStringSplit[0] === '-' ? `Sent ${venmoStringSplit[1]} to ${metadata.recipient}` : ``;
  }
};

// Define the Venmo deposit configuration
const venmoDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Venmo username",
  payeeDetailInputHelperText: "This is your Venmo username",
  payeeDetailValidationFailureMessage: "Make sure there are no typos in your username. Do not include the @",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    console.log('getDepositData', payeeDetails, telegramUsername);
    console.log('returning', {
      venmoUsername: payeeDetails,
      telegramUsername: telegramUsername || ''
    });
    return {
      venmoUsername: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.venmoUsername;
  }
};

// Export the complete Venmo platform configuration
export const venmoConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.VENMO,
  platformName: 'Venmo',
  platformCurrencies: [Currency.USD],
  platformLogo: undefined as any, // venmoLogo - Legal counsel advised not to use logo
  platformColor: '#3D95CE', // Venmo's brand blue color
  minFiatAmount: '0.1',   // 0.1 USD
  localeTimeString: 'en-US',
  depositConfig: venmoDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: venmoSendConfig,
      verifyConfig: venmoVerifyConfig
    }
  ]
};