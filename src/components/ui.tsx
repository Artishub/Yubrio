import React, { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { radius, spacing, type, ActivityType, Colors, shadowCard, display, sticker } from '@/design/tokens';
import { useTheme, useThemedStyles } from '@/design/theme';
import { Person, Room } from '@/types';
import { copy } from '@/design/copy';
import { useT } from '@/design/i18n';
import { displayName, displayTitle } from '@/utils/display-name';

export function YText({ style, ...props }: TextProps) {
  const styles = useThemedStyles(makeStyles);
  return <Text {...props} style={[styles.text, style]} />;
}
export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.screen, style]}>{children}</View>;
}
export function ActivityIcon({ activity, size = 46 }: { activity: ActivityType; size?: number }) {
  const { activityMeta } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const meta = activityMeta[activity];
  return (
    <View style={[styles.activityIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <YText accessible={false} style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>
        {meta.emoji}
      </YText>
    </View>
  );
}
export function Avatar({ person, size = 34 }: { person: Person; size?: number }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      accessible={false}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: person.color }]}
    >
      <YText style={{ fontSize: size * 0.38, fontWeight: '800', color: colors.brandInk }}>{person.initials}</YText>
    </View>
  );
}
export function PersonRow({ person, detail, action }: { person: Person; detail: string; action?: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.springify()} style={styles.personRow}>
      <Avatar person={person} />
      <View style={styles.personCopy}>
        <YText style={styles.personName}>{displayName(person.name)}</YText>
        <YText style={styles.meta}>{detail}</YText>
      </View>
      {action}
    </Animated.View>
  );
}
export function SmallPill({ children, color }: PropsWithChildren<{ color?: string }>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.pill, { backgroundColor: color ?? colors.surfaceMuted }]}>
      <YText style={styles.pillText}>{children}</YText>
    </View>
  );
}
export function ActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        if (!disabled) {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }
      }}
      style={({ pressed }) => [
        styles.actionButton,
        styles[`button_${variant}`],
        pressed && styles.actionButtonPressed,
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={variant === 'primary' ? colors.brandInk : colors.ink} />}
      <YText style={[styles.buttonLabel, variant === 'primary' && { color: colors.brandInk }]}>{label}</YText>
    </Pressable>
  );
}
export function SectionTitle({ children, action }: PropsWithChildren<{ action?: React.ReactNode }>) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.sectionTitle}>
      <YText style={type.section}>{children}</YText>
      {action}
    </View>
  );
}
export function GlassBackdrop({ intensity = 42, style }: { intensity?: number; style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  if (Platform.OS === 'ios' && isGlassEffectAPIAvailable())
    return (
      <GlassView
        colorScheme={scheme === 'dark' ? 'dark' : 'light'}
        glassEffectStyle="regular"
        style={[StyleSheet.absoluteFill, styles.pointerNone, style]}
      />
    );
  if (Platform.OS === 'web')
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.pointerNone,
          {
            backgroundColor: colors.glassWeb,
            backdropFilter: 'blur(24px) saturate(145%)',
            WebkitBackdropFilter: 'blur(24px) saturate(145%)',
          } as any,
          style,
        ]}
      />
    );
  return (
    <BlurView
      intensity={intensity}
      tint={scheme === 'dark' ? 'dark' : 'light'}
      style={[StyleSheet.absoluteFill, styles.pointerNone, style]}
    />
  );
}
export function RoomCard({ room, people }: { room: Room; people: Person[] }) {
  const { colors, activityMeta } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const meta = activityMeta[room.activity];
  const peopleLabel =
    room.count <= 0 ? 'Open to your people' : room.count === 1 ? '1 person is in' : `${room.count} people are in`;
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(260)}
      style={[styles.roomCard, styles.roomMoment, { borderColor: colors.glassBorder }]}
    >
      <View style={styles.roomTop}>
        <ActivityIcon activity={room.activity} size={42} />
        <View style={styles.roomTitleWrap}>
          <YText style={[styles.roomMomentKicker, { color: meta.color }]}>{t(roomStatus(room))}</YText>
          <YText style={styles.roomMomentTitle}>{displayTitle(room.title)}</YText>
          <YText style={styles.roomMomentTime}>{t(room.time)}</YText>
        </View>
      </View>
      <View style={styles.roomBottom}>
        <View style={styles.roomPeople}>
          {people.slice(0, 3).map((person) => (
            <Avatar key={person.id} person={person} size={28} />
          ))}
          <View style={styles.roomMomentPeopleCopy}>
            <YText style={styles.roomMomentPeopleNames} numberOfLines={1}>
              {people
                .slice(0, 2)
                .map((person) => displayName(person.name))
                .join(' · ') || t('Be the first in')}
            </YText>
            <YText style={styles.roomMomentPeople}>{t(peopleLabel)}</YText>
          </View>
        </View>
        {room.detail ? (
          <YText style={[styles.roomMomentLocation, { color: meta.color }]} numberOfLines={1}>
            {room.detail}
          </YText>
        ) : (
          <YText style={styles.location}>{room.location ?? t('Undecided')}</YText>
        )}
      </View>
    </Animated.View>
  );
}

