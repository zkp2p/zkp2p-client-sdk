// Setup import.meta.env before any other imports
if (!import.meta.env) {
  (globalThis as any).import = { meta: { env: {} } };
}

import './setup-env'; // Must be first to setup environment variables
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { rollbarReactMock } from './mocks/rollbar';

// Mock @rollbar/react module
vi.mock('@rollbar/react', () => rollbarReactMock);

// Mock crypto for wallet operations with deterministic randomness
// Uses a simple linear congruential generator for reproducible test results
let seed = 12345;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.resetModules();
  // Clear localStorage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  // Clear sessionStorage mocks
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  // Reset the seed for deterministic randomness
  seed = 12345;
});

// Ensure clean state before each test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset localStorage mock implementations
  localStorageMock.getItem.mockImplementation(() => null);
  localStorageMock.setItem.mockImplementation(() => undefined);
  localStorageMock.removeItem.mockImplementation(() => undefined);
  localStorageMock.clear.mockImplementation(() => undefined);
});

// Global mocks for browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const lcg = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(lcg() * 256);
      }
      return arr;
    },
    randomUUID: () => {
      // Generate deterministic UUID for testing
      const hexChars = '0123456789abcdef';
      let uuid = '';
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
          uuid += '-';
        } else if (i === 14) {
          uuid += '4'; // Version 4 UUID
        } else if (i === 19) {
          uuid += hexChars[(Math.floor(lcg() * 4) + 8)]; // Variant bits
        } else {
          uuid += hexChars[Math.floor(lcg() * 16)];
        }
      }
      return uuid;
    },
  },
});

global.localStorage = localStorageMock as any;
global.sessionStorage = sessionStorageMock as any;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn((...args) => {
    // Only show actual errors, not React warnings
    if (!args[0]?.includes?.('Warning:')) {
      originalError(...args);
    }
  });
  console.warn = vi.fn((...args) => {
    // Only show actual warnings
    if (!args[0]?.includes?.('componentWillReceiveProps')) {
      originalWarn(...args);
    }
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});