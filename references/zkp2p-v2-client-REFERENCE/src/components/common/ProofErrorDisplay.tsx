import React, { useState } from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'react-feather';

import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { ProofGenerationError } from '@helpers/proofErrorParser';
import { PaymentPlatformType } from '@helpers/types';
import { CopyButton } from '@components/common/CopyButton';


interface ProofErrorDisplayProps {
  error: ProofGenerationError;
  platform: PaymentPlatformType;
}

export const ProofErrorDisplay: React.FC<ProofErrorDisplayProps> = ({
  error,
  platform
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'TIMEOUT':
        return <Clock size={20} />;
      case 'EXTENSION_ERROR':
        return <XCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  return (
    <ErrorContainer>
      <ErrorHeader>
        <ErrorIconWrapper $type={error.type}>
          {getErrorIcon()}
        </ErrorIconWrapper>
        <ErrorTitle>{error.userMessage}</ErrorTitle>
      </ErrorHeader>

      <ErrorBody>
        {error.suggestedActions.length > 0 && (
          <ActionsSection>
            <ActionsList>
              {error.suggestedActions.map((action, index) => (
                <ActionItem key={index}>
                  <CheckCircle size={14} color={colors.validGreen} />
                  <span>{action}</span>
                </ActionItem>
              ))}
            </ActionsList>
          </ActionsSection>
        )}

        {/* TODO: Add technical details toggle */}
        {/* <DetailsToggle onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? (
            <>
              <ChevronUp size={16} />
              Hide Technical Details
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show Technical Details
            </>
          )}
        </DetailsToggle>

        {showDetails && (
          <TechnicalDetails>
            <CopyButtonWrapper>
              <CopyButton textToCopy={error.technicalDetails} />
            </CopyButtonWrapper>
            <pre>{error.technicalDetails}</pre>
          </TechnicalDetails>
        )} */}
      </ErrorBody>
    </ErrorContainer>
  );
};

const ErrorContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ErrorIconWrapper = styled.div<{ $type: string }>`
  color: ${({ $type }) => {
    switch ($type) {
      case 'TIMEOUT': return colors.warningYellow;
      case 'EXTENSION_ERROR': return colors.warningRed;
      default: return colors.warningYellow;
    }
  }};
`;

const ErrorTitle = styled(ThemedText.BodyPrimary)`
  font-weight: 600;
  color: ${colors.white};
`;

const ErrorBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;


const ActionsSection = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled(ThemedText.LabelSmall)`
  color: ${colors.textSecondary};
  margin-bottom: 0.5rem;
`;

const ActionsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${colors.white};
  font-size: 14px;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;


const DetailsToggle = styled.button`
  background: none;
  border: none;
  color: ${colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  transition: color 0.2s;

  &:hover {
    color: ${colors.white};
  }
`;

const TechnicalDetails = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  position: relative;

  pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    color: ${colors.textSecondary};
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const CopyButtonWrapper = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
`;
