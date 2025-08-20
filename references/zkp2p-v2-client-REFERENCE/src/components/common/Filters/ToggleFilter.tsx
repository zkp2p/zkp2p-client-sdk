import React from 'react';
import styled from 'styled-components';
import { Check } from 'react-feather';

import { FilterInput, FilterValue } from './FilterInput';
import { colors } from '@theme/colors';

interface ToggleFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  width?: string;
}

export const ToggleFilter: React.FC<ToggleFilterProps> = ({
  checked,
  onChange,
  label,
  width = 'auto'
}) => {
  return (
    <FilterInput 
      onClick={() => onChange(!checked)} 
      isActive={checked}
      width={width}
    >
      <Checkbox $checked={checked}>
        {checked && <Check size={12} />}
      </Checkbox>
      <FilterValue style={{ color: checked ? colors.white : colors.lightGrayText }}>
        {label}
      </FilterValue>
    </FilterInput>
  );
};

const Checkbox = styled.div<{ $checked: boolean }>`
  width: 18px;
  height: 18px;
  border: 1px solid ${props => props.$checked ? colors.buttonDefault : colors.defaultBorderColor};
  background: ${props => props.$checked ? colors.buttonDefault : 'transparent'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  svg {
    color: ${colors.white};
  }
`;