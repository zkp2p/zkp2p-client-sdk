/**
 * Utility functions for safely serializing and deserializing objects containing BigInt values
 * BigInt values cannot be directly serialized with JSON.stringify(), so they must be converted to strings
 */

/**
 * Recursively converts all BigInt values in an object to strings for safe JSON serialization
 * @param obj - The object to process
 * @returns A new object with all BigInt values converted to strings
 */
export function bigIntToString<T = any>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => bigIntToString(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = bigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Safely stringify an object that may contain BigInt values
 * @param obj - The object to stringify
 * @param space - Optional formatting space parameter for JSON.stringify
 * @returns JSON string representation of the object
 */
export function safeStringify(obj: any, space?: string | number): string {
  const processed = bigIntToString(obj);
  return JSON.stringify(processed, null, space);
}

/**
 * Custom replacer function for JSON.stringify that handles BigInt values
 * Can be used directly with JSON.stringify as the replacer parameter
 * @param _key - The object key (unused but required by JSON.stringify interface)
 * @param value - The value to process
 * @returns The value with BigInt converted to string
 */
export function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Recursively converts string representations of BigInt values back to BigInt
 * Only converts strings that match BigInt patterns (whole numbers)
 * @param obj - The object to process
 * @param keys - Optional array of specific keys to convert (if not provided, attempts to convert all numeric strings)
 * @returns A new object with string BigInt values converted back to BigInt
 */
export function stringToBigInt<T = any>(obj: T, keys?: string[]): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' && /^\d+$/.test(obj)) {
    // Only convert if no specific keys are provided or if this is in a specified key
    if (!keys) {
      try {
        return BigInt(obj);
      } catch {
        return obj;
      }
    }
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stringToBigInt(item, keys));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (keys && keys.includes(key) && typeof obj[key] === 'string' && /^\d+$/.test(obj[key] as string)) {
          try {
            result[key] = BigInt(obj[key] as string);
          } catch {
            result[key] = obj[key];
          }
        } else {
          result[key] = stringToBigInt(obj[key], keys);
        }
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Parse JSON string that contains BigInt string representations
 * @param json - The JSON string to parse
 * @param bigIntKeys - Optional array of keys that should be converted to BigInt
 * @returns Parsed object with BigInt values restored
 */
export function safeParse(json: string, bigIntKeys?: string[]): any {
  const parsed = JSON.parse(json);
  return stringToBigInt(parsed, bigIntKeys);
}