export const colors = {
  canvas: '#090B0D',
  surface: '#14191D',
  surfaceMuted: '#252D32',
  surfaceStrong: '#0C1012',
  glassSurface: 'rgba(20, 27, 31, 0.82)',
  glassBorder: 'rgba(244, 247, 242, 0.16)',
  glassHighlight: 'rgba(244, 247, 242, 0.08)',
  ink: '#F4F7F2',
  muted: '#AAB3B5',
  faint: '#737E81',
  line: '#2B3439',
  brand: '#D9FF57',
  brandPressed: '#BEE543',
  brandInk: '#16200A',
  brandWash: 'rgba(22, 32, 10, 0.14)',
  electric: '#7183FF',
  violet: '#BE8BFF',
  sky: '#72D9E5',
  coral: '#FF826E',
  coffee: '#F2B35C',
  drinks: '#FF806A',
  food: '#FF7968',
  gaming: '#9B82FF',
  walk: '#6ED6E7',
  gym: '#A1D978',
  hangout: '#79A8FF',
  custom: '#879296',
  availability: '#D9FF57',
  error: '#C8564F',
  overlay: 'rgba(0,0,0,0.58)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 };
export const radius = { card: 20, sheet: 30, button: 14, icon: 14, chip: 999 };
export const shadow = {
  card: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)', elevation: 3 },
};
export const type = {
  title: { fontSize: 34, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -1.4 },
  section: { fontSize: 22, lineHeight: 27, fontWeight: '800' as const, letterSpacing: -0.6 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1.1 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
};

export const activityMeta = {
  coffee: { label: 'Coffee', icon: 'cafe-outline', color: colors.coffee, tint: '#3B2A18' },
  drinks: { label: 'Drinks', icon: 'wine-outline', color: colors.drinks, tint: '#3A201D' },
  food: { label: 'Food', icon: 'restaurant-outline', color: colors.food, tint: '#3A211D' },
  gaming: { label: 'Gaming', icon: 'game-controller-outline', color: colors.gaming, tint: '#292445' },
  walk: { label: 'Walk', icon: 'walk-outline', color: colors.walk, tint: '#17323A' },
  gym: { label: 'Gym', icon: 'barbell-outline', color: colors.gym, tint: '#1E3520' },
  hangout: { label: 'Hang out', icon: 'sunny-outline', color: colors.hangout, tint: '#1D2D4A' },
  custom: { label: 'Custom', icon: 'sparkles-outline', color: colors.custom, tint: '#27312B' },
  availability: { label: 'Free', icon: 'radio-button-on-outline', color: colors.availability, tint: '#2D3A1A' },
} as const;

export type ActivityType = keyof typeof activityMeta;
