import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Address } from 'viem';
import { erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import { useTransactionStatus } from '@hooks/useTransactionStatus';

export default function useTokenApprove(
  onSuccessParam?: (data: any) => void,
  onErrorParam?: (error: Error) => void
) {
  /*
   * Context
   */
  const { escrowAddress } = useSmartContracts();
  const { wallets } = useWallets();
  
  // Get the active wallet address
  const activeWallet = useMemo(() => {
    return wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  }, [wallets]);

  /*
   * State
   */
  const [tokenAddressInput, setTokenAddressInput] = useState<string | null>(null);
  const [amountToApproveInput, setAmountToApproveInput] = useState<string | null>(null);
  const [shouldConfigureApproveWrite, setShouldConfigureApproveWrite] = useState<boolean>(false);
  const [waitingForAllowanceUpdate, setWaitingForAllowanceUpdate] = useState<boolean>(false);
  
  // Use the new transaction status hook
  const txStatus = useTransactionStatus();

  /*
   * Wagmi hooks for reading allowance with automatic refetching
   */
  const { 
    data: currentAllowance,
    refetch: refetchAllowance,
    isRefetching: isRefetchingAllowance,
  } = useReadContract({
    address: tokenAddressInput as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    // The allowance function takes (owner, spender) as arguments
    args: activeWallet?.address && escrowAddress && tokenAddressInput 
      ? [activeWallet.address as Address, escrowAddress] 
      : undefined,
    enabled: Boolean(tokenAddressInput && escrowAddress && activeWallet?.address),
    // Watch for changes and refetch automatically
    watch: true,
    // Poll every 2 seconds when we're waiting for allowance to update
    refetchInterval: waitingForAllowanceUpdate ? 2000 : false,
  });

  /*
   * Privy Transaction Hook
   */
  const {
    writeContractAsync,
    isLoading: isPrivyTxLoading,
    error: privyTxError,
    userOpHash,
  } = usePrivyTransaction({
    onSuccess: async (hash) => {
      txStatus.setHash(hash);
      txStatus.updateMining('success');
      setShouldConfigureApproveWrite(false);
      
      // Add a small delay to allow RPC nodes to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start polling for allowance updates
      setWaitingForAllowanceUpdate(true);
      // Trigger immediate refetch of allowance
      await refetchAllowance();
      // Call the success callback after mining is complete
      onSuccessParam?.({ transactionHash: hash });
    },
    onError: (error) => {
      txStatus.setError(error);
      setShouldConfigureApproveWrite(false);
      setWaitingForAllowanceUpdate(false); // Stop polling on error
      onErrorParam?.(error);
    },
  });

  /*
   * Update status based on transaction state
   */
  useEffect(() => {
    if (isPrivyTxLoading) {
      if (!userOpHash) {
        txStatus.updateSigning('loading');
        txStatus.updateMining('idle');
      } else {
        txStatus.updateSigning('success');
        txStatus.updateMining('loading');
      }
    } else if (privyTxError) {
      txStatus.updateSigning('error');
      txStatus.updateMining('error');
    }
    // Don't set mining to success here - it's handled in onSuccess callback
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeApproveAsync = useCallback(async () => {
    if (!shouldConfigureApproveWrite) {
      return;
    }

    // Reset state before starting new transaction
    txStatus.reset();

    if (!tokenAddressInput || !amountToApproveInput || !escrowAddress) {
      const error = new Error('Missing required parameters for approval');
      txStatus.setError(error);
      onErrorParam?.(error);
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: tokenAddressInput as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [escrowAddress as Address, BigInt(amountToApproveInput)],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureApproveWrite, 
    tokenAddressInput, 
    amountToApproveInput, 
    escrowAddress, 
    writeContractAsync,
    onErrorParam,
    txStatus
  ]);

  // Stop polling when allowance is updated
  useEffect(() => {
    if (waitingForAllowanceUpdate && currentAllowance !== undefined && amountToApproveInput) {
      const requiredAllowance = BigInt(amountToApproveInput);
      if (currentAllowance >= requiredAllowance) {
        setWaitingForAllowanceUpdate(false);
        // Don't reset transaction status here - let the component handle when to reset
        // This keeps the success state visible until explicitly reset
      }
    }
  }, [currentAllowance, amountToApproveInput, waitingForAllowanceUpdate]);

  return {
    writeApproveAsync,
    tokenAddressInput,
    setTokenAddressInput,
    amountToApproveInput,
    setAmountToApproveInput,
    shouldConfigureApproveWrite,
    setShouldConfigureApproveWrite,
    signApproveTransactionStatus: txStatus.signing,
    mineApproveTransactionStatus: txStatus.mining,
    transactionHash: txStatus.hash,
    resetTransactionStatus: txStatus.reset,
    // New exports for wagmi integration
    currentAllowance,
    refetchAllowance,
    isRefetchingAllowance,
  };
}