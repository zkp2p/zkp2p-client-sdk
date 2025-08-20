import { useEffect, useState, ReactNode, useMemo } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { base } from 'viem/chains';

import { esl } from '@helpers/constants';
import { LoginStatus, LoginStatusType } from '@helpers/types';
import { formatAddress } from '@helpers/addressFormat';
import { ToastContainer, toast } from 'react-toastify';
import { selectedChains } from '../..';

import AccountContext from './AccountContext';

interface ProvidersProps {
  children: ReactNode;
}

const AccountProvider = ({ children }: ProvidersProps) => {
  const { wallets } = useWallets();
  const {
    authenticated,
    logout: authenticatedLogout,
    user,
    login: authenticatedLogin,
    exportWallet: exportAuthenticatedWallet
  } = usePrivy();

  /*
   * State
   */

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatusType>(LoginStatus.LOGGED_OUT);
  const [loggedInEthereumAddress, setLoggedInEthereumAddress] = useState<string | null>(null);
  const [accountDisplay, setAccountDisplay] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [hasShownChainErrorToast, setHasShownChainErrorToast] = useState<boolean>(false);

  // Get the active wallet
  const activeWallet = useMemo(() => {
    // Prefer embedded wallet, then fall back to first connected wallet
    return wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  }, [wallets]);

  // Get current chain - for now default to base
  const currentChain = useMemo(() => {
    return selectedChains.find((chain: any) => chain.id === base.id) || base;
  }, []);

  /*
   * Hooks
   */

  useEffect(() => {
  }, [activeWallet?.address, authenticated, isLoggedIn]);

  // Update login status based on Privy authentication
  useEffect(() => {
    if (authenticated && activeWallet) {
      setLoginStatus(LoginStatus.AUTHENTICATED);
      setIsLoggedIn(true);
      setLoggedInEthereumAddress(activeWallet.address);
      
      // Set account display based on user info
      if (user?.email?.address) {
        setAccountDisplay(user.email.address);
      } else if (user?.google?.email) {
        setAccountDisplay(user.google.email);
      } else if (user?.twitter?.username) {
        setAccountDisplay(`@${user.twitter.username}`);
      } else if (activeWallet.address) {
        setAccountDisplay(formatAddress(activeWallet.address));
      }
      
      // Log active wallet for debugging
      console.log('Active wallet updated:', {
        address: activeWallet.address,
        type: activeWallet.walletClientType,
        isEmbedded: activeWallet.walletClientType === 'privy'
      });
    } else if (authenticated && !activeWallet) {
      // Authenticated but no wallet yet
      setLoginStatus(LoginStatus.AUTHENTICATED);
      setIsLoggedIn(false);
    } else {
      // Not authenticated
      setLoginStatus(LoginStatus.LOGGED_OUT);
      setIsLoggedIn(false);
      setLoggedInEthereumAddress(null);
      setAccountDisplay(null);
    }
  }, [authenticated, activeWallet, user]);

  // Update network state
  useEffect(() => {
    if (currentChain) {
      // Normalize chain name to lowercase to match deployed_addresses keys
      setNetwork(currentChain.name.toLowerCase());
    }
  }, [currentChain]);

  // Handle wrong network
  useEffect(() => {
    // This is simplified - in production you'd check the actual connected chain
    const isWrongNetwork = false;
    
    if (isWrongNetwork && !hasShownChainErrorToast) {
      toast.error('Please switch to the correct network');
      setHasShownChainErrorToast(true);
    } else if (!isWrongNetwork) {
      setHasShownChainErrorToast(false);
    }
  }, [hasShownChainErrorToast]);

  /*
   * Helpers
   */

  const logout = async () => {
    try {
      await authenticatedLogout();
      setIsLoggedIn(false);
      setLoginStatus(LoginStatus.LOGGED_OUT);
      setLoggedInEthereumAddress(null);
      setAccountDisplay(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const contextValue = useMemo(() => ({
    // Account Information
    isLoggedIn,
    loginStatus,
    loggedInEthereumAddress,
    accountDisplay,
    userEmail: user?.email?.address || user?.google?.email || null,
    network,
    connectStatus: authenticated ? 'connected' : 'disconnected',

    // Functions
    authenticatedLogin,
    authenticatedLogout: logout,
    exportAuthenticatedWallet,
  }), [
    isLoggedIn,
    loginStatus,
    loggedInEthereumAddress,
    accountDisplay,
    user,
    network,
    authenticatedLogin,
    exportAuthenticatedWallet,
  ]);

  return (
    <>
      <AccountContext.Provider value={contextValue}>
        {children}
      </AccountContext.Provider>
      <ToastContainer />
    </>
  );
};

export default AccountProvider;