export function AvailabilityCard({
  person,
  expiresIn,
  note,
  onMessage,
}: {
  person: Person;
  expiresIn: string;
  note: string;
  onMessage?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInRight.duration(260)}
      style={[styles.availabilityCard, { borderColor: colors.glassBorder }]}
    >
      <View style={styles.availabilityHeader}>
        <View style={[styles.availabilityAvatar, { borderColor: person.color }]}>
          <Avatar person={person} size={42} />
        </View>
        <View style={styles.personCopy}>
          <View style={styles.nameLine}>
            <YText style={styles.personName}>{displayName(person.name)}</YText>
            <View style={styles.freeBadge}>
              <View style={styles.freeDot} />
              <YText style={styles.freeText}>{t('FREE')}</YText>
            </View>
          </View>
          <YText style={styles.meta}>{t(expiresIn)}</YText>
        </View>
        {onMessage && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(`Message ${displayName(person.name)}`)}
            onPress={onMessage}
            style={styles.messageButton}
          >
            <Ionicons name="arrow-up" size={17} color={colors.ink} style={styles.messageArrow} />
          </Pressable>
        )}
      </View>
      <YText style={styles.availabilityNote}>{note || t('Up for anything.')}</YText>
      <View style={styles.availabilityFooter}>
        <YText style={styles.availabilityFooterText}>{t('Message while they’re free')}</YText>
        <Ionicons name="arrow-forward" size={14} color={colors.muted} />
      </View>
    </Animated.View>
  );
}
export function JoinButton({ joined, onPress }: { joined?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }), []);
  const content = (
    <>
      <Ionicons name={joined ? 'checkmark' : 'flash'} size={19} color={colors.brandInk} />
      <YText style={[styles.joinLabel, joined && styles.joinJoinedLabel]}>
        {t(joined ? copy.room.joined : copy.room.join)}
      </YText>
    </>
  );
  return (
    <Animated.View style={animatedStyle}>
      {joined ? (
        <View accessible accessibilityLabel={t(copy.room.joined)} style={[styles.joinButton, styles.joinJoined]}>
          {content}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Join room')}
          onPress={() => {
            if (!reducedMotion)
              scale.set(
                withSpring(1.08, { damping: 8 }, () => {
                  scale.set(withSpring(1));
                }),
              );
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
          style={({ pressed }) => [styles.joinButton, pressed && styles.joinButtonPressed]}
        >
          {content}
        </Pressable>
      )}
    </Animated.View>
  );
}

function roomStatus(room: Room, now = Date.now()) {
  if (typeof room.startsAt !== 'number' || typeof room.endAt !== 'number') return 'HAPPENING SOON';
  if (now < room.startsAt) return 'UP NEXT';
  if (now <= room.endAt) return 'HAPPENING NOW';
  return 'ENDED';
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.canvas },
    pointerNone: { pointerEvents: 'none' },
    text: { color: colors.ink, fontSize: 15, fontWeight: '500' },
    activityIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper,
      borderWidth: 2,
      borderColor: colors.outline,
      transform: [{ rotate: '-6deg' }],
    },
    avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.outline },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    personCopy: { flex: 1 },
    personName: { fontSize: 16, fontWeight: '700' },
    meta: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
    pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.chip },
    pillText: { fontSize: 11, fontWeight: '800', color: colors.ink },
    actionButton: {
      minHeight: 52,
      borderRadius: radius.button,
      paddingHorizontal: spacing.xl,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...sticker(colors, 3),
    },
    actionButtonPressed: {
      transform: [{ translateX: 3 }, { translateY: 3 }],
      boxShadow: `0px 0px 0px ${colors.outline}`,
    },
    button_primary: { backgroundColor: colors.brand },
    button_secondary: { backgroundColor: colors.surface },
    button_ghost: { backgroundColor: 'transparent', borderWidth: 0, boxShadow: undefined },
    buttonLabel: { ...display, fontSize: 17, color: colors.ink },
    sectionTitle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    roomCard: {
      overflow: 'hidden',
      backgroundColor: colors.glassSurface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadowCard(colors),
    },
    roomTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    roomTitleWrap: { flex: 1 },
    roomBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    roomPeople: { flexDirection: 'row', alignItems: 'center' },
    location: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    availabilityCard: {
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderRadius: 22,
      padding: spacing.lg,
      marginRight: spacing.md,
      width: 274,
      ...shadowCard(colors),
    },
    availabilityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    availabilityAvatar: { borderWidth: 2, borderRadius: 24, padding: 2 },
    nameLine: { flexDirection: 'row', gap: 7, alignItems: 'center', minWidth: 0 },
    freeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.availabilityTint,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
    },
    freeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.brand },
    freeText: { fontSize: 9, fontWeight: '900', color: colors.brandText, letterSpacing: 0.6 },
    messageButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassHighlight,
    },
    messageArrow: { transform: [{ rotate: '45deg' }] },
    availabilityNote: { marginTop: spacing.xl, color: colors.ink, fontSize: 17, lineHeight: 21, fontWeight: '800' },
    availabilityFooter: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    availabilityFooterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
    roomMoment: {
      minHeight: 204,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderRadius: 24,
      padding: spacing.lg,
      justifyContent: 'space-between',
      ...shadowCard(colors),
    },
    roomMomentKicker: { ...type.label, color: colors.muted, fontSize: 9, letterSpacing: 1.1 },
    roomMomentTitle: {
      fontSize: 29,
      lineHeight: 32,
      fontWeight: '900',
      letterSpacing: -1,
      maxWidth: '94%',
      marginTop: spacing.lg,
    },
    roomMomentTime: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 8 },
    roomMomentPeople: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
    roomMomentPeopleCopy: { marginLeft: 8, minWidth: 0 },
    roomMomentPeopleNames: { color: colors.ink, fontSize: 11, fontWeight: '800' },
    roomMomentLocation: { flex: 1, fontSize: 13, fontWeight: '800' },
    joinButton: {
      height: 56,
      borderRadius: radius.button,
      paddingHorizontal: 23,
      backgroundColor: colors.brand,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...sticker(colors),
    },
    joinButtonPressed: {
      transform: [{ translateX: 4 }, { translateY: 4 }],
      boxShadow: `0px 0px 0px ${colors.outline}`,
    },
    joinJoined: { backgroundColor: colors.brand },
    joinLabel: { ...display, fontSize: 20, color: colors.brandInk },
    joinJoinedLabel: { color: colors.brandInk },
  });
