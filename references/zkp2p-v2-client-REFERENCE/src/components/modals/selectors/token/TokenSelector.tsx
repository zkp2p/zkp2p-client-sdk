import React, { useReducer, useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, Search, HelpCircle } from 'react-feather';
import Link from '@mui/material/Link';
import { Skeleton } from '@components/common/Skeleton';

import { Overlay } from '@components/modals/Overlay';
import { UnverifiedTokenModal } from '@components/modals/UnverifiedTokenModal';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { ZKP2P_TG_LINK } from '@helpers/docUrls';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text'
import { Z_INDEX } from '@theme/zIndex';
import useMediaQuery from '@hooks/useMediaQuery';
import useTokenData from '@hooks/contexts/useTokenData';
import useBalances from '@hooks/contexts/useBalance';
import { tokenUnitsToReadableWithMaxDecimals } from '@helpers/units';
import { BASE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '@helpers/constants';

// Add SkeletonTokenRow component at the top level
const SkeletonTokenRow: React.FC = () => {
  return (
    <TokenRowContainer selected={false}>
      <TokenRowLeft>
        <TokenRowIcon>
          <Skeleton width="32px" height="32px" borderRadius="16px" />
        </TokenRowIcon>
        <Skeleton width="60px" height="20px" />
      </TokenRowLeft>
      <TokenRowRight style={{ gap: '4px' }}>
        <Skeleton width="80px" height="12px" />
        <Skeleton width="100px" height="12px" />
      </TokenRowRight>
    </TokenRowContainer>
  );
};

// Add TokenIcon component near the top
const TokenIcon: React.FC<{ 
  src?: string; 
  size?: number;
  style?: React.CSSProperties;
}> = ({ src, size = 24, style }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <StyledHelpCircle 
      size={size} 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        padding: size < 16 ? '2px' : '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }} 
    />;
  }

  return <img 
    src={src} 
    alt="token" 
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      borderRadius: '50%',
      ...style
    }}
    onError={() => setHasError(true)}
  />;
};

// Add a specialized ChainIcon component for chain logos
const ChainIcon: React.FC<{
  src?: string;
  size?: number;
  marginRight?: string;
}> = ({ src, size = 20, marginRight = '12px' }) => {
  return (
    <TokenIcon 
      src={src} 
      size={size}
      style={{ marginRight, borderRadius: '50%' }}
    />
  );
};

