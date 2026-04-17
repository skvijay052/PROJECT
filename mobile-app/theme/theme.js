import { Platform } from 'react-native';

export const Colors = {
  bg: 'transparent',
  backdrop: '#F7FCFD',
  chatPageBg: 'transparent',
  surface: '#FFFFFF',
  skeletonBgColor: '#FFFFFF',
  chip: 'rgba(255, 255, 255, 0.82)',
  skeleton: '#F4F7FB',
  skeletonGlow: '#FBFDFF',
  text: '#111114',
  muted: '#666A76',
  border: 'rgba(147, 151, 181, 0.22)',
  online: '#2ECC71',
  danger: '#FF5A5F',
  tabInactive: '#9DA0AF',
  accent: '#A02DFF',
  accentSoft: '#CAA5FF',
  accentGlow: '#F3E9FF',
};

export const Radii = {
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 36,
  pill: 999,
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

const createShadow = (shadowColor, shadowOpacity, shadowRadius, shadowHeight, elevation) => (
  Platform.select({
    ios: {
      shadowColor,
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: shadowHeight },
    },
    android: {
      shadowColor,
      elevation,
    },
    default: {},
  })
);

export const Shadows = {
  card: createShadow('#A28CCF', 0.18, 26, 14, 12),
  chip: createShadow('#8FCFD0', 0.12, 18, 8, 7),
};
