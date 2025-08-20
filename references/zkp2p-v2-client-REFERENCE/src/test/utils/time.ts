import { vi } from 'vitest';

/**
 * Time-based test utilities for consistent time handling in tests
 */

/**
 * Advances time by a specified duration
 * @param duration - Duration to advance in milliseconds
 */
export const advanceTimersByTime = async (duration: number) => {
  await vi.advanceTimersByTimeAsync(duration);
};

/**
 * Sets the system time to a specific date
 * @param date - The date to set the system time to
 */
export const setSystemTime = (date: Date | string | number) => {
  vi.setSystemTime(new Date(date));
};

/**
 * Runs all pending timers
 */
export const runAllTimers = async () => {
  await vi.runAllTimersAsync();
};

/**
 * Runs only the currently pending timers
 */
export const runOnlyPendingTimers = async () => {
  await vi.runOnlyPendingTimersAsync();
};

/**
 * Creates a test harness for time-based operations
 */
export const createTimeTestHarness = () => {
  const originalDateNow = Date.now;
  const originalDate = global.Date;

  return {
    setup: () => {
      vi.useFakeTimers();
    },

    teardown: () => {
      vi.useRealTimers();
      global.Date = originalDate;
      Date.now = originalDateNow;
    },

    /**
     * Sets a fixed time for the test
     */
    setTime: (timestamp: number) => {
      vi.setSystemTime(timestamp);
    },

    /**
     * Advances time by hours
     */
    advanceByHours: async (hours: number) => {
      await advanceTimersByTime(hours * 60 * 60 * 1000);
    },

    /**
     * Advances time by minutes
     */
    advanceByMinutes: async (minutes: number) => {
      await advanceTimersByTime(minutes * 60 * 1000);
    },

    /**
     * Advances time by seconds
     */
    advanceBySeconds: async (seconds: number) => {
      await advanceTimersByTime(seconds * 1000);
    },

    /**
     * Gets the current mocked time
     */
    getCurrentTime: () => {
      return new Date().getTime();
    },
  };
};

/**
 * Test helper for blockchain timestamps
 */
export const createBlockchainTimeHelper = () => {
  let currentBlockTimestamp = Math.floor(Date.now() / 1000);

  return {
    /**
     * Gets the current block timestamp
     */
    getBlockTimestamp: () => currentBlockTimestamp,

    /**
     * Advances the block timestamp by seconds
     */
    advanceBlockTime: (seconds: number) => {
      currentBlockTimestamp += seconds;
      return currentBlockTimestamp;
    },

    /**
     * Sets a specific block timestamp
     */
    setBlockTimestamp: (timestamp: number) => {
      currentBlockTimestamp = timestamp;
      return currentBlockTimestamp;
    },

    /**
     * Converts JS timestamp to blockchain timestamp
     */
    toBlockchainTime: (jsTimestamp: number) => {
      return Math.floor(jsTimestamp / 1000);
    },

    /**
     * Converts blockchain timestamp to JS timestamp
     */
    fromBlockchainTime: (blockTimestamp: number) => {
      return blockTimestamp * 1000;
    },
  };
};

/**
 * Common time constants for testing
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  
  // Intent-specific times
  INTENT_EXPIRY_TIME: 6 * 60 * 60 * 1000, // 6 hours
  PROOF_VALIDITY_TIME: 60 * 60 * 1000, // 1 hour
  
  // Test timestamps
  TEST_TIMESTAMP_2024: new Date('2024-01-01T00:00:00Z').getTime(),
  TEST_TIMESTAMP_2025: new Date('2025-01-01T00:00:00Z').getTime(),
};

/**
 * Creates a mock timer that can be controlled in tests
 */
export class MockTimer {
  private callbacks: Map<number, () => void> = new Map();
  private nextId = 1;
  private currentTime = 0;

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextId++;
    const executeAt = this.currentTime + delay;
    this.callbacks.set(id, () => {
      if (this.currentTime >= executeAt) {
        callback();
        this.callbacks.delete(id);
      }
    });
    return id;
  }

  clearTimeout(id: number): void {
    this.callbacks.delete(id);
  }

  tick(ms: number): void {
    this.currentTime += ms;
    this.callbacks.forEach(callback => callback());
  }

  reset(): void {
    this.callbacks.clear();
    this.currentTime = 0;
    this.nextId = 1;
  }
}

/**
 * Helper to test time-dependent functions
 */
export const withFakeTime = async (
  testFn: () => Promise<void> | void,
  initialTime?: number
) => {
  vi.useFakeTimers();
  
  if (initialTime) {
    vi.setSystemTime(initialTime);
  }

  try {
    await testFn();
  } finally {
    vi.useRealTimers();
  }
};

/**
 * Helper to test rate-limited functions
 * Returns the duration for external assertion
 */
export const measureRateLimit = async (
  fn: () => Promise<any>
): Promise<number> => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};