const StyledHelpCircle = styled(HelpCircle)`
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface TokenSelectorProps {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  onlyShowCurrentNetwork?: boolean;
  onlyShowDepositAllowedTokens?: boolean;
  stopSelection?: boolean;
  showBalance?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  setSelectedToken,
  onlyShowCurrentNetwork = false,
  onlyShowDepositAllowedTokens = false,
  stopSelection = false,
  showBalance = false,
}) => {
  // Get current environment
  const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;

  /*
   * Contexts
   */
  const { 
    tokenInfo, 
    tokens, 
    isLoading, 
    fetchTokensForChain, 
    searchTokensByTerm, 
    searchTokensByAddress,
    // Get the chain mapping functions from context
    getChainName,
    getChainIcon,
    getChainIdFromName,
    getChainIconFromName,
    getAllSupportedChains
  } = useTokenData();

  // Balance context for showing token balances
  const { 
    tokenBalances, 
    isTokenBalanceLoading 
  } = useBalances();

  /*
   * State
   */
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const [selectedChain, setSelectedChain] = useState<string>(BASE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia' : 'Base')
  const [chainSearchQuery, setChainSearchQuery] = useState<string>('')
  const [tokenSearchQuery, setTokenSearchQuery] = useState<string>('')
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)
  
  // New state for unverified token warning
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false)
  const [pendingTokenSelection, setPendingTokenSelection] = useState<string | null>(null)
  
  const currentDevice = useMediaQuery();
  const isMobile = currentDevice === 'mobile';

  /*
   * Effects
   */
  useEffect(() => {
    // Only set the initial chain if we don't have one already selected
    // This prevents resetting the chain during loading
    if (tokenInfo && selectedToken && tokenInfo[selectedToken]?.chainName && !selectedChain) {
      setSelectedChain(tokenInfo[selectedToken].chainName);
    }
  }, [selectedToken, tokenInfo, selectedChain]);

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)
  
  const chainDropdownRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(chainDropdownRef, isChainDropdownOpen ? () => setIsChainDropdownOpen(false) : undefined)

  // Only filter tokens if tokenInfo has data
  const filteredTokens = tokens.filter((token: string) => {
    if (!tokenInfo[token]) return false;
    if (onlyShowCurrentNetwork && !tokenInfo[token].isBase) return false;
    if (onlyShowDepositAllowedTokens && !tokenInfo[token].depositAllowed) return false;
    if (selectedChain && tokenInfo[token].chainName !== selectedChain) return false;
    return true;
  });

  // Get all supported chains using the function from TokenDataContext
  const allSupportedChains = getAllSupportedChains();
  
  // Filter out Base Sepolia if not in STAGING_TESTNET environment
  const environmentFilteredChains = env === 'STAGING_TESTNET' 
    ? allSupportedChains 
    : allSupportedChains.filter(chain => chain !== 'Base Sepolia');
  
  // When onlyShowCurrentNetwork is true, only show the current network
  const availableChains = onlyShowCurrentNetwork && selectedToken && tokenInfo[selectedToken]
    ? [tokenInfo[selectedToken].chainName]
    : environmentFilteredChains;

  // Separate chains into popular and A-Z categories
  const popularChainNames = ["Base", "Ethereum", "Solana", "Hyperliquid"];
  const popularChains = availableChains.filter(chain => popularChainNames.includes(chain));
  const sortedChains = [...availableChains].sort((a, b) => a.localeCompare(b));
  
  // Filter chains based on search query
  const filterChains = (chains: string[]) => {
    if (!chainSearchQuery) return chains;
    const query = chainSearchQuery.toLowerCase();
    return chains.filter(chain => chain.toLowerCase().includes(query));
  };
  
  const filteredPopularChains = filterChains(popularChains);
  const filteredSortedChains = filterChains(sortedChains);

  const handleOverlayClick = () => {
    toggleOpen();
    setIsChainDropdownOpen(false);
  };

  const handleSelectToken = (token: string) => {
    if (setSelectedToken && !stopSelection) {
      // If the token is not verified, show the warning modal
      if (tokenInfo[token] && !tokenInfo[token].verified) {
        setPendingTokenSelection(token);
        setShowUnverifiedWarning(true);
      } else {
        // If the token is verified, select it directly
        setSelectedToken(token);
        toggleOpen();
      }
    }
  };
  
  const handleChainSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainSearchQuery(e.target.value);
  };
  
  const handleChainSelect = async (chain: string) => {
    // Set the chain immediately to provide instant feedback
    setSelectedChain(chain);
    setIsChainDropdownOpen(false);
    // Clear token search when changing chains
    setTokenSearchQuery('');
    
    // Get the chainId for this chain using the function from TokenDataContext
    const chainId = getChainIdFromName(chain);
    
    if (chainId) {
      try {
        // Fetch tokens for this chain if they haven't been loaded yet
        // We use the await here to ensure errors are caught properly
        await fetchTokensForChain(chainId);
      } catch (error) {
        console.error(`Error loading tokens for chain ${chain}:`, error);
        // We still keep the selected chain even if token loading fails
      }
    }
  };

  // Get chain logo for the selected chain using the function from TokenDataContext
  const currentChainLogo = selectedChain ? getChainIconFromName(selectedChain) : undefined;

  // Add a handler for token search
  const handleTokenSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTokenSearchQuery(query);
    
    // Only search if query is at least 2 characters
    if (query.length < 2) return;
    
    // Get the chainId for the selected chain if available
    const selectedChainId = selectedChain ? getChainIdFromName(selectedChain) : undefined;
    
    // Check if it looks like an address (starts with 0x for EVM chains)
    if (query.startsWith('0x') && query.length >= 10) {
      await searchTokensByAddress(query, selectedChainId);
    } 
    // Otherwise search by term
    else if (query.length >= 2) {
      await searchTokensByTerm(query, selectedChainId);
    }
  };

  // Helper function to render balance or address based on showBalance prop
  const renderTokenRightContent = (token: string) => {
    if (showBalance) {
      const isLoading = isTokenBalanceLoading[token];
      const balance = tokenBalances[token];
      
      if (isLoading) {
        return (
          <TokenRowRight>
            <TokenRowName>Loading...</TokenRowName>
          </TokenRowRight>
        );
      }
      
      if (balance && tokenInfo[token]) {
        const formattedBalance = tokenUnitsToReadableWithMaxDecimals(
          balance, 
          tokenInfo[token].decimals,
          2
        );
        
        if (formattedBalance === '0') {
          return (
            <TokenRowRight>
            </TokenRowRight>
          );
        }

        return (
          <TokenRowRight>
            <TokenRowName>{formattedBalance} {tokenInfo[token].ticker}</TokenRowName>
          </TokenRowRight>
        );
      }
      
      return (
        <TokenRowRight>
        </TokenRowRight>
      );
    }
    
    // Default: show token name and address
    return (
      <TokenRowRight>
        <TokenRowName>{tokenInfo[token].name}</TokenRowName>
        <TokenRowAddress>{tokenInfo[token].address.substring(0, 4)}...{tokenInfo[token].address.substring(tokenInfo[token].address.length - 4)}</TokenRowAddress>
      </TokenRowRight>
    );
  };

  // Add a new sorting function to sort tokens by balance
  const sortTokensByBalance = (tokens: string[]) => {
    if (!showBalance) return tokens;

    return [...tokens].sort((tokenA, tokenB) => {
      const balanceA = tokenBalances[tokenA] || null;
      const balanceB = tokenBalances[tokenB] || null;
      
      // If both balances are null or zero, maintain original order
      if ((!balanceA || balanceA === 0n) && (!balanceB || balanceB === 0n)) {
        return 0;
      }
      
      // If only balanceA is null or zero, balanceB should come first
      if (!balanceA || balanceA === 0n) {
        return 1;
      }
      
      // If only balanceB is null or zero, balanceA should come first
      if (!balanceB || balanceB === 0n) {
        return -1;
      }
      
      // If both have balances, compare them (higher balances first)
      try {
        // Compare bigints directly
        return balanceB > balanceA ? 1 : -1;
      } catch (e) {
        return 0;
      }
    });
  };

  // New handlers for the unverified token modal
  const handleCancelUnverifiedToken = () => {
    setShowUnverifiedWarning(false);
    setPendingTokenSelection(null);
  };
  
  const handleConfirmUnverifiedToken = () => {
    if (pendingTokenSelection && setSelectedToken) {
      setSelectedToken(pendingTokenSelection);
      setShowUnverifiedWarning(false);
      toggleOpen();
    }
  };

  // Show loading state if data is not ready
  if (isLoading || !tokenInfo || !tokenInfo[selectedToken]) {
    return (
      <Wrapper ref={ref}>
        <TokenNameAndChevronContainer onClick={stopSelection ? undefined : toggleOpen}>
          {selectedToken && tokenInfo && tokenInfo[selectedToken] ? (
            <>
              <TokenIconContainer>
                <TokenIcon src={tokenInfo[selectedToken].icon} size={24} />
                <ChainIconWrapper>
                  <TokenIcon src={tokenInfo[selectedToken].chainIcon} size={10} />
                </ChainIconWrapper>
              </TokenIconContainer>
              <TokenLabel>
                {tokenInfo[selectedToken].ticker}
              </TokenLabel>
            </>
          ) : (
            <>
              <TokenIconContainer>
                <TokenIcon />
              </TokenIconContainer>
              <TokenLabel>Select</TokenLabel>
            </>
          )}
          <StyledChevronDown/>
        </TokenNameAndChevronContainer>

        {isOpen && (
          <ModalAndOverlayContainer>
            <Overlay onClick={handleOverlayClick}/>

            <ModalContainer $isMobile={isMobile}>
              <TableHeader>
                <ThemedText.SubHeader style={{ textAlign: 'left' }}>
                  Select Token
                </ThemedText.SubHeader>

                <button
                  onClick={handleOverlayClick}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <StyledX/>
                </button>
              </TableHeader>

              <HorizontalDivider/>
              
              {/* Mobile Chain Dropdown */}
              {isMobile && (
                <div ref={chainDropdownRef} style={{ position: 'relative', width: '100%', zIndex: 50 }}>
                  <ChainDropdownSelector 
                    onClick={() => {
                      setIsChainDropdownOpen(prev => !prev);
                    }}
                  >
                    <ChainDropdownLeft>
                      {currentChainLogo && <ChainIcon src={currentChainLogo} />}
                      <span>{selectedChain}</span>
                    </ChainDropdownLeft>
                    <ChevronDown size={20} color="white" style={{ transform: isChainDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </ChainDropdownSelector>
                  
                  {isChainDropdownOpen && (
                    <ChainDropdownMenu>
                      <SearchChainContainer>
                        <SearchIcon size={16} />
                        <SearchInput 
                          placeholder="Search chains"
                          value={chainSearchQuery}
                          onChange={handleChainSearch}
                          smaller
                          onClick={(e) => e.stopPropagation()}
                        />
                      </SearchChainContainer>
                      
                      {/* Chain Lists - Always show chains even during token loading */}
                      <ChainListContent>
                        {(filteredPopularChains.length > 0 || chainSearchQuery === '') && (
                          <>
                            <ChainGroupLabel>Popular Chains</ChainGroupLabel>
                            
                            {filteredPopularChains.map((chain) => {
                              const chainIcon = getChainIconFromName(chain);
                              
                              return (
                                <ChainItem
                                  key={chain}
                                  selected={selectedChain === chain}
                                  onClick={() => handleChainSelect(chain)}
                                >
                                  {chainIcon && <ChainIcon src={chainIcon} />}
                                  {chain}
                                </ChainItem>
                              );
                            })}
                          </>
                        )}
                        
                        {(filteredSortedChains.length > 0 || chainSearchQuery === '') && (
                          <>
                            <ChainGroupLabel>Chains A-Z</ChainGroupLabel>
                            
                            {filteredSortedChains.map((chain) => {
                              const chainIcon = getChainIconFromName(chain);
                              
                              return (
                                <ChainItem
                                  key={chain}
                                  selected={selectedChain === chain}
                                  onClick={() => handleChainSelect(chain)}
                                >
                                  {chainIcon && <ChainIcon src={chainIcon} />}
                                  {chain}
                                </ChainItem>
                              );
                            })}
                          </>
                        )}
                        
                        {filteredSortedChains.length === 0 && chainSearchQuery !== '' && (
                          <NoResultsMessage>No chains found</NoResultsMessage>
                        )}
                      </ChainListContent>
                    </ChainDropdownMenu>
                  )}
                </div>
              )}
              
              {/* Desktop Two-column layout */}
              {!isMobile ? (
                <ContentContainer>
                  {/* Left column - Chain selector */}
                  <ChainSelectorColumn>
                    <SearchChainContainer>
                      <SearchIcon size={16} />
                      <SearchInput 
                        placeholder="Search chains"
                        value={chainSearchQuery}
                        onChange={handleChainSearch}
                        smaller
                      />
                    </SearchChainContainer>
                    
                    <ChainsListContainer>
                      {(filteredPopularChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Popular Chains</ChainGroupLabel>
                          
                          {filteredPopularChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                      
                      {(filteredSortedChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Chains A-Z</ChainGroupLabel>
                          
                          {filteredSortedChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                      
                      {filteredSortedChains.length === 0 && chainSearchQuery !== '' && (
                        <NoResultsMessage>No chains found</NoResultsMessage>
                      )}
                    </ChainsListContainer>
                  </ChainSelectorColumn>
                  
                  {/* Right column - Token list */}
                  <TokenListColumn>
                    {/* Token search bar */}
                    <SearchContainer>
                      <SearchIcon size={18} />
                      <SearchInput 
                        placeholder="Search for a token or paste address"
                        value={tokenSearchQuery}
                        onChange={handleTokenSearch}
                      />
                      {isLoading && <LoadingSpinner style={{ marginLeft: '8px', width: '16px', height: '16px' }} />}
                    </SearchContainer>
                    
                    <TokenListScrollableContent>
                    {isLoading ? (
                      <>
                        <SectionHeader>Loading Tokens</SectionHeader>
                        <TokensListContainer>
                          {[...Array(8)].map((_, index) => (
                            <SkeletonTokenRow key={index} />
                          ))}
                        </TokensListContainer>
                      </>
                    ) : (
                      <>
                        {/* Popular tokens grid - only show when no search query */}
                        {!tokenSearchQuery && (
                          <PopularTokensGrid>
                            {(() => {
                              // First try to find the exact tickers we want
                              const preferredTickers = ["ETH", "USDC", "USDT", "WETH", "DEGEN"];
                              const popularTokens = filteredTokens.filter(token => 
                                tokenInfo[token] && preferredTickers.includes(tokenInfo[token].ticker)
                              );
                              
                              // If we don't have enough tokens from preferred list, add more from the filtered tokens
                              const tokensToShow = popularTokens.length >= 6 
                                ? popularTokens.slice(0, 5) 
                                : [...popularTokens, ...filteredTokens.filter(t => !popularTokens.includes(t))].slice(0, 5);
                              
                              return tokensToShow.map(token => (
                                <TokenGridItem 
                                  key={token} 
                                  onClick={() => handleSelectToken(token)}
                                >
                                  <TokenGridIconContainer>
                                    <TokenGridLogoImg as={TokenIcon} src={tokenInfo[token].icon} size={24} />
                                    <ChainIconBadge>
                                      <TokenIcon src={tokenInfo[token].chainIcon} size={10} />
                                    </ChainIconBadge>
                                  </TokenGridIconContainer>
                                  <TokenGridTicker>{tokenInfo[token].ticker}</TokenGridTicker>
                                </TokenGridItem>
                              ));
                            })()}
                          </PopularTokensGrid>
                        )}
                        
                        {/* Volume section header */}
                        <SectionHeader>
                          {tokenSearchQuery ? 
                            (filteredTokens.filter(token => 
                              tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                              tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                              tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                            ).length > 0 ? "Results" : "") 
                            : "Tokens"}
                        </SectionHeader>
                        
                        {/* All tokens list */}
                        <TokensListContainer>
                          {filteredTokens
                            .filter(token => 
                              tokenSearchQuery === '' || 
                              tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                              tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                              tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                            )
                            // Apply balance sorting here
                            .sort((tokenA, tokenB) => {
                              if (!showBalance) return 0;
                              
                              const balanceA = tokenBalances[tokenA] || null;
                              const balanceB = tokenBalances[tokenB] || null;
                              
                              // If both balances are null or zero, maintain original order
                              if ((!balanceA || balanceA === 0n) && (!balanceB || balanceB === 0n)) {
                                return 0;
                              }
                              
                              // If only balanceA is null or zero, balanceB should come first
                              if (!balanceA || balanceA === 0n) {
                                return 1;
                              }
                              
                              // If only balanceB is null or zero, balanceA should come first
                              if (!balanceB || balanceB === 0n) {
                                return -1;
                              }
                              
                              // If both have balances, compare them (higher balances first)
                              try {
                                return balanceB > balanceA ? 1 : -1;
                              } catch (e) {
                                return 0;
                              }
                            })
                            .map((token) => (
                            <TokenRowContainer
                              key={token}
                              selected={token === selectedToken}
                              onClick={() => handleSelectToken(token)}
                            >
                              <TokenRowLeft>
                                <TokenRowIcon>
                                  <TokenIcon src={tokenInfo[token].icon} size={32} />
                                  <ChainIconWrapper>
                                    <TokenIcon src={tokenInfo[token].chainIcon} size={12} />
                                  </ChainIconWrapper>
                                </TokenRowIcon>
                                <TokenRowTicker>{tokenInfo[token].ticker}</TokenRowTicker>
                              </TokenRowLeft>
                              {renderTokenRightContent(token)}
                            </TokenRowContainer>
                          ))}
                          
                          {tokenSearchQuery && filteredTokens.filter(token => 
                            tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <NoResultsMessage>No tokens found</NoResultsMessage>
                          )}
                        </TokensListContainer>
                      </>
                    )}
                    </TokenListScrollableContent>
                  </TokenListColumn>
                </ContentContainer>
              ) : (
                /* Mobile Token List View */
                <MobileContentContainer>
                  {/* Token search bar for mobile */}
                  <SearchContainer>
                    <SearchIcon size={18} />
                    <SearchInput 
                      placeholder="Search for a token or paste address"
                      value={tokenSearchQuery}
                      onChange={handleTokenSearch}
                    />
                    {isLoading && <LoadingSpinner style={{ marginLeft: '8px', width: '16px', height: '16px' }} />}
                  </SearchContainer>
                  
                  <MobileScrollableContent>
                  {isLoading ? (
                    <>
                      <SectionHeader>Loading Tokens</SectionHeader>
                      <TokensListContainer>
                        {[...Array(8)].map((_, index) => (
                          <SkeletonTokenRow key={index} />
                        ))}
                      </TokensListContainer>
                    </>
                  ) : (
                    <>
                      {/* Popular tokens grid for mobile - only show when no search query */}
                      {!tokenSearchQuery && (
                        <PopularTokensGrid>
                          {(() => {
                            // First try to find the exact tickers we want
                            const preferredTickers = ["ETH", "USDC", "USDT", "WETH", "DEGEN"];
                            const popularTokens = filteredTokens.filter(token => 
                              tokenInfo[token] && preferredTickers.includes(tokenInfo[token].ticker)
                            );
                            
                            // If we don't have enough tokens from preferred list, add more from the filtered tokens
                            const tokensToShow = popularTokens.length >= 6 
                              ? popularTokens.slice(0, 5) 
                              : [...popularTokens, ...filteredTokens.filter(t => !popularTokens.includes(t))].slice(0, 5);
                            
                            return tokensToShow.map(token => (
                              <TokenGridItem 
                                key={token} 
                                onClick={() => handleSelectToken(token)}
                              >
                                <TokenGridIconContainer>
                                  <TokenGridLogoImg as={TokenIcon} src={tokenInfo[token].icon} size={24} />
                                  <ChainIconBadge>
                                    <TokenIcon src={tokenInfo[token].chainIcon} size={10} />
                                  </ChainIconBadge>
                                </TokenGridIconContainer>
                                <TokenGridTicker>{tokenInfo[token].ticker}</TokenGridTicker>
                              </TokenGridItem>
                            ));
                          })()}
                        </PopularTokensGrid>
                      )}
                      
                      {/* Volume section header for mobile */}
                      <SectionHeader>
                        {tokenSearchQuery ? 
                          (filteredTokens.filter(token => 
                            tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                          ).length > 0 ? "Results" : "") 
                          : "Tokens"}
                      </SectionHeader>
                      
                      {/* All tokens list - filtered by search */}
                      <TokensListContainer>
                        {filteredTokens
                          .filter(token => 
                            tokenSearchQuery === '' || 
                            tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                          )
                          // Apply balance sorting here
                          .sort((tokenA, tokenB) => {
                            if (!showBalance) return 0;
                            
                            const balanceA = tokenBalances[tokenA] || null;
                            const balanceB = tokenBalances[tokenB] || null;
                            
                            // If both balances are null or zero, maintain original order
                            if ((!balanceA || balanceA === 0n) && (!balanceB || balanceB === 0n)) {
                              return 0;
                            }
                            
                            // If only balanceA is null or zero, balanceB should come first
                            if (!balanceA || balanceA === 0n) {
                              return 1;
                            }
                            
                            // If only balanceB is null or zero, balanceA should come first
                            if (!balanceB || balanceB === 0n) {
                              return -1;
                            }
                            
                            // If both have balances, compare them (higher balances first)
                            try {
                              return balanceB > balanceA ? 1 : -1;
                            } catch (e) {
                              return 0;
                            }
                          })
                          .map((token) => (
                          <TokenRowContainer
                            key={token}
                            selected={token === selectedToken}
                            onClick={() => handleSelectToken(token)}
                          >
                            <TokenRowLeft>
                              <TokenRowIcon>
                                <TokenIcon src={tokenInfo[token].icon} size={32} />
                                <ChainIconWrapper>
                                  <TokenIcon src={tokenInfo[token].chainIcon} size={12} />
                                </ChainIconWrapper>
                              </TokenRowIcon>
                              <TokenRowTicker>{tokenInfo[token].ticker}</TokenRowTicker>
                            </TokenRowLeft>
                            {renderTokenRightContent(token)}
                          </TokenRowContainer>
                        ))}
                        
                        {tokenSearchQuery && filteredTokens.filter(token => 
                          tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <NoResultsMessage>No tokens found</NoResultsMessage>
                        )}
                      </TokensListContainer>
                    </>
                  )}
                  </MobileScrollableContent>
                </MobileContentContainer>
              )}

              <HorizontalDivider/>

              <TableFooter>
                Missing a chain or token? <Link href={ZKP2P_TG_LINK} target='_blank'>
                  Let us know ↗
                </Link>
              </TableFooter>
            </ModalContainer>
          </ModalAndOverlayContainer>
        )}

        {/* Add the unverified token modal */}
        {showUnverifiedWarning && pendingTokenSelection && tokenInfo[pendingTokenSelection] && (
          <UnverifiedTokenModal
            token={tokenInfo[pendingTokenSelection]}
            onCancel={handleCancelUnverifiedToken}
            onConfirm={handleConfirmUnverifiedToken}
          />
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={ref}>
      <TokenNameAndChevronContainer onClick={stopSelection ? undefined : toggleOpen}>
        <TokenIconContainer>
          <TokenIcon src={tokenInfo[selectedToken].icon} size={24} />
          <ChainIconWrapper>
            <TokenIcon src={tokenInfo[selectedToken].chainIcon} size={10} />
          </ChainIconWrapper>
        </TokenIconContainer>
        
        <TokenLabel>
          {tokenInfo[selectedToken].ticker}
        </TokenLabel>

        <StyledChevronDown/>
      </TokenNameAndChevronContainer>

      {isOpen && (
        <ModalAndOverlayContainer>
          <Overlay onClick={handleOverlayClick}/>

          <ModalContainer $isMobile={isMobile}>
            <TableHeader>
              <ThemedText.SubHeader style={{ textAlign: 'left' }}>
                Select Token
              </ThemedText.SubHeader>

              <button
                onClick={handleOverlayClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <StyledX/>
              </button>
            </TableHeader>

            <HorizontalDivider/>
            
            {/* Mobile Chain Dropdown */}
            {isMobile && (
              <div ref={chainDropdownRef} style={{ position: 'relative', width: '100%', zIndex: 50 }}>
                <ChainDropdownSelector 
                  onClick={() => {
                    setIsChainDropdownOpen(prev => !prev);
                  }}
                >
                  <ChainDropdownLeft>
                    {currentChainLogo && <ChainIcon src={currentChainLogo} />}
                    <span>{selectedChain}</span>
                  </ChainDropdownLeft>
                  <ChevronDown size={20} color="white" style={{ transform: isChainDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </ChainDropdownSelector>
                
                {isChainDropdownOpen && (
                  <ChainDropdownMenu>
                    <SearchChainContainer>
                      <SearchIcon size={16} />
                      <SearchInput 
                        placeholder="Search chains"
                        value={chainSearchQuery}
                        onChange={handleChainSearch}
                        smaller
                        onClick={(e) => e.stopPropagation()}
                      />
                    </SearchChainContainer>
                    
                    {/* Chain Lists - Always show chains even during token loading */}
                    <ChainListContent>
                      {(filteredPopularChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Popular Chains</ChainGroupLabel>
                          
                          {filteredPopularChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                      
                      {(filteredSortedChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Chains A-Z</ChainGroupLabel>
                          
                          {filteredSortedChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                      
                      {filteredSortedChains.length === 0 && chainSearchQuery !== '' && (
                        <NoResultsMessage>No chains found</NoResultsMessage>
                      )}
                    </ChainListContent>
                  </ChainDropdownMenu>
                )}
              </div>
            )}
            
            {/* Desktop Two-column layout */}
            {!isMobile ? (
              <ContentContainer>
                {/* Left column - Chain selector */}
                <ChainSelectorColumn>
                  <SearchChainContainer>
                    <SearchIcon size={16} />
                    <SearchInput 
                      placeholder="Search chains"
                      value={chainSearchQuery}
                      onChange={handleChainSearch}
                      smaller
                    />
                  </SearchChainContainer>
                  
                  <ChainsListContainer>
                    {(filteredPopularChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Popular Chains</ChainGroupLabel>
                          
                          {filteredPopularChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                    
                    {(filteredSortedChains.length > 0 || chainSearchQuery === '') && (
                        <>
                          <ChainGroupLabel>Chains A-Z</ChainGroupLabel>
                          
                          {filteredSortedChains.map((chain) => {
                            const chainIcon = getChainIconFromName(chain);
                            
                            return (
                              <ChainItem
                                key={chain}
                                selected={selectedChain === chain}
                                onClick={() => handleChainSelect(chain)}
                              >
                                {chainIcon && <ChainIcon src={chainIcon} />}
                                {chain}
                              </ChainItem>
                            );
                          })}
                        </>
                      )}
                    
                    {filteredSortedChains.length === 0 && chainSearchQuery !== '' && (
                      <NoResultsMessage>No chains found</NoResultsMessage>
                    )}
                  </ChainsListContainer>
                </ChainSelectorColumn>
                
                {/* Right column - Token list */}
                <TokenListColumn>
                  {/* Token search bar */}
                  <SearchContainer>
                    <SearchIcon size={18} />
                    <SearchInput 
                      placeholder="Search for a token or paste address"
                      value={tokenSearchQuery}
                      onChange={handleTokenSearch}
                    />
                    {isLoading && <LoadingSpinner style={{ marginLeft: '8px', width: '16px', height: '16px' }} />}
                  </SearchContainer>
                  
                  <TokenListScrollableContent>
                  {isLoading ? (
                    <>
                      <SectionHeader>Loading Tokens</SectionHeader>
                      <TokensListContainer>
                        {[...Array(8)].map((_, index) => (
                          <SkeletonTokenRow key={index} />
                        ))}
                      </TokensListContainer>
                    </>
                  ) : (
                    <>
                      {/* Popular tokens grid - only show when no search query */}
                      {!tokenSearchQuery && (
                        <PopularTokensGrid>
                          {(() => {
                            // First try to find the exact tickers we want
                            const preferredTickers = ["ETH", "USDC", "USDT", "WETH", "DEGEN"];
                            const popularTokens = filteredTokens.filter(token => 
                              tokenInfo[token] && preferredTickers.includes(tokenInfo[token].ticker)
                            );
                            
                            // If we don't have enough tokens from preferred list, add more from the filtered tokens
                            const tokensToShow = popularTokens.length >= 6 
                              ? popularTokens.slice(0, 5) 
                              : [...popularTokens, ...filteredTokens.filter(t => !popularTokens.includes(t))].slice(0, 5);
                            
                            return tokensToShow.map(token => (
                              <TokenGridItem 
                                key={token} 
                                onClick={() => handleSelectToken(token)}
                              >
                                <TokenGridIconContainer>
                                  <TokenGridLogoImg as={TokenIcon} src={tokenInfo[token].icon} size={24} />
                                  <ChainIconBadge>
                                    <TokenIcon src={tokenInfo[token].chainIcon} size={10} />
                                  </ChainIconBadge>
                                </TokenGridIconContainer>
                                <TokenGridTicker>{tokenInfo[token].ticker}</TokenGridTicker>
                              </TokenGridItem>
                            ));
                          })()}
                        </PopularTokensGrid>
                      )}
                      
                      {/* Volume section header */}
                      <SectionHeader>
                        {tokenSearchQuery ? 
                          (filteredTokens.filter(token => 
                            tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                          ).length > 0 ? "Results" : "") 
                          : "Tokens"}
                      </SectionHeader>
                      
                      {/* All tokens list */}
                      <TokensListContainer>
                        {filteredTokens
                          .filter(token => 
                            tokenSearchQuery === '' || 
                            tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                            tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                          )
                          // Apply balance sorting here
                          .sort((tokenA, tokenB) => {
                            if (!showBalance) return 0;
                            
                            const balanceA = tokenBalances[tokenA] || null;
                            const balanceB = tokenBalances[tokenB] || null;
                            
                            // If both balances are null or zero, maintain original order
                            if ((!balanceA || balanceA === 0n) && (!balanceB || balanceB === 0n)) {
                              return 0;
                            }
                            
                            // If only balanceA is null or zero, balanceB should come first
                            if (!balanceA || balanceA === 0n) {
                              return 1;
                            }
                            
                            // If only balanceB is null or zero, balanceA should come first
                            if (!balanceB || balanceB === 0n) {
                              return -1;
                            }
                            
                            // If both have balances, compare them (higher balances first)
                            try {
                              return balanceB > balanceA ? 1 : -1;
                            } catch (e) {
                              return 0;
                            }
                          })
                          .map((token) => (
                          <TokenRowContainer
                            key={token}
                            selected={token === selectedToken}
                            onClick={() => handleSelectToken(token)}
                          >
                            <TokenRowLeft>
                              <TokenRowIcon>
                                <TokenIcon src={tokenInfo[token].icon} size={32} />
                                <ChainIconWrapper>
                                  <TokenIcon src={tokenInfo[token].chainIcon} size={12} />
                                </ChainIconWrapper>
                              </TokenRowIcon>
                              <TokenRowTicker>{tokenInfo[token].ticker}</TokenRowTicker>
                            </TokenRowLeft>
                            {renderTokenRightContent(token)}
                          </TokenRowContainer>
                        ))}
                        
                        {tokenSearchQuery && filteredTokens.filter(token => 
                          tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <NoResultsMessage>No tokens found</NoResultsMessage>
                        )}
                      </TokensListContainer>
                    </>
                  )}
                  </TokenListScrollableContent>
                </TokenListColumn>
              </ContentContainer>
            ) : (
              /* Mobile Token List View */
              <MobileContentContainer>
                {/* Token search bar for mobile */}
                <SearchContainer>
                  <SearchIcon size={18} />
                  <SearchInput 
                    placeholder="Search for a token or paste address"
                    value={tokenSearchQuery}
                    onChange={handleTokenSearch}
                  />
                  {isLoading && <LoadingSpinner style={{ marginLeft: '8px', width: '16px', height: '16px' }} />}
                </SearchContainer>
                
                <MobileScrollableContent>
                {isLoading ? (
                  <>
                    <SectionHeader>Loading Tokens</SectionHeader>
                    <TokensListContainer>
                      {[...Array(8)].map((_, index) => (
                        <SkeletonTokenRow key={index} />
                      ))}
                    </TokensListContainer>
                  </>
                ) : (
                  <>
                    {/* Popular tokens grid for mobile - only show when no search query */}
                    {!tokenSearchQuery && (
                      <PopularTokensGrid>
                        {(() => {
                          // First try to find the exact tickers we want
                          const preferredTickers = ["ETH", "USDC", "USDT", "WETH", "DEGEN"];
                          const popularTokens = filteredTokens.filter(token => 
                            tokenInfo[token] && preferredTickers.includes(tokenInfo[token].ticker)
                          );
                          
                          // If we don't have enough tokens from preferred list, add more from the filtered tokens
                          const tokensToShow = popularTokens.length >= 6 
                            ? popularTokens.slice(0, 5) 
                            : [...popularTokens, ...filteredTokens.filter(t => !popularTokens.includes(t))].slice(0, 5);
                          
                          return tokensToShow.map(token => (
                            <TokenGridItem 
                              key={token} 
                              onClick={() => handleSelectToken(token)}
                            >
                              <TokenGridIconContainer>
                                <TokenGridLogoImg as={TokenIcon} src={tokenInfo[token].icon} size={24} />
                                <ChainIconBadge>
                                  <TokenIcon src={tokenInfo[token].chainIcon} size={10} />
                                </ChainIconBadge>
                              </TokenGridIconContainer>
                              <TokenGridTicker>{tokenInfo[token].ticker}</TokenGridTicker>
                            </TokenGridItem>
                          ));
                        })()}
                      </PopularTokensGrid>
                    )}
                    
                    {/* Volume section header for mobile */}
                    <SectionHeader>
                      {tokenSearchQuery ? 
                        (filteredTokens.filter(token => 
                          tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                        ).length > 0 ? "Results" : "") 
                        : "Tokens"}
                    </SectionHeader>
                    
                    {/* All tokens list - filtered by search */}
                    <TokensListContainer>
                      {filteredTokens
                        .filter(token => 
                          tokenSearchQuery === '' || 
                          tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                          tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                        )
                        // Apply balance sorting here
                        .sort((tokenA, tokenB) => {
                          if (!showBalance) return 0;
                          
                          const balanceA = tokenBalances[tokenA] || null;
                          const balanceB = tokenBalances[tokenB] || null;
                          
                          // If both balances are null or zero, maintain original order
                          if ((!balanceA || balanceA === 0n) && (!balanceB || balanceB === 0n)) {
                            return 0;
                          }
                          
                          // If only balanceA is null or zero, balanceB should come first
                          if (!balanceA || balanceA === 0n) {
                            return 1;
                          }
                          
                          // If only balanceB is null or zero, balanceA should come first
                          if (!balanceB || balanceB === 0n) {
                            return -1;
                          }
                          
                          // If both have balances, compare them (higher balances first)
                          try {
                            return balanceB > balanceA ? 1 : -1;
                          } catch (e) {
                            return 0;
                          }
                        })
                        .map((token) => (
                        <TokenRowContainer
                          key={token}
                          selected={token === selectedToken}
                          onClick={() => handleSelectToken(token)}
                        >
                          <TokenRowLeft>
                            <TokenRowIcon>
                              <TokenIcon src={tokenInfo[token].icon} size={32} />
                              <ChainIconWrapper>
                                <TokenIcon src={tokenInfo[token].chainIcon} size={12} />
                              </ChainIconWrapper>
                            </TokenRowIcon>
                            <TokenRowTicker>{tokenInfo[token].ticker}</TokenRowTicker>
                          </TokenRowLeft>
                          {renderTokenRightContent(token)}
                        </TokenRowContainer>
                      ))}
                      
                      {tokenSearchQuery && filteredTokens.filter(token => 
                        tokenInfo[token].ticker.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                        tokenInfo[token].name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                        tokenInfo[token].address.toLowerCase().includes(tokenSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <NoResultsMessage>No tokens found</NoResultsMessage>
                      )}
                    </TokensListContainer>
                  </>
                )}
                </MobileScrollableContent>
              </MobileContentContainer>
            )}

            <HorizontalDivider/>

            <TableFooter>
              Missing a chain or token? <Link href={ ZKP2P_TG_LINK } target='_blank'>
                Let us know ↗
              </Link>
            </TableFooter>
          </ModalContainer>
        </ModalAndOverlayContainer>
      )}

      {/* Add the unverified token modal */}
      {showUnverifiedWarning && pendingTokenSelection && tokenInfo[pendingTokenSelection] && (
        <UnverifiedTokenModal
          token={tokenInfo[pendingTokenSelection]}
          onCancel={handleCancelUnverifiedToken}
          onConfirm={handleConfirmUnverifiedToken}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TokenIconContainer = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
`;

