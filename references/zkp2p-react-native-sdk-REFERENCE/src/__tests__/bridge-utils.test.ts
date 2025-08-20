import {
  generateRpcRequestId,
  createRPCMessage,
  isRPCResponse,
  parseRPCError,
} from '../bridges/utils';

describe('Bridge Utils', () => {
  describe('generateRpcRequestId', () => {
    it('should generate a valid hexadecimal string', () => {
      const id = generateRpcRequestId();

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^[0-9a-f]+$/);
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        ids.add(generateRpcRequestId());
      }

      // While theoretically possible to have collisions, it's extremely unlikely
      expect(ids.size).toBe(iterations);
    });

    it('should generate IDs of consistent format', () => {
      const ids = Array.from({ length: 100 }, () => generateRpcRequestId());

      ids.forEach((id) => {
        expect(id).toMatch(/^[0-9a-f]+$/);
        // IDs should be reasonably long (Math.random().toString(16).slice(2) typically gives 13-14 chars)
        expect(id.length).toBeGreaterThanOrEqual(10);
        expect(id.length).toBeLessThanOrEqual(16);
      });
    });
  });

  describe('createRPCMessage', () => {
    it('should create a properly formatted RPC message', () => {
      const id = '123abc';
      const type = 'executeZkFunctionV3';
      const request = { data: 'test', value: 42 };

      const message = createRPCMessage(id, type, request);

      expect(message).toEqual({
        module: 'attestor-core',
        id: '123abc',
        type: 'executeZkFunctionV3',
        request: { data: 'test', value: 42 },
      });
    });

    it('should handle empty request object', () => {
      const message = createRPCMessage('id1', 'executeZkFunctionV3', {});

      expect(message).toEqual({
        module: 'attestor-core',
        id: 'id1',
        type: 'executeZkFunctionV3',
        request: {},
      });
    });

    it('should handle null request', () => {
      const message = createRPCMessage('id2', 'executeZkFunctionV3', null);

      expect(message).toEqual({
        module: 'attestor-core',
        id: 'id2',
        type: 'executeZkFunctionV3',
        request: null,
      });
    });

    it('should handle complex request objects', () => {
      const complexRequest = {
        nested: {
          data: 'value',
          array: [1, 2, 3],
          boolean: true,
        },
        nullValue: null,
        undefinedValue: undefined,
      };

      const message = createRPCMessage(
        'id3',
        'executeZkFunctionV3',
        complexRequest
      );

      expect(message.request).toEqual(complexRequest);
    });

    it('should preserve request object reference', () => {
      const request = { mutable: 'data' };
      const message = createRPCMessage('id4', 'executeZkFunctionV3', request);

      // Should be the same reference
      expect(message.request).toBe(request);
    });
  });

  describe('isRPCResponse', () => {
    it('should return true for valid RPC response', () => {
      const validResponse = {
        module: 'attestor-core',
        isResponse: true,
        data: 'some response data',
      };

      expect(isRPCResponse(validResponse)).toBe(true);
    });

    it('should return false for non-response messages', () => {
      const nonResponse = {
        module: 'attestor-core',
        isResponse: false,
        data: 'some data',
      };

      expect(isRPCResponse(nonResponse)).toBe(false);
    });

    it('should return false for wrong module', () => {
      const wrongModule = {
        module: 'wrong-module',
        isResponse: true,
        data: 'some data',
      };

      expect(isRPCResponse(wrongModule)).toBe(false);
    });

    it('should return false for missing module', () => {
      const missingModule = {
        isResponse: true,
        data: 'some data',
      };

      expect(isRPCResponse(missingModule)).toBe(false);
    });

    it('should return false for missing isResponse', () => {
      const missingIsResponse = {
        module: 'attestor-core',
        data: 'some data',
      };

      expect(isRPCResponse(missingIsResponse)).toBe(false);
    });

    it('should return false for null/undefined inputs', () => {
      // The function actually returns null for null input due to short-circuit evaluation
      expect(isRPCResponse(null)).toBeFalsy();
      expect(isRPCResponse(undefined)).toBeFalsy();
    });

    it('should return false for non-object inputs', () => {
      expect(isRPCResponse('string')).toBe(false);
      expect(isRPCResponse(123)).toBe(false);
      expect(isRPCResponse(true)).toBe(false);
      expect(isRPCResponse([])).toBe(false);
    });

    it('should handle edge cases', () => {
      // isResponse as string 'true'
      expect(
        isRPCResponse({
          module: 'attestor-core',
          isResponse: 'true' as any,
        })
      ).toBe(false);

      // isResponse as number 1
      expect(
        isRPCResponse({
          module: 'attestor-core',
          isResponse: 1 as any,
        })
      ).toBe(false);
    });
  });

  describe('parseRPCError', () => {
    it('should parse error with message property', () => {
      const errorObj = { message: 'Something went wrong' };
      const error = parseRPCError(errorObj);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Something went wrong');
    });

    it('should handle error with empty message', () => {
      const errorObj = { message: '' };
      const error = parseRPCError(errorObj);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown RPC error');
    });

    it('should handle null error object', () => {
      const error = parseRPCError(null);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown RPC error');
    });

    it('should handle undefined error object', () => {
      const error = parseRPCError(undefined);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown RPC error');
    });

    it('should handle error object without message property', () => {
      const errorObj = { code: 500, data: 'some data' };
      const error = parseRPCError(errorObj);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown RPC error');
    });

    it('should handle non-object errors', () => {
      expect(parseRPCError('string error').message).toBe('Unknown RPC error');
      expect(parseRPCError(123).message).toBe('Unknown RPC error');
      expect(parseRPCError(true).message).toBe('Unknown RPC error');
      expect(parseRPCError([]).message).toBe('Unknown RPC error');
    });

    it('should handle error with non-string message', () => {
      const errorObj = { message: { nested: 'error' } };
      const error = parseRPCError(errorObj);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('[object Object]');
    });

    it('should preserve error message with special characters', () => {
      const specialMessage = 'Error: "quotes" & <tags> \n newlines \t tabs';
      const errorObj = { message: specialMessage };
      const error = parseRPCError(errorObj);

      expect(error.message).toBe(specialMessage);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const errorObj = { message: longMessage };
      const error = parseRPCError(errorObj);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });
  });

  describe('Integration scenarios', () => {
    it('should work together for request/response flow', () => {
      // Create request
      const requestId = generateRpcRequestId();
      const request = { action: 'verify', data: 'test' };
      const message = createRPCMessage(
        requestId,
        'executeZkFunctionV3',
        request
      );

      // Simulate response
      const response = {
        module: 'attestor-core',
        isResponse: true,
        id: requestId,
        result: 'success',
      };

      // Validate response
      expect(isRPCResponse(response)).toBe(true);
      expect(response.id).toBe(message.id);
    });

    it('should handle error response flow', () => {
      const requestId = generateRpcRequestId();
      const errorResponse = {
        module: 'attestor-core',
        isResponse: true,
        id: requestId,
        error: { message: 'Verification failed' },
      };

      expect(isRPCResponse(errorResponse)).toBe(true);

      const error = parseRPCError(errorResponse.error);
      expect(error.message).toBe('Verification failed');
    });
  });
});
