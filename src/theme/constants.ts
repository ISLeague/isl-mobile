/**
 * Constantes de diseño y espaciado
 * Centraliza valores numéricos para mantener consistencia
 */

// 📏 SPACING
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// 📐 BORDER RADIUS
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
} as const;

// 🎨 OPACITY
export const OPACITY = {
  disabled: 0.5,
  overlay: 0.5,
  hover: 0.8,
} as const;

// 📏 SIZES
export const SIZES = {
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  avatar: {
    sm: 40,
    md: 50,
    lg: 80,
    xl: 100,
  },
  button: {
    height: 48,
    minWidth: 100,
  },
  input: {
    height: 48,
  },
} as const;

// 🔤 FONT SIZES
export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 28,
} as const;

// 🖼️ SHADOWS
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

// 📱 Z-INDEX
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ⏱️ DURATIONS
export const DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// 📊 HITSLOP (Para mejorar táctil en áreas pequeñas)
export const HIT_SLOP = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

// 📏 LIST OPTIMIZATIONS
export const LIST_CONFIG = {
  windowSize: 5,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
} as const;
