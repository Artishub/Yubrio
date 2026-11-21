import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/design/theme';

// Soft colored light behind the panes in glass mode, so there is something to see through them.
// Renders nothing in dark mode.
const lights = [
  { id: 'lime', color: '#D6F86A', cx: '12%', cy: '8%', r: '55%' },
  { id: 'violet', color: '#B9A4FF', cx: '95%', cy: '30%', r: '60%' },
  { id: 'sky', color: '#8FDDF0', cx: '10%', cy: '70%', r: '60%' },
  { id: 'coral', color: '#FFB3A6', cx: '90%', cy: '98%', r: '55%' },
];

export function Backdrop() {
  const { colors } = useTheme();
  // Gradient ids are global on web, and several screens can be mounted at once.
  const prefix = useId().replace(/:/g, '');
  if (colors.material !== 'glass') return null;
  return (
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          {lights.map((light) => (
            <RadialGradient
              key={light.id}
              id={`${prefix}${light.id}`}
              cx={light.cx}
              cy={light.cy}
              r={light.r}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={light.color} stopOpacity="0.38" />
              <Stop offset="1" stopColor={light.color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        <Rect width="100%" height="100%" fill={colors.canvas} />
        {lights.map((light) => (
          <Rect key={light.id} width="100%" height="100%" fill={`url(#${prefix}${light.id})`} />
        ))}
      </Svg>
    </View>
  );
}
