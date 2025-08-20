import React, { ChangeEvent, useState } from "react";
import styled from 'styled-components';

import { CurrencySelector } from '@components/modals/selectors/currency';
import { colors } from '@theme/colors';
import { currencies } from '@helpers/types';

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
  inputLabel?: string;
  readOnly?: boolean;
  accessoryLabel?: string;
  hasSelector?: boolean;
  selectorDisabled?: boolean;
  enableMax?: boolean
  maxButtonOnClick?: () => void;
  fontSize?: number;
  selectedCurrency?: string;
  setSelectedCurrency?: (currency: string) => void;
  isPulsing?: boolean;
}

export const InputWithCurrencySelector: React.FC<InputProps> = ({
  label,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder,
  inputLabel,
  type = "text",
  readOnly = false,
  accessoryLabel="",
  hasSelector=false,
  selectorDisabled=false,
  enableMax=false,
  maxButtonOnClick=() => {},
  fontSize = 28,
  selectedCurrency,
  setSelectedCurrency,
  isPulsing = false,
}: InputProps) => {
  InputWithCurrencySelector.displayName = "InputWithCurrencySelector";

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  /*
   * Helper
   */

  const dynamicFontSize = value && value.length > 0 
      ? Math.max(fontSize - Math.floor(value.length / 18) * 3.5, 12)
      : fontSize;

  return (
    <Container readOnly={readOnly} isFocused={isFocused}>
      <LabelAndTooltipContainer>
        <Label htmlFor={name}>{label}</Label>
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            readOnly={readOnly}
            fontSize={dynamicFontSize}
            spellCheck={false}
            autoComplete={"off"}
            isPulsing={isPulsing}
          />
        </InputWrapper>

        {hasSelector ? (
          <SelectorAccessory>
            <CurrencySelector
              selectedCurrency={selectedCurrency || ''}
              setSelectedCurrency={setSelectedCurrency || (() => {})}
              allCurrencies={currencies}
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
        <AccessoryLabel />
        <RightAccessoryContainer>
          <AccessoryLabel>
            {accessoryLabel}
          </AccessoryLabel>
          {enableMax && accessoryLabel && (
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
  isFocused?: boolean;
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: ${colors.defaultInputColor};

  ${({ isFocused }) => isFocused && `
    border: 1px solid #CED4DA;
  `}
  
  ${({ readOnly }) => 
    readOnly && `
      border: 1px solid ${colors.readOnlyBorderColor};
      background-color: ${colors.readOnlyInputColor};
    `
  }
`;

const LabelAndInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
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
  isPulsing?: boolean;
}

const StyledInput = styled.input<StyledInputProps & { fontSize?: number }>`
  width: 100%;
  height: 27.5px;
  border: 0;
  padding: 0;
  color: #FFFFFF;
  background-color: #131A2A;
  font-size: ${({ fontSize }) => fontSize || '28'}px;


  &:focus {
    box-shadow: none;
    outline: none;
  }

  &:placeholder {
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

const SelectorAccessory = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #CED4DA;
  padding-top: 8px;
`;

const AccessoryAndInputLabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #CED4DA;
  margin: 9px 0px 2px 0px;
`;

const AccessoryLabelAndMax = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
`;

const MaxButton = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 1px;
  cursor: pointer;
`;

const AccessoryLabel = styled.div`
  font-size: 14px;
  text-align: right;
  font-weight: 550;
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

const RightAccessoryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;