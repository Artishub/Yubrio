import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated';
import { ActionButton, Avatar, YText } from '@/components/ui';
import { Colors, display, radius, spacing, sticker } from '@/design/tokens';
import { useTheme, useThemedStyles } from '@/design/theme';
import { copy } from '@/design/copy';
import { useT } from '@/design/i18n';
import { Person } from '@/types';
import { displayName } from '@/utils/display-name';

type MyAvailability = { expiresIn: string; upcoming: boolean };

// Your own status: one tap to tell friends you are free, or the current state with change and end.
export function FreeStatus({
  mine,
  pending,
  onFreeNow,
  onOptions,
  onEnd,
}: {
  mine?: MyAvailability;
  pending: boolean;
  onFreeNow: () => void;
  onOptions: () => void;
  onEnd: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = useT();

  if (mine) {
    return (
      <View style={[styles.card, styles.cardFree]}>
        <View style={styles.freeHead}>
          <View style={[styles.dot, mine.upcoming && styles.dotLater]} />
          <View style={styles.freeCopy}>
            <YText style={[styles.title, styles.onColor]}>
              {t(mine.upcoming ? copy.home.status.freeLater : copy.home.status.freeNow)}
            </YText>
            <YText style={[styles.hint, styles.onColor]}>{t(mine.expiresIn)}</YText>
          </View>
        </View>
        <View style={styles.actions}>
          <ActionButton
            label={t(copy.home.status.change)}
            icon="options-outline"
            variant="secondary"
            onPress={onOptions}
            style={styles.grow}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(copy.home.status.end)}
            disabled={pending}
            onPress={onEnd}
            style={({ pressed }) => [styles.endButton, (pressed || pending) && styles.dimmed]}
          >
            <YText style={[styles.endText, styles.onColor]}>{t(copy.home.status.end)}</YText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <YText style={styles.title}>{t(copy.home.status.question)}</YText>
      <YText style={styles.hint}>{t(copy.home.status.hint)}</YText>
      <View style={styles.actions}>
        <ActionButton
          label={t(copy.home.status.freeAction)}
          icon="radio-button-on"
          disabled={pending}
          onPress={onFreeNow}
          style={styles.grow}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(copy.home.status.options)}
          onPress={onOptions}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.dimmed]}
        >
          <Ionicons name="options-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

export type FreeFriend = {
  person: Person;
  expiresIn: string;
  upcoming: boolean;
  canMessage: boolean;
  availabilityId: string;
};

// Friends who are free now or later today, as a row of faces.
export function FreeFriends({ friends, onPress }: { friends: FreeFriend[]; onPress: (friend: FreeFriend) => void }) {
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const reducedMotion = useReducedMotion();

  if (!friends.length) return <YText style={styles.empty}>{t(copy.home.friendsEmpty)}</YText>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.friendScroll}
      contentContainerStyle={styles.friendRow}
    >
      {friends.map((friend, index) => {
        const name = displayName(friend.person.name);
        const when = t(friend.upcoming ? friend.expiresIn : copy.home.freeNow);
        return (
          <Animated.View
            key={friend.availabilityId}
            entering={reducedMotion ? undefined : FadeInRight.delay(index * 60).springify()}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${friend.upcoming ? `${t(copy.home.freeLater)} ${t(friend.expiresIn)}` : `${t(copy.home.freeNow)}, ${t(friend.expiresIn)}`}`}
              accessibilityState={{ disabled: !friend.canMessage }}
              disabled={!friend.canMessage}
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress(friend);
              }}
              style={({ pressed }) => [styles.friend, pressed && styles.dimmed]}
            >
              <View
                style={[
                  styles.sticker,
                  friend.upcoming && styles.stickerLater,
                  { transform: [{ rotate: index % 2 === 0 ? '-4deg' : '3deg' }] },
                ]}
              >
                <Avatar person={friend.person} size={54} />
                {!friend.upcoming && <View style={styles.liveDot} />}
              </View>
              <YText style={styles.friendName} numberOfLines={1}>
                {name}
              </YText>
              <YText style={[styles.friendWhen, !friend.upcoming && styles.friendWhenNow]} numberOfLines={1}>
                {when}
              </YText>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.surface, ...sticker(colors) },
    cardFree: { backgroundColor: colors.availability },
    onColor: { color: colors.onColor },
    title: { ...display, fontSize: 24, lineHeight: 29 },
    hint: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: colors.muted, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    grow: { flex: 1 },
    optionsButton: {
      width: 52,
      height: 52,
      borderRadius: radius.button,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...sticker(colors, 3),
    },
    endButton: { minHeight: 54, paddingHorizontal: spacing.lg, justifyContent: 'center' },
    endText: { ...display, fontSize: 16, color: colors.muted },
    dimmed: { opacity: 0.6 },
    freeHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    freeCopy: { flex: 1 },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.onColor },
    dotLater: { backgroundColor: 'transparent', borderWidth: 3, borderColor: colors.onColor },
    empty: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.muted },
    friendScroll: { marginHorizontal: -spacing.xl },
    friendRow: { paddingHorizontal: spacing.xl, paddingVertical: 6, gap: spacing.md },
    friend: { width: 76, alignItems: 'center' },
    // A die-cut sticker: white rim, outline, small hard shadow.
    sticker: { padding: 3, borderRadius: 40, backgroundColor: colors.paper, ...sticker(colors, 3) },
    stickerLater: { opacity: 0.55, borderStyle: 'dashed', boxShadow: undefined },
    liveDot: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.brand,
      borderWidth: 2,
      borderColor: colors.outline,
    },
    friendName: { fontSize: 13, fontWeight: '700', marginTop: 8 },
    friendWhen: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 1 },
    friendWhenNow: { color: colors.brandText },
  });
