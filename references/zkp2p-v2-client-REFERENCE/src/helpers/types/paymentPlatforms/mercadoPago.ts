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
import mercadoPagoLogo from '@assets/images/platforms/mercado.png';

// Define the Mercado Pago payment configuration
const mercadoPagoSendConfig: SendPaymentConfig = {
  defaultPaymentMode: PaymentPlatformDefaultPaymentMode.WEB_PAYMENT,
  useCustomQRCode: true,
  payeeDetailPrefix: "CVU",
  troubleScanningQRCodeLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://www.mercadopago.com.ar/money-out/transfer/`,
  getFormattedSendLink: (
    recipientId: string,
    sendCurrency?: CurrencyType,
    amountFiatToSend?: string
  ) => `https://www.mercadopago.com.ar/money-out/transfer/`,
  supportsSendingPaymentOnWeb: true,
  showTroubleScanningQRCodeLink: true,
  sendPaymentWarning: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `IMPORTANT: Only make payments through the Mercado Pago website. Do not use the mobile app.`
  },
  sendPaymentInfo: (sendCurrency: CurrencyType, amountFiatToSend: string) => {
    return `Double check that the CVU matches exactly before sending the payment. Send exactly ${amountFiatToSend} ${currencyInfo[sendCurrency].currencyCode} in a single payment.`;
  }
};

// Define the Mercado Pago verification configuration
const mercadoPagoVerifyConfig: PaymentVerificationConfig = {
  authLink: 'https://www.mercadopago.com.ar/home',
  actionType: 'transfer_mercadopago',
  actionPlatform: 'mercadopago',
  numPaymentsFetched: 20,
  minExtensionVersion: '0.1.31',
  supportsAppclip: false,
  totalProofs: 1,
  parseExtractedParameters: (context: string): ProofExtractedParameters => {
    const contextObject = JSON.parse(context);
    const params = contextObject.extractedParameters;

    const date = new Date(params.date);
    const formattedDate = date.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });

    const amount = (Number(params.amt.replace('-', ''))).toString();
    return {
      amount: amount,
      date: formattedDate,
      currency: params.curr,
      paymentPlatform: PaymentPlatform.MERCADO_PAGO,
      paymentId: params.paymentId,
      recipient: params.recipientId,
      intentHash: contextObject.contextMessage,
      providerHash: contextObject.providerHash
    };
  },
  parseMetadata: (metadata: ExtensionRequestMetadata): ParsedPaymentDetails => {
    try {
      // Parse Mercado Pago amount format (e.g., -1.400,12 or 100,12)
      let amountStr = '';
      if (metadata.amount) {
        const isSentTransaction = metadata.amount.startsWith('-');
        amountStr = isSentTransaction ? metadata.amount.substring(1) : metadata.amount;
        // Replace dots in thousands with nothing and commas with dots for decimal points (e.g., 1.400,12 -> 1400.12)
        amountStr = amountStr.replace(/\./g, '').replace(/,/g, '.');

        // For sent transactions, the amount should be positive (already removed the minus sign)
        // For received transactions, the amount should be negative (add minus sign)
        amountStr = isSentTransaction ? amountStr : `-${amountStr}`;
      }
      const dateStr = new Date(metadata.date ?? '').toISOString();
      return {
        amount: amountStr,
        parsedAmount: false, // amountStr !== '',
        date: dateStr,
        parsedDate: false, // dateStr !== '',
        recipientId: '',
        parsedRecipientId: false,
        currency: 'ARS',
        parsedCurrency: false, // true,
      };
    } catch (error) {
      console.error('Error parsing Mercado Pago metadata', error);
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
    const sentTransaction = metadata.amount?.includes('-') ?? false;
    if (sentTransaction) {
      const amount = metadata.amount?.replace('-', '') ?? '';
      return `Sent $ ${amount} to ${metadata.recipient}`;
    } else {
      return ``;
    }
  }
};

// Define the Mercado Pago deposit configuration
const mercadoPagoDepositConfig: PlatformDepositConfig = {
  depositRequiresApproval: false,
  payeeDetailInputPlaceholder: "Enter your Mercado Pago / Bank CVU",
  payeeDetailInputHelperText: "This is your Mercado Pago CVU. You can find it in your Mercado Pago account.",
  payeeDetailValidationFailureMessage: "Make sure there are no typos.",
  getDepositData: (payeeDetails: string, telegramUsername?: string) => {
    return {
      cvu: payeeDetails,
      telegramUsername: telegramUsername || ''
    };
  },
  getPayeeDetail: (data: { [key: string]: string }) => {
    return data.cvu;
  }
};

// Export the complete Mercado Pago platform configuration
export const mercadoPagoConfig: PaymentPlatformConfig = {
  platformId: PaymentPlatform.MERCADO_PAGO,
  platformName: 'Mercado Pago',
  platformLogo: mercadoPagoLogo,
  platformColor: '#00B1EA', // Mercado Pago's brand blue color
  platformCurrencies: [Currency.ARS],
  minFiatAmount: '1',   // 1 ARS
  localeTimeString: 'es-AR',
  depositConfig: mercadoPagoDepositConfig,
  hasMultiplePaymentMethods: false,
  paymentMethods: [
    {
      sendConfig: mercadoPagoSendConfig,
      verifyConfig: mercadoPagoVerifyConfig
    }
  ]
};
