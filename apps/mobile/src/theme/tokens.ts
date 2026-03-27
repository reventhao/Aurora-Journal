export const colors = {
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceMuted: '#eef4fb',
  surfaceStrong: '#0f172a',
  border: 'rgba(15, 23, 42, 0.08)',
  text: '#0f172a',
  textSoft: '#475569',
  textMuted: '#7c8aa5',
  brand: '#165dff',
  brandStrong: '#1047c7',
  success: '#0f9f6e',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  page: 20,
} as const;

export const radii = {
  input: 16,
  card: 24,
  hero: 28,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
  hero: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 4,
  },
} as const;
