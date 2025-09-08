import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fulfillIntent } from '../actions/fulfillIntent';
import { signalIntent } from '../actions/signalIntent';
import { createDeposit } from '../actions/createDeposit';
import { withdrawDeposit } from '../actions/withdrawDeposit';
import { cancelIntent } from '../actions/cancelIntent';
import { releaseFundsToPayer } from '../actions/releaseFundsToPayer';
import { ValidationError } from '../errors';

vi.mock('../adapters/api', () => ({
  apiSignalIntent: vi.fn(async () => ({
    success: true,
    message: 'ok',
    statusCode: 200,
    responseObject: {
      depositData: {},
      signedIntent: '0x',
      intentData: {
        depositId: '1',
        tokenAmount: '1000000',
        recipientAddress: '0x0000000000000000000000000000000000000002',
        verifierAddress: '0x0000000000000000000000000000000000000003',
        currencyCodeHash: '0x' + '11'.repeat(32),
        gatingServiceSignature: '0x' + '22'.repeat(65),
      },
    },
  })),
  apiPostDepositDetails: vi.fn(async () => ({
    success: true,
    message: 'ok',
    statusCode: 200,
    responseObject: {
      id: 1,
      processorName: 'wise',
      depositData: {},
      hashedOnchainId: '0x' + 'aa'.repeat(32),
      createdAt: new Date().toISOString(),
    },
  })),
}));

function createMockClients() {
  const writeContract = vi.fn(async () => '0x' + 'ab'.repeat(32));
  const walletClient: any = { account: { address: '0x0000000000000000000000000000000000000001' }, writeContract };
  const simulateContract = vi.fn(async (_: any) => ({ request: { to: '0x', data: '0x' } }));
  const waitForTransactionReceipt = vi.fn(async (_: any) => ({ status: 'success' }));
  const readContract = vi.fn();
  const publicClient: any = { simulateContract, waitForTransactionReceipt, readContract };
  return { walletClient, publicClient, fns: { writeContract, simulateContract, waitForTransactionReceipt, readContract } };
}

const baseProof = {
  claimInfo: { provider: 'wise', parameters: '{}', context: '' },
  signedClaim: {
    claim: {
      identifier: '0x' + '11'.repeat(32),
      owner: '0x0000000000000000000000000000000000000001',
      timestampS: 1n,
      epoch: 1n,
    },
    signatures: ['0x' + 'aa'.repeat(65)],
  },
  isAppclipProof: false,
} as const;

describe('actions: fulfillIntent', () => {
  it('encodes a single proof and writes tx', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    const tx = await fulfillIntent(walletClient, publicClient, '0xescrow', {
      paymentProofs: [{ proof: baseProof }],
      intentHash: '0x' + '12'.repeat(32),
      paymentMethod: 1,
    } as any);
    expect(tx).toMatch(/^0x/);
    expect(fns.simulateContract).toHaveBeenCalledTimes(1);
    expect(fns.writeContract).toHaveBeenCalledTimes(1);
  });

  it('throws on invalid number of proofs', async () => {
    const { walletClient, publicClient } = createMockClients();
    await expect(
      fulfillIntent(walletClient, publicClient, '0xescrow', { paymentProofs: [], intentHash: '0x' + '12'.repeat(32) } as any)
    ).rejects.toBeInstanceOf(Error);
  });
});

