import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

export type ClearSessionOptions = {
  clearInterceptedPayloads?: boolean;
  iosAlsoClearWebKitStore?: boolean;
};

const INTERCEPTED_PREFIX = 'intercepted_payload_';

export async function clearSession(
  options: ClearSessionOptions = {}
): Promise<void> {
  const { clearInterceptedPayloads = true, iosAlsoClearWebKitStore = true } =
    options;

  try {
    await CookieManager.clearAll(iosAlsoClearWebKitStore as any);
  } catch (err) {
    console.warn('[zkp2p] Failed to clear cookies:', err);
  }

  if (clearInterceptedPayloads) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toRemove = keys.filter((k) => k.startsWith(INTERCEPTED_PREFIX));
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (err) {
      console.warn('[zkp2p] Failed to clear intercepted payloads:', err);
    }
  }
}

export default clearSession;
