import React, { useReducer, useRef, useState, useMemo } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, Search } from 'react-feather';
import "flag-icons/css/flag-icons.min.css";

import { Overlay } from '@components/modals/Overlay';
import { CurrencyRow } from '@components/modals/selectors/currency/CurrencyRow';
import { CurrencyType, currencyInfo } from '@helpers/types';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';

import useMediaQuery from '@hooks/useMediaQuery';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyType | null;
  setSelectedCurrency: (currency: CurrencyType) => void;
  allCurrencies: CurrencyType[];
  width?: number;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  allCurrencies,
  width
}) => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const [searchTerm, setSearchTerm] = useState('');

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? () => {
    toggleOpen();
  } : undefined)

  const currentDevice = useMediaQuery();
  const isMobile = currentDevice === 'mobile';

  const filteredCurrencies = useMemo(() => {
    return allCurrencies.filter(currency => 
      currencyInfo[currency].currencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currencyInfo[currency].currencyCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCurrencies, searchTerm]);

  /*
   * Handlers
   */

  const handleOverlayClick = () => {
    toggleOpen();
    setSearchTerm('');
  };

  const handleSelectCurrency = (currency: CurrencyType) => {
    if (setSelectedCurrency) {
      setSelectedCurrency(currency);

      toggleOpen();
    }
  };

  /*
   * Component
   */

  return (
    <Wrapper ref={ref}>
      <LogoAndCurrencyLabel 
        onClick={toggleOpen} 
        isTextOnly={!selectedCurrency}
        width={width}
      >
        {selectedCurrency ? (
          <>
            <FlagIcon className={`fi fi-${currencyInfo[selectedCurrency].countryCode}`} />
            <CurrencyLabel>
              {currencyInfo[selectedCurrency].currencyCode}
            </CurrencyLabel>
          </>
        ) : (
          <AllCurrencyLabel>
            All currencies
          </AllCurrencyLabel>
        )}
        
        <StyledChevronDown/>
      </LogoAndCurrencyLabel>

      {isOpen && (
        <ModalAndOverlayContainer>
          <Overlay onClick={handleOverlayClick}/>

          <ModalContainer $isMobile={isMobile}>
            <TableHeader>
              <ThemedText.SubHeader style={{ textAlign: 'left' }}>
                Select a Currency
              </ThemedText.SubHeader>

              <button
                onClick={handleOverlayClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <StyledX/>
              </button>
            </TableHeader>

            <HorizontalDivider/>

            <SearchContainer onClick={(e) => e.stopPropagation()}>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search currency"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            <Table>
              {filteredCurrencies.map((currency, currIndex) => (
                <CurrencyRow
                  key={currIndex}
                  currency={currency}
                  isSelected={currency === selectedCurrency}
                  onRowClick={() => handleSelectCurrency(currency)}
                  isLastRow={currIndex === filteredCurrencies.length - 1}
                />
              ))}
            </Table>
          </ModalContainer>
        </ModalAndOverlayContainer>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoAndCurrencyLabel = styled.div<{ isTextOnly?: boolean; width?: number }>`
  width: ${({ width }) => width ? `${width}px` : 'auto'};  
  min-width: ${({ width }) => width ? `${width}px` : '98px'};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 24px;
  background: ${colors.selectorColor};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 8px 4px 4px;
  gap: 6px;
  cursor: pointer;

  ${props => props.isTextOnly && `
    padding: 6px 8px 6px 14px;
    gap: 4px;
    white-space: nowrap;
  `}

  &:hover {
    background-color: ${colors.selectorHover};
    border: 1px solid ${colors.selectorHoverBorder};
  }
`;

const FlagIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;

const CurrencyLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
`;

const AllCurrencyLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;

  @media (max-width: 600px) {
    font-size: 12px;
  }
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
  width: ${props => props.$isMobile ? '100vw' : '80vw'};
  max-width: ${props => props.$isMobile ? '100vw' : '400px'};
  display: flex;
  flex-direction: column;
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: ${colors.container};
  color: #FFF;
  align-items: center;
  z-index: 20;
  
  position: fixed;
  top: ${props => props.$isMobile ? '20%' : '50%'};
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

const Table = styled.div`
  font-size: 16px;
  color: #616161;
  height: 40vh;
  overflow-y: auto;
  scrollbar-width: thin;
  width: 100%;
  border-radius: 0 0 16px 16px;
  
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

  @media (max-width: 600px) {
    height: 100%;
  }
`;

const SearchContainer = styled.div`
  width: 90%;
  padding: 5px 0px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 16px auto;
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 16px;
  color: rgba(255, 255, 255, 0.5);
  width: 20px;
  height: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${colors.defaultBorderColor};
  background: ${colors.selectorColor};
  color: #FFF;
  font-size: 16px;
  height: 54px;
  padding-left: 48px;
  padding-right: 16px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #CED4DA;
  }
`;
