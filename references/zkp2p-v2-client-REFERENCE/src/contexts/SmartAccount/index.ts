export { SmartAccountContext } from './SmartAccountContext';
export { SmartAccountProvider } from './SmartAccountProvider';
export type { SmartAccountContextType } from './SmartAccountContext';

// Custom hook for using the SmartAccount context
import { useContext } from 'react';
import { SmartAccountContext } from './SmartAccountContext';

export const useSmartAccount = () => {
  const context = useContext(SmartAccountContext);
  if (!context) {
    throw new Error('useSmartAccount must be used within SmartAccountProvider');
  }
  return context;
};