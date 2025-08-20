// Import platform configs
import {
  PaymentPlatform,
  PaymentPlatformType,
  PaymentPlatformConfig
} from './types';
import { venmoConfig } from './venmo';
import { cashappConfig } from './cashapp';
import { revolutConfig } from './revolut';
import { wiseConfig } from './wise';
import { mercadoPagoConfig } from './mercadoPago';
import { zelleConfig } from './zelle';
import { paypalConfig } from './paypal';
import { monzoConfig } from './monzo';

// Export the consolidated platform info
export const paymentPlatformInfo: Record<PaymentPlatformType, PaymentPlatformConfig> = {
  [PaymentPlatform.VENMO]: venmoConfig,
  [PaymentPlatform.CASHAPP]: cashappConfig,
  [PaymentPlatform.REVOLUT]: revolutConfig,
  [PaymentPlatform.ZELLE]: zelleConfig,
  [PaymentPlatform.PAYPAL]: paypalConfig,
  [PaymentPlatform.WISE]: wiseConfig,
  [PaymentPlatform.MERCADO_PAGO]: mercadoPagoConfig,
  [PaymentPlatform.MONZO]: monzoConfig,
};


// Export all types and constants
export * from './types';

