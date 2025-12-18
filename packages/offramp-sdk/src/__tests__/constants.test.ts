import { describe, it, expect } from 'vitest';
import { resolvePlatformAttestationConfig } from '../constants';

describe('resolvePlatformAttestationConfig', () => {
  it('resolves base platform names', () => {
    const wiseConfig = resolvePlatformAttestationConfig('wise');
    expect(wiseConfig.actionType).toBe('transfer_wise');
    expect(wiseConfig.actionPlatform).toBe('wise');

    const venmoConfig = resolvePlatformAttestationConfig('venmo');
    expect(venmoConfig.actionType).toBe('transfer_venmo');
    expect(venmoConfig.actionPlatform).toBe('venmo');

    const zelleConfig = resolvePlatformAttestationConfig('zelle');
    expect(zelleConfig.actionType).toBe('transfer_zelle');
    expect(zelleConfig.actionPlatform).toBe('zelle');
  });

  it('normalizes zelle variants to base zelle config', () => {
    const zelleCiti = resolvePlatformAttestationConfig('zelle-citi');
    expect(zelleCiti.actionType).toBe('transfer_zelle');
    expect(zelleCiti.actionPlatform).toBe('zelle');

    const zelleBoa = resolvePlatformAttestationConfig('zelle-boa');
    expect(zelleBoa.actionType).toBe('transfer_zelle');
    expect(zelleBoa.actionPlatform).toBe('zelle');

    const zelleChase = resolvePlatformAttestationConfig('zelle-chase');
    expect(zelleChase.actionType).toBe('transfer_zelle');
    expect(zelleChase.actionPlatform).toBe('zelle');
  });

  it('handles case insensitivity', () => {
    const config = resolvePlatformAttestationConfig('WISE');
    expect(config.actionType).toBe('transfer_wise');

    const zelleConfig = resolvePlatformAttestationConfig('ZELLE-CITI');
    expect(zelleConfig.actionType).toBe('transfer_zelle');
  });

  it('throws for unknown platforms', () => {
    expect(() => resolvePlatformAttestationConfig('unknown')).toThrow(
      'Unknown payment platform: unknown'
    );
  });
});
