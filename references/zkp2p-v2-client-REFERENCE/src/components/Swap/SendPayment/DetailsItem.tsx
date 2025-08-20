import styled, { css, keyframes } from 'styled-components';

import QuestionHelper from '@components/common/QuestionHelper';
import { Row } from '@components/common/Layout';
import { colors } from '@theme/colors';
import { CopyButton } from '@components/common/CopyButton';

interface DetailsItemProps {
  label: string;
  value: string | React.ReactNode;
  suffixValue?: string;
  helperText?: string;
  colorOverride?: string;
  copyable?: boolean;
  loading?: boolean;
  maxLength?: number;
  padding?: string;
  fontSize?: string;
  labelHelperText?: string;
};

export const DetailsItem: React.FC<DetailsItemProps> = ({
  label,
  value,
  suffixValue,
  helperText,
  colorOverride,
  copyable,
  loading,
  maxLength,
  padding,
  fontSize,
  labelHelperText
}) => {
  const truncateValue = (val: string) => {
    if (!maxLength || val.length <= maxLength) return val;
    const halfLength = Math.floor((maxLength - 3) / 2);
    return `${val.slice(0, halfLength)}...${val.slice(-halfLength)}`;
  };

  const displayValue = typeof value === 'string' ? truncateValue(value) : value;

  return (
    <Container $padding={padding} $fontSize={fontSize}>
      <LabelAndHelperTextContainer>
        <Label
          $colorOverride={colorOverride}
        >
          {label}
        </Label>

        {labelHelperText && (
          <QuestionHelper
            text={labelHelperText}
            size="xsm"
            color={colors.grayText}
          />
        )}
      </LabelAndHelperTextContainer>

      <ValueAndQuestionMarkContainer>
        <Value
          $colorOverride={colorOverride}
          $loading={loading}
        >
          {displayValue}
        </Value>

        {suffixValue && (
          <SuffixValue>
            {suffixValue}
          </SuffixValue>
        )}

        {copyable && typeof value === 'string' && (
          <CopyButton textToCopy={value} size="sm" />
        )}

        {helperText && (
          <QuestionHelper
            text={helperText}
          />
        )}
      </ValueAndQuestionMarkContainer>
    </Container>
  );
};

const Container = styled(Row)<{ $padding?: string; $fontSize?: string }>`
  font-size: ${props => props.$fontSize || '14px'};
  justify-content: space-between;
  padding: ${props => props.$padding || '0 20px'};
  min-height: 12px;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const LabelAndHelperTextContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const Label = styled.div<{ $colorOverride?: string }>`
  color: ${props => props.$colorOverride || colors.grayText};
  font-weight: ${props => props.$colorOverride ? '600' : 'normal'};
`;

const SuffixValue = styled.div`
  color: ${colors.grayText};
  font-weight: normal;
`;

const ValueAndQuestionMarkContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
`;

// Define the pulse animation using keyframes
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

const Value = styled.div<{ $colorOverride?: string; $loading?: boolean }>`
  color: ${props => props.$colorOverride || colors.darkText};
  font-weight: ${props => props.$colorOverride ? '600' : 'normal'};
  ${props => props.$loading && css`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
`;
