const dark = {
  canvas: '#090B0D',
  surface: '#14191D',
  surfaceMuted: '#252D32',
  surfaceStrong: '#0C1012',
  glassSurface: 'rgba(20, 27, 31, 0.82)',
  glassWeb: 'rgba(30, 42, 37, 0.54)',
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
  brandText: '#D9FF57',
  shadow: 'rgba(0, 0, 0, 0.3)',
  coffeeTint: '#3B2A18',
  drinksTint: '#3A201D',
  foodTint: '#3A211D',
  gamingTint: '#292445',
  walkTint: '#17323A',
  gymTint: '#1E3520',
  hangoutTint: '#1D2D4A',
  customTint: '#27312B',
  availabilityTint: '#2D3A1A',
};

export type Colors = typeof dark;

const light: Colors = {
  canvas: '#F5F6F1',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EBE3',
  surfaceStrong: '#FFFFFF',
  glassSurface: 'rgba(255, 255, 255, 0.86)',
  glassWeb: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(18, 23, 26, 0.12)',
  glassHighlight: 'rgba(18, 23, 26, 0.05)',
  ink: '#12171A',
  muted: '#566065',
  faint: '#8A9498',
  line: '#DADFD5',
  brand: '#C9F23A',
  brandPressed: '#A8D11C',
  brandInk: '#16200A',
  brandWash: 'rgba(201, 242, 58, 0.28)',
  electric: '#4458E0',
  violet: '#7B4FD6',
  sky: '#0E8FA3',
  coral: '#D9482F',
  coffee: '#A86200',
  drinks: '#D9482F',
  food: '#CF3B28',
  gaming: '#6548E0',
  walk: '#0E8FA3',
  gym: '#3B8A1C',
  hangout: '#2C66D8',
  custom: '#5C676B',
  availability: '#4E6B00',
  error: '#B93A33',
  overlay: 'rgba(18, 23, 26, 0.42)',
  brandText: '#4E6B00',
  shadow: 'rgba(18, 23, 26, 0.10)',
  coffeeTint: '#FBEBD2',
  drinksTint: '#FCE2DC',
  foodTint: '#FCE0DB',
  gamingTint: '#E8E3FB',
  walkTint: '#D9F1F4',
  gymTint: '#E1F2D8',
  hangoutTint: '#DEE9FB',
  customTint: '#E6EAE8',
  availabilityTint: '#E9F6BF',
};

export const palettes = { dark, light };
export type Scheme = keyof typeof palettes;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 };
export const radius = { card: 20, sheet: 30, button: 14, icon: 14, chip: 999 };
export const motion = {
  celebration: 480,
  // How far a block is stretched, squeezed, blurred (px), dimmed and faded when fully past a list edge.
  stretch: { stretch: 0.3, squeeze: 0.06, blur: 20, dim: 0.25, fade: 0.5 },
};
export const shadowCard = (colors: Colors) => ({ boxShadow: `0px 8px 16px ${colors.shadow}`, elevation: 3 });
export const type = {
  title: { fontSize: 34, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -1.4 },
  section: { fontSize: 22, lineHeight: 27, fontWeight: '800' as const, letterSpacing: -0.6 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1.1 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
};

const activityInfo = {
  coffee: { label: 'Coffee', icon: 'cafe-outline' },
  drinks: { label: 'Drinks', icon: 'wine-outline' },
  food: { label: 'Food', icon: 'restaurant-outline' },
  gaming: { label: 'Gaming', icon: 'game-controller-outline' },
  walk: { label: 'Walk', icon: 'walk-outline' },
  gym: { label: 'Gym', icon: 'barbell-outline' },
  hangout: { label: 'Hang out', icon: 'sunny-outline' },
  custom: { label: 'Custom', icon: 'sparkles-outline' },
  availability: { label: 'Free', icon: 'radio-button-on-outline' },
} as const;

export type ActivityType = keyof typeof activityInfo;
export const activityTypes = Object.keys(activityInfo) as ActivityType[];
export const isActivityType = (value: string): value is ActivityType => value in activityInfo;

export function activityMetaFor(colors: Colors) {
  const entries = activityTypes.map((activity) => [activity, { ...activityInfo[activity], color: colors[activity], tint: colors[`${activity}Tint`] }] as const);
  return Object.fromEntries(entries) as Record<ActivityType, { label: string; icon: string; color: string; tint: string }>;
}

export const activityLabel = (activity: ActivityType) => activityInfo[activity].label;
