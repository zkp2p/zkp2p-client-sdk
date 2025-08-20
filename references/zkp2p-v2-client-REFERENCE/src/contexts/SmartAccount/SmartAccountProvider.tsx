import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePrivy, useWallets, useSign7702Authorization } from '@privy-io/react-auth';
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint, KernelVersionToAddressesMap } from '@zerodev/sdk/constants';
import { createPublicClient, createWalletClient, custom, http, type Address, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { SmartAccountContext } from './SmartAccountContext';
import { alchemyRpcUrl, selectedChains } from '../..';
import { getDefaultChain } from '../../config/wagmi';

const ZERODEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_APP_ID || '';
const ZERODEV_SEPOLIA_APP_ID = import.meta.env.VITE_ZERODEV_SEPOLIA_APP_ID || '';

// Validate ZeroDev project ID
if (!ZERODEV_PROJECT_ID) {
  // Silent validation - error will be handled later
}

// Function to get appropriate URLs based on chain
const getZeroDevUrls = (chainId: number) => {
  if (chainId === baseSepolia.id) {
    // Base Sepolia URLs
    return {
      bundlerRpc: `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_SEPOLIA_APP_ID}?provider=PIMLICO`,
      paymasterRpc: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_SEPOLIA_APP_ID}?provider=PIMLICO`
    };
  } else {
    // Base Mainnet URLs
    return {
      bundlerRpc: `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_PROJECT_ID}?provider=PIMLICO`,
      paymasterRpc: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?provider=PIMLICO`
    };
  }
};

interface SmartAccountProviderProps {
  children: React.ReactNode;
}

