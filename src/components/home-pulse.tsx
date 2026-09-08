import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ActivityIcon, Avatar, YText } from '@/components/ui';
import { colors, spacing } from '@/design/tokens';
import { copy } from '@/design/copy';
import { Person } from '@/types';
import { displayName } from '@/utils/display-name';

type PulseFriend = { person: Person; expiresIn: string; note: string; canMessage: boolean; availabilityId: string };

type HomePulseProps = {
  isFree?: boolean;
  friends: PulseFriend[];
  onFree: () => void;
  onMessage: (friend: PulseFriend) => void;
};

export function HomePulse({ isFree = false, friends, onFree, onMessage }: HomePulseProps) {
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const compact = width < 350;
  const onlinePulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || !isFree) {
      onlinePulse.value = 1;
      return;
    }
    onlinePulse.value = withRepeat(withTiming(1.7, { duration: 1150 }), -1, true);
  }, [isFree, onlinePulse, reducedMotion]);
  const onlinePulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: onlinePulse.value }], opacity: 1.55 - onlinePulse.value * 0.55 }));
  const visibleFriends = friends.slice(0, 4);
  const pressLight = () => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  return <View style={[styles.shell, compact && styles.shellCompact]}>
    {isFree && <View style={styles.hero}>
      <View style={styles.onlineMark}><Animated.View style={[styles.onlineRing, onlinePulseStyle]} /><View style={styles.onlineCore} /></View>
      <View style={styles.heroCopy}><YText style={styles.heroTitle}>{copy.home.freeState.online}</YText></View>
      <Pressable accessibilityRole="button" accessibilityLabel={copy.home.freeState.changeAction} onPress={() => { pressLight(); onFree(); }} style={({ pressed }) => [styles.changeAction, pressed && styles.changeActionPressed]}><YText style={styles.changeActionText}>{copy.home.freeState.changeAction}</YText><Ionicons name="options-outline" size={15} color={colors.muted} /></Pressable>
    </View>}

    {visibleFriends.length ? <View style={styles.peopleSection}><View style={styles.peopleHeader}><YText style={styles.peopleTitle}>{copy.home.friendsAvailable}</YText><YText style={styles.peopleCount}>{visibleFriends.length}</YText></View><View style={styles.friendList}>{visibleFriends.map((friend, index) => <PulseFriendBubble key={friend.availabilityId} friend={friend} index={index} reducedMotion={reducedMotion} onPress={() => onMessage(friend)} />)}</View></View> : !isFree ? <View style={styles.peopleSection}><View style={styles.emptySignal}><YText style={styles.emptySignalText}>{copy.home.friendsEmpty}</YText></View></View> : null}

    {!isFree && <Pressable accessibilityRole="button" accessibilityLabel={copy.home.freeAction} onPress={() => { pressLight(); onFree(); }} style={({ pressed }) => [styles.freeAction, pressed && styles.freeActionPressed]}>
      <ActivityIcon activity="availability" size={25} /><YText style={styles.freeActionText}>{copy.home.freeAction}</YText><Ionicons name="arrow-forward" size={17} color={colors.ink} />
    </Pressable>}
    {!isFree && <YText style={styles.freeHint}>{copy.home.freeActionHint}</YText>}
  </View>;
}

function PulseFriendBubble({ friend, index, reducedMotion, onPress }: { friend: PulseFriend; index: number; reducedMotion: boolean | undefined; onPress: () => void }) {
  const pressFriend = () => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const canMessage = friend.canMessage;
  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(90 + index * 70).springify()} style={styles.friendSignal}>
    <Pressable disabled={!canMessage} accessibilityRole={canMessage ? 'button' : undefined} accessibilityState={{ disabled: !canMessage }} accessibilityLabel={`${displayName(friend.person.name)}, ${friend.expiresIn}. ${canMessage ? `Message ${displayName(friend.person.name)}` : 'Messages are off'}`} onPress={() => { if (!canMessage) return; pressFriend(); onPress(); }} style={({ pressed }) => [styles.friendButton, pressed && styles.friendButtonPressed, !canMessage && styles.friendButtonUnavailable]}>
      <View style={[styles.friendAvatarWrap, { borderColor: friend.person.color }]}><Avatar person={friend.person} size={38} /><View style={styles.friendStatus} /></View>
      <View style={styles.friendCopy}><YText style={styles.friendName} numberOfLines={1}>{displayName(friend.person.name)}</YText><YText style={styles.friendTime} numberOfLines={1}>{friend.expiresIn}</YText>{index === 0 && friend.note ? <YText style={styles.friendNote} numberOfLines={1}>{friend.note}</YText> : null}</View>
      <Ionicons name={canMessage ? 'arrow-up' : 'lock-closed-outline'} size={canMessage ? 15 : 13} color={canMessage ? colors.muted : colors.faint} style={canMessage ? styles.friendArrow : undefined} />
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.xxxl },
  shellCompact: { marginBottom: spacing.xl },
  hero: { minHeight: 62, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlineMark: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 1 },
  onlineRing: { position: 'absolute', width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: colors.brand },
  onlineCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900', letterSpacing: -0.35, marginTop: 1 },
  changeAction: { minHeight: 44, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  changeActionPressed: { opacity: 0.65, transform: [{ translateY: 1 }] },
  changeActionText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  peopleSection: { marginTop: spacing.lg },
  peopleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  peopleTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  peopleCount: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  friendList: { borderTopWidth: 1, borderTopColor: colors.line },
  friendSignal: { width: '100%' },
  friendButton: { minHeight: 58, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  friendButtonPressed: { opacity: 0.72, transform: [{ translateY: 1 }] },
  friendButtonUnavailable: { opacity: 0.68 },
  friendAvatarWrap: { position: 'relative', borderWidth: 2, borderRadius: 22, padding: 2 },
  friendStatus: { position: 'absolute', right: -1, bottom: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.surface },
  friendCopy: { flex: 1, minWidth: 0 },
  friendName: { fontSize: 13, fontWeight: '900' },
  friendTime: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  friendNote: { color: colors.ink, fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.78 },
  friendArrow: { transform: [{ rotate: '45deg' }] },
  emptySignal: { minHeight: 58, justifyContent: 'center' },
  emptySignalText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  freeAction: { minHeight: 50, marginTop: 14, paddingHorizontal: 13, borderRadius: 16, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 3, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeActionPressed: { transform: [{ translateY: 2 }, { scale: 0.99 }], borderBottomWidth: 1 },
  freeActionText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '900' },
  freeHint: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
