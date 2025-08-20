import { useState, useEffect } from 'react';

const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');

    const updateIsTouch = () => {
      setIsTouch(mediaQuery.matches);
    };

    // Initial check
    updateIsTouch();

    // Listen for changes
    // Note: Some older browsers might not support addEventListener on MediaQueryList directly.
    // A 'change' event listener is more robust.
    try {
      mediaQuery.addEventListener('change', updateIsTouch);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(updateIsTouch);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', updateIsTouch);
      } catch (e) {
        // Fallback for older browsers
        mediaQuery.removeListener(updateIsTouch);
      }
    };
  }, []);

  return isTouch;
};

export default useIsTouchDevice; 