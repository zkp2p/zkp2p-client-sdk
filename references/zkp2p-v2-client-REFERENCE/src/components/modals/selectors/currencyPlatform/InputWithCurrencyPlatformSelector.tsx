import React, { ChangeEvent } from "react";
import styled from 'styled-components';
import QuestionHelper from '@components/common/QuestionHelper';

import { CurrencyPlatformSelector } from '@components/modals/selectors/currencyPlatform/CurrencyPlatformSelector';
import { colors } from '@theme/colors';
import { CurrencyType, PaymentPlatformType } from '@helpers/types';
import { currencies } from '@helpers/types/currency';

interface InputProps {
  label: string;
  name: string;
  value?: string;
  type?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  accessoryLabel?: string;
  inputLabel?: string;
  hasSelector?: boolean;
  selectorDisabled?: boolean;
  enableMax?: boolean
  maxButtonOnClick?: () => void;
  fontSize?: number;
  selectedCurrency: CurrencyType | null;
  setSelectedCurrency: (currency: CurrencyType) => void;
  selectedPlatform: PaymentPlatformType | null;
  setSelectedPlatform: (platform: PaymentPlatformType) => void;
  allPlatforms?: PaymentPlatformType[];
  isPulsing?: boolean;
  leftAccessoryLabel?: string;
  lockLabel?: string;
  displayMode?: 'currency' | 'platform' | 'both';
}

export const InputWithCurrencyPlatformSelector: React.FC<InputProps> = ({
  label,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder,
  type = "text",
  readOnly = false,
  inputLabel = "",
  hasSelector = true,
  selectorDisabled = false,
  accessoryLabel = "",
  enableMax = false,
  maxButtonOnClick = () => {},
  fontSize = 28,
  selectedCurrency,
  setSelectedCurrency,
  selectedPlatform,
  setSelectedPlatform,
  allPlatforms = [],
  isPulsing = false,
  leftAccessoryLabel = "",
  lockLabel,
  displayMode = 'both',
}: InputProps) => {
  InputWithCurrencyPlatformSelector.displayName = "InputWithCurrencyPlatformSelector";

  /*
   * Helper
   */

  const dynamicFontSize = value && value.length > 0 
      ? Math.max(fontSize - Math.floor(value.length / 18) * 3.5, 12)
      : fontSize;

  return (
    <Container readOnly={readOnly}>
      <LabelAndTooltipContainer>
        <Label htmlFor={name}>{label}</Label>
        {lockLabel && (
          <QuestionHelper text={lockLabel} size="sm" isLock={true} />
        )}
      </LabelAndTooltipContainer>

      <InputAndSelectorRow>
        <InputWrapper>
          <StyledInput
            type={type}
            name={name}
            id={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            readOnly={readOnly}
            fontSize={dynamicFontSize}
            spellCheck={false}
            autoComplete={"off"}
            isZero={Number(value) === 0 || value === "" || value === null} 
            isPulsing={isPulsing}
          />
        </InputWrapper>

        {hasSelector ? (
          <SelectorAccessory disabled={selectorDisabled}>
            <CurrencyPlatformSelector
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              allCurrencies={currencies}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              allPlatforms={allPlatforms}
              displayMode={displayMode}
            />
          </SelectorAccessory>
        ) : (
          inputLabel ? (
            <InputLabel>
              <span>{inputLabel}</span>
            </InputLabel>
          ) : null
        )}
      </InputAndSelectorRow>

      <AccessoryRow>
        <AccessoryLabel>
          {leftAccessoryLabel}
        </AccessoryLabel>
        <RightAccessoryContainer>
          <AccessoryLabel>
            {accessoryLabel}
          </AccessoryLabel>
          {enableMax && (
            <MaxButton onClick={maxButtonOnClick}>
              Max
            </MaxButton>
          )}
        </RightAccessoryContainer>
      </AccessoryRow>
    </Container>
  );
};

interface ContainerProps {
  readOnly?: boolean;
};

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: ${colors.defaultInputColor};

  &:focus-within {
    border-color: ${props => props.readOnly ? colors.defaultBorderColor : '#CED4DA'};
    border-width: 1px;
  }
`;

const LabelAndTooltipContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 0.25rem;
  margin-top: 4px;
  align-items: center;
  color: #CED4DA;
`;

const Label = styled.label`
  display: flex;
  font-size: 14px;
  font-weight: 550;
`;

const InputWrapper = styled.div`
  width: 100%;  
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin-top: 8px;
`;

interface StyledInputProps {
  readOnly?: boolean;
  isZero?: boolean;
  isPulsing?: boolean;
}

const StyledInput = styled.input<StyledInputProps & { fontSize?: number }>`
  width: 100%;
  height: 27.5px;
  border: 0;
  padding: 0;
  color: ${props => props.isZero ? '#6C757D' : '#FFFFFF'};
  background-color: #131A2A;
  font-size: ${({ fontSize }) => fontSize || '28'}px;

  &:focus {
    box-shadow: none;
    outline: none;
  }

  &::placeholder {
    color: #6C757D;
  }

  &[type='number'] {
    -moz-appearance: textfield;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  ${({ readOnly }) => 
    readOnly && `
      pointer-events: none;
    `
  }

  ${({ isPulsing }) =>
    isPulsing &&
    `
    animation: pulse 1.5s ease-in-out infinite;
  `}

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const SelectorAccessory = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #CED4DA;
  padding-top: 8px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
`;

const InputLabel = styled.div`
  pointer-events: none;
  color: #9ca3af;
  font-size: 20px;
  text-align: right;
`;

const InputAndSelectorRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const AccessoryRow = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 0.2rem;
  justify-content: space-between;
  align-items: center;
`;

const AccessoryLabel = styled.div`
  font-size: 14px;
  text-align: right;
  font-weight: 550;
  color: ${colors.lightGrayText}
`;

const MaxButton = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 1px;
  cursor: pointer;

  &:hover {
    color: ${colors.buttonHover};
    cursor: pointer;
  }
`;

const RightAccessoryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`; 