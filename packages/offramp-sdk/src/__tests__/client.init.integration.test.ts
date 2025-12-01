import { describe, it, expect } from 'vitest';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';
import { getContracts, type RuntimeEnv } from '../contracts';

function isHexAddress(v: unknown): boolean {
  return typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v);
}

function expectAddressesAlign(chainId: number, env: RuntimeEnv) {
  const { addresses } = getContracts(chainId, env);
  const walletClient = createWalletClient({ chain: base, transport: http() });
  const client = new Zkp2pClient({ walletClient, chainId, runtimeEnv: env });
  const deployed = client.getDeployedAddresses();
  // Logging for debugging CI/fixtures
  // eslint-disable-next-line no-console
  console.log('[init-integr] env=%s chainId=%d', env, chainId);
  // eslint-disable-next-line no-console
  console.log('[init-integr] expected (contracts-v2):', addresses);
  // eslint-disable-next-line no-console
  console.log('[init-integr] actual (client):', deployed);

  const pairs: Array<[string | undefined, string | undefined]> = [
    [addresses.escrow, deployed.escrow],
    [addresses.orchestrator, deployed.orchestrator],
    [addresses.unifiedPaymentVerifier, deployed.unifiedPaymentVerifier],
    [addresses.protocolViewer, deployed.protocolViewer],
    [addresses.usdc, deployed.usdc],
  ];
  for (const [expected, actual] of pairs) {
    if (expected && isHexAddress(expected)) {
      expect(actual?.toLowerCase()).toBe(expected.toLowerCase());
    } else {
      // When contracts-v2 provides an empty string, client may fall back to known constants
      expect(isHexAddress(actual)).toBe(true);
    }
  }
  return client;
}

describe('Zkp2pClient initialization (unmocked contracts)', () => {
  it('aligns deployed addresses with @zkp2p/contracts-v2 (production)', () => {
    const client = expectAddressesAlign(base.id, 'production');
    const endpoint = (client.indexer as any).endpoint as string | undefined;
    // eslint-disable-next-line no-console
    console.log('[init-integr] indexer (prod):', endpoint);
    expect(typeof endpoint).toBe('string');
    expect(endpoint).toMatch(/indexer\.(dev\.)?hyperindex\.xyz/);
  });

  it('uses staging indexer when runtimeEnv is staging', () => {
    const client = expectAddressesAlign(base.id, 'staging');
    const endpoint = (client.indexer as any).endpoint as string | undefined;
    // eslint-disable-next-line no-console
    console.log('[init-integr] indexer (staging):', endpoint);
    expect(endpoint).toMatch(/indexer\.dev\.hyperindex\.xyz/);
  });
});
