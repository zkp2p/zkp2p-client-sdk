import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';

import { Button } from "@components/common/Button";
import { CustomConnectButton } from "@components/common/ConnectButton";
import Spinner from '@components/common/Spinner';
import { AutoColumn } from '@components/layouts/Column';
import { InputWithTokenSelector } from '@components/modals/selectors/token/InputWithTokenSelector';
import { Input } from '@components/common/Input';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { ZERO_BIGINT, SOLANA_CHAIN_ID, TRON_CHAIN_ID, BASE_CHAIN_ID, HYPERLIQUID_CHAIN_ID, BASE_USDC_ADDRESS } from '@helpers/constants';
import { toBigInt, toTokenString } from '@helpers/unitsOld';
import {
  LoginStatus,
  SendTransactionStatus,
  Abi,
} from '@helpers/types';
import useTokenData from '@hooks/contexts/useTokenData';
import { usdcInfo } from '@helpers/types/tokens';
import { resolveEnsName } from '@helpers/ens';
import useAccount from '@hooks/contexts/useAccount';
import { useWallets } from '@privy-io/react-auth';
import useBalances from '@hooks/contexts/useBalance';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useSmartAccount from '@hooks/contexts/useSmartAccount';
import useMediaQuery from "@hooks/useMediaQuery";

import { tokenUnits, tokenUnitsToReadableWithMaxDecimals } from '@helpers/units';
import useSendTransaction from '@hooks/transactions/useSendTransaction';
import { TokenData } from "@helpers/types/tokens"
import TallySupportButton from '@components/common/TallySupportButton';
import { useSendWithBridge } from '@hooks/bridge/useSendWithBridge';
import BridgeSuccessView from './BridgeSuccessView';
import { ChainBreadcrumb } from './ChainBreadcrumb';
import { CHAIN_EXPLORERS } from '@helpers/blockExplorers';

type RecipientAddress = {
  input: string;
  ensName: string;
  rawAddress: string;
  displayAddress: string;
  addressType: string;
};

const EMPTY_RECIPIENT_ADDRESS: RecipientAddress = {
  input: '',
  ensName: '',
  rawAddress: '',
  displayAddress: '',
  addressType: ''
};

interface TokenSendConfig {
  tokenInfo: any;
  address: string | null;
  balance: bigint | null;
  abi: any | null;
  refetchBalance: (() => void) | null;
}

