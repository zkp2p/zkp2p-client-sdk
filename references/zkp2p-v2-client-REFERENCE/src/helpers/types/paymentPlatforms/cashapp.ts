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
import cashappLogo from '@assets/images/platforms/cashapp.png';

// Define the Cash App payment configuration
const cashappSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: false,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => recipientId.startsWith('$') ? `https://cash.app/qr/${recipientId}?size=288&margin=0` : `https://cash.app/qr/$${recipientId}?size=288&margin=0`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => recipientId.startsWith('$') ? `https://cash.app/qr/${recipientId}?size=288&margin=0` : `https://cash.app/qr/$${recipientId}?size=288&margin=0`,
  supportsSendingPaymentOnWeb: false,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Please do not put zkp2p, crypto or any related terms in the payment notes or memo field.`;
  }
};

// Define the Cash App verification configuration
const cashappVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://cash.app/account/activity',
  actionType: 'transfer_cashapp',
  actionPlatform: 'cashapp',
  numPaymentsFetched: 15,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const date = new Date(Number(params.date));
    const formattedDate = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    return {
      amount: params.amount,
      date: formattedDate,
      currency: params.currency_code,
      paymentPlatform: PaymentPlatform.CASHAPP,
      paymentId: params.paymentId,
      recipient: params.receiverId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      // For now; no way to tell if sent or received transaction
      const amountUnits = Number(metadata.amount) / 100;
      const amountStr = parseFloat(amountUnits.toFixed(2)).toString();
      const currency = metadata.currency ?? '';
      const dateString = new Date(metadata.date ?? '').toISOString();
      // Receipient should help determine if sent or received transaction
      const recipientId = metadata.recipient ?? '';
      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateString,
        parsedDate: dateString !== '',
        recipientId: recipientId,
        parsedRecipientId: recipientId !== '',
        currency: currency,
        parsedCurrency: currency !== '',
      };
    } catch (error) {
      console.error('Error parsing Cash App metadata', error);
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
    return `Transfer of $${Number(metadata.amount) / 100} to ${metadata.recipient}`;
  }
};

// Define the Cash App deposit configuration
const cashappDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Cashtag",
  payeeDetailInputHelperText: "This is your Cashtag. Please ensure you have set your Cashtag as discoverable by others. Do not include the $ symbol.",
  payeeDetailValidationFailureMessage: "Make sure you have set your Cashtag as discoverable by others. Do not include the $ symbol.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      cashtag: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.cashtag;
  }
};

// Export the complete Cash App platform configuration
export const cashappConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.CASHAPP,
  platformLogo: cashappLogo,
  platformName: 'Cash App',
  platformColor: '#00D632', // Cash App's brand green color
  platformCurrencies: [Currency.USD],
  minFiatAmount: '0.1',   // 0.1 USD
  localeTimeString: 'en-US',
  depositConfig: cashappDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: cashappSendConfig,
      verifyConfig: cashappVerifyConfig
    }
  ]
};
