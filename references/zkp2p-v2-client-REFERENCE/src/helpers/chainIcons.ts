import { useState, useEffect } from 'react';
import ethSvg from '@assets/images/eth.svg';

// Default fallback icon for chains without a logo (using Ethereum SVG)
const DEFAULT_CHAIN_ICON = ethSvg;

// Cache for validated URLs to avoid repeated checks
const validatedUrls = new Map<string, boolean>();

/**
 * Hook to handle chain icon loading with fallback
 * @param iconUrl - The URL of the chain icon
 * @returns The icon URL to use (original or fallback)
 */
export const useChainIcon = (iconUrl?: string): string => {
  const [iconSrc, setIconSrc] = useState(iconUrl || DEFAULT_CHAIN_ICON);

  useEffect(() => {
    if (!iconUrl) {
      setIconSrc(DEFAULT_CHAIN_ICON);
      return;
    }

    // Check cache first
    const cached = validatedUrls.get(iconUrl);
    if (cached === false) {
      setIconSrc(DEFAULT_CHAIN_ICON);
      return;
    }

    // If it's a local import (not a URL), trust it
    if (!iconUrl.startsWith('http')) {
      setIconSrc(iconUrl);
      return;
    }

    // For external URLs, validate them
    const img = new Image();
    
    const handleLoad = () => {
      validatedUrls.set(iconUrl, true);
      setIconSrc(iconUrl);
    };

    const handleError = () => {
      validatedUrls.set(iconUrl, false);
      setIconSrc(DEFAULT_CHAIN_ICON);
      
      // Log only in development
      if (import.meta.env.DEV) {
        console.warn(`Failed to load chain icon: ${iconUrl}`);
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = iconUrl;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [iconUrl]);

  return iconSrc;
};

/**
 * Validates a chain icon URL and returns a fallback if invalid
 * @param iconUrl - The URL to validate
 * @returns Promise resolving to the valid URL or fallback
 */
export const validateChainIcon = async (iconUrl?: string): Promise<string> => {
  if (!iconUrl) {
    return DEFAULT_CHAIN_ICON;
  }

  // Check cache
  const cached = validatedUrls.get(iconUrl);
  if (cached === false) {
    return DEFAULT_CHAIN_ICON;
  }
  if (cached === true) {
    return iconUrl;
  }

  // If it's a local import, trust it
  if (!iconUrl.startsWith('http')) {
    return iconUrl;
  }

  // Validate external URL
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      validatedUrls.set(iconUrl, true);
      resolve(iconUrl);
    };
    
    img.onerror = () => {
      validatedUrls.set(iconUrl, false);
      if (import.meta.env.DEV) {
        console.warn(`Failed to load chain icon: ${iconUrl}`);
      }
      resolve(DEFAULT_CHAIN_ICON);
    };
    
    img.src = iconUrl;
  });
};

/**
 * Get a safe chain icon URL with fallback
 * Synchronous version that returns cached result or default
 */
export const getSafeChainIcon = (iconUrl?: string): string => {
  if (!iconUrl) {
    return DEFAULT_CHAIN_ICON;
  }

  // Check cache
  const cached = validatedUrls.get(iconUrl);
  if (cached === false) {
    return DEFAULT_CHAIN_ICON;
  }

  // If not cached or cached as valid, return the URL
  // (it will be validated asynchronously if needed)
  return iconUrl;
};

export { DEFAULT_CHAIN_ICON };