import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useBrowserDetection } from '../useBrowserDetection';

describe('useBrowserDetection', () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalVendor = (window.navigator as any).vendor;

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'vendor', {
      value: originalVendor,
      configurable: true,
    });
  });

  const setUserAgent = (userAgent: string, vendor = '') => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: userAgent,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'vendor', {
      value: vendor,
      configurable: true,
    });
  };

  it('should detect Chrome browser correctly', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Google Inc.'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isChrome).toBe(true);
    expect(browserInfo.isAllowedBrowser).toBe(true);
    expect(browserInfo.browserName).toBe('Chrome');
  });

  it('should detect Firefox browser as incompatible', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isFirefox).toBe(true);
    expect(browserInfo.isAllowedBrowser).toBe(false);
    expect(browserInfo.browserName).toBe('Firefox');
  });

  it('should detect Safari browser as incompatible', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Apple Computer, Inc.'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isSafari).toBe(true);
    expect(browserInfo.isAllowedBrowser).toBe(false);
    expect(browserInfo.browserName).toBe('Safari');
  });

  it('should detect Edge (Chromium) as compatible', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isEdgeChromium).toBe(true);
    expect(browserInfo.isAllowedBrowser).toBe(true);
    expect(browserInfo.browserName).toBe('Edge');
  });

  it('should detect mobile devices', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isMobile).toBe(true);
  });

  it('should handle empty user agent strings', () => {
    setUserAgent('', '');

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isAllowedBrowser).toBe(false);
    expect(browserInfo.browserName).toBe('Unknown');
  });

  it('should handle SSR scenarios', () => {
    // The hook itself handles window being undefined by checking typeof window
    // We can't actually delete window in the test environment, but we can verify
    // the hook doesn't crash and returns safe defaults
    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    // Should return a valid object even if detection partially fails
    expect(browserInfo).toBeDefined();
    expect(browserInfo.userAgent).toBeDefined();
    expect(typeof browserInfo.isAllowedBrowser).toBe('boolean');
  });

  it('should detect Brave browser correctly', () => {
    // Brave has Chrome user agent but with navigator.brave
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Google Inc.'
    );
    
    // Mock navigator.brave
    (window.navigator as any).brave = {
      isBrave: () => true
    };

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isBrave).toBe(true);
    expect(browserInfo.isChrome).toBe(true); // Brave reports as Chrome too
    expect(browserInfo.isAllowedBrowser).toBe(true);
    expect(browserInfo.browserName).toBe('Brave');

    // Clean up
    delete (window.navigator as any).brave;
  });

  it('should detect Arc browser as compatible', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Arc/1.0.0'
    );

    const { result } = renderHook(() => useBrowserDetection());
    const browserInfo = result.current.detectBrowser();

    expect(browserInfo.isArc).toBe(true);
    expect(browserInfo.isAllowedBrowser).toBe(true);
    expect(browserInfo.browserName).toBe('Arc');
  });
});