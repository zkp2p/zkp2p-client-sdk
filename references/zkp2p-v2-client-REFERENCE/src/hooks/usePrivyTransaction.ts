import { useState, useCallback, useMemo } from 'react';
import { 
  type Address, 
  type Hex, 
  type Abi,
  encodeFunctionData,
  type EncodeFunctionDataParameters,
  zeroAddress
} from 'viem';
import { base } from 'viem/chains';
import { useWallets } from '@privy-io/react-auth';
import { 
  useWalletClient, 
  usePublicClient
} from 'wagmi';

import useSmartAccount from '@hooks/contexts/useSmartAccount';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { isAddress } from 'viem';
import { getNetworkConditions, calculateGasWithBuffer } from '@helpers/gas';

interface TransactionCall {
  to: Address;
  data: Hex;
  value?: bigint;
}

interface UsePrivyTransactionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  gasSponsorship?: boolean; // Default true
  showToasts?: boolean; // Default true
}

interface UsePrivyTransactionReturn {
  // Single transaction execution
  writeContractAsync: (params: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
  }) => Promise<Hex | null>;
  
  // Batch transaction execution
  executeBatch: (calls: TransactionCall[]) => Promise<Hex | null>;
  
  // Raw transaction execution
  sendTransaction: (params: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }) => Promise<Hex | null>;
  
  // State
  isLoading: boolean;
  error: Error | null;
  userOpHash: Hex | null;
  
  // Gas sponsorship info
  isUsingGasSponsorship: boolean;
  willPayGas: boolean;
}

// Validation helpers
const isValidAddress = (address: string): boolean => {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
};

const validateTransactionParams = (params: {
  address?: Address;
  to?: Address;
  value?: bigint;
  abi?: Abi;
  functionName?: string;
}) => {
  // Validate addresses
  const targetAddress = params.address || params.to;
  if (!targetAddress) {
    throw new Error('Missing target address');
  }
  
  if (!isValidAddress(targetAddress)) {
    throw new Error('Invalid target address');
  }
  
  if (targetAddress === zeroAddress) {
    throw new Error('Cannot send transaction to zero address');
  }
  
  // Validate value
  if (params.value !== undefined && params.value < 0n) {
    throw new Error('Transaction value cannot be negative');
  }
  
  // Validate contract call params
  if (params.address && params.abi && params.functionName) {
    if (!params.abi || !Array.isArray(params.abi)) {
      throw new Error('Invalid contract ABI');
    }
    
    if (!params.functionName || typeof params.functionName !== 'string') {
      throw new Error('Invalid function name');
    }
  }
};

/**
 * Generic hook for executing transactions via either:
 * 1. ZeroDev smart accounts with EIP-7702 and gas sponsorship (Privy wallets)
 * 2. Regular EOA transactions (external wallets like MetaMask)
 */
