import React from 'react';
import styled from 'styled-components';
import { Zap, Shield, AlertCircle } from 'react-feather';
import { colors } from '@theme/colors';

interface SmartAccountBadgeProps {
  status: 'idle' | 'pending' | 'authorized' | 'failed' | 'unauthorized';
  gasSponsored?: boolean;
  compact?: boolean;
}

export const SmartAccountBadge: React.FC<SmartAccountBadgeProps> = ({ 
  status, 
  gasSponsored = true,
  compact = false 
}) => {
  if (status === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'unauthorized':
        return {
          icon: <Shield size={14} />,
          text: compact ? 'Enable' : 'Enable Smart Account',
          color: colors.warningYellow,
          tooltip: 'Click to enable smart account features including gas-free transactions',
        };
      case 'pending':
        return {
          icon: <Shield size={14} />,
          text: compact ? 'Signing...' : 'Authorizing...',
          color: colors.linkBlue,
          tooltip: 'Please sign the authorization in your wallet',
        };
      case 'authorized':
        return {
          icon: gasSponsored ? <Zap size={14} /> : <Shield size={14} />,
          text: gasSponsored ? (compact ? 'Gas Free' : 'Gas Sponsored') : 'Smart Account',
          color: colors.validGreen,
          tooltip: gasSponsored 
            ? 'Your transactions are sponsored - no gas fees!' 
            : 'Smart account enabled',
        };
      case 'failed':
        return {
          icon: <AlertCircle size={14} />,
          text: compact ? 'Error' : 'Authorization Error',
          color: colors.warningRed,
          tooltip: 'Failed to authorize smart account. Click to retry.',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <BadgeContainer $color={config.color} $compact={compact} title={config.tooltip}>
      {config.icon}
      <BadgeText>{config.text}</BadgeText>
    </BadgeContainer>
  );
};

const BadgeContainer = styled.div<{ $color: string; $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${props => props.$compact ? '4px 8px' : '6px 12px'};
  background: ${props => `${props.$color}20`};
  border: 1px solid ${props => `${props.$color}40`};
  border-radius: 16px;
  cursor: ${props => props.$color === colors.warningYellow || props.$color === colors.warningRed ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  
  svg {
    color: ${props => props.$color};
  }
  
  &:hover {
    background: ${props => `${props.$color}30`};
    border-color: ${props => `${props.$color}60`};
  }
`;

const BadgeText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
`;