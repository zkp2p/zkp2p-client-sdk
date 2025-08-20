import { colors } from './colors';

const theme = {
  // Color properties used in components
  neutral1: colors.darkText,
  backgroundInteractive: colors.iconButtonDefault,
  
  // All color exports
  ...colors,
  
  // Override textSecondary to use grayText
  textSecondary: colors.grayText,
};

export default theme;