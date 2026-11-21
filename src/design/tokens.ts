const dark = {
  // Solid outlines and hard shadows.
  material: 'sticker' as 'sticker' | 'glass',
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
  brand: '#CDEB52',
  brandPressed: '#B2D03A',
  brandInk: '#1A1A1A',
  brandWash: 'rgba(212, 255, 58, 0.16)',
  brandText: '#CDEB52',
  electric: '#8C9BFF',
  violet: '#BE9BFF',
  sky: '#72D9E5',
  coral: '#FF8A78',
  // Activity fills are deep and muted; text on them is `onColor`. Text on lime is `brandInk`.
  coffee: '#7A5320',
  drinks: '#7D3D38',
  food: '#7D4A2A',
  gaming: '#51468A',
  walk: '#2B626B',
  gym: '#44692F',
  hangout: '#39558A',
  custom: '#4A443C',
  availability: '#4B5A1A',
  onColor: '#FFF6E5',
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

export type Colors = typeof dark;

// The brighter mode: translucent panes with a light rim and soft shadow over a pastel backdrop.
const glass: Colors = {
  material: 'glass',
  canvas: '#EEF1F6',
  surface: 'rgba(255, 255, 255, 0.66)',
  surfaceMuted: 'rgba(255, 255, 255, 0.38)',
  surfaceStrong: 'rgba(255, 255, 255, 0.72)',
  glassSurface: 'rgba(255, 255, 255, 0.58)',
  glassWeb: 'rgba(255, 255, 255, 0.45)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  glassHighlight: 'rgba(255, 255, 255, 0.5)',
  ink: '#141A24',
  muted: '#4A5466',
  faint: '#8590A3',
  line: 'rgba(20, 26, 36, 0.10)',
  outline: 'rgba(255, 255, 255, 0.9)',
  paper: 'rgba(255, 255, 255, 0.85)',
  brand: '#CDEB52',
  brandPressed: '#B2D03A',
  brandInk: '#141A24',
  brandWash: 'rgba(205, 245, 58, 0.35)',
  brandText: '#3B6E00',
  electric: '#4458E0',
  violet: '#7B4FD6',
  sky: '#0E8FA3',
  coral: '#E0452F',
  coffee: 'rgba(255, 181, 71, 0.36)',
  drinks: 'rgba(255, 111, 97, 0.32)',
  food: 'rgba(255, 145, 72, 0.34)',
  gaming: 'rgba(168, 139, 255, 0.34)',
  walk: 'rgba(95, 212, 230, 0.36)',
  gym: 'rgba(143, 224, 99, 0.36)',
  hangout: 'rgba(116, 169, 255, 0.34)',
  custom: 'rgba(255, 255, 255, 0.5)',
  availability: 'rgba(205, 235, 82, 0.5)',
  onColor: '#141A24',
  error: '#C7352B',
  overlay: 'rgba(20, 26, 36, 0.32)',
  shadow: 'rgba(50, 70, 120, 0.18)',
  coffeeTint: 'rgba(255, 181, 71, 0.3)',
  drinksTint: 'rgba(255, 111, 97, 0.28)',
  foodTint: 'rgba(255, 145, 72, 0.28)',
  gamingTint: 'rgba(168, 139, 255, 0.3)',
  walkTint: 'rgba(95, 212, 230, 0.3)',
  gymTint: 'rgba(143, 224, 99, 0.3)',
  hangoutTint: 'rgba(116, 169, 255, 0.3)',
  customTint: 'rgba(255, 255, 255, 0.4)',
  availabilityTint: 'rgba(205, 245, 58, 0.4)',
};

export const palettes = { dark, glass };
export type Scheme = keyof typeof palettes;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 };
export const radius = { card: 20, sheet: 30, button: 14, icon: 14, chip: 999 };
export const motion = {
  celebration: 480,
  // How far a block is stretched, squeezed, blurred (px), dimmed and faded when fully past a list edge.
  stretch: { stretch: 0.3, squeeze: 0.06, blur: 20, dim: 0.25, fade: 0.5 },
};
// The edge of every card and button. Dark mode: a solid outline and a hard shadow offset
// down-right. Glass mode: a light rim, a soft drop shadow and (on web) a blur of what is behind.
export const sticker = (colors: Colors, offset = 4) =>
  colors.material === 'glass'
    ? {
        borderWidth: 1,
        borderColor: colors.outline,
        boxShadow: `0px ${offset * 2}px ${offset * 6}px ${colors.shadow}`,
        backdropFilter: 'blur(18px) saturate(160%)',
      }
    : {
        borderWidth: 1.5,
        borderColor: colors.outline,
        boxShadow: `${offset - 1}px ${offset - 1}px 0px ${colors.outline}`,
      };
export const shadowCard = (colors: Colors) => ({ boxShadow: sticker(colors).boxShadow, elevation: 0 });
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
  const entries = activityTypes.map(
    (activity) =>
      [
        activity,
        { ...activityInfo[activity], color: colors[activity], tint: colors[`${activity}Tint` as const] },
      ] as const,
  );
  return Object.fromEntries(entries) as Record<
    ActivityType,
    { label: string; icon: string; emoji: string; color: string; tint: string }
  >;
}

export const activityLabel = (activity: ActivityType) => activityInfo[activity].label;
