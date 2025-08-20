import { describe, it, expect } from 'vitest';
import { bigIntToString, safeStringify, bigIntReplacer, stringToBigInt, safeParse } from '../bigIntSerialization';
import { Proof } from '../types';

describe('bigIntSerialization', () => {
  describe('bigIntToString', () => {
    it('should convert BigInt values to strings', () => {
      const input = {
        amount: BigInt('1000000000000000000'),
        timestamp: BigInt(1234567890),
        normal: 'string',
        number: 42,
      };

      const result = bigIntToString(input);

      expect(result).toEqual({
        amount: '1000000000000000000',
        timestamp: '1234567890',
        normal: 'string',
        number: 42,
      });
    });

    it('should handle nested objects with BigInt', () => {
      const input = {
        outer: {
          inner: {
            value: BigInt(999),
            data: 'test',
          },
        },
      };

      const result = bigIntToString(input);

      expect(result).toEqual({
        outer: {
          inner: {
            value: '999',
            data: 'test',
          },
        },
      });
    });

    it('should handle arrays with BigInt', () => {
      const input = {
        values: [BigInt(1), BigInt(2), BigInt(3)],
        mixed: [BigInt(100), 'text', 200],
      };

      const result = bigIntToString(input);

      expect(result).toEqual({
        values: ['1', '2', '3'],
        mixed: ['100', 'text', 200],
      });
    });

    it('should handle null and undefined', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        bigintValue: BigInt(123),
      };

      const result = bigIntToString(input);

      expect(result).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        bigintValue: '123',
      });
    });
  });

  describe('safeStringify', () => {
    it('should stringify objects with BigInt without throwing', () => {
      const obj = {
        amount: BigInt('1000000000000000000'),
        timestamp: BigInt(1234567890),
      };

      // This would throw with regular JSON.stringify
      expect(() => JSON.stringify(obj)).toThrow('Do not know how to serialize a BigInt');

      // But our safeStringify should work
      const result = safeStringify(obj);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        amount: '1000000000000000000',
        timestamp: '1234567890',
      });
    });

    it('should handle Proof objects from extension', () => {
      const proof: Proof = {
        claimInfo: {
          provider: 'venmo',
          parameters: '{"amount":"10.00"}',
          context: 'test-context',
        },
        signedClaim: {
          claim: {
            identifier: '0x123',
            owner: '0xabc',
            timestampS: BigInt(1640995200),
            epoch: BigInt(1),
          },
          signatures: ['0xsignature1', '0xsignature2'],
        },
        isAppclipProof: false,
      };

      const result = safeStringify(proof);
      const parsed = JSON.parse(result);

      expect(parsed.signedClaim.claim.timestampS).toBe('1640995200');
      expect(parsed.signedClaim.claim.epoch).toBe('1');
      expect(parsed.claimInfo.provider).toBe('venmo');
    });

    it('should handle arrays of Proof objects', () => {
      const proofs: Proof[] = [
        {
          claimInfo: {
            provider: 'venmo',
            parameters: '{}',
            context: 'ctx1',
          },
          signedClaim: {
            claim: {
              identifier: '0x1',
              owner: '0xa',
              timestampS: BigInt(1000),
              epoch: BigInt(1),
            },
            signatures: ['0xsig1'],
          },
          isAppclipProof: false,
        },
        {
          claimInfo: {
            provider: 'revolut',
            parameters: '{}',
            context: 'ctx2',
          },
          signedClaim: {
            claim: {
              identifier: '0x2',
              owner: '0xb',
              timestampS: BigInt(2000),
              epoch: BigInt(2),
            },
            signatures: ['0xsig2'],
          },
          isAppclipProof: true,
        },
      ];

      const result = safeStringify(proofs);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].signedClaim.claim.timestampS).toBe('1000');
      expect(parsed[1].signedClaim.claim.epoch).toBe('2');
    });

    it('should preserve formatting with space parameter', () => {
      const obj = {
        value: BigInt(123),
        nested: {
          amount: BigInt(456),
        },
      };

      const result = safeStringify(obj, 2);
      
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  describe('bigIntReplacer', () => {
    it('should work as JSON.stringify replacer', () => {
      const obj = {
        amount: BigInt(1000),
        normal: 'value',
      };

      const result = JSON.stringify(obj, bigIntReplacer);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        amount: '1000',
        normal: 'value',
      });
    });
  });

  describe('stringToBigInt', () => {
    it('should convert string numbers back to BigInt', () => {
      const input = {
        amount: '1000000000000000000',
        timestamp: '1234567890',
        normal: 'string',
        number: 42,
      };

      const result = stringToBigInt(input);

      expect(result.amount).toBe(BigInt('1000000000000000000'));
      expect(result.timestamp).toBe(BigInt('1234567890'));
      expect(result.normal).toBe('string');
      expect(result.number).toBe(42);
    });

    it('should only convert specified keys when provided', () => {
      const input = {
        amount: '1000',
        code: '12345',
        timestamp: '999',
      };

      const result = stringToBigInt(input, ['amount', 'timestamp']);

      expect(result.amount).toBe(BigInt('1000'));
      expect(result.code).toBe('12345'); // Not converted
      expect(result.timestamp).toBe(BigInt('999'));
    });

    it('should handle nested objects with specified keys', () => {
      const input = {
        data: {
          amount: '500',
          id: '123',
        },
      };

      const result = stringToBigInt(input, ['amount']);

      expect(result.data.amount).toBe(BigInt('500'));
      expect(result.data.id).toBe('123');
    });

    it('should not convert non-numeric strings', () => {
      const input = {
        amount: '100abc',
        valid: '200',
        text: 'hello',
      };

      const result = stringToBigInt(input);

      expect(result.amount).toBe('100abc'); // Not converted
      expect(result.valid).toBe(BigInt('200'));
      expect(result.text).toBe('hello');
    });
  });

  describe('safeParse', () => {
    it('should parse JSON and restore BigInt values', () => {
      const original = {
        amount: BigInt('1000000000000000000'),
        timestamp: BigInt(1234567890),
      };

      const stringified = safeStringify(original);
      const parsed = safeParse(stringified, ['amount', 'timestamp']);

      expect(parsed.amount).toBe(BigInt('1000000000000000000'));
      expect(parsed.timestamp).toBe(BigInt('1234567890'));
    });

    it('should handle Proof object round-trip', () => {
      const proof: Proof = {
        claimInfo: {
          provider: 'venmo',
          parameters: '{"amount":"10.00"}',
          context: 'test',
        },
        signedClaim: {
          claim: {
            identifier: '0x123',
            owner: '0xabc',
            timestampS: BigInt(1640995200),
            epoch: BigInt(1),
          },
          signatures: ['0xsig'],
        },
        isAppclipProof: false,
      };

      const stringified = safeStringify(proof);
      const parsed = safeParse(stringified, ['timestampS', 'epoch']);

      expect(parsed.signedClaim.claim.timestampS).toBe(BigInt(1640995200));
      expect(parsed.signedClaim.claim.epoch).toBe(BigInt(1));
      expect(parsed.claimInfo.provider).toBe('venmo');
    });
  });

  describe('Real-world scenario tests', () => {
    it('should handle extension proof error scenario', () => {
      // Simulating the error case from ExtensionProofForm.tsx
      const transferProof = {
        error: 'Failed to generate proof',
        details: {
          timestamp: BigInt(Date.now()),
          intentHash: '0x1234567890abcdef',
          amount: BigInt('1000000'), // 1 USDC
        },
      };

      // This would fail with JSON.stringify
      expect(() => JSON.stringify(transferProof)).toThrow();

      // But safeStringify should work
      const serialized = safeStringify(transferProof);
      expect(serialized).toBeTruthy();
      
      const parsed = JSON.parse(serialized);
      expect(parsed.error).toBe('Failed to generate proof');
      expect(parsed.details.amount).toBe('1000000');
    });

    it('should handle Rollbar logging scenario', () => {
      // Simulating logging to Rollbar with BigInt values
      const logData = {
        proof: {
          signedClaim: {
            claim: {
              timestampS: BigInt(1640995200),
              epoch: BigInt(1),
            },
          },
        },
        paymentPlatform: 'venmo',
        intentHash: '0xabc',
        currentProofIndex: 0,
      };

      const serialized = safeStringify(logData);
      const parsed = JSON.parse(serialized);

      expect(parsed.proof.signedClaim.claim.timestampS).toBe('1640995200');
      expect(parsed.paymentPlatform).toBe('venmo');
    });

    it('should handle TallySupportButton proof scenario', () => {
      // Simulating the TallySupportButton paymentProof prop
      const paymentProofs: Proof[] = [
        {
          claimInfo: {
            provider: 'venmo',
            parameters: '{}',
            context: 'test',
          },
          signedClaim: {
            claim: {
              identifier: '0x1',
              owner: '0x2',
              timestampS: BigInt('1234567890'),
              epoch: BigInt('5'),
            },
            signatures: ['0xsig'],
          },
          isAppclipProof: false,
        },
      ];

      const serialized = safeStringify(paymentProofs);
      expect(serialized).toBeTruthy();
      
      // Should be valid JSON
      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].signedClaim.claim.timestampS).toBe('1234567890');
    });
  });
});