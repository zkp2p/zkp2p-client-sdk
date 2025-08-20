import { useState, useEffect } from 'react';

const useCanInstallExtensions = (): boolean => {
  const [canInstallExtensions, setCanInstallExtensions] = useState(true);

  useEffect(() => {
    const checkExtensionSupport = () => {
      // Check for mobile operating systems
      const userAgent = navigator.userAgent.toLowerCase();

      // iOS devices (iPhone, iPad, iPod)
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      // Android mobile browsers (excluding desktop Chrome on Android)
      const isAndroidMobile = /android/.test(userAgent) && /mobile/.test(userAgent);

      // Check for mobile browsers that don't support extensions
      const isMobileBrowser =
        isIOS ||
        isAndroidMobile ||
        /webos|blackberry|iemobile|opera mini/.test(userAgent);

      // Check if running in a mobile app webview
      const isWebView =
        /wv|webview/.test(userAgent) ||
        // Instagram, Facebook, Twitter in-app browsers
        /instagram|fbav|twitter/.test(userAgent);

      // Check for browsers that don't support extensions
      const isUnsupportedBrowser =
        /samsung/.test(userAgent) || // Samsung Internet (limited support)
        /ucbrowser/.test(userAgent) || // UC Browser
        /miuibrowser/.test(userAgent); // MIUI Browser

      // Additional check: try to detect if extensions API is available
      // const hasExtensionAPI =
      //   typeof chrome !== 'undefined' &&
      //   chrome.runtime &&
      //   chrome.runtime.id;

      // Combine all checks
      console.log("isMobileBrowser: ", isMobileBrowser);
      console.log("isWebView: ", isWebView);
      console.log("isUnsupportedBrowser: ", isUnsupportedBrowser);
      const cantInstall = isMobileBrowser || isWebView || isUnsupportedBrowser;
      const canInstall = !cantInstall;
      console.log("canInstall: ", canInstall);
      setCanInstallExtensions(canInstall);
    };

    checkExtensionSupport();
  }, []);

  return canInstallExtensions;
};

export default useCanInstallExtensions; 