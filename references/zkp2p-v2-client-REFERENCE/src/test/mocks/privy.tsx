import React from 'react';
import { vi } from 'vitest';

// Mock Privy authentication
export const mockPrivy = {
  ready: true,
  authenticated: true,
  user: {
    id: 'test-user-id',
    wallet: { 
      address: '0x1234567890123456789012345678901234567890',
      chainId: 8453,
    },
    email: {
      address: 'test@example.com',
    },
  },
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  linkWallet: vi.fn(),
  unlinkWallet: vi.fn(),
  signMessage: vi.fn().mockResolvedValue('0xmocksignature'),
};

// Mock usePrivy hook
export const mockUsePrivy = vi.fn(() => mockPrivy);

// Mock Privy provider
export const MockPrivyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Reset Privy mocks
export const resetPrivyMocks = () => {
  mockPrivy.login.mockClear();
  mockPrivy.logout.mockClear();
  mockPrivy.getAccessToken.mockClear();
  mockPrivy.linkWallet.mockClear();
  mockPrivy.unlinkWallet.mockClear();
  mockPrivy.signMessage.mockClear();
  mockUsePrivy.mockClear();
};