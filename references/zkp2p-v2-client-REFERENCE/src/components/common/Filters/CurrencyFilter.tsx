import React, { useReducer, useRef } from 'react';
import { ChevronDown } from 'react-feather';
import "flag-icons/css/flag-icons.min.css";

import { FilterInput, FilterValue, FilterIcon, FilterDropdownIcon } from './FilterInput';
import { CurrencySelectorModal } from './CurrencySelectorModal';
import { CurrencyType, currencyInfo } from '@helpers/types';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import styled from 'styled-components';

interface CurrencyFilterProps {
  selectedCurrency: CurrencyType | null;
  setSelectedCurrency: (currency: CurrencyType | null) => void;
  allCurrencies: CurrencyType[];
  width?: string;
}

export const CurrencyFilter: React.FC<CurrencyFilterProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  allCurrencies,
  width = '140px'
}) => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false);
  const ref = useRef<HTMLDivElement>(null);
  
  // Always call the hook with a callback, but make it a no-op when not needed
  useOnClickOutside(ref, isOpen ? toggleOpen : () => {});

  return (
    <Wrapper ref={ref}>
      <FilterInput 
        onClick={toggleOpen} 
        isActive={!!selectedCurrency}
        width={width}
      >
        {selectedCurrency ? (
          <>
            <FilterIcon>
              <FlagIcon className={`fi fi-${currencyInfo[selectedCurrency].countryCode}`} />
            </FilterIcon>
            <FilterValue>
              {currencyInfo[selectedCurrency].currencyCode}
            </FilterValue>
          </>
        ) : (
          <FilterValue style={{ color: '#9CA3AF' }}>
            Currency
          </FilterValue>
        )}
        <FilterDropdownIcon>
          <ChevronDown />
        </FilterDropdownIcon>
      </FilterInput>

      {isOpen && (
        <CurrencySelectorModal
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
          allCurrencies={allCurrencies}
          onClose={toggleOpen}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const FlagIcon = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 2px;
  overflow: hidden;
`;