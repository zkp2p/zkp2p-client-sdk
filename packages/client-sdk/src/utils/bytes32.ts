import { keccak256, toBytes, hexToBytes, bytesToHex } from 'viem';

/**
 * Ensure a value is 32 bytes hex (0x + 64 nibbles). If ascii, keccak256 by default when hash=true.
 */
export function ensureBytes32(value: string, { hashIfAscii = false }: { hashIfAscii?: boolean } = {}): `0x${string}` {
  if (value.startsWith('0x')) {
    const bytes = hexToBytes(value as `0x${string}`);
    if (bytes.length !== 32) throw new Error('Expected 32-byte hex value');
    return value as `0x${string}`;
  }
  if (!hashIfAscii) throw new Error('Expected 32-byte hex; received ascii string. Pass hashIfAscii=true to hash.');
  const hashed = keccak256(toBytes(value));
  return hashed as `0x${string}`;
}

/**
 * Encode ASCII (<=32 chars) left-aligned, right-padded with zeros to 32 bytes.
 */
export function asciiToBytes32(value: string): `0x${string}` {
  const b = toBytes(value);
  if (b.length > 32) throw new Error('ASCII input exceeds 32 bytes');
  const padded = new Uint8Array(32);
  padded.set(b);
  return (`0x${bytesToHex(padded)}`) as `0x${string}`;
}

