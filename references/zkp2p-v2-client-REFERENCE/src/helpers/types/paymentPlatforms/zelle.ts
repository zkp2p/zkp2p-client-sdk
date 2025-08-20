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

import bankOfAmericaSvg from '@assets/images/zelle/boa.svg';
import chasePng from '@assets/images/zelle/chase.png';
import citiSvg from '@assets/images/zelle/citi.svg';
import zelleLogo from '@assets/images/platforms/zelle.png';


/**
 * Encodes a Zelle recipient ID into a base64 string
 * @param recipientId The Zelle recipient ID to encode
 * @returns Base64 encoded string
 */
export const encodeZelleRecipientId = (recipientId: string): string => {
  const payload = {
    name: '',
    action: 'payment',
    token: recipientId
  };
  return btoa(JSON.stringify(payload));
};


// Bank of America configuration
// ----------------------------

// Define Bank of America send payment config
const zelleBankOfAmericaSendConfig: SendPaymentConfig = {
  paymentMethodName: 'Bank of America',
  paymentMethodIcon: bankOfAmericaSvg,
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://www.bankofamerica.com/`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => {
    // const encodedRecipientId = encodeZelleRecipientId(recipientId);
    // We weren't able to get the QR code to work, so we will just deeplink to the Zelle page in the BOA app
    return `https://www.bankofamerica.com/movemoney`;
  },
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment through Bank of America's Zelle.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Only use Bank of America. Scan the QR code and manually enter the recipient email. Double-check the email before sending.`;
  }
};

// Define Bank of America verification config
const zelleBankOfAmericaVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://www.bankofamerica.com/',
  actionType: 'transfer_zelle',
  actionPlatform: 'bankofamerica',
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
      paymentPlatform: PaymentPlatform.ZELLE,
      paymentId: params.paymentId,
      recipient: params.receiverId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      const amountStr = metadata.amount ?? '';

      let dateStr = metadata.date ?? '';
      if (dateStr && dateStr.length === 10) { // Check if it's in format "2025-05-04"
        dateStr = `${dateStr}T23:59:59`;
      }

      const recipientIdStr = metadata.recipient || '';
      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateStr,
        parsedDate: dateStr !== '',
        recipientId: recipientIdStr,
        parsedRecipientId: false,
        currency: Currency.USD,
        parsedCurrency: true,
      };
    } catch (error) {
      console.error('Error parsing Zelle Bank of America metadata', error);
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
    if (!metadata.amount || !metadata.recipient) {
      return '';
    }
    return `Transfer of $${Number(metadata.amount)} to ${metadata.recipient}`;
  }
};

// Chase configuration
// ----------------------------

// Define Chase send config
const zelleChaseSendConfig: SendPaymentConfig = {
  paymentMethodName: 'Chase',
  paymentMethodIcon: chasePng,
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://secure.chase.com/web/auth/dashboard#/dashboard/singleDoor/singleDoorController/index`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => {
    const encodedRecipientId = encodeZelleRecipientId(recipientId);
    return `https://enroll.zellepay.com/qr-codes?data=${encodedRecipientId}`;
  },
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment through Chase's Zelle.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Do not send using any other bank.`;
  }
};

// Define Chase payment verification config
const zelleChaseVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://secure.chase.com/web/auth/dashboard#/dashboard/singleDoor/payments/activity;params=qp,sentactivity',
  actionType: 'transfer_zelle',
  actionPlatform: 'chase',
  numPaymentsFetched: 15,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 2,
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
      paymentPlatform: PaymentPlatform.ZELLE,
      paymentId: params.paymentId,
      recipient: params.receiverId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      const amountStr = metadata.amount ?? '';
      let dateStr = metadata.date ?? '';
      if (dateStr && dateStr.length === 8) { // Check if it's in format "20250504"
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        dateStr = `${year}-${month}-${day}T23:59:59`;
      }

      const recipientIdStr = metadata.recipient || '';
      return {
        amount: amountStr,
        parsedAmount: amountStr !== '',
        date: dateStr,
        parsedDate: dateStr !== '',
        recipientId: recipientIdStr,
        parsedRecipientId: false,
        currency: Currency.USD,
        parsedCurrency: true,
      };
    } catch (error) {
      console.error('Error parsing Zelle Chase metadata', error);
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
    if (!metadata.amount || !metadata.recipient) {
      return '';
    }
    return `Transfer of $${Number(metadata.amount)} to ${metadata.recipient}`;
  }
};


// Citi configuration
// ----------------------------

// Define Citi send config
const zelleCitiSendConfig: SendPaymentConfig = {
  paymentMethodName: 'Citi',
  paymentMethodIcon: citiSvg,
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.QR_CODE,
  useCustomQRCode: true,
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://online.citi.com/US/nga/zelle/transfer`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => {
    const encodedRecipientId = encodeZelleRecipientId(recipientId);
    return `https://enroll.zellepay.com/qr-codes?data=${encodedRecipientId}`;
  },
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment through Citi's Zelle.`;
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Do not send using any other bank.`;
  }
};

// Define Citi verification config
const zelleCitiVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://online.citi.com/US/nga/zelle/transfer',
  actionType: 'transfer_zelle',
  actionPlatform: 'citi',
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
      paymentPlatform: PaymentPlatform.ZELLE,
      paymentId: params.paymentId,
      recipient: params.receiverId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      const amountStr = metadata.amount ?? '';
      let dateStr = metadata.date ?? '';
      if (dateStr && dateStr.length === 8) { // Check if it's in format "20250504"
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        dateStr = `${year}-${month}-${day}T23:59:59`;
      }

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
      console.error('Error parsing Zelle Citi metadata', error);
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
    if (!metadata.amount || !metadata.recipient) {
      return '';
    }
    return `Transfer of $${Number(metadata.amount)} to ${metadata.recipient}`;
  }
};

// Define the Zelle deposit configuration (common for all banks)
const zelleDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your email",
  payeeDetailInputHelperText: "This is the email you use with Zelle",
  payeeDetailValidationFailureMessage: "Make sure there are no typos in your email",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      zelleEmail: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.zelleEmail;
  }
};

// Export the complete Zelle platform configuration with multiple payment methods
export const zelleConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.ZELLE,
  platformName: 'Zelle',
  platformLogo: zelleLogo,
  platformColor: '#6D1ED4', // Zelle's brand purple color
  platformCurrencies: [Currency.USD],
  minFiatAmount: '0.1',   // 0.1 USD
  localeTimeString: 'en-US',
  depositConfig: zelleDepositConfig,
  hasMultiplePaymentMethods: true,
  paymentMethods: [
    // Ensure payment method identifiers are same as that stored on the contract
    {
      sendConfig: zelleChaseSendConfig,
      verifyConfig: zelleChaseVerifyConfig
    },
    {
      sendConfig: zelleBankOfAmericaSendConfig,
      verifyConfig: zelleBankOfAmericaVerifyConfig
    },
    {
      sendConfig: zelleCitiSendConfig,
      verifyConfig: zelleCitiVerifyConfig
    }
  ]
};
