import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  formatLabel?: (value: number) => string;
  showLabels?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  formatLabel,
  showLabels = true,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <SliderContainer>
      <SliderTrack>
        <SliderFill style={{ width: `${percentage}%` }} />
        <SliderInput
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
        <SliderThumb style={{ left: `${percentage}%` }} />
      </SliderTrack>
      {showLabels && (
        <SliderLabels>
          <SliderLabel>{formatLabel ? formatLabel(min) : min}</SliderLabel>
          <SliderLabel>{formatLabel ? formatLabel(max) : max}</SliderLabel>
        </SliderLabels>
      )}
    </SliderContainer>
  );
};

const SliderContainer = styled.div`
  width: 100%;
  padding: 4px 0;
`;

const SliderTrack = styled.div`
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  margin: 12px 0;
`;

const SliderFill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${colors.buttonDefault};
  border-radius: 2px;
  pointer-events: none;
  transition: width 0.1s ease;
`;

const SliderInput = styled.input`
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 20px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;

  &:disabled {
    cursor: not-allowed;
  }
  
  &:active ~ div:last-child {
    box-shadow: 0 0 0 6px rgba(255, 63, 62, 0.15), 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const SliderThumb = styled.div`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: ${colors.white};
  border: 2px solid ${colors.buttonDefault};
  border-radius: 50%;
  pointer-events: none;
  transition: left 0.1s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const SliderLabel = styled.span`
  font-size: 12px;
  color: ${colors.grayText};
`;