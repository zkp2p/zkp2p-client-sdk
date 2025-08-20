import { clearSession } from '../utils/session';

jest.mock('@react-native-cookies/cookies', () => ({
  __esModule: true,
  default: {
    clearAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getAllKeys: jest
      .fn()
      .mockResolvedValue([
        'foo',
        'intercepted_payload_venmo_transfer',
        'bar',
        'intercepted_payload_revolut_transfer',
      ]),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('clearSession', () => {
  it('clears all cookies and intercepted payloads by default', async () => {
    const CookieManager = (await import('@react-native-cookies/cookies'))
      .default as any;
    const AsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default as any;

    await clearSession();

    // iOS flag defaults to true, Android will just ignore the boolean
    expect(CookieManager.clearAll).toHaveBeenCalledTimes(1);
    expect(CookieManager.clearAll).toHaveBeenCalledWith(true);

    // Only keys with intercepted_payload_ prefix are removed
    expect(AsyncStorage.getAllKeys).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.multiRemove).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.multiRemove.mock.calls[0][0]).toEqual([
      'intercepted_payload_venmo_transfer',
      'intercepted_payload_revolut_transfer',
    ]);
  });

  it('can skip clearing intercepted payloads', async () => {
    const AsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default as any;
    (AsyncStorage.getAllKeys as jest.Mock).mockClear();
    (AsyncStorage.multiRemove as jest.Mock).mockClear();

    await clearSession({ clearInterceptedPayloads: false });

    expect(AsyncStorage.getAllKeys).not.toHaveBeenCalled();
    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });
});
