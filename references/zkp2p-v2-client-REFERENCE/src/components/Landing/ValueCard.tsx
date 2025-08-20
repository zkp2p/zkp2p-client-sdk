import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';

const StyledCard = styled.div`
  background-color: ${colors.defaultInputColor};
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ValueItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ValueHeader = styled.div`
  font-size: 24px;
  line-height: 36px;
  font-weight: 600;
  color: ${colors.darkText};
`;

const ValueDescription = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 18px;
  line-height: 28px;
  color: ${colors.darkText};
  max-width: 480px;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  font-size: 24px;
`;

interface ValueCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ValueCard: React.FC<ValueCardProps> = ({ title, description, icon }) => {
  return (
    <StyledCard>
      <ValueItemRow>
        <ValueHeader>{title}</ValueHeader>
        <IconWrapper>{icon}</IconWrapper>
      </ValueItemRow>
      <ValueDescription>{description}</ValueDescription>
    </StyledCard>
  );
};

export default ValueCard;
