import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Scheme, activityMetaFor, palettes } from '@/design/tokens';

export type ThemeMode = 'system' | Scheme;
const themeModeKey = 'yubrio.theme-mode';

type ThemeValue = { colors: Colors; activityMeta: ReturnType<typeof activityMetaFor>; scheme: Scheme; mode: ThemeMode; setMode: (mode: ThemeMode) => void };
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void AsyncStorage.getItem(themeModeKey).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
    }).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme: Scheme = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
    const colors = palettes[scheme];
    return {
      colors,
      activityMeta: activityMetaFor(colors),
      scheme,
      mode,
      setMode: (next) => { setModeState(next); void AsyncStorage.setItem(themeModeKey, next).catch(() => undefined); },
    };
  }, [mode, systemScheme]);

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
