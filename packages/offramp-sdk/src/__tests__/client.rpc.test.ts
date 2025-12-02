import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';

/**
 * Tests for RPC-first query methods that read from on-chain via ProtocolViewer.
 *
 * These tests verify:
 * - getDeposits() / getAccountDeposits(owner)
 * - getDeposit(id) / getDepositsById(ids)
 * - getIntents() / getAccountIntents(owner)
 * - getIntent(hash)
 * - resolvePayeeHash(depositId, pmHash)
 */

// Mock deposit data matching ProtocolViewer contract response format
const MOCK_DEPOSIT_RAW = {
  depositId: 42n,
  deposit: {
    depositor: '0x1234567890123456789012345678901234567890',
    delegate: '0x0000000000000000000000000000000000000000',
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: 1000000000n, // 1000 USDC
    intentAmountRange: { min: 10000000n, max: 500000000n },
    acceptingIntents: true,
    remainingDeposits: 800000000n,
    outstandingIntentAmount: 200000000n,
    makerProtocolFee: 0n,
    reservedMakerFees: 0n,
    accruedMakerFees: 0n,
    accruedReferrerFees: 0n,
    intentGuardian: '0x0000000000000000000000000000000000000000',
    referrer: '0x0000000000000000000000000000000000000000',
    referrerFee: 0n,
  },
  availableLiquidity: 800000000n,
  paymentMethods: [
    {
      paymentMethod: '0x77697365000000000000000000000000000000000000000000000000000000', // "wise" in bytes32
      verificationData: {
        intentGatingService: '0x0000000000000000000000000000000000000000',
        payeeDetails: '0x1111111111111111111111111111111111111111111111111111111111111111',
        data: '0x',
      },
      currencies: [
        { code: '0x555344000000000000000000000000000000000000000000000000000000', minConversionRate: 1020000000000000000n },
      ],
    },
  ],
  intentHashes: ['0xaaaa...', '0xbbbb...'],
};

const MOCK_DEPOSIT_RAW_2 = {
  ...MOCK_DEPOSIT_RAW,
  depositId: 43n,
  availableLiquidity: 500000000n,
};

// Mock intent data matching ProtocolViewer contract response format
const MOCK_INTENT_RAW = {
  intentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  intent: {
    owner: '0x1234567890123456789012345678901234567890',
    to: '0x2345678901234567890123456789012345678901',
    escrow: '0x2f121CDDCA6d652f35e8B3E560f9760898888888',
    depositId: 42n,
    amount: 100000000n, // 100 USDC
    timestamp: 1700000000n,
    paymentMethod: '0x77697365000000000000000000000000000000000000000000000000000000',
    fiatCurrency: '0x555344000000000000000000000000000000000000000000000000000000',
    conversionRate: 1020000000000000000n,
    referrer: '0x0000000000000000000000000000000000000000',
    referrerFee: 0n,
    postIntentHook: '0x0000000000000000000000000000000000000000',
    data: '0x',
  },
  deposit: MOCK_DEPOSIT_RAW,
};

