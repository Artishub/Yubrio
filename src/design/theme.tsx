import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Scheme, activityMetaFor, palettes } from '@/design/tokens';

const themeModeKey = 'yubrio.theme-mode';

type ThemeValue = { colors: Colors; activityMeta: ReturnType<typeof activityMetaFor>; scheme: Scheme; setScheme: (scheme: Scheme) => void };
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(themeModeKey).then((saved) => {
      if (saved === 'dark' || saved === 'glass') setSchemeState(saved);
    }).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const colors = palettes[scheme];
    return {
      colors,
      activityMeta: activityMetaFor(colors),
      scheme,
      setScheme: (next) => { setSchemeState(next); void AsyncStorage.setItem(themeModeKey, next).catch(() => undefined); },
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

// Builds each style sheet once per palette, however many components use it.
const styleCache = new WeakMap<object, Map<Colors, unknown>>();
export function useThemedStyles<T>(makeStyles: (colors: Colors) => T): T {
  const { colors } = useTheme();
  let byPalette = styleCache.get(makeStyles);
  if (!byPalette) { byPalette = new Map(); styleCache.set(makeStyles, byPalette); }
  if (!byPalette.has(colors)) byPalette.set(colors, makeStyles(colors));
  return byPalette.get(colors) as T;
}
