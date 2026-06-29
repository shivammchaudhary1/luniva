export const colors = {
  /*
   * Official Luniva brand palette
   */
  primary: '#6E3B78',
  primarySoft: '#9A66B5',
  accent: '#D8B4FF',
  background: '#F7E7FF',
  pink: '#FAD1E6',
  textPrimary: '#2D1B36',

  /*
   * Surfaces
   */
  surface: '#FFFFFF',
  surfaceSoft: '#FCF9FD',
  surfaceMuted: '#F4EDF7',
  primarySurface: '#F0E7F3',
  pinkSurface: '#FFF1F8',

  /*
   * Text
   */
  textSecondary: '#6E3B78',
  textMuted: '#8A788F',
  textOnPrimary: '#FFFFFF',
  textDisabled: '#B2A4B7',

  /*
   * Borders and separators
   */
  border: '#E2D5E8',
  borderStrong: '#CDB7D8',
  divider: '#E9DFED',

  /*
   * Feedback colors
   *
   * These are semantic accessibility colors.
   * The main product UI still uses the Luniva
   * purple and pink palette.
   */
  success: '#2F7D62',
  successSurface: '#EAF6F0',

  warning: '#8A5A22',
  warningSurface: '#FFF7E7',

  danger: '#B33A50',
  dangerSurface: '#FFF1F4',

  info: '#5C6FA3',
  infoSurface: '#EEF1FA',

  /*
   * Cycle calendar colors
   */
  periodRecorded: '#C53D4D',
  periodPredicted: '#E88FA1',
  fertility: '#E59B2F',
  ovulation: '#7D54A3',
  lowerLikelihood: '#7E91AD',

  /*
   * Utility colors
   */
  transparent: 'transparent',
  overlay: 'rgba(45, 27, 54, 0.48)',
  pressedOverlay: 'rgba(110, 59, 120, 0.10)',
} as const;

export type LunivaColor = (typeof colors)[keyof typeof colors];
