const light = {
  canvas: '#FFF6E5',
  surface: '#FFFFFF',
  surfaceMuted: '#F3E8D2',
  surfaceStrong: '#FFFFFF',
  glassSurface: '#FFFFFF',
  glassWeb: '#FFFFFF',
  glassBorder: '#1A1A1A',
  glassHighlight: '#F3E8D2',
  ink: '#1A1A1A',
  muted: '#5E574C',
  faint: '#9A9184',
  line: '#E4D8C0',
  // Sticker edges and hard shadows.
  outline: '#1A1A1A',
  // The white a sticker is cut from, same in both modes.
  paper: '#FFFDF7',
  brand: '#D4FF3A',
  brandPressed: '#B6E01C',
  brandInk: '#1A1A1A',
  brandWash: 'rgba(212, 255, 58, 0.35)',
  brandText: '#2E7A00',
  electric: '#4458E0',
  violet: '#7B4FD6',
  sky: '#0E8FA3',
  coral: '#E0452F',
  // Activity fills are the same in both modes; text on them is always `onColor`.
  coffee: '#FFB547',
  drinks: '#FF6F61',
  food: '#FF9148',
  gaming: '#A88BFF',
  walk: '#5FD4E6',
  gym: '#8FE063',
  hangout: '#74A9FF',
  custom: '#D8CFC0',
  availability: '#D4FF3A',
  onColor: '#1A1A1A',
  error: '#C7352B',
  overlay: 'rgba(26, 26, 26, 0.45)',
  shadow: '#1A1A1A',
  coffeeTint: '#FFE6BF',
  drinksTint: '#FFD6D1',
  foodTint: '#FFDDC4',
  gamingTint: '#E5DBFF',
  walkTint: '#CFF3F8',
  gymTint: '#DDF6CE',
  hangoutTint: '#D6E5FF',
  customTint: '#F0EADF',
  availabilityTint: '#F0FFBF',
};

export type Colors = typeof light;

const dark: Colors = {
  canvas: '#211D19',
  surface: '#2E2924',
  surfaceMuted: '#3D3730',
  surfaceStrong: '#2E2924',
  glassSurface: '#2E2924',
  glassWeb: '#2E2924',
  glassBorder: '#000000',
  glassHighlight: '#3D3730',
  ink: '#FFF6E5',
  muted: '#BDB3A3',
  faint: '#877E71',
  line: '#423C35',
  outline: '#000000',
  paper: '#FFFDF7',
  brand: '#D4FF3A',
  brandPressed: '#B6E01C',
  brandInk: '#1A1A1A',
  brandWash: 'rgba(212, 255, 58, 0.16)',
  brandText: '#D4FF3A',
  electric: '#8C9BFF',
  violet: '#BE9BFF',
  sky: '#72D9E5',
  coral: '#FF8A78',
  // Activity fills are the same in both modes; text on them is always `onColor`.
  coffee: '#FFB547',
  drinks: '#FF6F61',
  food: '#FF9148',
  gaming: '#A88BFF',
  walk: '#5FD4E6',
  gym: '#8FE063',
  hangout: '#74A9FF',
  custom: '#D8CFC0',
  availability: '#D4FF3A',
  onColor: '#1A1A1A',
  error: '#FF7B70',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  coffeeTint: '#4A3A20',
  drinksTint: '#4A2925',
  foodTint: '#4A3020',
  gamingTint: '#362E55',
  walkTint: '#1F4048',
  gymTint: '#2A4520',
  hangoutTint: '#24375A',
  customTint: '#3D3730',
  availabilityTint: '#3A4A12',
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
// The sticker look: a solid outline and a hard shadow offset down-right.
export const sticker = (colors: Colors, offset = 4) => ({ borderWidth: 2, borderColor: colors.outline, boxShadow: `${offset}px ${offset}px 0px ${colors.outline}` });
export const shadowCard = (colors: Colors) => ({ boxShadow: `4px 4px 0px ${colors.shadow}`, elevation: 0 });
// Round display face for titles and buttons; the file is already bold, so no extra weight.
export const display = { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' as const };
export const type = {
  title: { ...display, fontSize: 36, lineHeight: 40, letterSpacing: -0.5 },
  section: { ...display, fontSize: 23, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1.1 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
};

const activityInfo = {
  coffee: { label: 'Coffee', icon: 'cafe-outline', emoji: '☕' },
  drinks: { label: 'Drinks', icon: 'wine-outline', emoji: '🍷' },
  food: { label: 'Food', icon: 'restaurant-outline', emoji: '🍜' },
  gaming: { label: 'Gaming', icon: 'game-controller-outline', emoji: '🎮' },
  walk: { label: 'Walk', icon: 'walk-outline', emoji: '🚶' },
  gym: { label: 'Gym', icon: 'barbell-outline', emoji: '💪' },
  hangout: { label: 'Hang out', icon: 'sunny-outline', emoji: '☀️' },
  custom: { label: 'Custom', icon: 'sparkles-outline', emoji: '✨' },
  availability: { label: 'Free', icon: 'radio-button-on-outline', emoji: '👋' },
} as const;

export type ActivityType = keyof typeof activityInfo;
export const activityTypes = Object.keys(activityInfo) as ActivityType[];
export const isActivityType = (value: string): value is ActivityType => value in activityInfo;

export function activityMetaFor(colors: Colors) {
  const entries = activityTypes.map((activity) => [activity, { ...activityInfo[activity], color: colors[activity], tint: colors[`${activity}Tint`] }] as const);
  return Object.fromEntries(entries) as Record<ActivityType, { label: string; icon: string; emoji: string; color: string; tint: string }>;
}

export const activityLabel = (activity: ActivityType) => activityInfo[activity].label;
