import React, { useReducer, useRef } from 'react';
import { ChevronDown } from 'react-feather';
import styled from 'styled-components';

import { FilterInput, FilterValue, FilterIcon, FilterDropdownIcon } from './FilterInput';
import { PlatformSelectorModal } from './PlatformSelectorModal';
import { PaymentPlatformType, paymentPlatformInfo, PaymentPlatform } from '@helpers/types';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { colors } from '@theme/colors';

interface PlatformFilterProps {
  selectedPlatform: PaymentPlatformType | null;
  setSelectedPlatform: (platform: PaymentPlatformType | null) => void;
  allPlatforms: string[];
  width?: string;
}

export const PlatformFilter: React.FC<PlatformFilterProps> = ({
  selectedPlatform,
  setSelectedPlatform,
  allPlatforms,
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
        isActive={!!selectedPlatform}
        width={width}
      >
        {selectedPlatform && paymentPlatformInfo[selectedPlatform] ? (
          <>
            <FilterIcon>
              {(selectedPlatform === PaymentPlatform.VENMO || selectedPlatform === PaymentPlatform.PAYPAL) ? (
                <PlatformLogoFallback 
                  $backgroundColor={paymentPlatformInfo[selectedPlatform].platformColor}
                >
                  {selectedPlatform === PaymentPlatform.VENMO ? 'V' : 'P'}
                </PlatformLogoFallback>
              ) : paymentPlatformInfo[selectedPlatform].platformLogo ? (
                <img 
                  src={paymentPlatformInfo[selectedPlatform].platformLogo} 
                  alt={paymentPlatformInfo[selectedPlatform].platformName}
                />
              ) : (
                <PlatformLogoFallback 
                  $backgroundColor={paymentPlatformInfo[selectedPlatform].platformColor || colors.grayText}
                >
                  {paymentPlatformInfo[selectedPlatform].platformName?.[0] || '?'}
                </PlatformLogoFallback>
              )}
            </FilterIcon>
            <FilterValue>
              {paymentPlatformInfo[selectedPlatform].platformName}
            </FilterValue>
          </>
        ) : (
          <FilterValue style={{ color: '#9CA3AF' }}>
            Platform
          </FilterValue>
        )}
        <FilterDropdownIcon>
          <ChevronDown />
        </FilterDropdownIcon>
      </FilterInput>

      {isOpen && (
        <PlatformSelectorModal
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          allPlatforms={allPlatforms as PaymentPlatformType[]}
          onClose={toggleOpen}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${({ $backgroundColor }) => $backgroundColor || colors.grayText};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
`;