export const SendForm: React.FC = () => {

  SendForm.displayName = "SendForm";

  /*
   * Contexts
   */

  const { isLoggedIn, network, loginStatus, loggedInEthereumAddress } = useAccount();
  const { blockscanUrl, usdcAddress, usdcAbi } = useSmartContracts();
  const { isSmartAccountEnabled } = useSmartAccount();
  const { wallets } = useWallets();
  const { tokens, tokenInfo } = useTokenData();
  const { 
    tokenBalances, 
    isTokenBalanceLoading, 
    refetchTokenBalance,
    usdcBalance, 
    refetchUsdcBalance
  } = useBalances();

  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';

  /*
   * State
   */

  const [sendToken, setSendToken] = useState<string>(usdcInfo.tokenId);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [sendState, setSendState] = useState(SendTransactionStatus.DEFAULT);
  const [sendAmountInput, setSendAmountInput] = useState<string>('');
  const [resolvingEnsName, setResolvingEnsName] = useState<boolean>(false);
  const [recipientAddressInput, setRecipientAddressInput] = useState<RecipientAddress>(EMPTY_RECIPIENT_ADDRESS);
  const [isRecipientInputFocused, setIsRecipientInputFocused] = useState(false);
  const [isValidRecipientAddress, setIsValidRecipientAddress] = useState<boolean>(false);
  // Removed shouldConfigureEthTransferWrite and shouldConfigureErc20TransferWrite - no longer needed without wagmi hooks
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<bigint | null>(null);
  const [isSelectedTokenBalanceLoading, setIsSelectedTokenBalanceLoading] = useState<boolean>(false);
  
  // Destination token selection for cross-chain
  const [destinationTokenId, setDestinationTokenId] = useState<string>('');
  const [destinationToken, setDestinationToken] = useState<TokenData | null>(null);
  const [showBridgeInfo, setShowBridgeInfo] = useState<boolean>(false);
  const [destinationAmount, setDestinationAmount] = useState<string>('');
  const [bridgeTransactionHashes, setBridgeTransactionHashes] = useState<{ txHash: string; chainId: number }[] | null>(null);
  const [isBridgeComplete, setIsBridgeComplete] = useState<boolean>(false);
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [bridgeStartTime, setBridgeStartTime] = useState<number | null>(null);
  const [bridgeEndTime, setBridgeEndTime] = useState<number | null>(null);
  const [actualBridgeFee, setActualBridgeFee] = useState<string | null>(null);
  const [bridgeQuoteError, setBridgeQuoteError] = useState<string | null>(null);

  /*
   * LocalStorage for send token
   */
  
  useEffect(() => {
    const storedSelectedSendToken = localStorage.getItem('storedSelectedSendToken');
    
    if (storedSelectedSendToken) {
      setSendToken(JSON.parse(storedSelectedSendToken));
    }
  }, []);

  useEffect(() => {
    if (sendToken) {
      localStorage.setItem('storedSelectedSendToken', JSON.stringify(sendToken));
    }
  }, [sendToken]);

  /*
   * Filter for Base chain tokens only
   */

  const baseTokens = useMemo(() => {
    return tokens.filter(tokenId => tokenInfo[tokenId]?.isBase && !tokenInfo[tokenId]?.isNative);
  }, [tokens, tokenInfo]);

  /*
   * Select default token on load
   */

  useEffect(() => {
    if (baseTokens.length > 0 && !selectedTokenId) {
      // Find USDC token 
      const usdcTokenId = baseTokens.find(tokenId => 
        tokenInfo[tokenId]?.ticker === 'USDC'
      );
      
      // Set default token to USDC or first available token
      setSelectedTokenId(usdcTokenId || baseTokens[0]);
    }
  }, [baseTokens, selectedTokenId, tokenInfo]);

  // Token selection and data synchronization effects  
  useEffect(() => {
    if (selectedTokenId && tokenInfo[selectedTokenId]) {
      const token = tokenInfo[selectedTokenId];
      setSelectedToken(token);
      setDestinationAmount('');
      setShowBridgeInfo(false);
    } else {
      setSelectedToken(null);
    }
  }, [selectedTokenId, tokenInfo]);
  
  useEffect(() => {
    if (destinationTokenId && tokenInfo[destinationTokenId]) {
      const newDestinationToken = tokenInfo[destinationTokenId];
      setDestinationToken(newDestinationToken);
      setDestinationAmount('');
      setShowBridgeInfo(false);
    } else {
      setDestinationToken(null);
    }
  }, [destinationTokenId, tokenInfo]);
  
  useEffect(() => {
    if (selectedTokenId && !destinationTokenId) {
      setDestinationTokenId(selectedTokenId);
    }
  }, [selectedTokenId, destinationTokenId]);

  useEffect(() => {
    if (selectedTokenId && tokenBalances[selectedTokenId]) {
      setSelectedTokenBalance(tokenBalances[selectedTokenId]);
    } else {
      setSelectedTokenBalance(null);
    }
  }, [selectedTokenId, tokenBalances]);

  useEffect(() => {
    if (selectedTokenId) {
      setIsSelectedTokenBalanceLoading(!!isTokenBalanceLoading[selectedTokenId]);
    } else {
      setIsSelectedTokenBalanceLoading(false);
    }
  }, [selectedTokenId, isTokenBalanceLoading]);

  /*
   * Configure token send settings
   */
   
  const tokenSendConfig: TokenSendConfig = useMemo(() => {
    if (!selectedToken) {
      return {
        tokenInfo: null,
        isNative: false,
        address: null,
        balance: null,
        abi: null,
        refetchBalance: null
      };
    }

    return {
      tokenInfo: selectedToken,
      address: selectedToken.address,
      balance: selectedTokenBalance ? BigInt(selectedTokenBalance.toString()) : null,
      abi: null,
      refetchBalance: () => refetchTokenBalance(selectedTokenId)
    };
  }, [
    selectedToken, 
    selectedTokenId, 
    selectedTokenBalance, 
    refetchTokenBalance
  ]);

  /*
   * Transaction Hook
   */

  // Transaction states
  const [isTransactionSigning, setIsTransactionSigning] = useState(false);
  const [isTransactionMining, setIsTransactionMining] = useState(false);

  // Send Transaction Hook
  const { executeSend, isLoading: isSendLoading, error: sendError } = useSendTransaction(
    // onSuccess callback
    (data) => {
      console.log('Send transaction successful:', data);
      setTransactionHash(data.transactionHash || data.hash);
      setIsTransactionMining(false);
      setIsTransactionSigning(false);
      resetStateOnSuccessfulTransaction();
    },
    // onError callback
    (error) => {
      console.error('Send transaction failed:', error);
      setIsTransactionMining(false);
      setIsTransactionSigning(false);
    }
  );
  
  // Bridge hook for cross-chain transfers
  const { executeWithBridge, getBridgeQuote, bridgeQuote, isLoadingQuote, currentProvider } = useSendWithBridge();
  
  // Store getBridgeQuote in a ref to prevent useEffect re-runs
  const getBridgeQuoteRef = useRef(getBridgeQuote);
  useEffect(() => {
    getBridgeQuoteRef.current = getBridgeQuote;
  }, [getBridgeQuote]);
  
  // Check if cross-chain transfer is needed
  const isCrossChain = useMemo(() => {
    if (!selectedToken || !destinationToken) {
      console.log('Missing token info for cross-chain check:', { selectedToken, destinationToken });
      return false;
    }
    console.log('Checking cross-chain transfer:', {
      fromChain: selectedToken.chainId,
      toChain: destinationToken.chainId
    });
    return selectedToken.chainId !== destinationToken.chainId;
  }, [selectedToken, destinationToken]);
  
  // Check if we need a bridge/swap (either cross-chain OR same-chain different-token)
  const needsBridge = useMemo(() => {
    if (!selectedToken || !destinationToken) return false;
    // Need bridge for cross-chain OR same-chain different-token (not Base USDC to Base USDC)
    return isCrossChain || destinationToken.address.toLowerCase() !== BASE_USDC_ADDRESS.toLowerCase();
  }, [selectedToken, destinationToken, isCrossChain]);
  
  // Debounced bridge quote fetching function
  const fetchBridgeQuoteDebounced = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const fetchQuote = async () => {
        if (needsBridge && sendAmountInput && recipientAddressInput.rawAddress && selectedToken && destinationToken) {
          try {
            setBridgeQuoteError(null);
            const quote = await getBridgeQuoteRef.current({
              amount: sendAmountInput,
              recipient: recipientAddressInput.rawAddress as `0x${string}`,
              fromChain: selectedToken.chainId,
              toChain: destinationToken.chainId,
              toToken: destinationToken,
            });
            
            if (quote) {
              setShowBridgeInfo(true);
              const outputAmountInSmallestUnit = BigInt(quote.outputAmount);
              const maxDecimals = destinationToken.chainId === HYPERLIQUID_CHAIN_ID ? 8 : 6;
              const outputAmountFormatted = tokenUnitsToReadableWithMaxDecimals(
                outputAmountInSmallestUnit,
                destinationToken.decimals,
                maxDecimals
              );
              setDestinationAmount(outputAmountFormatted);
            }
          } catch (error) {
            console.error('Failed to get bridge quote:', error);
            setShowBridgeInfo(false);
            
            let errorMessage = 'Unable to get bridge quote';
            if (error instanceof Error) {
              if (error.message.includes('No routes')) {
                errorMessage = `Bridge route not available from ${selectedToken.chainName} to ${destinationToken.chainName}`;
              } else if (error.message.includes('amount')) {
                errorMessage = 'Invalid amount for bridging';
              } else if (error.message.includes('support')) {
                errorMessage = `${destinationToken.chainName} is not supported for bridging`;
              }
            }
            setBridgeQuoteError(errorMessage);
          }
        } else if (!needsBridge && sendAmountInput && destinationToken) {
          setShowBridgeInfo(false);
          if (destinationToken.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase()) {
            setDestinationAmount(sendAmountInput);
          } else {
            setDestinationAmount('');
          }
          setBridgeQuoteError(null);
        } else {
          setShowBridgeInfo(false);
          setDestinationAmount('');
          setBridgeQuoteError(null);
        }
      };
      
      fetchQuote();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [needsBridge, sendAmountInput, recipientAddressInput.rawAddress, selectedToken, destinationToken]);

  // Update transaction states based on loading
  useEffect(() => {
    if (isSendLoading && !isTransactionMining) {
      setIsTransactionSigning(true);
    }
  }, [isSendLoading, isTransactionMining]);

  // Unified send function
  const executeSendTransaction = useCallback(async () => {
    if (!recipientAddressInput.rawAddress || !sendAmountInput || !selectedToken) {
      return;
    }

    try {
      // Convert amount to token units
      const amountInUnits = tokenUnits(sendAmountInput, selectedToken.decimals);
      
      setIsTransactionSigning(true);
      
      if (needsBridge && destinationToken) {
        // Track bridge start time but DON'T show success view yet
        // We'll set isBridging to true only after the transaction is signed
        setSendState(SendTransactionStatus.TRANSACTION_SIGNING);
        
        // Execute cross-chain transfer or same-chain swap via bridge
        const result = await executeWithBridge({
          amount: sendAmountInput,
          recipient: recipientAddressInput.rawAddress as `0x${string}`,
          fromChain: selectedToken.chainId,
          toChain: destinationToken.chainId,
          toToken: destinationToken,
          onTransactionSigned: (txHashes) => {
            // This callback is called as soon as the transaction is signed
            console.log('Transaction signed, showing success view', txHashes);
            
            // NOW we can show the success view since the transaction was signed
            setBridgeStartTime(Date.now());
            setIsBridging(true);
            setIsTransactionSigning(false);
            setIsTransactionMining(true);
            setSendState(SendTransactionStatus.TRANSACTION_MINING);
            setBridgeTransactionHashes(txHashes);
            console.log('Bridge transaction initiated');
          }
        });
        
        if (result) {
          console.log('Bridge transaction completed:', result);
          
          // Check if we have transaction hashes indicating completion
          if (result && typeof result === 'object' && 'txHashes' in result && result.txHashes && Array.isArray(result.txHashes) && result.txHashes.length > 0) {
            setBridgeTransactionHashes(result.txHashes);
            
            // Check if we have transactions on both chains
            const hasSourceTx = result.txHashes.some((tx: any) => tx.chainId === selectedToken.chainId);
            const hasDestTx = result.txHashes.some((tx: any) => tx.chainId === destinationToken.chainId);
            
            // Special handling for embedded wallets and Solana bridges
            const isSolanaBridge = destinationToken.chainId === SOLANA_CHAIN_ID;
            const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
            const isEmbeddedWallet = activeWallet?.walletClientType === 'privy';
            const isEmbeddedWalletComplete = isEmbeddedWallet && hasSourceTx;
            const isSolanaComplete = isSolanaBridge && hasSourceTx;
            
            // Update state based on transaction progress
            if (hasSourceTx && !hasDestTx && !isEmbeddedWalletComplete && !isSolanaComplete) {
              // Source transaction complete, waiting for destination
              setSendState(SendTransactionStatus.WAITING_DESTINATION_TRANSACTION);
            }
            
            // Complete if: 
            // 1. We have both source and destination txs (regular case)
            // 2. Embedded wallet with source tx (only get 1 tx)
            // 3. Solana bridge with source tx (destination may be delayed)
            if (hasSourceTx && hasDestTx || isEmbeddedWalletComplete || isSolanaComplete) {
              setIsBridging(false);
              setIsBridgeComplete(true);
              setIsTransactionMining(false);
              setSendState(SendTransactionStatus.BRIDGE_COMPLETE);
              setBridgeEndTime(Date.now());
              // Set actual bridge fee if available from quote
              if (bridgeQuote) {
                setActualBridgeFee(bridgeQuote.totalFee);
              }
              console.log('Bridge completed successfully');
            }
          }
          
          return result;
        }
      } else {
        // Execute same-chain transfer
        const hash = await executeSend({
          to: recipientAddressInput.rawAddress as `0x${string}`,
          amount: amountInUnits.toString(),
          token: selectedToken,
          chainId: selectedToken.chainId,
        });
        
        if (hash) {
          setIsTransactionSigning(false);
          setIsTransactionMining(true);
          console.log('Transaction hash:', hash);
          return hash;
        }
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      setIsTransactionSigning(false);
      setIsTransactionMining(false);
      setIsBridging(false); // Ensure we don't show success view on error
      setSendState(SendTransactionStatus.DEFAULT); // Reset state
      throw error;
    }
  }, [recipientAddressInput.rawAddress, sendAmountInput, selectedToken, destinationToken, needsBridge, executeSend, executeWithBridge]);

  /*
   * Handlers
   */

  const handleSendAmountInputChange = async (value: string) => {
    validateAndSetQuote(value);
  };

  const handleRecipientInputChange = async (value: string) => {
    validateAndSetAddress(value);
  };

  /*
   * Hooks
   */

  // Consolidated state management - single useEffect following Swap pattern
  useEffect(() => {
    // PRIORITY 1: Transaction states (highest priority - never override)
    if (isTransactionSigning) {
      setSendState(SendTransactionStatus.TRANSACTION_SIGNING);
      return;
    }
    if (isTransactionMining) {
      setSendState(SendTransactionStatus.TRANSACTION_MINING);
      return;
    }
    if (isBridging && !isBridgeComplete) {
      setSendState(SendTransactionStatus.TRANSACTION_MINING);
      return;
    }
    if (isBridgeComplete) {
      setSendState(SendTransactionStatus.BRIDGE_COMPLETE);
      return;
    }

    // PRIORITY 2: Input validation
    if (!sendAmountInput || sendAmountInput === '0') {
      setSendState(SendTransactionStatus.MISSING_AMOUNTS);
      setShowBridgeInfo(false);
      setDestinationAmount('');
      setBridgeQuoteError(null);
      return;
    }
    
    if (!recipientAddressInput.input) {
      setSendState(SendTransactionStatus.DEFAULT);
      setShowBridgeInfo(false);
      setDestinationAmount('');
      setBridgeQuoteError(null);
      return;
    }
    
    if (!isValidRecipientAddress) {
      setSendState(SendTransactionStatus.INVALID_RECIPIENT_ADDRESS);
      setShowBridgeInfo(false);
      setDestinationAmount('');
      setBridgeQuoteError(null);
      return;
    }

    // PRIORITY 3: Balance validation
    if (!selectedToken || selectedTokenBalance === null) {
      setSendState(SendTransactionStatus.MISSING_AMOUNTS);
      return;
    }
    
    const sendAmountBI = toBigInt(sendAmountInput);
    if (sendAmountBI > selectedTokenBalance) {
      setSendState(SendTransactionStatus.INSUFFICIENT_BALANCE);
      setShowBridgeInfo(false);
      setDestinationAmount('');
      setBridgeQuoteError(null);
      return;
    }

    // PRIORITY 4: Bridge requirements check
    if (!needsBridge) {
      // Same chain transfer - ready to send
      setSendState(SendTransactionStatus.VALID_FOR_ERC20_TRANSFER);
      setShowBridgeInfo(false);
      if (destinationToken?.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase()) {
        setDestinationAmount(sendAmountInput);
      } else {
        setDestinationAmount('');
      }
      setBridgeQuoteError(null);
      return;
    }

    // PRIORITY 5: Bridge quote handling
    if (!destinationToken) {
      setSendState(SendTransactionStatus.DEFAULT);
      return;
    }

    // Check if quote fetch is in progress
    if (isLoadingQuote) {
      setSendState(SendTransactionStatus.FETCHING_BRIDGE_QUOTE);
      return;
    }

    // Check for existing quote errors
    if (bridgeQuoteError) {
      setSendState(SendTransactionStatus.DEFAULT);
      return;
    }

    // Check if we have a valid quote
    if (bridgeQuote && showBridgeInfo) {
      setSendState(SendTransactionStatus.BRIDGE_QUOTE_READY);
      return;
    }

    // Need to fetch quote - trigger quote fetch
    setSendState(SendTransactionStatus.FETCHING_BRIDGE_QUOTE);
    fetchBridgeQuoteDebounced();
  }, [
    // Transaction states
    isTransactionSigning,
    isTransactionMining, 
    isBridging,
    isBridgeComplete,
    
    // Input validation
    sendAmountInput,
    recipientAddressInput.input,
    isValidRecipientAddress,
    
    // Balance & token data
    selectedToken,
    selectedTokenBalance,
    destinationToken,
    
    // Bridge state
    needsBridge,
    isLoadingQuote,
    bridgeQuote,
    bridgeQuoteError,
    showBridgeInfo,
    
    // Function reference
    fetchBridgeQuoteDebounced
  ]);

  useEffect(() => {
    if (loginStatus === LoginStatus.LOGGED_OUT) {
      resetStateOnSuccessfulTransaction();

      if (transactionHash) {
        setTransactionHash('');
      };
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginStatus]);

  // Clear recipient address when switching between incompatible chain types
  useEffect(() => {
    // Only clear if we have an existing address and are switching chains
    if (recipientAddressInput.input && destinationToken) {
      const previousChainType = recipientAddressInput.addressType;
      const destinationChainId = destinationToken.chainId;
      
      // Determine new chain type
      let newChainType = 'evm'; // default
      if (destinationChainId === SOLANA_CHAIN_ID) {
        newChainType = 'solana';
      } else if (destinationChainId === TRON_CHAIN_ID) {
        newChainType = 'tron';
      }
      
      // Clear address if switching between incompatible chain types
      // EVM to EVM is compatible (includes ENS), but EVM to Solana/Tron or vice versa is not
      const isIncompatibleSwitch = previousChainType && previousChainType !== newChainType;
      
      if (isIncompatibleSwitch) {
        // Clear the recipient address since it won't be valid on the new chain
        setRecipientAddressInput(EMPTY_RECIPIENT_ADDRESS);
        setIsValidRecipientAddress(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationToken?.chainId]); // Only trigger on chain change, not other token properties

  // Removed useEffect for setShouldConfigureErc20TransferWrite and setShouldConfigureEthTransferWrite - no longer needed

  // Transaction hash is now set in the onSuccess callback

  
  /*
   * Helpers
   */

  function resetStateOnInputChanges() {
    if (transactionHash) {
      setTransactionHash('');
    };

    if (sendState === SendTransactionStatus.TRANSACTION_SUCCEEDED) {
      setSendState(SendTransactionStatus.DEFAULT);
    }
  }

  function resetStateOnSuccessfulTransaction() {
    setSendAmountInput('');
    setDestinationAmount('');
    setRecipientAddressInput(EMPTY_RECIPIENT_ADDRESS);
    setBridgeTransactionHashes(null);
    setIsBridgeComplete(false);
    setIsBridging(false);
    setShowBridgeInfo(false);
    setBridgeStartTime(null);
    setBridgeEndTime(null);
    setActualBridgeFee(null);
    setBridgeQuoteError(null);

    // Refresh the token balance
    if (selectedTokenId) {
      refetchTokenBalance(selectedTokenId);
    }
    
    // Also refresh destination token balance if it's different
    if (destinationTokenId && destinationTokenId !== selectedTokenId) {
      refetchTokenBalance(destinationTokenId);
    }
  };

  const validateAndSetQuote = async (value: string) => {
    if (value === "") {
      setSendAmountInput("");
    } else if (value === "0") {
      setSendAmountInput("0");
    } else if (value === ".") {
      setSendAmountInput("0.");
    } else {
      setSendAmountInput(value);
    }
  }

  const validateAndSetAddress = async (recipientAddress: string) => {
    resetStateOnInputChanges();

    let rawAddress = '';
    let ensName = '';
    let displayAddress = '';
    let isValidAddress = false;

    // Support different address formats based on destination chain
    const destinationChainId = destinationToken?.chainId || BASE_CHAIN_ID;
    let addressType = 'evm';
    if (destinationChainId === SOLANA_CHAIN_ID) {
      addressType = 'solana';
    } else if (destinationChainId === TRON_CHAIN_ID) {
      addressType = 'tron';
    }
    
    setRecipientAddressInput({
      input: recipientAddress,
      ensName,
      rawAddress,
      displayAddress,
      addressType
    });
    
    if (destinationChainId === SOLANA_CHAIN_ID) {
      // Solana address validation
      if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(recipientAddress)) {
        rawAddress = recipientAddress;
        displayAddress = recipientAddress;
        isValidAddress = true;
      }
    } else if (destinationChainId === TRON_CHAIN_ID) {
      // TRON address validation (Base58 format starting with T)
      if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(recipientAddress)) {
        rawAddress = recipientAddress;
        displayAddress = recipientAddress;
        isValidAddress = true;
      }
    } else {
      // EVM chains (including ENS support)
      if (recipientAddress.endsWith('.eth') || recipientAddress.endsWith('.xyz')) {
        setResolvingEnsName(true);
        ensName = recipientAddress;
        const resolvedAddress = await resolveEnsName(recipientAddress);
        if (resolvedAddress) {
          rawAddress = resolvedAddress;
          displayAddress = resolvedAddress;
          isValidAddress = true;
        }
        setResolvingEnsName(false);
      } else if (recipientAddress.startsWith('0x') && recipientAddress.length === 42) {
        rawAddress = recipientAddress;
        displayAddress = recipientAddress;
        isValidAddress = true;
      }
    }

    setRecipientAddressInput(prevState => ({
      ...prevState,
      ensName: ensName,
      rawAddress: rawAddress,
      displayAddress: displayAddress,
    }));

    setIsValidRecipientAddress(isValidAddress);
  }

  /*
   * Other Helpers
   */

  const recipientPlaceholderLabel = useMemo(() => {
    if (!destinationToken) return "Wallet address";
    
    const chainId = destinationToken.chainId;
    if (chainId === SOLANA_CHAIN_ID) {
      return "Solana wallet address";
    } else if (chainId === TRON_CHAIN_ID) {
      return "TRON wallet address";
    } else {
      return "Wallet address or ENS name";
    }
  }, [destinationToken]);

  function isValidSendAmountInput(value: string) {
    const isValidUsdcInput = /^-?\d*(\.\d{0,6})?$/.test(value);
    // const isValidEthInput = /^-?\d*(\.\d{0,18})?$/.test(value);
    
    return parseFloat(value) >= 0 && isValidUsdcInput;
  };

  const tokenBalanceLabel = useMemo(() => {
    if (isLoggedIn && selectedToken) {
      if (isSelectedTokenBalanceLoading) {
        return 'Balance: Loading...';
      }
      
      if (selectedTokenBalance) {
        return `Balance: ${tokenUnitsToReadableWithMaxDecimals(
          BigInt(selectedTokenBalance.toString()), 
          selectedToken.decimals,
          6
        )}`;
      }
    }
    return '';
  }, [isLoggedIn, selectedToken, selectedTokenBalance, isSelectedTokenBalanceLoading]);

  const ctaOnClick = async () => {
    switch (sendState) {
      case SendTransactionStatus.VALID_FOR_ERC20_TRANSFER:
      case SendTransactionStatus.BRIDGE_QUOTE_READY:
        try {
          const hash = await executeSendTransaction();
          if (hash) {
            // Transaction was submitted successfully
            // The success callback in useSendTransaction will handle the rest
            console.log('Send transaction hash:', hash);
          }
        } catch (error) {
          // User rejected or transaction failed
          console.error('Send transaction error:', error);
          // Reset state so user can try again
          setSendState(needsBridge ? SendTransactionStatus.BRIDGE_QUOTE_READY : SendTransactionStatus.VALID_FOR_ERC20_TRANSFER);
          // Error toast is already shown by useSendTransaction
        }
        break;

      default:
        break;
    }
  };

  const ctaDisabled = (): boolean => {
    if (resolvingEnsName) {
      return true;
    }

    // CTA should only be enabled for these specific states where user action is possible
    const enabledStates = [
      SendTransactionStatus.VALID_FOR_ERC20_TRANSFER,
      SendTransactionStatus.BRIDGE_QUOTE_READY,
    ];

    // If we're in an enabled state, button is not disabled
    if (enabledStates.includes(sendState)) {
      return false;
    }

    // All other states should have the button disabled
    // Note: Some disabled states show loading (signing, fetching quote) 
    // while others show informational text (missing amounts, invalid address)
    return true;
  };

  const ctaLoading = (): boolean => {
    // Show loading for ENS resolution
    if (resolvingEnsName) {
      return true;
    }

    // Show loading for specific states that require user interaction or processing
    const loadingStates = [
      SendTransactionStatus.FETCHING_BRIDGE_QUOTE,
      SendTransactionStatus.TRANSACTION_SIGNING,
    ];

    return loadingStates.includes(sendState);
  };

  const ctaText = (): string => {
    if (resolvingEnsName) {
      return 'Resolving To Address';
    }

    switch (sendState) {
      case SendTransactionStatus.INVALID_RECIPIENT_ADDRESS:
        return 'Invalid recipient address';

      case SendTransactionStatus.MISSING_AMOUNTS:
        return 'Input send amount';
      
      case SendTransactionStatus.INSUFFICIENT_BALANCE: {
        const readableBalance = tokenSendConfig.balance && tokenSendConfig.tokenInfo
          ? toTokenString(tokenSendConfig.balance, tokenSendConfig.tokenInfo.decimals) 
          : '0';
        return `Insufficient ${tokenSendConfig.tokenInfo?.ticker || ''} balance: ${readableBalance}`;
      }

      case SendTransactionStatus.TRANSACTION_SIGNING:
        return 'Signing Transaction';

      case SendTransactionStatus.TRANSACTION_MINING:
        return needsBridge ? 'Mining on source chain...' : 'Transaction Mining';

      // Bridge-specific granular states
      case SendTransactionStatus.FETCHING_BRIDGE_QUOTE:
        return 'Fetching quote...';

      case SendTransactionStatus.BRIDGE_QUOTE_READY:
        return 'Bridge & Send';

      case SendTransactionStatus.WAITING_DESTINATION_TRANSACTION:
        return 'Bridging to destination...';

      case SendTransactionStatus.BRIDGE_COMPLETE:
        return 'Bridge Complete';

      case SendTransactionStatus.VALID_FOR_ERC20_TRANSFER:
        return isCrossChain ? 'Bridge & Send' : 'Send';

      case SendTransactionStatus.TRANSACTION_SUCCEEDED:
        return isBridgeComplete ? 'Bridge Complete' : 'Transaction Sent';

      case SendTransactionStatus.DEFAULT:
      default:
        return 'Input recipient address';
    }
  };

  const recipientInputText = (): string => {
    if (isRecipientInputFocused) {
      return recipientAddressInput.input;
    } else {
      if (recipientAddressInput.ensName) {
        return recipientAddressInput.ensName;
      } else if (recipientAddressInput.displayAddress) {
        return recipientAddressInput.displayAddress;
      } else {
        return recipientAddressInput.input;
      }
    }
  };


  /*
   * Component
   */

  // Show bridge success view when bridging starts or is complete
  if ((isBridging || isBridgeComplete) && selectedToken && destinationToken) {
    const bridgeTime = bridgeStartTime && bridgeEndTime ? 
      Math.floor((bridgeEndTime - bridgeStartTime) / 1000) : 0;
    
    const chainNames: Record<number, string> = {
      [BASE_CHAIN_ID]: 'Base',
      [SOLANA_CHAIN_ID]: 'Solana',
      [TRON_CHAIN_ID]: 'Tron',
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    
    return (
      <Suspense>
        <Wrapper>
          <SendFormContainer>
            <BridgeSuccessView
              sourceAmount={sendAmountInput}
              destinationAmount={destinationAmount}
              sourceToken={selectedToken}
              destinationToken={destinationToken}
              txHashes={bridgeTransactionHashes || undefined}
              bridgeTime={bridgeTime}
              bridgeFee={actualBridgeFee || bridgeQuote?.totalFee}
              isInProgress={isBridging && !isBridgeComplete}
              bridgeProvider={currentProvider || undefined}
              onNewTransaction={() => {
                resetStateOnSuccessfulTransaction();
                setSendState(SendTransactionStatus.DEFAULT);
              }}
              blockscanUrls={CHAIN_EXPLORERS}
            />
          </SendFormContainer>
          <TallySupportButton page="send" />
        </Wrapper>
      </Suspense>
    );
  }

  return (
    <Suspense>
      <Wrapper>
        <SendFormContainer>
          {/* {!isMobile ? (
            <TitleContainer>
              <ThemedText.HeadlineMedium>
                Send
              </ThemedText.HeadlineMedium>
            </TitleContainer>
          ) : (
            <TitleContainer>
              <ThemedText.HeadlineSmall>
                Send
              </ThemedText.HeadlineSmall>
            </TitleContainer>
          )} */}

          <MainContentWrapper>

            <InputWithTokenSelector
              label="You Send"
              name={`SendAmount`}
              value={sendAmountInput}
              onChange={(e) => handleSendAmountInputChange(e.currentTarget.value)}
              type="number"
              inputLabel={selectedToken?.ticker || ""}
              placeholder="0"
              accessoryLabel={tokenBalanceLabel}
              enableMax={true}
              maxButtonOnClick={() => {
                if (selectedTokenBalance && selectedToken) {
                  try {
                    const convertedValue = toTokenString(
                      BigInt(selectedTokenBalance.toString()), 
                      selectedToken.decimals
                    );
                    handleSendAmountInputChange(convertedValue);
                  } catch (error) {
                    // Error setting max amount
                  }
                }
              }}
              hasSelector={true}
              selectedToken={selectedTokenId}
              setSelectedToken={setSelectedTokenId}
              onlyShowCurrentNetwork={true}
              showBalance={true}
            />
            
            <Input
              label="To"
              name={`to`}
              value={recipientInputText()}
              onChange={(e) => {handleRecipientInputChange(e.currentTarget.value)}}
              onFocus={() => setIsRecipientInputFocused(true)}
              onBlur={() => setIsRecipientInputFocused(false)}
              type="string"
              placeholder={recipientPlaceholderLabel}
              valueFontSize="16px"
            />

            <InputWithTokenSelector
              label="You receive"
              name="destinationAmount"
              value={destinationAmount}
              onChange={() => {}}
              placeholder="0"
              type="number"
              readOnly={true}
              hasSelector={true}
              selectedToken={destinationTokenId}
              setSelectedToken={setDestinationTokenId}
              isPulsing={isLoadingQuote}
              accessoryLabel={''}  // Remove bridge fee display from token field
            />
            
            {bridgeQuoteError && isCrossChain && (
              <ErrorContainer>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {bridgeQuoteError}
              </ErrorContainer>
            )}
            
            {showBridgeInfo && bridgeQuote && (
              <BridgeInfoContainer>
                <BridgeInfoRow>
                  <BridgeInfoLabel>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12h18m-3-3l3 3-3 3"/>
                      <path d="M3 12l3-3m-3 3l3 3"/>
                    </svg>
                    Route
                  </BridgeInfoLabel>
                  <BridgeInfoValue>
                    {needsBridge && (
                      <ChainBreadcrumb
                        sourceToken={selectedToken}
                        destinationToken={destinationToken}
                        isActive={isBridging}
                        hasSourceTx={bridgeTransactionHashes ? 
                          bridgeTransactionHashes.some(tx => tx.chainId === selectedToken?.chainId) : false}
                        hasDestTx={bridgeTransactionHashes ? 
                          bridgeTransactionHashes.some(tx => tx.chainId === destinationToken?.chainId) : false}
                      />
                    )}
                  </BridgeInfoValue>
                </BridgeInfoRow>
                <BridgeInfoRow>
                  <BridgeInfoLabel>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Bridge Provider
                  </BridgeInfoLabel>
                  <BridgeInfoValue>
                    <BridgeProviderBadge>
                      {bridgeQuote.provider}
                    </BridgeProviderBadge>
                  </BridgeInfoValue>
                </BridgeInfoRow>
                <BridgeInfoRow>
                  <BridgeInfoLabel>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    Estimated Time
                  </BridgeInfoLabel>
                  <BridgeInfoValue>
                    <TimeEstimate>
                      {Math.ceil(bridgeQuote.estimatedTime / 60)} min
                    </TimeEstimate>
                  </BridgeInfoValue>
                </BridgeInfoRow>
                <BridgeInfoRow>
                  <BridgeInfoLabel>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Total Fee
                  </BridgeInfoLabel>
                  <BridgeInfoValue>
                    <FeeAmount>
                      ${bridgeQuote.totalFee}
                    </FeeAmount>
                  </BridgeInfoValue>
                </BridgeInfoRow>
              </BridgeInfoContainer>
            )}
            
            {/* Show bridge transaction status */}
            {bridgeTransactionHashes && bridgeTransactionHashes.length > 0 && (
              <BridgeInfoContainer>
                <BridgeInfoRow>
                  <BridgeInfoLabel>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6"/>
                      <path d="m21 12-6-6m-6 6-6-6"/>
                    </svg>
                    Bridge Status
                  </BridgeInfoLabel>
                  <BridgeInfoValue>
                    <BridgeStatusBadge $isComplete={isBridgeComplete}>
                      {isBridgeComplete ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                          Complete
                        </>
                      ) : (
                        <>
                          <div className="processing-spinner" />
                          Processing...
                        </>
                      )}
                    </BridgeStatusBadge>
                  </BridgeInfoValue>
                </BridgeInfoRow>
                {bridgeTransactionHashes.map((tx, index) => {
                  const chainName = tx.chainId === BASE_CHAIN_ID ? 'Base' : 
                                   tx.chainId === SOLANA_CHAIN_ID ? 'Solana' :
                                   tx.chainId === TRON_CHAIN_ID ? 'Tron' : 
                                   `Chain ${tx.chainId}`;
                  const isPending = tx.txHash.startsWith('pending-');
                  return (
                    <BridgeInfoRow key={index}>
                      <BridgeInfoLabel>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
                        </svg>
                        {chainName} TX
                      </BridgeInfoLabel>
                      <BridgeInfoValue>
                        <TransactionHash $isPending={isPending}>
                          {isPending ? (
                            <>
                              <div className="processing-spinner" />
                              Processing...
                            </>
                          ) : (
                            `${tx.txHash.substring(0, 8)}...${tx.txHash.substring(tx.txHash.length - 6)}`
                          )}
                        </TransactionHash>
                      </BridgeInfoValue>
                    </BridgeInfoRow>
                  );
                })}
              </BridgeInfoContainer>
            )}

            <ButtonContainer>
              {!isLoggedIn ? (
                <CustomConnectButton
                  fullWidth={true}
                />
              ) : (
                <Button
                  fullWidth={true}
                  disabled={ctaDisabled()}
                  onClick={async () => {
                    ctaOnClick();
                  }}>
                  <ButtonContentWrapper>
                    {ctaLoading() && <StyledSpinner size={20} />}
                    <span>{ctaText()}</span>
                  </ButtonContentWrapper>
                </Button>
               )}
            </ButtonContainer>

            {transactionHash?.length ? (
              <LinkContainer>
                <Link
                  disabled={!transactionHash}
                  href={`${blockscanUrl}/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer">
                    <ThemedText.LabelSmall textAlign="center">
                      View on Explorer ↗
                    </ThemedText.LabelSmall>
                </Link>
              </LinkContainer>
            ) : null}
          </MainContentWrapper>
        </SendFormContainer>

        <TallySupportButton
          page="send"
        />
      </Wrapper>
    </Suspense>
  );
};

const Wrapper = styled.div`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    margin: 0 auto;
    width: 98%;
  }
`;

const SendFormContainer = styled(AutoColumn)`
  padding: 1rem;
  gap: 1rem;
  background-color: ${colors.container};
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  justify-content: flex-start;
`;

const TitleContainer = styled.div`
  display: flex;
  margin: 0rem 0.75rem;
  justify-content: space-between;
  align-items: center;
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: center;
  border-radius: 4px;
  justify-content: center;
`;


const LinkContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  padding: 0 2.25rem;
`;

interface LinkProps {
  disabled?: boolean;
}

const Link = styled.a<LinkProps>`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;
  padding: 0.75rem 1rem 0.5rem 1rem;
  justify-content: center;
  align-items: center;
  flex: 1;

  &:hover {
    text-decoration: ${({ disabled }) => disabled ? 'none' : 'underline'};
  }

  ${({ disabled }) => 
    disabled && `
      color: gray;
      pointer-events: none;
      cursor: default;
  `}
`;

const ButtonContainer = styled.div`
  width: 100%;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  color: ${colors.warningYellow};
  font-size: 14px;
  margin-top: 8px;
  
  svg {
    flex-shrink: 0;
    color: ${colors.warningYellow};
  }
`;

const BridgeInfoContainer = styled.div`
  background: linear-gradient(135deg, ${colors.container} 0%, ${colors.backgroundSecondary} 100%);
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BridgeInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
`;

const BridgeInfoLabel = styled.span`
  color: ${colors.textSecondary};
  font-size: 13px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    opacity: 0.7;
  }
`;

const BridgeInfoValue = styled.span`
  color: ${colors.darkText};
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BridgeProviderBadge = styled.span`
  background: ${colors.textSecondary}20;
  color: ${colors.white};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
  
const TimeEstimate = styled.span`
  background: ${colors.validGreen}20;
  color: ${colors.validGreen};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 45px;
  text-align: center;
`;

const FeeAmount = styled.span`
  background: ${colors.backgroundSecondary};
  color: ${colors.textPrimary};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${colors.defaultBorderColor};
`;

const BridgeStatusBadge = styled.span<{ $isComplete: boolean }>`
  background: ${props => props.$isComplete ? `${colors.validGreen}20` : `${colors.warningYellow}20`};
  color: ${props => props.$isComplete ? colors.validGreen : colors.warningYellow};
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${props => props.$isComplete ? `${colors.validGreen}40` : `${colors.warningYellow}40`};
  
  .processing-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TransactionHash = styled.span<{ $isPending: boolean }>`
  background: ${props => props.$isPending ? `${colors.warningYellow}20` : `${colors.backgroundSecondary}`};
  color: ${props => props.$isPending ? colors.warningYellow : colors.textSecondary};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid ${props => props.$isPending ? `${colors.warningYellow}40` : colors.defaultBorderColor};
  
  .processing-spinner {
    width: 10px;
    height: 10px;
    border: 1.5px solid transparent;
    border-top: 1.5px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ButtonContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  /* No additional styles needed as Spinner handles its own styling */
`;

export default SendForm;