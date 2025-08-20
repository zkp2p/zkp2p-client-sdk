/**
 * Normalize an identifier to a base-10 string.
 * - If hex-prefixed (0x...), converts using BigInt to decimal.
 * - If decimal digits, returns as-is (without altering leading zeros).
 * - Otherwise, returns the input string unchanged.
 */
export function toDecimalString(value: string | bigint): string {
  if (typeof value === 'bigint') return value.toString(10);
  const str = String(value ?? '').trim();
  // Hex with 0x/0X prefix
  if (/^0x[0-9a-fA-F]+$/i.test(str)) {
    try {
      return BigInt(str).toString(10);
    } catch {
      return str;
    }
  }
  // Pure decimal digits
  if (/^[0-9]+$/.test(str)) {
    return str;
  }
  // Hex without 0x prefix (contains a-f characters)
  if (/^[0-9a-fA-F]+$/.test(str)) {
    try {
      return BigInt('0x' + str).toString(10);
    } catch {
      return str;
    }
  }
  return str;
}
