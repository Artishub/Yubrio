import React from 'react';
import Animated, { SharedValue, measure, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { motion } from '@/design/tokens';

export function useStretchScroll() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollY.value = event.contentOffset.y; });
  return { scrollY, onScroll };
}

// Follows the finger: while a block crosses the top or bottom edge of the list it stretches in
// the scroll direction, blurs, dims and fades, like a smear. `top` and `bottom` are the screen
// positions of those edges.
export function StretchOnScroll({ scrollY, top, bottom, children }: { scrollY: SharedValue<number>; top: number; bottom: number; children: React.ReactNode }) {
  const ref = useAnimatedRef<Animated.View>();
  const reducedMotion = useReducedMotion();

  const style = useAnimatedStyle(() => {
    // Reading the offset makes this run again on every scroll frame.
    void scrollY.value;
    if (reducedMotion) return {};
    const box = measure(ref);
    if (!box || box.height <= 0) return {};
    const pastTop = Math.min(Math.max((top - box.pageY) / box.height, 0), 1);
    const pastBottom = Math.min(Math.max((box.pageY + box.height - bottom) / box.height, 0), 1);
    // Squared, so a block that only peeks past an edge at rest stays almost untouched.
    const amount = Math.max(pastTop, pastBottom) ** 2;
    const { stretch, squeeze, blur, dim, fade } = motion.stretch;
    return {
      opacity: 1 - fade * amount,
      transformOrigin: pastTop > pastBottom ? 'bottom' : 'top',
      transform: [{ scaleX: 1 - squeeze * amount }, { scaleY: 1 + stretch * amount }],
      filter: `blur(${blur * amount}px) brightness(${1 - dim * amount})`,
    };
  });

  // The outer view is measured, so the stretch itself never feeds back into the measurement.
  return <Animated.View ref={ref}><Animated.View style={style}>{children}</Animated.View></Animated.View>;
}
