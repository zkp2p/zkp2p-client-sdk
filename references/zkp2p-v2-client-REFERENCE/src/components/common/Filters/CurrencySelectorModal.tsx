import React, { useState, useMemo } from 'react';
import { X, Search } from 'react-feather';
import styled from 'styled-components';
import "flag-icons/css/flag-icons.min.css";

import { CurrencyType, currencyInfo } from '@helpers/types';
import { Overlay } from '@components/modals/Overlay';
import { CurrencyRow } from '@components/modals/selectors/currency/CurrencyRow';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import useMediaQuery from '@hooks/useMediaQuery';

interface CurrencySelectorModalProps {
  selectedCurrency: CurrencyType | null;
  onSelectCurrency: (currency: CurrencyType) => void;
  allCurrencies: CurrencyType[];
  onClose: () => void;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  selectedCurrency,
  onSelectCurrency,
  allCurrencies,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDevice = useMediaQuery();
  const isMobile = currentDevice === 'mobile';

  const filteredCurrencies = useMemo(() => {
    return allCurrencies.filter(currency => 
      currencyInfo[currency].currencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currencyInfo[currency].currencyCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCurrencies, searchTerm]);

  const handleSelectCurrency = (currency: CurrencyType) => {
    onSelectCurrency(currency);
    onClose();
  };

  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={onClose}/>
      
      <ModalContainer $isMobile={isMobile}>
        <TableHeader>
          <ThemedText.SubHeader style={{ textAlign: 'left' }}>
            Select a Currency
          </ThemedText.SubHeader>

          <button
            onClick={onClose}
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
            autoFocus
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
  );
};

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
  position: fixed;
  top: ${props => props.$isMobile ? '20%' : '50%'};
  left: 50%;
  transform: ${props => props.$isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)'};
  width: ${props => props.$isMobile ? '100vw' : '80vw'};
  max-width: ${props => props.$isMobile ? '100vw' : '400px'};
  max-height: ${props => props.$isMobile ? '80vh' : '600px'};
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 20;
  
  ${props => props.$isMobile && `
    bottom: 0;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    
    @keyframes slideUp {
      0% { transform: translate(-50%, 100%); }
      100% { transform: translateX(-50%); }
    }
  `}
`;

const TableHeader = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledX = styled(X)`
  color: ${colors.lightGrayText};
  size: 24px;
  
  &:hover {
    color: ${colors.white};
  }
`;

const HorizontalDivider = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${colors.defaultBorderColor};
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  background: ${colors.container};
`;

const SearchIcon = styled(Search)`
  color: ${colors.grayText};
  size: 20px;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${colors.white};
  font-size: 16px;
  outline: none;
  
  &::placeholder {
    color: ${colors.grayText};
  }
`;

const Table = styled.div`
  overflow-y: auto;
  flex: 1;
`;