const ChainIconWrapper = styled.div`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1E2230;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #1E2230;
`;

const TokenNameAndChevronContainer = styled.div`
  min-width: 98px;
  width: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 24px;
  background: ${colors.selectorColor};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 6px 4px 4px;
  gap: 6px;
  cursor: pointer;

  &:hover {
    background-color: ${colors.selectorHover};
    border: 1px solid ${colors.selectorHoverBorder};
  }
`;

const TokenLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
`;

const StyledChevronDown = styled(ChevronDown)`
  min-width: 20px;
  width: 20px;
  height: 20px;
  color: #FFF;
  flex-shrink: 0;
`;

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};
`;

const ModalContainer = styled.div<{ $isMobile: boolean }>`
  width: ${props => props.$isMobile ? '100vw' : '90vw'};
  max-width: ${props => props.$isMobile ? '100vw' : '680px'};
  display: flex;
  flex-direction: column;
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: ${colors.container};
  color: #FFF;
  align-items: center;
  z-index: 20;
  
  position: fixed;
  top: ${props => props.$isMobile ? '19%' : '48.8%'};
  bottom: ${props => props.$isMobile ? '0' : 'auto'};
  left: 50%;
  transform: ${props => !props.$isMobile && 'translate(-50%, -50%)'};
  ${props => props.$isMobile && 'transform: translateX(-50%);'}
  overflow: hidden;
  max-height: ${props => props.$isMobile ? '90vh' : 'auto'};
  
  ${props => props.$isMobile && `
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    
    @keyframes slideUp {
      0% { transform: translate(-50%, 100%); }
      100% { transform: translateX(-50%); }
    }
  `}
`;

