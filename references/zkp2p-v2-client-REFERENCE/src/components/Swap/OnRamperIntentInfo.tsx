import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { currencyInfo } from '@helpers/types/currency';
import { ParsedIntentData, parseIntentData } from '@helpers/intentHelper';

import useAccount from '@hooks/contexts/useAccount';
import useQuery from '@hooks/useQuery';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useOnRamperIntents from '@hooks/contexts/useOnRamperIntents';
import { AccessoryButton } from '@components/common/AccessoryButton';
import useMediaQuery from "@hooks/useMediaQuery";
import useCancelIntent from '@hooks/transactions/useCancelIntent';
import { ConfirmCancelIntent } from '@components/modals/ConfirmCancelIntent';
import { paymentPlatformInfo } from '@helpers/types/paymentPlatform';
import { PaymentPlatformType } from '@helpers/types/paymentPlatform';
import useQuoteStorage, { QuoteData } from '@hooks/useQuoteStorage';
import useTokenData from '@hooks/contexts/useTokenData';
import { usdcInfo } from '@helpers/types/tokens';

interface OnRamperIntentInfoProps {
  onCompleteOrderClick: () => void;
  onCancelIntent: () => void;
}

export const OnRamperIntentInfo: React.FC<OnRamperIntentInfoProps> = ({ 
  onCompleteOrderClick, 
  onCancelIntent 
}) => {

  /*
   * Contexts
   */

  const isMobile = useMediaQuery() === 'mobile';
  const { loggedInEthereumAddress } = useAccount();
  const { currentIntentView, refetchIntentView } = useOnRamperIntents();
  const { addressToPlatform } = useSmartContracts();
  const { queryParams } = useQuery();
  const { tokenInfo, isLoading: isTokenDataLoading, refetchToken } = useTokenData();
  const { getQuoteData, clearQuoteData, saveQuoteData } = useQuoteStorage();

  /*
   * State
   */

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [storedQuoteData, setStoredQuoteData] = useState<QuoteData | null>(null);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntentData | null>(null);

  const [inputCurrency, setInputCurrency] = useState<string>('');
  const [outputToken, setOutputToken] = useState<string>('');
  const [tokenLogo, setTokenLogo] = useState<string>('');
  const [outputTokenId, setOutputTokenId] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);

  /*
   * Hooks
   */

  // Load stored quote data from localStorage and fetch token info if needed
  useEffect(() => {
    const fetchData = async () => {
      if (!loggedInEthereumAddress) return;
      
      // If we have intent data, validate it belongs to this user first
      if (currentIntentView) {
        // Security check: ensure intent belongs to logged-in user
        if (currentIntentView.intent.owner.toLowerCase() !== loggedInEthereumAddress.toLowerCase()) {
          console.error('Intent does not belong to logged-in user');
          return;
        }
        
        const parsed = parseIntentData(currentIntentView, addressToPlatform);
        
        setParsedIntent(parsed);
        
        // Get quote data using the logged-in address
        let quoteData = getQuoteData(loggedInEthereumAddress);
        
        // If no quote data exists for this address, create from intent
        if (!quoteData) {
          const initialQuoteData: QuoteData = {
            intentHash: currentIntentView.intentHash,
            usdcAmount: parsed.amountTokenToReceive,
            fiatAmount: parsed.amountFiatToSend,
            fiatCurrency: parsed.sendCurrency,
            token: usdcInfo.tokenId,
            recipientAddress: parsed.recipientAddress,
            paymentPlatform: parsed.paymentPlatform,
          };
          
          saveQuoteData(loggedInEthereumAddress, currentIntentView.intentHash, initialQuoteData);
          setStoredQuoteData(initialQuoteData);
          quoteData = initialQuoteData;
        } else {
          // Validate that the stored quote data matches the current intent
          if (quoteData.intentHash && quoteData.intentHash !== currentIntentView.intentHash) {
            console.warn(
              `Stored quote data mismatch: stored intentHash="${quoteData.intentHash}" does not match current intentHash="${currentIntentView.intentHash}". Creating new quote data.`
            );
            const initialQuoteData: QuoteData = {
              intentHash: currentIntentView.intentHash,
              usdcAmount: parsed.amountTokenToReceive,
              fiatAmount: parsed.amountFiatToSend,
              fiatCurrency: parsed.sendCurrency,
              token: usdcInfo.tokenId,
              recipientAddress: parsed.recipientAddress,
              paymentPlatform: parsed.paymentPlatform,
            };
            saveQuoteData(loggedInEthereumAddress, currentIntentView.intentHash, initialQuoteData);
            setStoredQuoteData(initialQuoteData);
            quoteData = initialQuoteData;
          } else {
            setStoredQuoteData(quoteData);
          }
        }
        
        const currency = quoteData.fiatCurrency || parsed.sendCurrency;
        setInputCurrency(currency);
        
        const tokenId = quoteData.token || parsed.receiveToken;
        setOutputTokenId(tokenId);
        
        // Check if we already have the token info
        if (tokenId && !tokenInfo[tokenId]) {
          setIsLoadingToken(true);
          try {
            // Use refetchToken to get token data for this specific token
            const tokenData = await refetchToken(tokenId);
            if (tokenData) {
              setOutputToken(tokenData.ticker);
              setTokenLogo(tokenData.icon);
            }
          } catch (error) {
            console.error("Error fetching token data:", error);
          } finally {
            setIsLoadingToken(false);
          }
        } else if (tokenId && tokenInfo[tokenId]) {
          setOutputToken(tokenInfo[tokenId].ticker);
          setTokenLogo(tokenInfo[tokenId].icon);
        }
      } else {
        // No intent loaded yet, try to get quote data
        const quoteData = getQuoteData(loggedInEthereumAddress);
        if (quoteData) {
          setStoredQuoteData(quoteData);
          
          const currency = quoteData.fiatCurrency;
          setInputCurrency(currency);
          
          const tokenId = quoteData.token;
          setOutputTokenId(tokenId);
          
          if (tokenId && tokenInfo[tokenId]) {
            setOutputToken(tokenInfo[tokenId].ticker);
            setTokenLogo(tokenInfo[tokenId].icon);
          }
        }
      }
    };
    
    fetchData();
  }, [loggedInEthereumAddress, currentIntentView, addressToPlatform, getQuoteData, saveQuoteData, tokenInfo, refetchToken]);

  const onCancelIntentSuccess = useCallback(() => {
    // First clear the quote data from localStorage
    if (loggedInEthereumAddress) {
      clearQuoteData(loggedInEthereumAddress);
    }

    // Then refetch the intent view
    refetchIntentView?.();
    onCancelIntent();
  }, [refetchIntentView, onCancelIntent, loggedInEthereumAddress, clearQuoteData]);

  const {
    writeCancelIntentAsync,
    setIntentHashInput,
    shouldConfigureCancelIntentWrite,
    setShouldConfigureCancelIntentWrite,
    signCancelIntentTransactionStatus,
    mineCancelIntentTransactionStatus,
  } = useCancelIntent(onCancelIntentSuccess);

  /*
   * Effects
   */

  useEffect(() => {
    if (currentIntentView) {
      setIntentHashInput(currentIntentView.intentHash);
    }
  }, [currentIntentView, setIntentHashInput]);

  useEffect(() => {
    const executeCancelIntent = async () => {
      const statusForExecution = signCancelIntentTransactionStatus === 'idle' || signCancelIntentTransactionStatus === 'error';

      if (shouldConfigureCancelIntentWrite && writeCancelIntentAsync && statusForExecution) {
        try {
          await writeCancelIntentAsync();
        } catch (error) {
          console.error('writeCancelIntentAsync failed: ', error);
          setShouldConfigureCancelIntentWrite(false);
        }
      }
    };

    executeCancelIntent();
  }, [
    shouldConfigureCancelIntentWrite,
    writeCancelIntentAsync,
    signCancelIntentTransactionStatus,
    mineCancelIntentTransactionStatus,
    setShouldConfigureCancelIntentWrite,
  ]);

  /*
   * Handlers
   */

  const handleShowCancelModalClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowCancelModal(true);
  };

  const handleCancelClick = () => {
    setShouldConfigureCancelIntentWrite(true);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
  };

  /*
   * Helpers
   */

  const getSendCurrencyLabel = () => {
    if (!parsedIntent) return '';
    const currencySymbol = currencyInfo[parsedIntent.sendCurrency].currencySymbol;
    const paymentPlatformName = paymentPlatformInfo[parsedIntent.paymentPlatform as PaymentPlatformType]?.platformName || 'Unknown Platform';
    return `${currencySymbol}${parsedIntent.amountFiatToSend} on ${paymentPlatformName}`;
  };

  const getReceiveTokenLabel = () => {
    if (!parsedIntent) return '';

    const getChainName = (token: string) => {
      return tokenInfo[token]?.chainName || 'Unknown Chain';
    };

    // Use stored data if available
    if (storedQuoteData?.token && storedQuoteData?.tokenAmount && tokenInfo[storedQuoteData.token]) {
      const chainName = getChainName(storedQuoteData.token);
      const tokenTicker = tokenInfo[storedQuoteData.token].ticker;
      return `~${storedQuoteData.tokenAmount} ${tokenTicker} on ${chainName}`;
    }
    
    // Fall back to intent data
    if (parsedIntent.receiveToken && tokenInfo[parsedIntent.receiveToken]) {
      const chainName = getChainName(parsedIntent.receiveToken);
      const tokenTicker = tokenInfo[parsedIntent.receiveToken].ticker;
      return `${parsedIntent.amountTokenToReceive} ${tokenTicker} on ${chainName}`;
    }
    
    return 'Unknown token amount';
  };

  /*
   * Render
   */

  // If token data is still loading, show a loading state
  if (isTokenDataLoading || isLoadingToken || !tokenInfo) {
    return (
      <Container>
        <TitleContainer>
          <ThemedText.BodySecondary>
            Loading active transaction details...
          </ThemedText.BodySecondary>
        </TitleContainer>
      </Container>
    );
  }
    
  return (
    <Container onClick={onCompleteOrderClick}>
      <TitleContainer>
        <ThemedText.BodySecondary>
          Active transaction
        </ThemedText.BodySecondary>
        <AccessoryButton
          onClick={handleShowCancelModalClick}
          height={36}
          loading={signCancelIntentTransactionStatus === 'loading' || mineCancelIntentTransactionStatus === 'loading'}
          title={'Cancel'}
          icon={isMobile ? undefined : 'trash'}
        />
      </TitleContainer>

      <TransactionCardAndTrashContainer>
        <LogoContainer>
          <IconStack>
            <FlagIcon className={`fi fi-${currencyInfo[inputCurrency]?.countryCode || ''}`} />
            <TokenIcon src={tokenLogo} />
            <ChainIconWrapper>
              <ChainIcon src={tokenInfo[outputTokenId]?.chainIcon} />
            </ChainIconWrapper>
          </IconStack>
        </LogoContainer>

        <TransactionCard>
          <TokenSection>
            <TokenSymbol>{inputCurrency}</TokenSymbol>
            <ArrowIcon>→</ArrowIcon>
            <TokenSymbol>{outputToken}</TokenSymbol>
          </TokenSection>

          <ThemedText.BodySecondary style={{ color: colors.lightGrayText }} fontSize="14px">
            {getSendCurrencyLabel()} → {getReceiveTokenLabel()}
          </ThemedText.BodySecondary>
        </TransactionCard>

        <ButtonsContainer>
          {/* Commented out as these are duplicates */}
        </ButtonsContainer>

      </TransactionCardAndTrashContainer>

      {showCancelModal && (
        <ConfirmCancelIntent
          onBackClick={handleCancelModalClose}
          onCancelClick={handleCancelClick}
          signCancelIntentTransactionStatus={signCancelIntentTransactionStatus}
          mineCancelIntentTransactionStatus={mineCancelIntentTransactionStatus}
          intentHash={currentIntentView?.intentHash || ''}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 16px;
  background-color: ${colors.container};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid ${colors.buttonDefault};
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.selectorHover}
  }
`;

const TransactionCard = styled.div`
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TokenSymbol = styled(ThemedText.BodyPrimary)`
  font-weight: 500;
`;

const ArrowIcon = styled.span`
  font-size: 16px;
  color: ${colors.darkText};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const IconStack = styled.div`
  position: relative;
  width: 58px;
  height: 24px;
`;

const FlagIcon = styled.span`
  position: absolute;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-block;
  background-size: 150%;
  background-position: center;
  z-index: 1;
`;

const TokenIcon = styled.img`
  position: absolute;
  left: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  z-index: 2;
`;

const ChainIconWrapper = styled.div`
  position: absolute;
  bottom: -12px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1E2230;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1E2230;
  z-index: 3;
`;

const ChainIcon = styled.img`
  width: 10px;
  height: 10px;
  border-radius: 10%;
`;

const TransactionCardAndTrashContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  justify-content: flex-start;
  align-items: flex-start;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;