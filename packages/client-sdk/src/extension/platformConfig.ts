import type { PaymentPlatformType } from '../types';

export type PlatformMethodConfig = {
  actionType: string;
  actionPlatform: string;
  requiredProofs: number;
  minExtensionVersion: string;
};

export type PlatformConfig = {
  methods: PlatformMethodConfig[];
  defaultMethodIndex: number;
};

// Minimal mapping to abstract extension action details away from integrators.
export const PLATFORM_CONFIG: Record<PaymentPlatformType, PlatformConfig> = {
  wise: {
    methods: [{ actionType: 'transfer_wise', actionPlatform: 'wise', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  venmo: {
    methods: [{ actionType: 'transfer_venmo', actionPlatform: 'venmo', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  revolut: {
    methods: [{ actionType: 'transfer_revolut', actionPlatform: 'revolut', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  cashapp: {
    methods: [{ actionType: 'transfer_cashapp', actionPlatform: 'cashapp', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  mercadopago: {
    methods: [{ actionType: 'transfer_mercadopago', actionPlatform: 'mercadopago', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  paypal: {
    methods: [{ actionType: 'transfer_paypal', actionPlatform: 'paypal', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  monzo: {
    methods: [{ actionType: 'transfer_monzo', actionPlatform: 'monzo', requiredProofs: 1, minExtensionVersion: '0.1.31' }],
    defaultMethodIndex: 0,
  },
  zelle: {
    // Order aligns with common bank flows; method index can be supplied by integrator if needed.
    methods: [
      { actionType: 'transfer_zelle', actionPlatform: 'bankofamerica', requiredProofs: 1, minExtensionVersion: '0.1.31' },
      { actionType: 'transfer_zelle', actionPlatform: 'chase',        requiredProofs: 2, minExtensionVersion: '0.1.31' },
      { actionType: 'transfer_zelle', actionPlatform: 'citi',         requiredProofs: 1, minExtensionVersion: '0.1.31' },
    ],
    defaultMethodIndex: 0,
  },
};

export function resolvePlatformMethod(
  platform: PaymentPlatformType,
  paymentMethod?: number
): PlatformMethodConfig {
  const cfg = PLATFORM_CONFIG[platform];
  if (!cfg) throw new Error(`Unsupported platform: ${platform}`);
  const idx = typeof paymentMethod === 'number' ? paymentMethod : cfg.defaultMethodIndex;
  const method = cfg.methods[idx];
  if (!method) throw new Error(`Invalid paymentMethod ${idx} for platform ${platform}`);
  return method;
}

