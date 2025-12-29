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
  });

  it('preserves zelle variant names for attestation service routing', () => {
    // Zelle variants map to bank-specific attestation platforms
    const zelleCiti = resolvePlatformAttestationConfig('zelle-citi');
    expect(zelleCiti.actionType).toBe('transfer_zelle');
    expect(zelleCiti.actionPlatform).toBe('citi');

    const zelleBofa = resolvePlatformAttestationConfig('zelle-bofa');
    expect(zelleBofa.actionType).toBe('transfer_zelle');
    expect(zelleBofa.actionPlatform).toBe('bankofamerica');

    const zelleChase = resolvePlatformAttestationConfig('zelle-chase');
    expect(zelleChase.actionType).toBe('transfer_zelle');
    expect(zelleChase.actionPlatform).toBe('chase');
  });

  it('handles case insensitivity', () => {
    const config = resolvePlatformAttestationConfig('WISE');
    expect(config.actionType).toBe('transfer_wise');
    expect(config.actionPlatform).toBe('wise');

    const zelleConfig = resolvePlatformAttestationConfig('ZELLE-CITI');
    expect(zelleConfig.actionType).toBe('transfer_zelle');
    expect(zelleConfig.actionPlatform).toBe('citi');
  });

  it('throws for unknown platforms', () => {
    expect(() => resolvePlatformAttestationConfig('unknown')).toThrow(
      'Unknown payment platform: unknown'
    );
  });
});
