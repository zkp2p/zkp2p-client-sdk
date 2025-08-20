import React from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { TokenData } from '@helpers/types/tokens';
import { Check } from 'react-feather';

interface ChainBreadcrumbProps {
  sourceToken: TokenData | null;
  destinationToken: TokenData | null;
  isActive?: boolean;
  hasSourceTx?: boolean;
  hasDestTx?: boolean;
}

const BreadcrumbContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0;
  background: transparent;
  margin: 0;
  
  @media (max-width: 600px) {
    gap: 0.4rem;
  }
`;

const ChainItem = styled.div<{ isActive?: boolean; isComplete?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
`;

const ChainIconContainer = styled.div<{ isActive?: boolean; isComplete?: boolean }>`
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isComplete ? colors.validGreen : colors.container};
  border: 1.5px solid ${props => 
    props.isComplete ? colors.validGreen : 
    props.isActive ? colors.buttonDefault : 
    colors.defaultBorderColor
  };
  transition: all 0.3s ease;
  
  @media (max-width: 600px) {
    width: 24px;
    height: 24px;
  }
`;

const ChainIcon = styled.img`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  
  @media (max-width: 600px) {
    width: 16px;
    height: 16px;
  }
`;

const CheckIcon = styled(Check)`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 11px;
  height: 11px;
  padding: 1px;
  background: ${colors.validGreen};
  border-radius: 50%;
  color: white;
`;

const ChainLabel = styled(ThemedText.Caption)<{ isActive?: boolean }>`
  display: none; // Hide labels for inline view
  color: ${props => props.isActive ? colors.textPrimary : colors.textSecondary};
  font-weight: ${props => props.isActive ? 500 : 400};
  transition: all 0.3s ease;
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
`;

const flowAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const ArrowContainer = styled.div<{ isActive?: boolean; isComplete?: boolean }>`
  display: flex;
  align-items: center;
  position: relative;
  width: 20px;
  
  @media (max-width: 600px) {
    width: 16px;
  }
`;

const Arrow = styled.div<{ isActive?: boolean; isComplete?: boolean }>`
  width: 100%;
  height: 1px;
  background: ${props => 
    props.isComplete ? colors.validGreen :
    props.isActive ? 
      `linear-gradient(90deg, 
        ${colors.buttonDefault} 0%, 
        ${colors.buttonHover} 50%, 
        ${colors.buttonDefault} 100%)` :
    colors.defaultBorderColor
  };
  background-size: 200% 100%;
  position: relative;
  animation: ${props => props.isActive ? flowAnimation : 'none'} 2s ease infinite;
  
  &::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid ${props => 
      props.isComplete ? colors.validGreen :
      props.isActive ? colors.buttonDefault :
      colors.defaultBorderColor
    };
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
  }
`;

const PulsingDot = styled.div<{ isActive?: boolean }>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: ${colors.buttonDefault};
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: ${props => props.isActive ? pulse : 'none'} 1.5s ease-in-out infinite;
  display: ${props => props.isActive ? 'block' : 'none'};
`;

const ProgressIndicator = styled.div<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => props.progress}%;
  background: ${colors.buttonDefault};
  transition: width 0.5s ease;
  opacity: 0.8;
`;

export const ChainBreadcrumb: React.FC<ChainBreadcrumbProps> = ({
  sourceToken,
  destinationToken,
  isActive = false,
  hasSourceTx = false,
  hasDestTx = false,
}) => {
  if (!sourceToken || !destinationToken) {
    return null;
  }
  
  const sourceComplete = hasSourceTx;
  const destinationComplete = hasDestTx;
  const fullyComplete = sourceComplete && destinationComplete;

  return (
    <BreadcrumbContainer>
      <ChainItem isActive={isActive} isComplete={sourceComplete}>
        <ChainIconContainer isActive={isActive} isComplete={sourceComplete}>
          <ChainIcon src={sourceToken.chainIcon} alt={sourceToken.chainName} />
          {sourceComplete && <CheckIcon />}
        </ChainIconContainer>
        <ChainLabel isActive={isActive}>
          {sourceToken.chainName}
        </ChainLabel>
      </ChainItem>

      <ArrowContainer isActive={isActive} isComplete={fullyComplete}>
        <Arrow isActive={isActive && !fullyComplete} isComplete={fullyComplete}>
          {isActive && !fullyComplete && (
            <>
              <PulsingDot isActive={true} />
              <ProgressIndicator progress={sourceComplete ? 50 : 0} />
            </>
          )}
        </Arrow>
      </ArrowContainer>

      <ChainItem isActive={isActive} isComplete={destinationComplete}>
        <ChainIconContainer 
          isActive={isActive && sourceComplete} 
          isComplete={destinationComplete}
        >
          <ChainIcon src={destinationToken.chainIcon} alt={destinationToken.chainName} />
          {destinationComplete && <CheckIcon />}
        </ChainIconContainer>
        <ChainLabel isActive={isActive && sourceComplete}>
          {destinationToken.chainName}
        </ChainLabel>
      </ChainItem>
    </BreadcrumbContainer>
  );
};

export default ChainBreadcrumb;