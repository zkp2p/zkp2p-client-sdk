import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { esl } from '@helpers/constants';
import { PaymentPlatformType } from '@helpers/types';

import usePayeeDetails from '@hooks/backend/useGetPayeeDetails';
import useGetOwnerDeposits from '@hooks/backend/useGetOwnerDeposits';
import useAccount from '@hooks/contexts/useAccount';
import { paymentPlatformInfo } from '@helpers/types/paymentPlatforms';

import BackendContext from './BackendContext';


interface ProvidersProps {
  children: ReactNode;
}

const BackendProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */
  const { loggedInEthereumAddress, isLoggedIn } = useAccount();

  /*
   * Hooks
   */
  const { 
    fetchPayeeDetails: fetchPayeeDetailsImpl, 
    data: payeeDetailsResponse
  } = usePayeeDetails();
  
  const {
    data: ownerDeposits,
    isLoading: isLoadingOwnerDeposits,
    error: ownerDepositsError,
    fetchOwnerDeposits
  } = useGetOwnerDeposits();

  /*
   * State for payee details
   */
  const [rawPayeeDetails, setRawPayeeDetails] = useState<string>('');
  const [depositorTgUsername, setDepositorTgUsername] = useState<string>('');
  const [isFetchingRawPayeeDetails, setIsFetchingRawPayeeDetails] = useState<boolean>(false);

  /*
   * Effects for payee details
   */
  useEffect(() => {

    if (payeeDetailsResponse) {

      const platform = payeeDetailsResponse.responseObject.processorName;

      const tgUsername = payeeDetailsResponse.responseObject.depositData.telegramUsername;
      if (tgUsername) {
        setDepositorTgUsername(tgUsername);
      } else {
        setDepositorTgUsername('');
      }

      const depositData = payeeDetailsResponse.responseObject.depositData;
      const rawPayeeDetails = paymentPlatformInfo[platform].depositConfig.getPayeeDetail(depositData);
      
      setRawPayeeDetails(rawPayeeDetails);
      setIsFetchingRawPayeeDetails(false);
    }
  }, [payeeDetailsResponse]);

  // Payee details handler
  useEffect(() => { 
    if (isLoggedIn && loggedInEthereumAddress) {
      fetchOwnerDeposits(loggedInEthereumAddress);
    }
  }, [isLoggedIn, loggedInEthereumAddress, fetchOwnerDeposits]);

  const fetchPayeeDetails = useCallback(async (hashedOnchainId: string, platform: PaymentPlatformType) => {
    setIsFetchingRawPayeeDetails(true);
    await fetchPayeeDetailsImpl(hashedOnchainId, platform);
  }, [fetchPayeeDetailsImpl]);
  
  const refetchOwnerDeposits = useCallback(async () => {
    if (loggedInEthereumAddress) {
      await fetchOwnerDeposits(loggedInEthereumAddress);
    }
  }, [fetchOwnerDeposits, loggedInEthereumAddress]);

  const clearPayeeDetails = useCallback(() => {
    setRawPayeeDetails('');
    setDepositorTgUsername('');
    setIsFetchingRawPayeeDetails(false);
  }, []);


  return (
    <BackendContext.Provider
      value={{
        // Payee details values
        rawPayeeDetails,
        depositorTgUsername,
        fetchPayeeDetails,
        clearPayeeDetails,
        isFetchingRawPayeeDetails,
        
        // Owner deposits values
        ownerDeposits,
        isLoadingOwnerDeposits,
        ownerDepositsError,
        fetchOwnerDeposits,
        refetchOwnerDeposits
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export default BackendProvider;