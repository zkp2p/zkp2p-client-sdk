import React from 'react';

import DefaultTokenLogo from '@icons/svg/ethereum-token-logo.svg?react';
import DarkGithubLogo from '@icons/svg/dark-github.svg?react';
import DarkTwitterLogo from '@icons/svg/dark-twitter.svg?react';
import DarkUsdcLogo from '@icons/svg/dark-usdc.svg?react';
import DarkTelegramLogo from '@icons/svg/dark-telegram.svg?react';
import LightningIcon from '@icons/svg/dark-lightning.svg?react';
import CashIcon from '@icons/svg/dark-cash.svg?react';
import PadlockIcon from '@icons/svg/dark-padlock.svg?react';
import DownArrowIcon from '@icons/svg/dark-arrow-down.svg?react';

import './SVGIcon.css';


interface SVGIconProps {
  iconName: string
  width?: string,
  height?: string,
};

export const SVGIcon: React.FC<SVGIconProps> = ({
  iconName = 'ethereum-logo',
  width,
  height
}) => {
  let Icon;
  switch (iconName) {
    case 'dark-telegram':
      Icon = DarkTelegramLogo;
      break;

    case 'dark-github':
      Icon = DarkGithubLogo;
      break;

    case 'dark-usdc':
      Icon = DarkUsdcLogo;
      break;

    case 'dark-twitter':
      Icon = DarkTwitterLogo;
      break;

    case 'ethereum-logo':
      Icon = DefaultTokenLogo;
      break;

    case 'dark-lightning':
      Icon = LightningIcon;
      break;

    case 'dark-cash':
      Icon = CashIcon;
      break;

    case 'dark-padlock':
      Icon = PadlockIcon;
      break;

    case 'dark-arrow-down':
      Icon = DownArrowIcon;
      break;

    default:
      Icon = DefaultTokenLogo;
  }

  return <Icon className="svg" width={width} height={height} />;
};
