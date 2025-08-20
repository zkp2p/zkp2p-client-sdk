import { useEffect, useState, ReactNode, useCallback } from 'react'
import { erc20Abi } from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import useAccount from '@hooks/contexts/useAccount'
import useSmartContracts from '@hooks/contexts/useSmartContracts'
import useTokenData from '@hooks/contexts/useTokenData'
import { basePublicClient } from '@helpers/baseClient'

import BalancesContext from './BalancesContext'


interface ProvidersProps {
  children: ReactNode;
}

const BalancesProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const {
    escrowAddress,
    usdcAddress,
  } = useSmartContracts();
  const { tokens, tokenInfo } = useTokenData();

  /*
   * State
   */

  // Usdc balance
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
  const [shouldFetchUsdcBalance, setShouldFetchUsdcBalance] = useState<boolean>(false);
  
  // Usdc approval to escrow
  const [usdcApprovalToEscrow, setUsdcApprovalToEscrow] = useState<bigint | null>(null);
  const [shouldFetchUsdcApprovalToEscrow, setShouldFetchUsdcApprovalToEscrow] = useState<boolean>(false);
  
  // Eth balance
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [shouldFetchEthBalance, setShouldFetchEthBalance] = useState<boolean>(false);

  // Dynamic token balances
  const [tokenBalances, setTokenBalances] = useState<Record<string, bigint | null>>({});
  const [isTokenBalanceLoading, setIsTokenBalanceLoading] = useState<Record<string, boolean>>({});
  const [baseTokensToFetch, setBaseTokensToFetch] = useState<string[]>([]);

  /*
   * Wagmi Hooks for Auto-Refetching
   */

  // ETH balance with auto-refresh
  const { 
    data: wagmiEthBalance, 
    refetch: wagmiRefetchEth 
  } = useBalance({
    address: loggedInEthereumAddress as `0x${string}`,
    query: {
      enabled: shouldFetchEthBalance && Boolean(loggedInEthereumAddress),
      refetchInterval: 4000, // Refetch every 4 seconds
      staleTime: 2000, // Consider data stale after 2 seconds
    }
  });

  // USDC balance with auto-refresh
  const { 
    data: wagmiUsdcBalance, 
    refetch: wagmiRefetchUsdc 
  } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [loggedInEthereumAddress as `0x${string}`],
    query: {
      enabled: shouldFetchUsdcBalance && Boolean(loggedInEthereumAddress) && Boolean(usdcAddress),
      refetchInterval: 4000, // Refetch every 4 seconds  
      staleTime: 2000, // Consider data stale after 2 seconds
    }
  });

  // USDC approval with auto-refresh
  const { 
    data: wagmiUsdcApproval, 
    refetch: wagmiRefetchApproval 
  } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      loggedInEthereumAddress as `0x${string}`,
      escrowAddress as `0x${string}`,
    ],
    query: {
      enabled: shouldFetchUsdcApprovalToEscrow && Boolean(loggedInEthereumAddress) && Boolean(usdcAddress) && Boolean(escrowAddress),
      refetchInterval: 4000, // Refetch every 4 seconds
      staleTime: 2000, // Consider data stale after 2 seconds
    }
  });

  // Update local state when wagmi data changes
  useEffect(() => {
    if (wagmiEthBalance !== undefined) {
      setEthBalance(wagmiEthBalance.value);
    }
  }, [wagmiEthBalance]);

  useEffect(() => {
    if (wagmiUsdcBalance !== undefined) {
      setUsdcBalance(wagmiUsdcBalance);
    }
  }, [wagmiUsdcBalance]);

  useEffect(() => {
    if (wagmiUsdcApproval !== undefined) {
      setUsdcApprovalToEscrow(wagmiUsdcApproval);
    }
  }, [wagmiUsdcApproval]);

  /*
   * Contract Read Functions
   */

  // Fetch ETH balance (fallback)
  const fetchEthBalance = useCallback(async () => {
    if (!shouldFetchEthBalance || !loggedInEthereumAddress) {
      return;
    }

    try {
      const balance = await basePublicClient.getBalance({
        address: loggedInEthereumAddress as `0x${string}`,
      });
      
      const ethBalanceProcessed = BigInt(balance.toString());
      setEthBalance(ethBalanceProcessed);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance(null);
    }
  }, [shouldFetchEthBalance, loggedInEthereumAddress]);

  const refetchEthBalance = useCallback(() => {
    // Use wagmi refetch for immediate refresh, fallback to manual fetch
    return wagmiRefetchEth() || fetchEthBalance();
  }, [wagmiRefetchEth, fetchEthBalance]);

  // Fetch USDC balance (fallback)
  const fetchUsdcBalance = useCallback(async () => {
    if (!shouldFetchUsdcBalance || !loggedInEthereumAddress || !usdcAddress) {
      return;
    }

    try {
      const balance = await basePublicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [loggedInEthereumAddress as `0x${string}`],
      });
      
      const usdcBalanceProcessed = BigInt(balance.toString());
      setUsdcBalance(usdcBalanceProcessed);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      // Don't clear balance during network transitions
    }
  }, [shouldFetchUsdcBalance, loggedInEthereumAddress, usdcAddress]);

  const refetchUsdcBalance = useCallback(() => {
    // Use wagmi refetch for immediate refresh, fallback to manual fetch
    return wagmiRefetchUsdc() || fetchUsdcBalance();
  }, [wagmiRefetchUsdc, fetchUsdcBalance]);

  // Fetch USDC approval (fallback)
  const fetchUsdcApproval = useCallback(async () => {
    if (!shouldFetchUsdcApprovalToEscrow || !loggedInEthereumAddress || !usdcAddress || !escrowAddress) {
      return;
    }

    try {
      const approval = await basePublicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [
          loggedInEthereumAddress as `0x${string}`,
          escrowAddress as `0x${string}`,
        ],
      });
      
      const approvalProcessed = BigInt(approval.toString());
      setUsdcApprovalToEscrow(approvalProcessed);
    } catch (error) {
      console.error('Error fetching USDC approval:', error);
      setUsdcApprovalToEscrow(null);
    }
  }, [shouldFetchUsdcApprovalToEscrow, loggedInEthereumAddress, usdcAddress, escrowAddress]);

  const refetchUsdcApprovalToEscrow = useCallback(() => {
    // Use wagmi refetch for immediate refresh, fallback to manual fetch
    return wagmiRefetchApproval() || fetchUsdcApproval();
  }, [wagmiRefetchApproval, fetchUsdcApproval]);

  /*
   * Helper Functions for Dynamic Token Balances
   */
  
  // Find Base tokens to fetch balances for
  useEffect(() => {
    if (tokens.length > 0 && Object.keys(tokenInfo).length > 0) {
      const baseTokenIds = tokens.filter(tokenId => 
        tokenInfo[tokenId] && tokenInfo[tokenId].isBase
      );
      setBaseTokensToFetch(baseTokenIds);
    }
  }, [tokens, tokenInfo]);
  
  // Function to fetch a specific token's balance
  const fetchTokenBalance = useCallback(async (tokenId: string) => {
    // Mark token as loading before any checks
    setIsTokenBalanceLoading(prev => ({
      ...prev,
      [tokenId]: true
    }));
    
    if (!isLoggedIn || !loggedInEthereumAddress || !tokenInfo[tokenId]) {
      // Reset loading state even if we can't fetch the balance
      setIsTokenBalanceLoading(prev => ({
        ...prev,
        [tokenId]: false
      }));
      return;
    }
    
    try {
      const token = tokenInfo[tokenId];
      
      // Skip tokens with invalid addresses early
      if (!token.isNative && (!token.address || 
          token.address === '0x0000000000000000000000000000000000000000' || 
          token.address === '0x00000000000000000000000000000000' ||
          !token.address.match(/^0x[a-fA-F0-9]{40}$/))) {
        return;
      }
      
      // Only fetch balances for tokens on Base chain since basePublicClient is configured for Base
      // Skip tokens from other chains to avoid errors
      const baseChainId = basePublicClient.chain.id;
      if (token.chainId !== baseChainId) {
        setTokenBalances(prev => ({
          ...prev,
          [tokenId]: BigInt(0) // Set to 0 for tokens on other chains
        }));
        return;
      }
      
      if (token.isNative) {
        // For native token (ETH)
        const balance = await basePublicClient.getBalance({
          address: loggedInEthereumAddress as `0x${string}`
        });
        
        
        // Update the balance
        setTokenBalances(prev => ({
          ...prev,
          [tokenId]: BigInt(balance.toString())
        }));
      } else {
        // For ERC20 tokens
        const balance = await basePublicClient.readContract({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [loggedInEthereumAddress as `0x${string}`]
        });
        
        
        // Update the balance
        setTokenBalances(prev => ({
          ...prev,
          [tokenId]: BigInt(balance.toString())
        }));
      }
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenId}:`, error);
    } finally {
      // Mark as no longer loading
      setIsTokenBalanceLoading(prev => ({
        ...prev,
        [tokenId]: false
      }));
    }
  }, [isLoggedIn, loggedInEthereumAddress, tokenInfo, basePublicClient]);
  
  // Function to refresh a specific token's balance (exposed via context)
  const refetchTokenBalance = useCallback((tokenId: string) => {
    if (tokenId) {
      fetchTokenBalance(tokenId);
    }
  }, [fetchTokenBalance]);
  
  // Fetch all Base token balances
  useEffect(() => {
    if (isLoggedIn && loggedInEthereumAddress && baseTokensToFetch.length > 0) {
      // Process in batches to avoid rate limits
      const fetchBalances = async () => {
        const batchSize = 5;
        for (let i = 0; i < baseTokensToFetch.length; i += batchSize) {
          const batch = baseTokensToFetch.slice(i, i + batchSize);
          
          // Fetch all tokens in batch
          await Promise.all(batch.map(fetchTokenBalance));
          
          // Add a small delay between batches
          if (i + batchSize < baseTokensToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };
      
      fetchBalances();
    } else if (!isLoggedIn || !loggedInEthereumAddress) {
      // Clear balances when logged out
      setTokenBalances({});
      setIsTokenBalanceLoading({});
    }
  }, [isLoggedIn, loggedInEthereumAddress, baseTokensToFetch, fetchTokenBalance]);

  /*
   * Original Hooks
   */

  useEffect(() => {

    if (isLoggedIn && loggedInEthereumAddress) {

      setShouldFetchEthBalance(true);
    } else {

      setShouldFetchEthBalance(false);

      // Only clear balances if we're actually logged out
      if (!isLoggedIn) {
        setEthBalance(null);
        setUsdcBalance(null);
        setUsdcApprovalToEscrow(null);
      }
    }
  }, [isLoggedIn, loggedInEthereumAddress]);

  useEffect(() => {

    if (isLoggedIn && loggedInEthereumAddress && escrowAddress && usdcAddress) {

      setShouldFetchUsdcBalance(true);
      setShouldFetchUsdcApprovalToEscrow(true);
    } else {

      setShouldFetchUsdcBalance(false);
      setShouldFetchUsdcApprovalToEscrow(false);

      // Only clear balances if we're actually logged out
      // Don't clear during network transitions when addresses temporarily become null
      if (!isLoggedIn) {
        setEthBalance(null);
        setUsdcBalance(null);
        setUsdcApprovalToEscrow(null);
      }
    }
  }, [isLoggedIn, loggedInEthereumAddress, escrowAddress, usdcAddress]);
  
  // Fetch ETH balance when needed
  useEffect(() => {
    if (shouldFetchEthBalance) {
      fetchEthBalance();
    }
  }, [shouldFetchEthBalance, fetchEthBalance]);

  // Fetch USDC balance when needed
  useEffect(() => {
    if (shouldFetchUsdcBalance) {
      fetchUsdcBalance();
    }
  }, [shouldFetchUsdcBalance, fetchUsdcBalance]);

  // Fetch USDC approval when needed
  useEffect(() => {
    if (shouldFetchUsdcApprovalToEscrow) {
      fetchUsdcApproval();
    }
  }, [shouldFetchUsdcApprovalToEscrow, fetchUsdcApproval]);

  return (
    <BalancesContext.Provider
      value={{
        ethBalance,
        refetchEthBalance,
        shouldFetchEthBalance,
        usdcBalance,
        refetchUsdcBalance,
        shouldFetchUsdcBalance,
        usdcApprovalToEscrow,
        refetchUsdcApprovalToEscrow,

        // New values for dynamic token balances
        tokenBalances,
        isTokenBalanceLoading,
        refetchTokenBalance
      }}
    >
      {children}
    </BalancesContext.Provider>
  );
};

export default BalancesProvider