describe('Zkp2pClient RPC Methods', () => {
  let client: Zkp2pClient;
  let mockReadContract: Mock;
  const TEST_OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup wallet client with a test private key (Hardhat default account #0)
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    // Create client
    client = new Zkp2pClient({
      walletClient,
      chainId: 8453,
    });

    // Mock the publicClient.readContract method
    mockReadContract = vi.fn();
    (client.publicClient as any).readContract = mockReadContract;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getDeposits() / getAccountDeposits()
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getDeposits()', () => {
    it('fetches deposits for the connected wallet', async () => {
      mockReadContract.mockResolvedValue([MOCK_DEPOSIT_RAW, MOCK_DEPOSIT_RAW_2]);

      const deposits = await client.getDeposits();

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getAccountDeposits',
          args: [TEST_OWNER],
        })
      );
      expect(deposits).toHaveLength(2);
      expect(deposits[0].depositId).toBe(42n);
      expect(deposits[1].depositId).toBe(43n);
    });

    it('throws when wallet has no account', async () => {
      // Create client without account
      const walletClientNoAccount = createWalletClient({
        chain: base,
        transport: http(),
      });
      const clientNoAccount = new Zkp2pClient({
        walletClient: walletClientNoAccount,
        chainId: 8453,
      });

      await expect(clientNoAccount.getDeposits()).rejects.toThrow('Wallet client is missing account');
    });

    it('returns empty array when no deposits exist', async () => {
      mockReadContract.mockResolvedValue([]);

      const deposits = await client.getDeposits();

      expect(deposits).toHaveLength(0);
    });
  });

  describe('getAccountDeposits(owner)', () => {
    it('fetches deposits for a specific address', async () => {
      const otherOwner = '0x9999999999999999999999999999999999999999';
      mockReadContract.mockResolvedValue([MOCK_DEPOSIT_RAW]);

      const deposits = await client.getAccountDeposits(otherOwner as `0x${string}`);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getAccountDeposits',
          args: [otherOwner],
        })
      );
      expect(deposits).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getDeposit() / getDepositsById()
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getDeposit(depositId)', () => {
    it('fetches a single deposit by bigint ID', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const deposit = await client.getDeposit(42n);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getDeposit',
          args: [42n],
        })
      );
      expect(deposit.depositId).toBe(42n);
      expect(deposit.availableLiquidity).toBe(800000000n);
      expect(deposit.deposit.acceptingIntents).toBe(true);
    });

    it('accepts number ID and converts to bigint', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      await client.getDeposit(42);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [42n],
        })
      );
    });

    it('accepts string ID and converts to bigint', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      await client.getDeposit('42');

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [42n],
        })
      );
    });

    it('correctly parses deposit with payment methods', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const deposit = await client.getDeposit(42n);

      expect(deposit.paymentMethods).toHaveLength(1);
      expect(deposit.paymentMethods[0].currencies).toHaveLength(1);
      expect(deposit.paymentMethods[0].currencies[0].minConversionRate).toBe(1020000000000000000n);
    });
  });

  describe('getDepositsById(depositIds)', () => {
    it('fetches multiple deposits by ID in batch', async () => {
      mockReadContract.mockResolvedValue([MOCK_DEPOSIT_RAW, MOCK_DEPOSIT_RAW_2]);

      const deposits = await client.getDepositsById([42n, 43n]);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getDepositFromIds',
          args: [[42n, 43n]],
        })
      );
      expect(deposits).toHaveLength(2);
    });

    it('converts mixed ID types to bigint', async () => {
      mockReadContract.mockResolvedValue([MOCK_DEPOSIT_RAW, MOCK_DEPOSIT_RAW_2]);

      await client.getDepositsById([42n, 43, '44']);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [[42n, 43n, 44n]],
        })
      );
    });

    it('returns empty array for empty input', async () => {
      mockReadContract.mockResolvedValue([]);

      const deposits = await client.getDepositsById([]);

      expect(deposits).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getIntents() / getAccountIntents()
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getIntents()', () => {
    it('fetches intents for the connected wallet', async () => {
      mockReadContract.mockResolvedValue([MOCK_INTENT_RAW]);

      const intents = await client.getIntents();

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getAccountIntents',
          args: [TEST_OWNER],
        })
      );
      expect(intents).toHaveLength(1);
      expect(intents[0].intentHash).toBe(MOCK_INTENT_RAW.intentHash);
    });

    it('throws when wallet has no account', async () => {
      const walletClientNoAccount = createWalletClient({
        chain: base,
        transport: http(),
      });
      const clientNoAccount = new Zkp2pClient({
        walletClient: walletClientNoAccount,
        chainId: 8453,
      });

      await expect(clientNoAccount.getIntents()).rejects.toThrow('Wallet client is missing account');
    });

    it('returns empty array when no intents exist', async () => {
      mockReadContract.mockResolvedValue([]);

      const intents = await client.getIntents();

      expect(intents).toHaveLength(0);
    });
  });

  describe('getAccountIntents(owner)', () => {
    it('fetches intents for a specific address', async () => {
      const otherOwner = '0x9999999999999999999999999999999999999999';
      mockReadContract.mockResolvedValue([MOCK_INTENT_RAW]);

      const intents = await client.getAccountIntents(otherOwner as `0x${string}`);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getAccountIntents',
          args: [otherOwner],
        })
      );
      expect(intents).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getIntent()
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getIntent(intentHash)', () => {
    it('fetches a single intent by hash', async () => {
      mockReadContract.mockResolvedValue(MOCK_INTENT_RAW);

      const intent = await client.getIntent(MOCK_INTENT_RAW.intentHash as `0x${string}`);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getIntent',
          args: [MOCK_INTENT_RAW.intentHash],
        })
      );
      expect(intent.intentHash).toBe(MOCK_INTENT_RAW.intentHash);
      expect(intent.intent.amount).toBe(100000000n);
      expect(intent.intent.depositId).toBe(42n);
    });

    it('correctly parses intent with deposit context', async () => {
      mockReadContract.mockResolvedValue(MOCK_INTENT_RAW);

      const intent = await client.getIntent(MOCK_INTENT_RAW.intentHash as `0x${string}`);

      // Verify intent fields
      expect(intent.intent.owner).toBe(MOCK_INTENT_RAW.intent.owner);
      expect(intent.intent.to).toBe(MOCK_INTENT_RAW.intent.to);
      expect(intent.intent.conversionRate).toBe(1020000000000000000n);

      // Verify embedded deposit context
      expect(intent.deposit.depositId).toBe(42n);
      expect(intent.deposit.availableLiquidity).toBe(800000000n);
      expect(intent.deposit.paymentMethods).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // resolvePayeeHash()
  // ═══════════════════════════════════════════════════════════════════════════

  describe('resolvePayeeHash(depositId, paymentMethodHash)', () => {
    it('returns payeeDetails when payment method matches', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const payeeHash = await client.resolvePayeeHash(
        42n,
        '0x77697365000000000000000000000000000000000000000000000000000000'
      );

      expect(payeeHash).toBe('0x1111111111111111111111111111111111111111111111111111111111111111');
    });

    it('returns null when payment method not found', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const payeeHash = await client.resolvePayeeHash(
        42n,
        '0x0000000000000000000000000000000000000000000000000000000000000000' // non-existent
      );

      expect(payeeHash).toBeNull();
    });

    it('matches payment method case-insensitively', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const payeeHash = await client.resolvePayeeHash(
        42n,
        '0x77697365000000000000000000000000000000000000000000000000000000'.toUpperCase()
      );

      expect(payeeHash).toBe('0x1111111111111111111111111111111111111111111111111111111111111111');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Parsing
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Data Parsing', () => {
    it('correctly converts all bigint fields in deposit', async () => {
      mockReadContract.mockResolvedValue(MOCK_DEPOSIT_RAW);

      const deposit = await client.getDeposit(42n);

      // All these should be bigint
      expect(typeof deposit.depositId).toBe('bigint');
      expect(typeof deposit.availableLiquidity).toBe('bigint');
      expect(typeof deposit.deposit.amount).toBe('bigint');
      expect(typeof deposit.deposit.remainingDeposits).toBe('bigint');
      expect(typeof deposit.deposit.outstandingIntentAmount).toBe('bigint');
      expect(typeof deposit.deposit.intentAmountRange.min).toBe('bigint');
      expect(typeof deposit.deposit.intentAmountRange.max).toBe('bigint');
    });

    it('correctly converts all bigint fields in intent', async () => {
      mockReadContract.mockResolvedValue(MOCK_INTENT_RAW);

      const intent = await client.getIntent(MOCK_INTENT_RAW.intentHash as `0x${string}`);

      // All these should be bigint
      expect(typeof intent.intent.depositId).toBe('bigint');
      expect(typeof intent.intent.amount).toBe('bigint');
      expect(typeof intent.intent.timestamp).toBe('bigint');
      expect(typeof intent.intent.conversionRate).toBe('bigint');
    });
  });
});