describe('actions: signalIntent', () => {
  it('rejects invalid currency early', async () => {
    const { walletClient, publicClient } = createMockClients();
    await expect(
      signalIntent(walletClient, publicClient, '0xescrow', 8453, {
        processorName: 'wise',
        depositId: '1',
        tokenAmount: '100',
        payeeDetails: '{}',
        toAddress: '0x0000000000000000000000000000000000000002',
        currency: 'XXX' as any,
      }, 'apikey', 'https://api.example')
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('simulates and writes on success', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    const res = await signalIntent(walletClient, publicClient, '0xescrow', 8453, {
      processorName: 'wise',
      depositId: '1',
      tokenAmount: '1000000',
      payeeDetails: '{}',
      toAddress: '0x0000000000000000000000000000000000000002',
      currency: 'USD',
    }, 'apikey', 'https://api.example');
    expect(res.success).toBe(true);
    expect(fns.simulateContract).toHaveBeenCalledTimes(1);
    expect(fns.writeContract).toHaveBeenCalledTimes(1);
  });
});

describe('actions: createDeposit', () => {
  const token = '0x0000000000000000000000000000000000000abc' as const;
  it('approves when allowance insufficient and creates deposit', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    // First read allowance -> 0n
    fns.readContract.mockImplementation(async (opts: any) => {
      if (opts.functionName === 'allowance') return 0n;
      return undefined;
    });

    const res = await createDeposit(
      walletClient,
      publicClient,
      '0xescrow',
      31337,
      {
        token,
        amount: 1000000n,
        intentAmountRange: { min: 100000n, max: 2000000n },
        processorNames: ['wise'],
        depositData: [{}],
        conversionRates: [[{ currency: 'USD', conversionRate: '1000000' }]],
      } as any,
      'apikey',
      'https://api.example',
      {
        usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const,
        escrow: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const,
        venmo: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as const,
        revolut: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as const,
        cashapp: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788' as const,
        wise: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82' as const,
        mercadopago: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1' as const,
        zelle: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c' as const,
        paypal: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E' as const,
        monzo: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042' as const,
        gatingService: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const,
        zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3' as const,
      }
    );
    expect(res.hash).toMatch(/^0x/);
    // approve + createDeposit writes
    expect(fns.writeContract).toHaveBeenCalledTimes(2);
  });

  it('errors when processor not deployed on chain', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    fns.readContract.mockResolvedValue(10n);
    await expect(
      createDeposit(
        walletClient,
        publicClient,
        '0xescrow',
        31337,
        {
          token,
          amount: 1000000n,
          intentAmountRange: { min: 1n, max: 2n },
          processorNames: ['square'], // not an enabled platform
          depositData: [{}],
          conversionRates: [[{ currency: 'USD', conversionRate: '1000000' }]],
        } as any,
        'apikey',
        'https://api.example',
        {
          usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const,
          escrow: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const,
          venmo: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as const,
          revolut: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as const,
          cashapp: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788' as const,
          wise: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82' as const,
          mercadopago: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1' as const,
          zelle: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c' as const,
          paypal: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E' as const,
          monzo: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042' as const,
          gatingService: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const,
          zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3' as const,
        }
      )
    ).rejects.toBeInstanceOf(Error);
  });
});

describe('actions: trivial wrappers', () => {
  it('withdrawDeposit calls simulate+write', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    const hash = await withdrawDeposit(walletClient, publicClient, '0xescrow', { depositId: 1 } as any);
    expect(hash).toMatch(/^0x/);
    expect(fns.simulateContract).toHaveBeenCalled();
  });

  it('cancelIntent calls simulate+write', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    const hash = await cancelIntent(walletClient, publicClient, '0xescrow', { intentHash: '0x' + '12'.repeat(32) } as any);
    expect(hash).toMatch(/^0x/);
    expect(fns.simulateContract).toHaveBeenCalled();
  });

  it('releaseFundsToPayer calls simulate+write', async () => {
    const { walletClient, publicClient, fns } = createMockClients();
    const hash = await releaseFundsToPayer(walletClient, publicClient, '0xescrow', { intentHash: '0x' + '34'.repeat(32) } as any);
    expect(hash).toMatch(/^0x/);
    expect(fns.simulateContract).toHaveBeenCalled();
  });
});

describe('actions: callbacks are invoked', () => {
  it('fulfillIntent triggers onSuccess and onMined', async () => {
    const { walletClient, publicClient } = createMockClients();
    const onSuccess = vi.fn();
    const onMined = vi.fn();
    await fulfillIntent(walletClient, publicClient, '0xescrow', {
      paymentProofs: [{ proof: baseProof }],
      intentHash: '0x' + 'cd'.repeat(32),
      onSuccess,
      onMined,
    } as any);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onMined).toHaveBeenCalledTimes(1);
  });
});
