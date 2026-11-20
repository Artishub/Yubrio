import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ActivityIcon, Avatar, YText } from '@/components/ui';
import { YebBurst } from '@/components/yeb-burst';
import { Colors, radius, spacing } from '@/design/tokens';
import { useTheme, useThemedStyles } from '@/design/theme';
import { copy } from '@/design/copy';
import { Person, Room } from '@/types';
import { displayTitle } from '@/utils/display-name';

// How far a row must be dragged right to count as Yeb, and how far it can travel.
const swipeYebAt = 72;
const swipeMax = 104;

// One room in the home list: what, when, where, who is in, and a Yeb button.
// Dragging the row to the right is a second way to Yeb; the button always stays.
export function RoomRow({ room, people, onOpen, onYeb }: { room: Room; people: Person[]; onOpen: () => void; onYeb: () => void }) {
  const { colors, activityMeta } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const meta = activityMeta[room.activity];
  const title = displayTitle(room.title);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const happening = (room.startsAt ?? 0) <= now && now <= room.endAt;
  const dragX = useSharedValue(0);
  const armed = useSharedValue(false);
  // A drag must not also count as a tap on the row when the finger lifts.
  const justSwiped = useSharedValue(0);
  const tick = () => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const swipe = Gesture.Pan()
    .enabled(!room.joined)
    .activeOffsetX(12)
    .failOffsetX(-12)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      // Past the Yeb point the row resists, so it feels like it catches.
      const pull = Math.max(0, event.translationX);
      dragX.value = pull <= swipeYebAt ? pull : Math.min(swipeMax, swipeYebAt + (pull - swipeYebAt) * 0.3);
      const nowArmed = pull >= swipeYebAt;
      if (nowArmed !== armed.value) { armed.value = nowArmed; if (nowArmed) runOnJS(tick)(); }
    })
    .onEnd(() => {
      justSwiped.value = 1;
      justSwiped.value = withDelay(400, withTiming(0, { duration: 0 }));
      if (armed.value) runOnJS(onYeb)();
      armed.value = false;
      dragX.value = withSpring(0, { damping: 18, stiffness: 220 });
    });
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }] }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, dragX.value / swipeYebAt) }));
  const countLabel = room.count === 1 ? copy.home.onePersonIn : `${room.count} ${copy.home.peopleIn}`;

  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.springify()} style={styles.track}>
    <Animated.View accessible={false} style={[styles.reveal, revealStyle]}><Ionicons name="flash" size={18} color={colors.brandInk} /><YText style={styles.yebText}>{copy.room.join}</YText></Animated.View>
    <GestureDetector gesture={swipe}><Animated.View style={[styles.card, happening && { borderColor: `${meta.color}66`, boxShadow: `0px 0px 18px ${meta.color}33` }, cardStyle]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title}`} onPress={() => { if (justSwiped.value > 0) return; if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpen(); }} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
      <ActivityIcon activity={room.activity} size={46} />
      <View style={styles.copy}>
        <YText style={styles.title} numberOfLines={2}>{title}</YText>
        <View style={styles.line}>
          {happening && <View style={styles.nowBadge}><View style={styles.nowDot} /><YText style={styles.nowText}>{copy.home.roomNow}</YText></View>}
          <YText style={styles.time} numberOfLines={1}>{room.time}</YText>
        </View>
        <View style={styles.line}>
          <Ionicons name={room.online ? 'globe-outline' : 'location-outline'} size={14} color={meta.color} />
          <YText style={[styles.place, { color: meta.color }]} numberOfLines={1}>{room.location ?? (room.online ? 'Online' : 'Undecided')}</YText>
        </View>
        <View style={styles.people}>
          {people.slice(0, 4).map((person, index) => <View key={person.id} style={index > 0 ? styles.overlap : undefined}><Avatar person={person} size={24} /></View>)}
          <YText style={styles.count}>{room.count > 0 ? countLabel : copy.home.beFirst}</YText>
        </View>
      </View>
    </Pressable>
    <View style={styles.action}>
      {room.joined
        ? <View accessible accessibilityLabel={copy.room.joined} style={styles.joined}><Ionicons name="checkmark" size={15} color={colors.brandText} /><YText style={styles.joinedText}>{copy.home.joinedShort}</YText></View>
        : <Pressable accessibilityRole="button" accessibilityLabel={`Yeb, join ${title}`} onPress={() => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onYeb(); }} style={({ pressed }) => [styles.yeb, pressed && styles.yebPressed]}>
          <Ionicons name="flash" size={15} color={colors.brandInk} /><YText style={styles.yebText}>{copy.room.join}</YText>
        </Pressable>}
      <YebBurst active={Boolean(room.joined)} />
    </View>
    </Animated.View></GestureDetector>
  </Animated.View>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  track: { borderRadius: radius.card },
  reveal: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, paddingLeft: spacing.lg, borderRadius: radius.card, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', gap: 5 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  time: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: colors.muted },
  nowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandText },
  nowText: { fontSize: 13, fontWeight: '800', color: colors.brandText },
  place: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  people: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  overlap: { marginLeft: -7 },
  count: { fontSize: 12, fontWeight: '700', color: colors.muted, marginLeft: 8 },
  action: { alignSelf: 'center' },
  yeb: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.button, backgroundColor: colors.brand, borderBottomWidth: 3, borderBottomColor: colors.brandPressed, flexDirection: 'row', alignItems: 'center', gap: 5 },
  yebPressed: { transform: [{ translateY: 2 }] },
  yebText: { fontSize: 15, fontWeight: '900', color: colors.brandInk },
  joined: { minHeight: 44, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinedText: { fontSize: 13, fontWeight: '800', color: colors.brandText },
});
