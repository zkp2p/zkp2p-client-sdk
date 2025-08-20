import React, { useReducer, useRef, useState, useMemo } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, Search, Check } from 'react-feather';
import Link from '@mui/material/Link';
import "flag-icons/css/flag-icons.min.css";

import { Overlay } from '@components/modals/Overlay';
import { CurrencyType, currencyInfo, PaymentPlatformType, paymentPlatformInfo } from '@helpers/types';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { ZKP2P_TG_LINK } from '@helpers/docUrls';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import useMediaQuery from '@hooks/useMediaQuery';
import { CurrencyRow } from './CurrencyRow';
import { PlatformRow } from './PlatformRow';

interface CurrencyPlatformSelectorProps {
  selectedCurrency: CurrencyType | null;
  setSelectedCurrency: (currency: CurrencyType) => void;
  allCurrencies: CurrencyType[];
  selectedPlatform: PaymentPlatformType | null;
  setSelectedPlatform: (platform: PaymentPlatformType) => void;
  allPlatforms?: PaymentPlatformType[];
  displayMode?: 'currency' | 'platform' | 'both';
}

export const CurrencyPlatformSelector: React.FC<CurrencyPlatformSelectorProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  allCurrencies,
  selectedPlatform,
  setSelectedPlatform,
  allPlatforms = [],
  displayMode = 'both'
}) => {
  /*
   * State
   */
  const [isOpen, toggleOpen] = useReducer((s) => !s, false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [platformSearchTerm, setPlatformSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'currency' | 'platform'>('currency');

  const currentDevice = useMediaQuery();
  const isMobile = currentDevice === 'mobile';

  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined);

  /*
   * Helper function to render the display based on displayMode
   */
  const renderDisplayContent = () => {
    if (!selectedCurrency && !selectedPlatform) {
      return <Label>Select Currency & Platform</Label>;
    }
    
    if (displayMode === 'currency' && selectedCurrency) {
      return (
        <CurrencyDisplay>
          <FlagIcon className={`fi fi-${currencyInfo[selectedCurrency].countryCode}`} />
          <Label>{currencyInfo[selectedCurrency].currencyCode}</Label>
        </CurrencyDisplay>
      );
    }
    
    if (displayMode === 'platform' && selectedPlatform) {
      const platformInfo = paymentPlatformInfo[selectedPlatform];
      return (
        <PlatformDisplay>
          {platformInfo.platformLogo ? (
            <PlatformLogo src={platformInfo.platformLogo} />
          ) : (
            <LogoFallback $backgroundColor={platformInfo.platformColor}>
              {platformInfo.platformName.charAt(0)}
            </LogoFallback>
          )}
          <Label>{platformInfo.platformName}</Label>
        </PlatformDisplay>
      );
    }
    
    // For 'both' mode or fallback
    return (
      <>
        {selectedCurrency && (
          <CurrencyDisplay>
            <FlagIcon className={`fi fi-${currencyInfo[selectedCurrency].countryCode}`} />
            <Label>{currencyInfo[selectedCurrency].currencyCode}</Label>
          </CurrencyDisplay>
        )}

        {selectedCurrency && selectedPlatform && displayMode === 'both' && (
          <Separator>/</Separator>
        )}

        {selectedPlatform && displayMode === 'both' && (
          <PlatformDisplay>
            {paymentPlatformInfo[selectedPlatform].platformLogo ? (
              <PlatformLogo src={paymentPlatformInfo[selectedPlatform].platformLogo} />
            ) : (
              <LogoFallback $backgroundColor={paymentPlatformInfo[selectedPlatform].platformColor}>
                {paymentPlatformInfo[selectedPlatform].platformName.charAt(0)}
              </LogoFallback>
            )}
            <Label>{paymentPlatformInfo[selectedPlatform].platformName}</Label>
          </PlatformDisplay>
        )}
      </>
    );
  };

  /*
   * Derived state
   */
  // Define popular currencies
  const popularCurrencyCodes = ["USD", "EUR", "GBP", "ARS"];
  
  // Use useMemo for derived state to avoid unnecessary recalculations
  const { filteredPopularCurrencies, filteredAllCurrencies } = useMemo(() => {
    // First, get all currencies that match our popular codes
    const popularCurrencies = allCurrencies.filter(currency => 
      popularCurrencyCodes.includes(currencyInfo[currency].currencyCode)
    );
    
    // Sort popular currencies according to the order in popularCurrencyCodes
    const sortedPopularCurrencies = [...popularCurrencies].sort((a, b) => {
      const indexA = popularCurrencyCodes.indexOf(currencyInfo[a].currencyCode);
      const indexB = popularCurrencyCodes.indexOf(currencyInfo[b].currencyCode);
      return indexA - indexB;
    });
    
    // Sort all currencies alphabetically by name (including popular ones)
    const allCurrenciesSorted = [...allCurrencies].sort((a, b) => 
      currencyInfo[a].currencyName.localeCompare(currencyInfo[b].currencyName)
    );
    
    // Apply search filtering
    const filteredPopular = sortedPopularCurrencies.filter(currency =>
      currencyInfo[currency].currencyName.toLowerCase().includes(currencySearchTerm.toLowerCase()) ||
      currencyInfo[currency].currencyCode.toLowerCase().includes(currencySearchTerm.toLowerCase())
    );
    
    const filteredAll = allCurrenciesSorted.filter(currency =>
      currencyInfo[currency].currencyName.toLowerCase().includes(currencySearchTerm.toLowerCase()) ||
      currencyInfo[currency].currencyCode.toLowerCase().includes(currencySearchTerm.toLowerCase())
    );
    
    return {
      filteredPopularCurrencies: filteredPopular,
      filteredAllCurrencies: filteredAll
    };
  }, [allCurrencies, currencySearchTerm]);

  const filteredPlatforms = useMemo(() => {
    // Filter all platforms based on search term
    return allPlatforms.filter(platform =>
      paymentPlatformInfo[platform].platformName.toLowerCase().includes(platformSearchTerm.toLowerCase())
    );
  }, [allPlatforms, platformSearchTerm]);

  /*
   * Handlers
   */
  const handleOverlayClick = () => {
    toggleOpen();
    setCurrencySearchTerm('');
    setPlatformSearchTerm('');
  };

  const handleSelectCurrency = (currency: CurrencyType) => {
    if (setSelectedCurrency) {
      setSelectedCurrency(currency);
      
      // If on mobile, switch to platform tab after currency selection
      if (isMobile) {
        setActiveTab('platform');
      }
    }
  };

  const handleSelectPlatform = (platform: PaymentPlatformType) => {
    if (setSelectedPlatform) {
      setSelectedPlatform(platform);
      
      // Only close modal if both selections have been made
      if (selectedCurrency) {
        toggleOpen();
      }
    }
  };

  // Helper to render currency lists with section headers
  const renderCurrencyList = (
    popularCurrencies: CurrencyType[],
    otherCurrencies: CurrencyType[],
    showHeaders: boolean = true
  ) => (
    <>
      {showHeaders && popularCurrencies.length > 0 && (
        <SectionHeader>Popular Currencies</SectionHeader>
      )}
      
      {popularCurrencies.map((currency, index) => (
        <CurrencyRowContainer key={`popular-${currency}`}>
          <CurrencyRow
            currency={currency}
            isSelected={currency === selectedCurrency}
            onRowClick={() => handleSelectCurrency(currency)}
            isLastRow={index === popularCurrencies.length - 1}
          />
        </CurrencyRowContainer>
      ))}
      
      {showHeaders && otherCurrencies.length > 0 && (
        <SectionHeader>All Currencies A-Z</SectionHeader>
      )}
      
      {otherCurrencies.map((currency, index) => (
        <CurrencyRowContainer key={`other-${currency}`}>
          <CurrencyRow
            currency={currency}
            isSelected={currency === selectedCurrency}
            onRowClick={() => handleSelectCurrency(currency)}
            isLastRow={index === otherCurrencies.length - 1}
          />
        </CurrencyRowContainer>
      ))}
      
      {popularCurrencies.length === 0 && otherCurrencies.length === 0 && (
        <NoResultsMessage>No currencies found</NoResultsMessage>
      )}
    </>
  );

  /*
   * Component
   */
  return (
    <Wrapper ref={ref}>
      <SelectorContainer onClick={toggleOpen}>
        <SelectionDisplay>
          {renderDisplayContent()}
        </SelectionDisplay>
        <StyledChevronDown />
      </SelectorContainer>

      {isOpen && (
        <ModalAndOverlayContainer>
          <Overlay onClick={handleOverlayClick} />

          <ModalContainer $isMobile={isMobile}>
            <TableHeader>
              <ThemedText.SubHeader style={{ textAlign: 'left' }}>
                Select Currency & Platform
              </ThemedText.SubHeader>

              <button
                onClick={handleOverlayClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <StyledX />
              </button>
            </TableHeader>

            <HorizontalDivider />
              
            <ContentContainer>
              {/* Left column - Currency selector */}
              <CurrencySelectorColumn>
                <CurrencySearchContainer>
                  <SearchIcon size={18} />
                  <SearchInput
                    placeholder="Search currency"
                    value={currencySearchTerm}
                    onChange={(e) => setCurrencySearchTerm(e.target.value)}
                  />
                </CurrencySearchContainer>
                
                <ScrollableList>
                  {renderCurrencyList(filteredPopularCurrencies, filteredAllCurrencies)}
                </ScrollableList>
              </CurrencySelectorColumn>

              {/* Right column - Platform selector */}
              <PlatformSelectorColumn>
                <SearchContainer>
                  <SearchIcon size={18} />
                  <SearchInput
                    placeholder="Search platform"
                    value={platformSearchTerm}
                    onChange={(e) => setPlatformSearchTerm(e.target.value)}
                  />
                </SearchContainer>

                <SectionHeader>Platform</SectionHeader>
                
                <ScrollableList>
                  {filteredPlatforms.map((platform, index) => (
                    <PlatformRow
                      key={platform}
                      platformName={paymentPlatformInfo[platform].platformName || ''}
                      paymentMethods={(paymentPlatformInfo[platform].paymentMethods?.map(
                        (method: any) => method.sendConfig.paymentMethodName
                      ).filter(Boolean) as string[]) || []}
                      platformLogo={paymentPlatformInfo[platform].platformLogo}
                      platformColor={paymentPlatformInfo[platform].platformColor}
                      isSelected={platform === selectedPlatform}
                      onRowClick={() => handleSelectPlatform(platform)}
                    />
                  ))}
                  
                  {filteredPlatforms.length === 0 && (
                    <NoResultsMessage>No platforms found</NoResultsMessage>
                  )}
                </ScrollableList>
              </PlatformSelectorColumn>
            </ContentContainer>

            <HorizontalDivider />

            <TableFooter>
              Let us know which platforms you are interested in seeing ZKP2P add support
              for. <Link href={ZKP2P_TG_LINK} target="_blank">
                Give feedback ↗
              </Link>
            </TableFooter>
          </ModalContainer>
        </ModalAndOverlayContainer>
      )}
    </Wrapper>
  );
};

// Main component styles
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SelectorContainer = styled.div`
  width: auto;
  min-width: 98px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 24px;
  background: ${colors.selectorColor};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 8px 6px 8px;
  gap: 6px;
  cursor: pointer;

  &:hover {
    background-color: ${colors.selectorHover};
    border: 1px solid ${colors.selectorHoverBorder};
  }
`;

const SelectionDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CurrencyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PlatformDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Label = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
`;

const Separator = styled.div`
  color: rgba(255, 255, 255, 0.5);
  margin: 0 2px;
`;

const FlagIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;

const StyledChevronDown = styled(ChevronDown)`
  width: 20px;
  height: 20px;
  color: #FFF;
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
  max-width: ${props => props.$isMobile ? '100vw' : '700px'};
  display: flex;
  flex-direction: column;
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: ${colors.container};
  color: #FFF;
  align-items: center;
  z-index: 20;
  
  position: fixed;
  top: ${props => props.$isMobile ? '20%' : '49%'};
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

// Two-column layout components
const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  height: 500px;
`;

// Left column - Currency selector
const CurrencySelectorColumn = styled.div`
  width: 40%;
  border-right: 1px solid ${colors.defaultBorderColor};
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0px 0px 0px 12px;
`;

// Right column - Platform selector
const PlatformSelectorColumn = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0px 12px 0px 12px;
`;

// const ColumnHeader = styled.div`
//   font-size: 16px;
//   font-weight: 500;
//   color: rgba(255, 255, 255, 0.8);
//   padding: 16px 0px;
// `;

// const CurrencyColumnHeader = styled.div`
//   font-size: 16px;
//   font-weight: 500;
//   color: rgba(255, 255, 255, 0.8);
//   padding: 16px 12px 16px 0px;
// `;

const SectionHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  padding: 12px 0 8px 0;
  margin-top: 8px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 16px;
`;

const CurrencySearchContainer = styled(SearchContainer)`
  margin: 16px 16px 0 0;
`;

const SearchIcon = styled(Search)`
  color: rgba(255, 255, 255, 0.5);
  margin-right: 8px;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: 16px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  
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


const CurrencyRowContainer = styled.div`
  margin: 0 8px 0px 0px;
`;

const NoResultsMessage = styled.div`
  padding: 16px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const TableFooter = styled.div`
  padding: 20px;
  font-size: 14px;
  text-align: left;
  line-height: 1.5;
  color: ${colors.grayText};
`; 

const PlatformLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 12px;
`;

const LogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${props => props.$backgroundColor || colors.defaultBorderColor};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
`;