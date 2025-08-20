import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import theme from '@theme/index';

// Mock providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Create wrapper for hooks testing
export const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders>{children}</AllTheProviders>
  );
};

// Mock wagmi config for testing blockchain interactions
export const createMockWagmiConfig = () => {
  const mockConfig = {
    publicClient: {
      readContract: vi.fn(),
      simulateContract: vi.fn(),
    },
    walletClient: {
      writeContract: vi.fn(),
      account: {
        address: '0x1234567890123456789012345678901234567890',
      },
    },
  };

  return ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders>{children}</AllTheProviders>
  );
};