const TableHeader = styled.div`
  box-sizing: border-box;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px 20px;
`;

const HorizontalDivider = styled.div`
  width: 100%;
  border-top: 1px solid ${colors.defaultBorderColor};
`;

const StyledX = styled(X)`
  color: #FFF;
`;

// Search components
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 8px 12px;
  margin: 12px 20px 10px;
  width: calc(100% - 62px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchChainContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
  margin: 12px 12px 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchIcon = styled(Search)`
  color: rgba(255, 255, 255, 0.5);
  margin-right: 8px;
`;

const SearchInput = styled.input<{ smaller?: boolean }>`
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: ${props => props.smaller ? '14px' : '16px'};
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

// Mobile chain dropdown
const ChainDropdownSelector = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  margin: 12px;
  width: calc(100% - 54px);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 768px) {
    margin: 12px auto 0px;
    padding: 10px 12px;
    width: calc(100% - 64px);
  }
`;

const ChainDropdownLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
`;

const ChainDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 12px;
  right: 12px;
  background: ${colors.container};
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  z-index: 40;
  max-height: 350px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  /* Thin scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

// Two-column layout components
const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  height: 500px;
`;

// Mobile content container with padding
const MobileContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 180px);
  padding-top: 8px;
`;

// Left column - Chain selector
const ChainSelectorColumn = styled.div`
  width: 240px;
  border-right: 1px solid ${colors.defaultBorderColor};
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
`;

// Right column - Token list
const TokenListColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-x: hidden; // Prevent horizontal scrolling
`;

