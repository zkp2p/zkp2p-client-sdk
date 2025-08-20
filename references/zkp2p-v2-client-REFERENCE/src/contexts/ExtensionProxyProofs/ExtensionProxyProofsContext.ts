import { createContext } from 'react';

import { ExtensionNotaryProofRequest, ExtensionRequestMetadata, PaymentPlatformType } from '@helpers/types';

export interface MetadataInfo {
  metadata: ExtensionRequestMetadata[] | null;
  expiresAt: number | null;
}

interface ExtensionProxyProofsValues {
  isSidebarInstalled: boolean;
  sideBarVersion: string | null;
  refetchExtensionVersion: () => void;

  openNewTab: (actionType: string, platform: string) => void;

  platformMetadata: Record<PaymentPlatformType, MetadataInfo>;
  clearPlatformMetadata: (platform: PaymentPlatformType) => void;

  paymentProof: ExtensionNotaryProofRequest | null;
  generatePaymentProof: (platform: PaymentPlatformType, intentHash: string, originalIndex: number, proofIndex?: number) => void;
  fetchPaymentProof: (platform: PaymentPlatformType) => void;
  resetProofState: () => void;
};

const defaultValues: ExtensionProxyProofsValues = {
  isSidebarInstalled: false,
  sideBarVersion: null,
  refetchExtensionVersion: () => { },

  openNewTab: (_actionType: string, _platform: string) => { },

  platformMetadata: {} as Record<PaymentPlatformType, MetadataInfo>,
  clearPlatformMetadata: (_platform: PaymentPlatformType) => { },

  paymentProof: null,
  generatePaymentProof: (_platform: PaymentPlatformType, _intentHash: string, _originalIndex: number, proofIndex?: number) => { },
  fetchPaymentProof: (_platform: PaymentPlatformType) => { },
  resetProofState: () => { },
};

const ExtensionProxyProofsContext = createContext<ExtensionProxyProofsValues>(defaultValues);

export default ExtensionProxyProofsContext;
