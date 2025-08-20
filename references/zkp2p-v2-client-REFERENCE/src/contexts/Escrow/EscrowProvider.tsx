import React, { useEffect, useState, ReactNode, useCallback } from 'react'
import { useReadContract } from 'wagmi'

import { esl, CALLER_ACCOUNT, ZERO } from '@helpers/constants'
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { basePublicClient } from '@helpers/baseClient';

import { EscrowContext } from './index'


interface ProvidersProps {
  children: ReactNode;
}

const EscrowProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  const { escrowAddress, escrowAbi } = useSmartContracts();

  /*
   * State
   */

  const [depositCounter, setDepositCounter] = useState<number | null>(null);
  const [shouldFetchEscrowState, setShouldFetchEscrowState] = useState<boolean>(false);

  /*
   * Contract Read Functions using wagmi
   */

  const { 
    data: depositCounterRaw,
    isLoading: isLoadingDepositCounter,
    refetch: refetchDepositCounter
  } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: escrowAbi,
    functionName: 'depositCounter',
    account: CALLER_ACCOUNT as `0x${string}`,
    query: {
      enabled: shouldFetchEscrowState && Boolean(escrowAddress) && Boolean(escrowAbi),
      // No polling needed - deposit counter only used internally to fetch max deposits
      // Manual refetch when needed for deposit operations
    }
  });

  /*
   * Hooks
   */

  useEffect(() => {

    if (escrowAddress) {

      setShouldFetchEscrowState(true);
    } else {

      setShouldFetchEscrowState(false);
      setDepositCounter(null);
    }
  }, [escrowAddress]);

  // Process the wagmi data when it changes
  useEffect(() => {
    if (depositCounterRaw !== undefined) {
      if (depositCounterRaw || depositCounterRaw === ZERO) { // BigInt(0) is falsy
        setDepositCounter(Number(depositCounterRaw));
      } else {
        setDepositCounter(null);
      }
    }
  }, [depositCounterRaw]);

  return (
    <EscrowContext.Provider
      value={{
        depositCounter,
        refetchDepositCounter,
        shouldFetchEscrowState
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export default EscrowProvider
