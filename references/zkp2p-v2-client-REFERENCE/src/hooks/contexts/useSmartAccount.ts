import { useContext } from 'react';
import { SmartAccountContext } from '@contexts/SmartAccount/SmartAccountContext';

const useSmartAccount = () => {
  const context = useContext(SmartAccountContext);
  
  if (!context) {
    throw new Error(
      'useSmartAccount must be used within SmartAccountProvider'
    );
  }
  
  return context;
};

export default useSmartAccount;