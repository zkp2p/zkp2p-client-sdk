import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';

vi.mock('../contracts', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    getContracts: vi.fn(() => ({
      addresses: {
        escrow: '0x1111111111111111111111111111111111111111',
        orchestrator: '0x2222222222222222222222222222222222222222',
        unifiedPaymentVerifier: '0x3333333333333333333333333333333333333333',
        protocolViewer: '0x4444444444444444444444444444444444444444',
        usdc: '0x5555555555555555555555555555555555555555',
      },
      abis: { escrow: [] as any, orchestrator: [] as any, protocolViewer: [] as any },
    })),
  };
});

describe('Zkp2pClient initialization', () => {
  let client: Zkp2pClient;
  beforeEach(() => {
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({ account, chain: base, transport: http() });
    client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'staging', timeouts: { api: 3210 } });
  });

  it('sets core fields and deployed addresses', () => {
    expect(client.chainId).toBe(base.id);
    expect(client.runtimeEnv).toBe('staging');
    expect(client['apiTimeoutMs']).toBe(3210);
    const deployed = client.getDeployedAddresses();
    expect(deployed.escrow).toBe('0x1111111111111111111111111111111111111111');
    expect(deployed.orchestrator).toBe('0x2222222222222222222222222222222222222222');
    expect(deployed.unifiedPaymentVerifier).toBe('0x3333333333333333333333333333333333333333');
  });
});