// Content container for the scrollable area (excluding search bar)
const TokenListScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Thin scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

// Chain list styles
const ChainsListContainer = styled.div`
  display: flex;
  flex-direction: column; 
  overflow-y: auto;
  height: 100%;
  padding: 0px 12px 8px 12px;
  
  /* Thin scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${colors.container};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${colors.iconButtonActive};
    border-radius: 4px;
  }
`;

const ChainGroupLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  padding: 12px 0 8px 0;
  margin-top: 8px;
`;

const ChainItem = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 4px;
  
  background: ${props => props.selected ? colors.iconButtonActive : 'transparent'};
  
  &:hover {
    background: ${props => props.selected ? colors.iconButtonActive : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const TokensListContainer = styled.div`
  flex: 1;
`;

const TableFooter = styled.div`
  padding: 14px;
  font-size: 14px;
  text-align: left;
  line-height: 1.5;
  color: ${colors.grayText};
`;

const PopularTokensGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 20px 8px;
  width: 100%;
  box-sizing: border-box;
`;

const TokenGridItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px 12px 6px 8px;
  border-radius: 100px;
  transition: all 0.2s;
  background: rgba(30, 32, 40, 0.9);
  border: 1px solid rgba(50, 50, 60, 0.8);
  min-width: auto;
  white-space: nowrap;
  
  &:hover {
    background: rgba(40, 42, 50, 1);
    border-color: rgba(70, 70, 80, 1);
  }