export const SmartAccountProvider: React.FC<SmartAccountProviderProps> = ({ children }) => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();
  
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [eip7702AuthorizationStatus, setEip7702AuthorizationStatus] = useState<'idle' | 'pending' | 'authorized' | 'failed' | 'unauthorized'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [walletAuthAttempts, setWalletAuthAttempts] = useState<Record<string, boolean>>({});
  const [currentAuthWallet, setCurrentAuthWallet] = useState<string | null>(null);

  // Get the active wallet (prefer Privy embedded, fall back to any wallet)
  const activeWallet = useMemo(() => {
    // If user is authenticated and we have wallets, prefer Privy embedded wallet
    if (authenticated && wallets.length > 0) {
      const privyWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
      if (privyWallet) {
        return privyWallet;
      }
    }
    // Fall back to first wallet only if no Privy wallet exists
    return wallets[0];
  }, [wallets, authenticated]);

  // Get the current chain
  const currentChain = useMemo(() => {
    return getDefaultChain();
  }, []);

  // Simple: Smart accounts are enabled if we have a wallet and can try authorization
  const isSmartAccountEnabled = useMemo(() => {
    return !!activeWallet;
  }, [activeWallet]);

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);



  // Authorize EIP-7702 - Let Privy handle ALL the complexity
  const authorize7702 = useCallback(async () => {
    
    if (!activeWallet) {
      setError(new Error('No wallet available for authorization'));
      return;
    }

    // Check if we've already attempted authorization for this wallet
    const walletKey = `${activeWallet.address}-${activeWallet.walletClientType}`;
    if (walletAuthAttempts[walletKey]) {
      console.log('⚠️ Wallet already attempted authorization:', walletKey);
      return;
    }

    if (!ZERODEV_PROJECT_ID) {
      setError(new Error('ZeroDev project ID is required. Please set VITE_ZERODEV_APP_ID environment variable.'));
      setEip7702AuthorizationStatus('failed');
      return;
    }

    // Check Sepolia project ID if on testnet
    if (currentChain.id === baseSepolia.id && !ZERODEV_SEPOLIA_APP_ID) {
      setError(new Error('ZeroDev Sepolia project ID is required. Please set VITE_ZERODEV_SEPOLIA_APP_ID environment variable.'));
      setEip7702AuthorizationStatus('failed');
      return;
    }

    // Let Privy's signAuthorization handle capability detection
    console.log('🔄 Starting EIP-7702 authorization for wallet:', {
      address: activeWallet.address,
      type: activeWallet.walletClientType,
    });

    setEip7702AuthorizationStatus('pending');
    
    try {
      // Get kernel addresses for the version
      const kernelAddresses = KernelVersionToAddressesMap[KERNEL_V3_3];
      
      // Try Privy's signAuthorization for ANY wallet - let it handle compatibility
      
      // Add timeout to prevent getting stuck
      const authorizationPromise = signAuthorization({
        contractAddress: kernelAddresses.accountImplementationAddress,
        chainId: currentChain.id
        // nonce is optional - Privy handles it automatically
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('EIP-7702 authorization timed out after 30 seconds. This may indicate the wallet does not support EIP-7702 or there was a network issue.'));
        }, 30000); // 30 second timeout
      });
      
      const authorization = await Promise.race([authorizationPromise, timeoutPromise]) as any;
      console.log('✅ EIP-7702 authorization successful!', {
        authorization,
        walletType: activeWallet.walletClientType,
        hasRequiredFields: {
          address: !!authorization?.address,
          chainId: !!authorization?.chainId,
          nonce: authorization?.nonce !== undefined,
          r: !!authorization?.r,
          s: !!authorization?.s,
          yParity: authorization?.yParity !== undefined
        }
      });
      
      // Validate authorization response
      if (!authorization || typeof authorization !== 'object') {
        throw new Error('Invalid authorization response from wallet');
      }
      
      // Create public client (reuse if already created for external wallet)
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(alchemyRpcUrl),
      });

      // Create wallet client
      const provider = await activeWallet.getEthereumProvider();
      if (!provider) {
        throw new Error('Failed to get Ethereum provider from wallet');
      }
      
      const walletClient = createWalletClient({
        account: activeWallet.address as Address,
        chain: currentChain,
        transport: custom(provider),
      });
      
      // Create the 7702 Kernel account (no deployment occurs!)
      const kernelAccount = await createKernelAccount(publicClient, {
        eip7702Account: walletClient,
        entryPoint: getEntryPoint('0.7'),
        kernelVersion: KERNEL_V3_3,
        eip7702Auth: authorization,
      });

      // Get the appropriate URLs for the current chain
      const { bundlerRpc, paymasterRpc } = getZeroDevUrls(currentChain.id);

      // Create paymaster client
      const paymasterClient = createZeroDevPaymasterClient({
        chain: currentChain,
        transport: http(paymasterRpc),
      });

      // Create the Kernel client
      const client = createKernelAccountClient({
        account: kernelAccount,
        chain: currentChain,
        bundlerTransport: http(bundlerRpc),
        paymaster: paymasterClient,
        client: publicClient,
      });

      console.log('🎉 Setting smart account state to authorized!', {
        kernelAccountAddress: kernelAccount.address,
        walletType: activeWallet.walletClientType,
        walletAddress: activeWallet.address,
        componentMounted: mountedRef.current
      });
      
      // Update state immediately - don't wait for mount check
      setKernelClient(client);
      setSmartAccountAddress(kernelAccount.address);
      setEip7702AuthorizationStatus('authorized');
      setError(null);
      setCurrentAuthWallet(walletKey);
      // Mark this wallet as successfully authorized
      setWalletAuthAttempts(prev => ({ ...prev, [walletKey]: true }));
      
      console.log('✅ Smart account successfully enabled with EIP-7702!');
      
    } catch (err) {
      const errorMessage = (err as Error)?.message || '';
      
      console.error('❌ EIP-7702 authorization failed:', {
        error: err,
        errorMessage,
        errorName: (err as Error)?.name,
        walletType: activeWallet.walletClientType,
        chainId: currentChain.id
      });
      
      // Provide clearer error message for common cases
      let userFriendlyError: Error;
      if (errorMessage.includes('Signing wallet not found')) {
        userFriendlyError = new Error(
          `EIP-7702 is not supported by ${activeWallet.walletClientType} wallets yet. ` +
          'Your transactions will use regular wallet signing instead of smart account features.'
        );
      } else {
        userFriendlyError = err as Error;
      }
      
      // Update state immediately - don't wait for mount check
      setError(userFriendlyError);
      setEip7702AuthorizationStatus('failed');
      // Mark this wallet as attempted (even if failed)
      setWalletAuthAttempts(prev => ({ ...prev, [walletKey]: true }));
      
      // This is expected behavior - the app will fall back to regular EOA transactions
      console.log('🔄 EIP-7702 not supported by this wallet - will fall back to regular EOA transactions');
    }
  }, [activeWallet, signAuthorization, currentChain, walletAuthAttempts]);

  // Clean up kernel client when wallet changes
  useEffect(() => {
    if (!activeWallet) {
      // No wallet connected, clear everything
      console.log('🔄 No active wallet, clearing smart account state');
      setKernelClient(null);
      setSmartAccountAddress(null);
      setEip7702AuthorizationStatus('idle');
      setError(null);
      return;
    }
    
    // Check if this is a different wallet than the one we're tracking
    const currentWalletKey = `${activeWallet.address}-${activeWallet.walletClientType}`;
    
    // If we have a different wallet than what we're currently tracking
    if (currentAuthWallet && currentAuthWallet !== currentWalletKey) {
      console.log('🔄 Active wallet changed', {
        from: currentAuthWallet,
        to: currentWalletKey,
      });
      
      // Reset everything for the new wallet
      setKernelClient(null);
      setSmartAccountAddress(null);
      setEip7702AuthorizationStatus('idle');
      setError(null);
      setCurrentAuthWallet(currentWalletKey);
      
      // Clear the attempt for this specific wallet so it can try fresh
      setWalletAuthAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[currentWalletKey];
        return newAttempts;
      });
    } else if (!currentAuthWallet) {
      // First time setting the wallet
      setCurrentAuthWallet(currentWalletKey);
      
      // Also clear any stale attempt for this wallet on fresh mount
      setWalletAuthAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[currentWalletKey];
        return newAttempts;
      });
    }
  }, [activeWallet, kernelClient, smartAccountAddress, currentAuthWallet]);

  // Auto-initialize smart account when conditions are met
  useEffect(() => {
    const initialize = async () => {
      if (!ready || !authenticated || !activeWallet) {
        setEip7702AuthorizationStatus('idle');
        return;
      }

      // Reset status if we have a different wallet or if stuck in pending state
      const walletKey = `${activeWallet.address}-${activeWallet.walletClientType}`;
      const wasAttempted = walletAuthAttempts[walletKey];
      
      if (eip7702AuthorizationStatus === 'pending' && !isInitializing) {
        setEip7702AuthorizationStatus('idle');
        return;
      }

      // Try to initialize smart account for any wallet that hasn't been attempted
      // Only log when status changes or on first attempt
      if (!wasAttempted && eip7702AuthorizationStatus === 'idle') {
        console.log('Smart account initialization check:', {
          walletType: activeWallet?.walletClientType,
          status: eip7702AuthorizationStatus,
          address: activeWallet?.address,
        });
      }

      if (eip7702AuthorizationStatus === 'idle' && !wasAttempted) {
        console.log('🚀 Attempting smart account initialization for:', activeWallet?.address);
        setIsInitializing(true);
        try {
          await authorize7702();
        } catch (err) {
          console.log('⚠️ Authorization failed during initialization:', err);
          // Expected for wallets without EIP-7702 support
        } finally {
          setIsInitializing(false);
        }
      } else if (eip7702AuthorizationStatus === 'failed' && !wasAttempted) {
        // Don't reset to idle - this causes infinite loop
        // Just mark this wallet as attempted
        setWalletAuthAttempts(prev => ({
          ...prev,
          [walletKey]: true
        }));
      } else if (wasAttempted) {
        // This specific wallet was already attempted
        // Only skip if it succeeded or if it's the same wallet that just failed
        const shouldSkip = eip7702AuthorizationStatus === 'authorized' || 
                          (eip7702AuthorizationStatus === 'failed' && currentAuthWallet === walletKey);
        
        if (shouldSkip) {
          console.log('Skipping wallet authorization:', {
            wallet: walletKey,
            status: eip7702AuthorizationStatus,
            reason: eip7702AuthorizationStatus === 'authorized' ? 'already authorized' : 'same wallet that failed'
          });
        } else {
          // Different wallet, reset and try again
          console.log('Different wallet detected, attempting authorization:', {
            wallet: walletKey,
            previousWallet: currentAuthWallet,
            status: eip7702AuthorizationStatus
          });
          setEip7702AuthorizationStatus('idle');
          setWalletAuthAttempts(prev => {
            const newAttempts = { ...prev };
            delete newAttempts[walletKey];
            return newAttempts;
          });
        }
      }
    };

    initialize();
  }, [ready, authenticated, activeWallet, eip7702AuthorizationStatus, authorize7702, walletAuthAttempts, currentAuthWallet]);

  const contextValue = useMemo(() => ({
    kernelClient,
    smartAccountAddress,
    isInitializing,
    isSmartAccountEnabled,
    eip7702AuthorizationStatus,
    authorize7702,
    error,
    eoa7702Support: eip7702AuthorizationStatus === 'authorized' ? true : (eip7702AuthorizationStatus === 'failed' ? false : null),
  }), [
    kernelClient,
    smartAccountAddress,
    isInitializing,
    isSmartAccountEnabled,
    eip7702AuthorizationStatus,
    authorize7702,
    error,
  ]);

  return (
    <SmartAccountContext.Provider value={contextValue}>
      {children}
    </SmartAccountContext.Provider>
  );
};