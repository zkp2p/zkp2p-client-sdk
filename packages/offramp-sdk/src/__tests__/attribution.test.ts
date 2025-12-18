import { describe, it, expect, vi } from 'vitest';
import { base } from 'viem/chains';
import type { WalletClient } from 'viem';
import { Attribution } from 'ox/erc8021';
import {
  appendAttributionToCalldata,
  BASE_BUILDER_CODE,
  getAttributionDataSuffix,
  sendTransactionWithAttribution,
} from '../utils/attribution';

const APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

describe('attribution utils', () => {
  it('appends Base builder code when no referrer is provided', () => {
    const suffix = getAttributionDataSuffix();
    const expected = Attribution.toDataSuffix({ codes: [BASE_BUILDER_CODE] });
    expect(suffix).toBe(expected);
  });

  it('prepends single referrer before Base builder code', () => {
    const suffix = getAttributionDataSuffix('zkp2p-ios');
    const expected = Attribution.toDataSuffix({ codes: ['zkp2p-ios', BASE_BUILDER_CODE] });
    expect(suffix).toBe(expected);
  });

  it('supports multiple referrers in order', () => {
    const suffix = getAttributionDataSuffix(['partner-code', 'merchant-id']);
    const expected = Attribution.toDataSuffix({
      codes: ['partner-code', 'merchant-id', BASE_BUILDER_CODE],
    });
    expect(suffix).toBe(expected);
  });

  it('appends suffix to calldata', () => {
    const calldata = '0x1234' as const;
    const suffix = getAttributionDataSuffix('demo');
    const combined = appendAttributionToCalldata(calldata, 'demo');
    expect(combined).toBe((calldata + suffix.slice(2)) as `0x${string}`);
  });

  it('sends transaction with attribution and forwards overrides', async () => {
    const sendTx = vi.fn().mockResolvedValue('0x' + 'ab'.repeat(32));
    const walletClient = {
      account: { address: '0x' + '11'.repeat(20) },
      chain: base,
      sendTransaction: sendTx,
    } as unknown as WalletClient;

    await sendTransactionWithAttribution(
      walletClient,
      {
        address: ('0x' + '22'.repeat(20)) as `0x${string}`,
        abi: APPROVE_ABI as any,
        functionName: 'approve',
        args: [('0x' + '33'.repeat(20)) as `0x${string}`, 1n],
      },
      ['partner'],
      { gas: 123n }
    );

    expect(sendTx).toHaveBeenCalledTimes(1);
    const sent = sendTx.mock.calls[0]?.[0];
    expect(sent?.gas).toBe(123n);
    const suffix = getAttributionDataSuffix(['partner']);
    expect((sent?.data as string).toLowerCase().endsWith(suffix.slice(2).toLowerCase())).toBe(true);
  });
});
