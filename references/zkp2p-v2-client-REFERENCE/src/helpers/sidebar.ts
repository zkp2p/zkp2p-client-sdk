import {
  PaymentPlatformType,
  paymentPlatformInfo
} from './types/paymentPlatform';

export const isVersionOutdated = (
  current: string,
  paymentMethod: number,
  paymentPlatform: PaymentPlatformType
): boolean => {
  const currentParts = current.split('.').map(Number);
  const minimumRequiredVersion = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.minExtensionVersion;
  const requiredParts = minimumRequiredVersion.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (currentParts[i] > requiredParts[i]) return false;
    if (currentParts[i] < requiredParts[i]) return true;
  }
  return false;
};