import { PaymentPlatformType } from "./types"

type Providers = {
  [platform: PaymentPlatformType]: {
    providerIds: string[];
  }
}

export const providers: Providers = {
  'venmo': {
    providerIds: [
      '44f8c3a9-f436-475d-b6fa-c399bd7d2093',   // 0
    ],
  },
  'revolut': {
    providerIds: [
      '7db3d79b-c648-4459-9a02-283c915e17ab',   // 0
    ],
  },
  'cashapp': {
    providerIds: [
    ],
  },
  'wise': {
    providerIds: [
    ],
  },
  'mercadopago': {
    providerIds: [
      '0afc40bd-83b7-46f1-9027-eebc5c3fd5c1'    // any
    ],
  }
}