`;

const TokenGridIconContainer = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  margin-right: 8px;
`;

const TokenGridLogoImg = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  &${StyledHelpCircle} {
    width: 24px;
    height: 24px;
    padding: 3px;
  }
`;

const TokenGridTicker = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const ChainIconBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1E2230;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #1E2230;
  
  img, ${StyledHelpCircle} {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
`;

const TokenDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const TokenName = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

const TokenChain = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

// Add missing styled component
const ChainListContent = styled.div`
  padding: 0 16px 16px 16px;
`;

const TokenAndNameLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

const TokenTicker = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const SectionHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 20px;
`;

const TokenGridName = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
`;

const TokenGridAddress = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
  margin-top: 1px;
`;

const SectionDivider = styled.div`
  width: 100%;
  border-top: 1px solid ${colors.defaultBorderColor};
`;

const NoResultsMessage = styled.div`
  padding: 16px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

// Updated TokenRowContainer with proper padding
const TokenRowContainer = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(30, 30, 40, 0.5);
  background: ${props => props.selected ? 'rgba(50, 50, 70, 0.3)' : 'transparent'};

  &:hover {
    background: rgba(40, 40, 50, 0.2);
  }
`;

const TokenRowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TokenRowRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
`;

const TokenRowIcon = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  
  img, ${StyledHelpCircle} {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  
  ${ChainIconWrapper} {
    width: 14px;
    height: 14px;
    bottom: -2px;
    right: -2px;
    border: 1.5px solid #1E2230;
    
    img, ${StyledHelpCircle} {
      width: 12px;
      height: 12px;
    }
  }
`;

const TokenRowTicker = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const TokenRowName = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
`;

const TokenRowDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
`;

const TokenRowAddress = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
`;

const MobileTokensGrid = styled(PopularTokensGrid)`
  grid-template-columns: repeat(3, 1fr);
`;

// Loading spinner for when tokens are being fetched
const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Add the mobile scrollable content component
const MobileScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  
  /* Thin scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;