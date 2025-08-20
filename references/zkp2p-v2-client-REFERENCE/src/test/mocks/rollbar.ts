import { vi } from 'vitest';

// Mock Rollbar instance
export const mockRollbar = {
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  critical: vi.fn(),
};

// Mock useRollbar hook
export const mockUseRollbar = () => mockRollbar;

// Mock useErrorLogger hook
export const mockLogError = vi.fn();
export const mockUseErrorLogger = () => ({
  logError: mockLogError,
});

// Mock for @rollbar/react module
export const rollbarReactMock = {
  useRollbar: mockUseRollbar,
  RollbarProvider: ({ children }: { children: React.ReactNode }) => children,
};

// Mock for useErrorLogger hook
export const errorLoggerMock = {
  useErrorLogger: mockUseErrorLogger,
};