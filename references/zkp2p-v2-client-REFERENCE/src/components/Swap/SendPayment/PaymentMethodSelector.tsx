import React, { useRef, useReducer } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { paymentPlatformInfo, PaymentPlatformType } from '@helpers/types';
import { useOnClickOutside } from '@hooks/useOnClickOutside';


interface PaymentMethodSelectorProps {
  paymentPlatform: PaymentPlatformType;
  selectedPaymentMethod: number;
  setSelectedPaymentMethod: (method: number) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentPlatform,
  selectedPaymentMethod,
  setSelectedPaymentMethod
}) => {
  const platform = paymentPlatformInfo[paymentPlatform];
  const options = platform.paymentMethods.map((method: any, index: number) => ({
    value: index,
    label: method.sendConfig.paymentMethodName || 'Payment Method'
  }));
  
  const [isOpen, toggleOpen] = useReducer((s) => !s, false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined);
  
  if (options.length <= 1) return null;
  
  return (
    <PaymentMethodSelectorContainer>
      <ThemedText.BodySmall>Choose Your {platform.platformName} Bank</ThemedText.BodySmall>
      <DropdownContainer ref={ref}>
        <SelectButton onClick={toggleOpen}>
          <SelectedItemContainer>
            <LogoContainer>
              <img src={platform.paymentMethods[selectedPaymentMethod].sendConfig.paymentMethodIcon} alt={''} width={18} height={18} />
            </LogoContainer>
            <SelectedValue>{options[selectedPaymentMethod].label}</SelectedValue>
          </SelectedItemContainer>
          <StyledChevronDown $isOpen={isOpen} />
        </SelectButton>
        
        {isOpen && (
          <OptionsContainer>
            {options.map(option => (
              <OptionItem 
                key={option.value} 
                $isSelected={selectedPaymentMethod === option.value}
                onClick={() => {
                  setSelectedPaymentMethod(option.value);
                  toggleOpen();
                }}
              >
                <LogoContainer>
                  <img src={platform.paymentMethods[option.value].sendConfig.paymentMethodIcon} alt={''} width={18} height={18} />
                </LogoContainer>
                {option.label}
              </OptionItem>
            ))}
          </OptionsContainer>
        )}
      </DropdownContainer>
    </PaymentMethodSelectorContainer>
  );
};

const PaymentMethodSelectorContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.div`
  background-color: #131A2A;
  color: ${colors.white};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  
  &:hover {
    border-color: ${colors.iconButtonHover};
  }
`;

const SelectedItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const SelectedValue = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

interface StyledChevronDownProps {
  $isOpen: boolean;
}

const StyledChevronDown = styled(ChevronDown)<StyledChevronDownProps>`
  width: 20px;
  height: 20px;
  color: ${colors.white};
  transition: transform 0.4s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const OptionsContainer = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: #131A2A;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  z-index: 20;
  max-height: 200px;
  overflow-y: auto;
  
  /* Scrollbar styling */
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

interface OptionItemProps {
  $isSelected: boolean;
}

const OptionItem = styled.div<OptionItemProps>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
  
  &:hover {
    background-color: ${colors.rowSelectorHover}
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
`;

const LogoSvg = styled.svg`
  width: 24px;
  height: 24px;
`;
