import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, motion } from '@/design/tokens';

const sparkColors = [colors.brand, colors.coral, colors.violet, colors.sky, colors.coffee];
const sparks = Array.from({ length: 12 }, (_, index) => ({
  angle: (index / 12) * Math.PI * 2,
  distance: index % 2 === 0 ? 86 : 58,
  color: sparkColors[index % sparkColors.length],
}));

// Plays once each time `active` turns true (and on mount when `playOnMount` is set).
export function YebBurst({ active, playOnMount = false }: { active: boolean; playOnMount?: boolean }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(1);
  const wasActive = useRef(playOnMount ? false : active);

  useEffect(() => {
    const turnedOn = active && !wasActive.current;
    wasActive.current = active;
    if (!turnedOn) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reducedMotion) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: motion.celebration, easing: Easing.out(Easing.cubic) });
  }, [active, progress, reducedMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.7,
    transform: [{ scale: 0.4 + progress.value * 1.8 }],
  }));

  return <View pointerEvents="none" accessible={false} style={styles.root}>
    <Animated.View style={[styles.ring, ringStyle]} />
    {sparks.map((spark, index) => <Spark key={index} progress={progress} {...spark} />)}
  </View>;
}

function Spark({ progress, angle, distance, color }: { progress: SharedValue<number>; angle: number; distance: number; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value >= 1 ? 0 : 1 - progress.value * progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.5 },
    ],
  }));
  return <Animated.View style={[styles.spark, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  ring: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.brand },
  spark: { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
});
