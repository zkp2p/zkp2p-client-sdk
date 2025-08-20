import { useMemo } from 'react';

/**
 * Custom hook for browser detection
 * Identifies browser type and whether it's allowed for order creation
 * Allowed browsers: Chrome, Brave, Edge, Opera, Vivaldi, Arc, Samsung Internet (Chromium-based only)
 * Not allowed: Safari, Firefox, other non-Chromium browsers
 */
export const useBrowserDetection = () => {
  const detectBrowser = useMemo(() => () => {
    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const vendor = typeof window !== "undefined" ? window.navigator.vendor : "";
    
    // Check for Chrome
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor) && !/Edg/.test(userAgent) && !/OPR/.test(userAgent);
    
    // Check for Brave (Brave has Chrome in user agent but also has navigator.brave)
    const isBrave = isChrome && typeof (window as any).navigator.brave !== "undefined" && typeof (window as any).navigator.brave.isBrave !== "undefined";
    
    // Check for Edge (Chromium-based) - More specific pattern
    const isEdgeChromium = /EdgA?\//.test(userAgent);
    
    // Check for Opera (Chromium-based) - More specific pattern
    const isOperaChromium = /OPR\//.test(userAgent) || (/Opera\//.test(userAgent) && /Chrome/.test(userAgent));
    
    // Check for Vivaldi (Chromium-based)
    const isVivaldi = /Vivaldi/.test(userAgent);
    
    // Check for Arc (Chromium-based)  
    const isArc = /Arc\//.test(userAgent);
    
    // Check for Samsung Internet (Chromium-based)
    const isSamsungInternet = /SamsungBrowser/.test(userAgent);
    
    // Firefox detection (non-Chromium browser, not allowed)
    const isFirefox = /Firefox/.test(userAgent) && !/Seamonkey/.test(userAgent);
    
    // Safari detection (not allowed) - More precise to avoid false positives
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(vendor) && !/Chrome/.test(userAgent) && !/CriOS/.test(userAgent) && !/EdgA?\//.test(userAgent);
    
    // Check if browser is allowed (Chromium-based browsers only)
    const isAllowedBrowser = isChrome || isBrave || isEdgeChromium || isOperaChromium || isVivaldi || isArc || isSamsungInternet;
    
    // Mobile detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent);
    
    return {
      isChrome,
      isBrave,
      isEdgeChromium,
      isOperaChromium,
      isVivaldi,
      isArc,
      isSamsungInternet,
      isFirefox,
      isSafari,
      isAllowedBrowser,
      isMobile,
      userAgent,
      browserName: getBrowserName({ isChrome, isBrave, isEdgeChromium, isOperaChromium, isVivaldi, isArc, isSamsungInternet, isFirefox, isSafari })
    };
    } catch (error) {
      console.error('Browser detection failed:', error);
      // Return safe defaults on error
      return {
        isChrome: false,
        isBrave: false,
        isEdgeChromium: false,
        isOperaChromium: false,
        isVivaldi: false,
        isArc: false,
        isSamsungInternet: false,
        isFirefox: false,
        isSafari: false,
        isAllowedBrowser: false,
        isMobile: false,
        userAgent: '',
        browserName: 'Unknown'
      };
    }
  }, []); // Empty dependency array since browser detection doesn't change

  const getBrowserName = (browsers: {
    isChrome: boolean;
    isBrave: boolean;
    isEdgeChromium: boolean;
    isOperaChromium: boolean;
    isVivaldi: boolean;
    isArc: boolean;
    isSamsungInternet: boolean;
    isFirefox: boolean;
    isSafari: boolean;
  }) => {
    if (browsers.isBrave) return "Brave";
    if (browsers.isChrome) return "Chrome";
    if (browsers.isEdgeChromium) return "Edge";
    if (browsers.isOperaChromium) return "Opera";
    if (browsers.isVivaldi) return "Vivaldi";
    if (browsers.isArc) return "Arc";
    if (browsers.isSamsungInternet) return "Samsung Internet";
    if (browsers.isFirefox) return "Firefox";
    if (browsers.isSafari) return "Safari";
    return "Unknown";
  };

  return {
    detectBrowser,
  };
};