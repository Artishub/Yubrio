import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon, Avatar, YText } from '@/components/ui';
import { activityMeta, colors, spacing, type, ActivityType } from '@/design/tokens';
import { copy } from '@/design/copy';
import { Person, Room } from '@/types';
import { useDemo } from '@/stores/demo-store';
import { displayName, displayTitle } from '@/utils/display-name';

type Signal = {
  id: string;
  kind: 'room' | 'availability';
  person: Person;
  room?: Room;
  activity?: ActivityType;
  title: string;
  detail: string;
  actionLabel: string;
};

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me, people, rooms, availability } = useDemo();
  const signals = useMemo<Signal[]>(() => {
    const roomSignals = rooms.slice(0, 3).map((room) => {
      const person = people.find((item) => item.id === room.creatorId) ?? me;
      return { id: `room-${room.id}`, kind: 'room' as const, person, room, activity: room.activity, title: `${displayName(person.name)} opened ${displayTitle(room.title)}`, detail: room.time, actionLabel: copy.activity.openRoom };
    });
    const availabilitySignals = availability.filter((item) => item.personId !== me.id).slice(0, 2).flatMap((item) => {
      const person = people.find((entry) => entry.id === item.personId);
      return person ? [{ id: `availability-${item.id}`, kind: 'availability' as const, person, title: `${displayName(person.name)} is free`, detail: `${item.expiresIn} · ${item.note || 'Up for anything.'}`, actionLabel: copy.activity.seeRooms }] : [];
    });
    return [...roomSignals, ...availabilitySignals].slice(0, 5);
  }, [availability, me, people, rooms]);

  const openSignal = (signal: Signal) => {
    if (signal.room) {
      router.push({ pathname: '/room/[id]', params: { id: signal.room.id } });
      return;
    }
    router.replace('/(tabs)');
  };

  return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(32, insets.top + 12), paddingBottom: insets.bottom + 110 }]}>
    <YText style={type.title}>{copy.activity.title}</YText>
    <YText style={styles.intro}>{copy.activity.intro}</YText>
    {signals.length ? <>
      <SignalSpotlight signal={signals[0]} onPress={() => openSignal(signals[0])} />
      {signals.length > 1 && <YText style={styles.sectionLabel}>{copy.activity.earlier}</YText>}
      <View style={styles.signalList}>{signals.slice(1).map((signal) => <SignalRow key={signal.id} signal={signal} onPress={() => openSignal(signal)} />)}</View>
    </> : <View style={styles.empty}><YText style={styles.emptyTitle}>{copy.activity.emptyTitle}</YText><YText style={styles.emptyCopy}>{copy.activity.emptyCopy}</YText></View>}
  </ScrollView></View>;
}

function SignalSpotlight({ signal, onPress }: { signal: Signal; onPress: () => void }) {
  const accent = signal.activity ? activityMeta[signal.activity].color : colors.brand;
  return <Pressable accessibilityRole="button" accessibilityLabel={signal.actionLabel} onPress={onPress} style={({ pressed }) => [styles.spotlight, pressed && styles.spotlightPressed]}>
    <View style={styles.spotlightTop}><View style={styles.signalType}><ActivityIcon activity={signal.activity ?? 'availability'} size={44} /><YText style={[styles.kicker, { color: accent }]}>{copy.activity.fresh}</YText></View><View style={[styles.signalMark, { backgroundColor: accent }]}><Ionicons name="arrow-up" size={18} color={colors.brandInk} /></View></View>
    <YText style={styles.spotlightTitle}>{signal.title}</YText>
    <YText style={styles.spotlightDetail}>{signal.detail}</YText>
    <View style={styles.spotlightFooter}><Avatar person={signal.person} size={28} /><YText style={styles.personName}>{displayName(signal.person.name)}</YText><YText style={[styles.actionLabel, { color: accent }]}>{signal.actionLabel}</YText><Ionicons name="arrow-forward" size={16} color={accent} /></View>
  </Pressable>;
}

function SignalRow({ signal, onPress }: { signal: Signal; onPress: () => void }) {
  const accent = signal.activity ? activityMeta[signal.activity].color : colors.brand;
  return <Pressable accessibilityRole="button" accessibilityLabel={signal.actionLabel} onPress={onPress} style={({ pressed }) => [styles.signalRow, pressed && styles.signalRowPressed]}>
    <ActivityIcon activity={signal.activity ?? 'availability'} size={38} /><View style={styles.signalCopy}><YText style={styles.signalTitle}>{signal.title}</YText><YText style={styles.signalDetail}>{signal.detail}</YText></View><Ionicons name="arrow-forward" size={17} color={accent} />
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.xl },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 20, fontWeight: '600', marginTop: 6 },
  spotlight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 24, padding: spacing.xl, marginTop: spacing.xxxl },
  spotlightPressed: { transform: [{ translateY: 2 }], opacity: 0.86 },
  spotlightTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  signalType: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { ...type.label, fontSize: 10, letterSpacing: 1.1 },
  signalMark: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  spotlightTitle: { fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.xl },
  spotlightDetail: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: 7 },
  spotlightFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, marginTop: spacing.xl, paddingTop: spacing.md },
  personName: { flex: 1, fontSize: 13, fontWeight: '800' },
  actionLabel: { fontSize: 12, fontWeight: '900' },
  sectionLabel: { ...type.section, fontSize: 18, lineHeight: 23, marginTop: spacing.xxxl, marginBottom: spacing.sm },
  signalList: { borderTopWidth: 1, borderTopColor: colors.line },
  signalRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.sm },
  signalRowPressed: { opacity: 0.72 },
  signalCopy: { flex: 1 },
  signalTitle: { fontSize: 15, lineHeight: 19, fontWeight: '800' },
  signalDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  empty: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: spacing.xxxl, marginTop: spacing.xxxl },
  emptyTitle: { fontSize: 22, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 15, lineHeight: 20, fontWeight: '600', marginTop: spacing.sm, maxWidth: 320 },
});
