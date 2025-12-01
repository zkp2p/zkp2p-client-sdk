import { describe, it, expect } from 'vitest';
import { resolvePlatformMethod, PLATFORM_CONFIG } from '../extension/platformConfig';

describe('platform config', () => {
  it('resolves revolut action details', () => {
    const m = resolvePlatformMethod('revolut' as any);
    expect(m.actionType).toBe('transfer_revolut');
    expect(m.actionPlatform).toBe('revolut');
    expect(m.requiredProofs).toBe(1);
  });

  it('resolves zelle method indices', () => {
    const m0 = resolvePlatformMethod('zelle' as any, 0);
    const m1 = resolvePlatformMethod('zelle' as any, 1);
    expect(m0.actionPlatform).toBe('bankofamerica');
    expect(m1.actionPlatform).toBe('chase');
    expect(m1.requiredProofs).toBe(2);
  });
});

