import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { colors } from '@theme/colors';
import { Input } from '@components/common/Input';

interface AdvancedSettingsProps {
  minAmountValue: string;
  maxAmountValue: string;
  handleMinAmountChange: (value: string) => void;
  handleMaxAmountChange: (value: string) => void;
  handleMaxPerOrderButtonClick: () => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  minAmountValue,
  maxAmountValue,
  handleMinAmountChange,
  handleMaxAmountChange,
  handleMaxPerOrderButtonClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container>
      <TitleLabelAndDropdownIconContainer $isOpen={isOpen}>
        <TitleLabel>Advanced Settings</TitleLabel>
        <StyledChevronDown
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
        />
      </TitleLabelAndDropdownIconContainer>

      <DetailsDropdown $isOpen={isOpen}>
        <SettingsContent>
          <AmountRangeContainer>
            <Input
              label="Min Per Order"
              name="minAmount"
              value={minAmountValue}
              onChange={(e) => handleMinAmountChange(e.currentTarget.value)}
              type="number"
              placeholder="0"
              inputLabel="USDC"
              helperText="Minimum amount counterparty can take per order"
            />
            <Input
              label="Max Per Order"
              name="maxAmount"
              value={maxAmountValue}
              onChange={(e) => handleMaxAmountChange(e.currentTarget.value)}
              type="number"
              placeholder="0"
              inputLabel="USDC"
              enableMax={true}
              maxButtonOnClick={handleMaxPerOrderButtonClick}
              helperText="Maximum amount counterparty can take per order"
            />
          </AmountRangeContainer>
        </SettingsContent>
      </DetailsDropdown>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  background: ${colors.container};
  overflow: hidden;
  width: 100%;
  border: 1px solid ${colors.defaultBorderColor};
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  min-height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20px;  
  width: 90%;
  border-bottom: ${({ $isOpen }) => $isOpen ? `1px solid ${colors.defaultBorderColor}` : 'none'};
  position: relative;
`;

const TitleLabel = styled.div`
  flex: 1;
  text-align: left;
  font-size: 16px;
  padding: 0 5px;

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const StyledChevronDown = styled(ChevronDown)<{ $isOpen: boolean }>`
  position: absolute;
  right: 15px;
  width: 20px;
  height: 20px;
  color: ${colors.darkText};
  cursor: pointer;
  transition: transform 0.4s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DetailsDropdown = styled.div<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${colors.container};
  color: ${colors.darkText};
  align-items: center;
  overflow: hidden;
  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0px'};
  transition: max-height 0.4s ease-out;
`;

const SettingsContent = styled.div`
  width: 90%;
  padding: 16px;
`;

const AmountRangeContainer = styled.div`
  gap: 1rem;
  display: flex;
  flex-direction: row;
`; 