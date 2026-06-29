import { colors } from './colors';

export const theme = Object.freeze({
  colors: {
    background: colors.background,
    surface: colors.surface,
    primary: colors.primary,
    primarySoft: colors.primarySurface,
    onPrimary: colors.textOnPrimary,
    text: colors.textPrimary,
    textMuted: colors.textMuted,
    border: colors.border,
    danger: colors.danger,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    full: 999,
  },
});
