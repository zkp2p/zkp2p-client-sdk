import React from 'react';
import { Search } from 'react-feather';
import styled from 'styled-components';

import { FilterInput, FilterTextInput } from './FilterInput';
import { colors } from '@theme/colors';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  width = '200px'
}) => {
  return (
    <FilterInput isActive={!!value} width={width}>
      <SearchIcon>
        <Search size={16} />
      </SearchIcon>
      <FilterTextInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FilterInput>
  );
};

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${colors.grayText};
`;