export default function usePrivyTransaction(
  options: UsePrivyTransactionOptions = {}
): UsePrivyTransactionReturn {
  const { 
    onSuccess, 
    onError, 
    gasSponsorship = true,
    showToasts = true
  } = options;
  
  const { kernelClient, isSmartAccountEnabled } = useSmartAccount();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null);
  
  // Get the active wallet - always prioritize embedded wallet
  const activeWallet = useMemo(() => {
    return wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  }, [wallets]);
  
  // Get wallet client for the active wallet
  const { data: walletClient } = useWalletClient({
    account: activeWallet?.address as Address | undefined,
  });
  const publicClient = usePublicClient();
  
  // Ensure publicClient is available (it should always be)
  if (!publicClient) {
    throw new Error('Public client not initialized');
  }

  /**
   * Estimate gas with a 20-30% buffer for safety (increased from 10% for better reliability)
   */
  const estimateGasWithBuffer = useCallback(async (params: {
    to: Address;
    from: Address;
    data?: Hex;
    value?: bigint;
  }): Promise<bigint | null> => {
    try {
      const estimated = await publicClient.estimateGas({
        account: params.from,
        to: params.to,
        data: params.data,
        value: params.value,
      });
      
      // Get current network conditions using shared utility
      const { baseFee, isCongested } = await getNetworkConditions(publicClient);
      
      // Calculate gas with adaptive buffer using shared utility
      const gasWithBuffer = calculateGasWithBuffer({
        estimated,
        baseFee,
        isCongested
      });
      
      console.log('[GAS] Estimation:', {
        estimated: estimated.toString(),
        baseFee: baseFee.toString(),
        isCongested,
        bufferPercent: isCongested ? 30 : 20,
        final: gasWithBuffer.toString()
      });
      
      return gasWithBuffer;
    } catch (error) {
      console.warn('Gas estimation failed, will use wallet defaults:', error);
      return null;
    }
  }, [publicClient]);

  /**
   * Execute a contract write operation
   */
  const writeContractAsync = useCallback(async (params: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
  }): Promise<Hex | null> => {
    const { address, abi, functionName, args, value } = params;

    // Check if wallet is available
    if (!activeWallet) {
      const err = new Error('No wallet connected');
      setError(err);
      onError?.(err);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setUserOpHash(null);

    try {
      // Validate transaction parameters
      validateTransactionParams({ address, abi, functionName, value });
      // Encode the contract call
      const data = encodeFunctionData({
        abi,
        functionName,
        args: args || [],
      } as EncodeFunctionDataParameters);

      // Debug logging for smart account state
      console.log('Smart account check:', {
        isSmartAccountEnabled,
        hasKernelClient: !!kernelClient,
        gasSponsorship,
        walletType: activeWallet?.walletClientType,
        address: activeWallet?.address,
        isEmbeddedWallet: activeWallet?.walletClientType === 'privy',
      });

      // For embedded wallets without ETH, we MUST use smart account path
      // Otherwise the transaction will fail with insufficient funds
      const mustUseSmartAccount = activeWallet?.walletClientType === 'privy' && gasSponsorship;
      
      if (mustUseSmartAccount && !kernelClient) {
        const err = new Error(
          'Smart account not initialized for embedded wallet. ' +
          'Please wait for authorization or try refreshing the page.'
        );
        setError(err);
        onError?.(err);
        console.error('Cannot proceed without smart account for embedded wallet');
        return null;
      }

      // Check if we should use smart account or regular transaction
      // For external wallets, we also need to check if the kernelClient is properly initialized
      // If EIP-7702 authorization failed, kernelClient will be null and we should fall back to regular transactions
      if (isSmartAccountEnabled && kernelClient && gasSponsorship) {
        // Smart account path (EIP-7702 with gas sponsorship)
        // The kernelClient already has the account configured internally
        const hash = await kernelClient.sendUserOperation({
          calls: [{
            to: address,
            data,
            value: value || 0n,
          }],
        });

        setUserOpHash(hash);
        console.log('UserOperation sent, hash:', hash);

        // Wait for receipt
        console.log('Waiting for UserOperation receipt...');
        try {
          const receipt = await kernelClient.waitForUserOperationReceipt({ 
            hash,
            timeout: 60_000, // 60 second timeout
          });
          console.log('UserOperation receipt received:', receipt);

          if (receipt.success) {
            console.log('Transaction successful, calling onSuccess callback');
            // For UserOperations, we need to get the transaction receipt to provide logs
            const txReceipt = await publicClient.getTransactionReceipt({
              hash: receipt.receipt.transactionHash,
            });
            onSuccess?.({ 
              hash, 
              transactionHash: receipt.receipt.transactionHash,
              logs: txReceipt.logs,
              ...txReceipt 
            });
            console.log('onSuccess callback completed');
          } else {
            throw new Error('Transaction failed');
          }
        } catch (receiptError) {
          console.error('Error waiting for UserOperation receipt:', receiptError);
          throw receiptError;
        }

        return hash;
      } else if (isSmartAccountEnabled && kernelClient && !gasSponsorship) {
        // Smart account path WITHOUT gas sponsorship
        const hash = await kernelClient.sendUserOperation({
          calls: [{
            to: address,
            data,
            value: value || 0n,
          }],
          // No paymaster - user pays their own gas
        });

        setUserOpHash(hash);

        // Wait for receipt
        const receipt = await kernelClient.waitForUserOperationReceipt({ 
          hash,
          timeout: 60_000,
        });

        if (receipt.success) {
          // For UserOperations, we need to get the transaction receipt to provide logs
          const txReceipt = await publicClient.getTransactionReceipt({
            hash: receipt.receipt.transactionHash,
          });
          onSuccess?.({ 
            hash, 
            transactionHash: receipt.receipt.transactionHash,
            logs: txReceipt.logs,
            ...txReceipt 
          });
        } else {
          throw new Error('Transaction failed');
        }

        return hash;
      } else {
        // Regular EOA transaction path
        // If walletClient is not available, create one from the active wallet
        let client = walletClient;
        
        if (!client && activeWallet) {
          // Create a wallet client directly from the active wallet
          const provider = await activeWallet.getEthereumProvider();
          if (!provider) {
            throw new Error('Failed to get provider from wallet');
          }
          
          const { createWalletClient, custom } = await import('viem');
          client = createWalletClient({
            account: activeWallet.address as Address,
            chain: base,
            transport: custom(provider),
          });
        }
        
        if (!client) {
          throw new Error('Wallet client not available');
        }

        // Estimate gas with buffer for EOA transactions
        const estimatedGas = await estimateGasWithBuffer({
          to: address,
          from: activeWallet.address as Address,
          data,
          value: value || 0n,
        });

        // Send regular transaction using walletClient
        const hash = await client.writeContract({
          address,
          abi,
          functionName,
          args: args || [],
          value: value || 0n,
          gas: estimatedGas || undefined,
        });

        setUserOpHash(hash);

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 60_000,
        });

        if (receipt.status === 'success') {
          // For regular transactions, provide full receipt data
          onSuccess?.({ 
            hash, 
            transactionHash: hash,
            logs: receipt.logs,
            ...receipt 
          });
        } else {
          throw new Error('Transaction failed');
        }

        return hash;
      }
    } catch (err: any) {
      const error = err as Error;
      console.error('Transaction error:', error);
      setError(error);
      
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [kernelClient, isSmartAccountEnabled, activeWallet, walletClient, publicClient, onSuccess, onError, gasSponsorship]);

  /**
   * Execute multiple contract calls in a single UserOperation (only for smart accounts)
   */
  const executeBatch = useCallback(async (
    calls: TransactionCall[]
  ): Promise<Hex | null> => {
    if (!isSmartAccountEnabled || !kernelClient) {
      const err = new Error('Batch transactions require smart account features');
      setError(err);
      onError?.(err);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setUserOpHash(null);

    try {
      // Validate each call in the batch
      for (const call of calls) {
        validateTransactionParams({ to: call.to, value: call.value });
      }
      // Send batch UserOperation
      const hash = await kernelClient.sendUserOperation({
        calls: calls.map(call => ({
          to: call.to,
          data: call.data,
          value: call.value || 0n,
        })),
      });

      setUserOpHash(hash);

      // Wait for receipt
      const receipt = await kernelClient.waitForUserOperationReceipt({ 
        hash,
        timeout: 60_000,
      });

      if (receipt.success) {
        // For UserOperations, we need to get the transaction receipt to provide logs
        const txReceipt = await publicClient.getTransactionReceipt({
          hash: receipt.receipt.transactionHash,
        });
        onSuccess?.({ 
          hash, 
          transactionHash: receipt.receipt.transactionHash,
          logs: txReceipt.logs,
          ...txReceipt 
        });
      } else {
        throw new Error('Batch transaction failed');
      }

      return hash;
    } catch (err: any) {
      const error = err as Error;
      console.error('Batch transaction error:', error);
      setError(error);
      
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [kernelClient, isSmartAccountEnabled, activeWallet, walletClient, publicClient, onSuccess, onError, gasSponsorship]);

  /**
   * Send a raw transaction (e.g., ETH transfer)
   */
  const sendTransaction = useCallback(async (params: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }): Promise<Hex | null> => {
    const { to, data, value } = params;

    // Check if wallet is available
    if (!activeWallet) {
      const err = new Error('No wallet connected');
      setError(err);
      onError?.(err);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setUserOpHash(null);

    try {
      // Validate transaction parameters
      validateTransactionParams({ to, value });
      
      // For embedded wallets without ETH, we MUST use smart account path
      const mustUseSmartAccount = activeWallet?.walletClientType === 'privy' && gasSponsorship;
      
      if (mustUseSmartAccount && !kernelClient) {
        const err = new Error(
          'Smart account not initialized for embedded wallet. ' +
          'Please wait for authorization or try refreshing the page.'
        );
        setError(err);
        onError?.(err);
        return null;
      }

      // Check if we should use smart account or regular transaction
      // For external wallets, we also need to check if the kernelClient is properly initialized
      // If EIP-7702 authorization failed, kernelClient will be null and we should fall back to regular transactions
      if (isSmartAccountEnabled && kernelClient && gasSponsorship) {
        // Smart account path (EIP-7702 with gas sponsorship)
        // The kernelClient already has the account configured internally
        const hash = await kernelClient.sendUserOperation({
          calls: [{
            to,
            data: data || '0x',
            value: value || 0n,
          }],
        });

        setUserOpHash(hash);

        // Wait for receipt
        const receipt = await kernelClient.waitForUserOperationReceipt({ 
          hash,
          timeout: 60_000,
        });

        if (receipt.success) {
          // For UserOperations, we need to get the transaction receipt to provide logs
          const txReceipt = await publicClient.getTransactionReceipt({
            hash: receipt.receipt.transactionHash,
          });
          onSuccess?.({ 
            hash, 
            transactionHash: receipt.receipt.transactionHash,
            logs: txReceipt.logs,
            ...txReceipt 
          });
        } else {
          throw new Error('Transaction failed');
        }

        return hash;
      } else if (isSmartAccountEnabled && kernelClient && !gasSponsorship) {
        // Smart account path WITHOUT gas sponsorship
        const hash = await kernelClient.sendUserOperation({
          calls: [{
            to,
            data: data || '0x',
            value: value || 0n,
          }],
          // No paymaster - user pays their own gas
        });

        setUserOpHash(hash);

        // Wait for receipt
        const receipt = await kernelClient.waitForUserOperationReceipt({ 
          hash,
          timeout: 60_000,
        });

        if (receipt.success) {
          // For UserOperations, we need to get the transaction receipt to provide logs
          const txReceipt = await publicClient.getTransactionReceipt({
            hash: receipt.receipt.transactionHash,
          });
          onSuccess?.({ 
            hash, 
            transactionHash: receipt.receipt.transactionHash,
            logs: txReceipt.logs,
            ...txReceipt 
          });
        } else {
          throw new Error('Transaction failed');
        }

        return hash;
      } else {
        // Regular EOA transaction path
        // If walletClient is not available, create one from the active wallet
        let client = walletClient;
        
        if (!client && activeWallet) {
          // Create a wallet client directly from the active wallet
          const provider = await activeWallet.getEthereumProvider();
          if (!provider) {
            throw new Error('Failed to get provider from wallet');
          }
          
          const { createWalletClient, custom } = await import('viem');
          client = createWalletClient({
            account: activeWallet.address as Address,
            chain: base,
            transport: custom(provider),
          });
        }
        
        if (!client) {
          throw new Error('Wallet client not available');
        }

        // Estimate gas with buffer for EOA transactions
        const estimatedGas = await estimateGasWithBuffer({
          to,
          from: activeWallet.address as Address,
          data: data || '0x',
          value: value || 0n,
        });

        // Send regular transaction
        const hash = await client.sendTransaction({
          to,
          data: data || '0x',
          value: value || 0n,
          gas: estimatedGas || undefined,
        });

        setUserOpHash(hash);

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 60_000,
        });

        if (receipt.status === 'success') {
          // For regular transactions, provide full receipt data
          onSuccess?.({ 
            hash, 
            transactionHash: hash,
            logs: receipt.logs,
            ...receipt 
          });
        } else {
          throw new Error('Transaction failed');
        }

        return hash;
      }
    } catch (err: any) {
      const error = err as Error;
      console.error('Transaction error:', error);
      setError(error);
      
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [kernelClient, isSmartAccountEnabled, activeWallet, walletClient, publicClient, onSuccess, onError, gasSponsorship]);

  // Determine if we're using gas sponsorship
  const isUsingGasSponsorship = isSmartAccountEnabled && kernelClient !== null && gasSponsorship;
  const willPayGas = !isUsingGasSponsorship;

  return {
    writeContractAsync,
    executeBatch,
    sendTransaction,
    isLoading,
    error,
    userOpHash,
    isUsingGasSponsorship,
    willPayGas,
  };
}