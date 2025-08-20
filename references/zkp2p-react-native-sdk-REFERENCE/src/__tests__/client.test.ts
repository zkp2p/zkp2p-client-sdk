import { Zkp2pClient } from '../client';
import { base } from 'viem/chains';
import type { WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';

jest.mock('viem', () => {
  const actual = jest.requireActual('viem');
  return {
    ...actual,
    createPublicClient: jest.fn(() => ({})),
    http: jest.fn((url?: string) => ({ url })),
  };
});

const walletClient = {} as WalletClient;

describe('Zkp2pClient', () => {
  it('throws for unsupported chain without rpcUrl', () => {
    expect(
      () =>
        new Zkp2pClient({
          walletClient,
          apiKey: 'key',
          chainId: 99999,
          prover: 'reclaim_snarkjs',
        })
    ).toThrow('Unsupported chain ID: 99999');
  });

  it('uses custom rpcUrl when provided', () => {
    const rpcUrl = 'https://rpc.example.com';
    const client = new Zkp2pClient({
      walletClient,
      apiKey: 'key',
      chainId: base.id,
      rpcUrl,
      prover: 'reclaim_snarkjs',
    });
    expect(createPublicClient).toHaveBeenCalledWith({
      chain: base,
      transport: http(rpcUrl),
    });

    expect(client.apiKey).toBe('key');
    expect(client.chainId).toBe(base.id);
  });
});
