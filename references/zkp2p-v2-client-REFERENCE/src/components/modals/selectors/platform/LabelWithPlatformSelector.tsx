import React from 'react';
import styled from 'styled-components';
import { PlatformSelector } from '@components/modals/selectors/platform';
import { PaymentPlatformType } from '@helpers/types';
import { colors } from '@theme/colors';

interface LabelWithPlatformSelectorProps {
  label: string;
  selectedPlatform: PaymentPlatformType;
  setSelectedPlatform: (platform: PaymentPlatformType) => void;
  allPlatforms?: PaymentPlatformType[];
}

export const LabelWithPlatformSelector: React.FC<LabelWithPlatformSelectorProps> = ({
  label,
  selectedPlatform,
  setSelectedPlatform,
  allPlatforms
}) => {
  return (
    <Container>
      <Label>
        {label}
      </Label>
      <SelectorWrapper>
        <PlatformSelector
          paymentPlatform={selectedPlatform}
          setPaymentPlatform={setSelectedPlatform}
          allPlatforms={allPlatforms}
        />
      </SelectorWrapper>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: ${colors.defaultInputColor};

  &:focus-within {
    border-color: #CED4DA;
    border-width: 1px;
  }
`;

const Label = styled.label`
  display: flex;
  font-size: 14px;
  font-weight: 550;
  color: #CED4DA;
`;

const SelectorWrapper = styled.div`
  display: flex;
  align-items: center;
`;
