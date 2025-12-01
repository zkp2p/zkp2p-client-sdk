import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';
import * as att from '../adapters/attestation';

vi.mock('../adapters/attestation');

// Mock contracts mapping so client has addresses
vi.mock('../contracts', async (orig) => {
  const actual = await (orig as any)();
  const VENMO_HASH = '0x' + 'aa'.repeat(32);
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
    getPaymentMethodsCatalog: vi.fn(() => ({ venmo: { paymentMethodHash: VENMO_HASH } })),
  };
});

describe('Zkp2pClient.fulfillIntent (simplified)', () => {
  let client: Zkp2pClient;

  beforeEach(() => {
    vi.clearAllMocks();
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({ account, chain: base, transport: http() });
    client = new Zkp2pClient({ walletClient, chainId: base.id });
  });

  it('derives intent inputs, requests attestation, and sends tx', async () => {
    // Arrange: fake derived inputs
    const intentHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
    const VENMO_HASH = '0x' + 'aa'.repeat(32);
    vi.spyOn(client, 'getFulfillIntentInputs' as any).mockResolvedValue({
      amount: '1000000',
      fiatCurrency: '0x5555555555555555555555555555555555555555555555555555555555555555',
      conversionRate: '1000000000000000000',
      payeeDetails: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      intentTimestampMs: '1700000000000',
      paymentMethodHash: VENMO_HASH,
    });

    // Mock attestation service
    const signer = '0x1234567890123456789012345678901234567890';
    const attestationResponse = {
      success: true,
      message: 'ok',
      responseObject: {
        platform: 'venmo',
        actionType: 'transfer_venmo',
        signature: '0x' + '11'.repeat(65),
        signer,
        domainSeparator: '0x',
        typeHash: '0x',
        typedDataSpec: { primaryType: 'PaymentAttestation', types: {} },
        typedDataValue: { intentHash, releaseAmount: '1000000', dataHash: '0x' + '00'.repeat(32) },
        proofInput: '0x',
        encodedPaymentDetails: '0x',
        metadata: '0x',
      },
      statusCode: 200,
    } as any;
    vi.mocked(att.apiCreatePaymentAttestation).mockResolvedValue(attestationResponse);

    // Mock viem calls
    const simulateSpy = vi
      .spyOn(client.publicClient, 'simulateContract' as any)
      .mockResolvedValue({ request: { to: client['orchestratorAddress'], data: '0xabc' } } as any);
    const writeSpy = vi
      .spyOn(client.walletClient, 'writeContract' as any)
      .mockResolvedValue('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as any);

    // Act
    const tx = await client.fulfillIntent({ intentHash, proof: { foo: 'bar' }, timestampBufferMs: '300000' });

    // Assert
    expect(att.apiCreatePaymentAttestation).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(att.apiCreatePaymentAttestation).mock.calls[0]?.[0] as any;
    expect(payload.intent.intentHash).toBe(intentHash);
    expect(payload.verifyingContract?.toLowerCase()).toBe(client['unifiedPaymentVerifier']?.toLowerCase());
    expect(payload.intent.paymentMethod).toBe(VENMO_HASH);
    expect(simulateSpy).toHaveBeenCalledOnce();
    expect(writeSpy).toHaveBeenCalledOnce();
    expect(tx).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });
});
