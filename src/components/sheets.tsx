import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActionButton, ActivityIcon, YText } from '@/components/ui';
import { ActivityType, radius, spacing, type, Colors, display, sticker } from '@/design/tokens';
import { useTheme, useThemedStyles } from '@/design/theme';
import { useT } from '@/design/i18n';
import { Circle, Person, Room } from '@/types';
import { people as seededPeople } from '@/data/demo';
import { availabilityWindow, halfHourSlots } from '@/lib/validation/rules';

const activities: ActivityType[] = ['coffee', 'drinks', 'food', 'walk', 'gaming', 'gym', 'hangout', 'custom'];
const roomDurations: Record<string, number> = { '1 hour': 1, '2 hours': 2, '3 hours': 3, '6 hours': 6, 'All day': 24 };
const now = 'Now';

function SheetShell({
  visible,
  kicker,
  title,
  children,
  onClose,
  footer,
}: {
  visible: boolean;
  kicker: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer: React.ReactNode;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Close')}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.sheetHeader}>
            <View style={sheetStyles.headerCopy}>
              <YText style={sheetStyles.kicker}>{t(kicker)}</YText>
              <YText style={type.section}>{t(title)}</YText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Close')}
              onPress={onClose}
              style={sheetStyles.close}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={sheetStyles.scrollContent}
          >
            {children}
          </ScrollView>
          <View style={sheetStyles.footer}>{footer}</View>
        </View>
      </View>
    </Modal>
  );
}

// Everything for a room on one sheet. What and when are always visible and have defaults, so
// "Open room" works right away; where and who fold out only when someone wants to change them.
export function CreateRoomSheet({
  visible,
  onClose,
  onCreate,
  creatorId = 'artjom',
  circles = [],
  people = seededPeople,
  withFriendId,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (room: Room) => void;
  creatorId?: string;
  circles?: Circle[];
  people?: Person[];
  withFriendId?: string;
}) {
  const { activityMeta } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  const [activity, setActivity] = useState<ActivityType>('drinks');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(now);
  const [duration, setDuration] = useState('3 hours');
  const [whereOpen, setWhereOpen] = useState(false);
  const [where, setWhere] = useState('In person');
  const [place, setPlace] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [onlineDetails, setOnlineDetails] = useState('');
  const [whoOpen, setWhoOpen] = useState(Boolean(withFriendId));
  const [audience, setAudience] = useState(withFriendId ? 'Choose people' : 'All friends');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(withFriendId ? [withFriendId] : []);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [participantsCanInvite, setParticipantsCanInvite] = useState(true);
  const [slots] = useState(() => halfHourSlots(Date.now(), 47));
  const audienceOptions = useMemo(
    () => ['All friends', ...(circles.length ? ['Choose circles'] : []), 'Choose people'],
    [circles],
  );
  const audiencePeople = useMemo(() => people.filter((person) => person.id !== creatorId), [creatorId, people]);

  const reset = () => {
    setActivity('drinks');
    setTitle('');
    setStart(now);
    setDuration('3 hours');
    setWhereOpen(false);
    setWhere('In person');
    setPlace('');
    setGameTitle('');
    setGameMode('');
    setOnlineDetails('');
    setWhoOpen(false);
    setAudience('All friends');
    setSelectedCircles([]);
    setSelectedPeople([]);
    setChatEnabled(true);
    setParticipantsCanInvite(true);
  };
  const close = () => {
    reset();
    onClose();
  };
  const chooseActivity = (next: ActivityType) => {
    setActivity(next);
    // Gaming is usually online, and its game and link fields live under "Where".
    if (next === 'gaming') {
      setWhere('Online');
      setWhereOpen(true);
    }
  };
  const audienceMissing =
    (audience === 'Choose people' && selectedPeople.length === 0) ||
    (audience === 'Choose circles' && selectedCircles.length === 0);

  const create = () => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const startsAt = startTime(start);
    const endsAt = new Date(startsAt.getTime() + roomDurations[duration] * 60 * 60 * 1000);
    const connectionDetails = [gameTitle.trim(), gameMode.trim(), onlineDetails.trim()].filter(Boolean).join(' · ');
    onCreate({
      id: `room-${Date.now()}`,
      activity,
      title: title.trim() || (where === 'Online' && gameTitle.trim()) || t(activityMeta[activity].label),
      detail: where === 'Online' ? 'Online · Link after you join' : undefined,
      time: formatRoomTime(startsAt, endsAt),
      startsAt: startsAt.getTime(),
      endAt: endsAt.getTime(),
      people: [],
      count: 1,
      location: where === 'In person' ? place.trim() || 'Decide together' : undefined,
      online: where === 'Online' ? connectionDetails || 'Online' : undefined,
      locationMode: where === 'In person' ? 'in_person' : where === 'Online' ? 'online' : 'undecided',
      placeName: where === 'In person' ? place.trim() || undefined : undefined,
      onlineDetails: where === 'Online' ? connectionDetails || undefined : undefined,
      audience,
      audienceIds: audience === 'Choose circles' ? selectedCircles : audience === 'Choose people' ? selectedPeople : [],
      creatorId,
      chatEnabled,
      participantsCanInvite,
      joined: true,
    });
    close();
  };

  const whereSummary = where === 'In person' ? place.trim() || t('Decide together') : t(where);
  const whoSummary =
    audience === 'Choose people'
      ? t(`${selectedPeople.length} selected`)
      : audience === 'Choose circles'
        ? t(`${selectedCircles.length} selected`)
        : t(audience);

  return (
    <SheetShell
      visible={visible}
      kicker="OPEN A ROOM"
      title="What sounds good?"
      onClose={close}
      footer={<ActionButton label={t('Open room')} icon="sparkles" disabled={audienceMissing} onPress={create} />}
    >
      <View style={sheetStyles.activityGrid}>
        {activities.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: activity === item }}
            accessibilityLabel={t(activityMeta[item].label)}
            onPress={() => chooseActivity(item)}
            style={({ pressed }) => [
              sheetStyles.activityChoice,
              activity === item && sheetStyles.activityChoiceSelected,
              pressed && sheetStyles.choicePressed,
            ]}
          >
            <ActivityIcon activity={item} size={42} />
            <YText style={[sheetStyles.choiceLabel, activity === item && sheetStyles.choiceLabelSelected]}>
              {t(activityMeta[item].label)}
            </YText>
          </Pressable>
        ))}
      </View>
      <YTextInput
        label="Give it a name (optional)"
        value={title}
        onChangeText={setTitle}
        placeholder={t(activityMeta[activity].label)}
      />
      <ChoiceRow label="Start" options={[now, ...slots]} value={start} onChange={setStart} />
      <ChoiceRow label="Duration" options={Object.keys(roomDurations)} value={duration} onChange={setDuration} />

      <Foldout label="Where" value={whereSummary} open={whereOpen} onToggle={() => setWhereOpen((value) => !value)}>
        <ChoiceRow
          label="Format"
          options={['In person', 'Online', 'Undecided']}
          value={where}
          onChange={setWhere}
          wrap
        />
        {where === 'In person' && (
          <YTextInput
            label="Place (optional)"
            value={place}
            onChangeText={setPlace}
            placeholder={t('Decide together')}
          />
        )}
        {where === 'Online' && (
          <>
            {activity === 'gaming' && (
              <>
                <YTextInput
                  label="Game (optional)"
                  value={gameTitle}
                  onChangeText={setGameTitle}
                  placeholder="League of Legends"
                />
                <YTextInput label="Mode (optional)" value={gameMode} onChangeText={setGameMode} placeholder="ARAM" />
              </>
            )}
            <YTextInput
              label="Link or details (optional)"
              value={onlineDetails}
              onChangeText={setOnlineDetails}
              placeholder={t('Discord, username, server, or link')}
              multiline
            />
          </>
        )}
        {where === 'Undecided' && (
          <YText style={sheetStyles.helper}>{t('You can figure it out together in the room.')}</YText>
        )}
      </Foldout>

      <Foldout label="Who sees it" value={whoSummary} open={whoOpen} onToggle={() => setWhoOpen((value) => !value)}>
        <ChoiceRow label="Audience" options={audienceOptions} value={audience} onChange={setAudience} wrap />
        {audience === 'Choose circles' && (
          <CirclePicker
            circles={circles}
            selectedIds={selectedCircles}
            onToggle={(id) => setSelectedCircles((current) => toggled(current, id))}
          />
        )}
        {audience === 'Choose people' && (
          <PersonPicker
            people={audiencePeople}
            selectedIds={selectedPeople}
            onToggle={(id) => setSelectedPeople((current) => toggled(current, id))}
          />
        )}
        <OptionRow
          icon="chatbubble-ellipses-outline"
          title="Room chat"
          description="A small place for coordination"
          value={chatEnabled}
          onChange={setChatEnabled}
        />
        <OptionRow
          icon="person-add-outline"
          title="Participants can invite others"
          description="Let people bring a friend"
          value={participantsCanInvite}
          onChange={setParticipantsCanInvite}
        />
      </Foldout>
    </SheetShell>
  );
}

const freeDurations = ['1h', '3h', '6h', 'Today'];

export function AvailabilitySheet({
  visible,
  onClose,
  onPublish,
  people = seededPeople,
  circles = [],
  excludePersonId,
}: {
  visible: boolean;
  onClose: () => void;
  onPublish: (
    duration: string,
    note: string,
    audience: string,
    audienceIds: string[],
    canMessage: boolean,
    times: { startsAt: number; expiresAt: number } | null,
  ) => void | Promise<void>;
  people?: Person[];
  circles?: Circle[];
  excludePersonId?: string;
}) {
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  const [from, setFrom] = useState(now);
  const [until, setUntil] = useState('');
  const [duration, setDuration] = useState('3h');
  const [audience, setAudience] = useState('Everyone');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [allowMessages, setAllowMessages] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [slots] = useState(() => halfHourSlots(Date.now(), 47));
  // "Until" offers the half hours after the chosen start.
  const untilSlots = useMemo(() => (from === now ? [] : halfHourSlots(clockToday(from).getTime() + 1, 47)), [from]);
  const times = from === now ? null : availabilityWindow(from, until);
  const audienceOptions = useMemo(
    () => ['Everyone', ...(circles.length ? ['Choose circles'] : []), 'Choose people'],
    [circles],
  );
  const audiencePeople = useMemo(
    () => people.filter((person) => person.id !== excludePersonId),
    [excludePersonId, people],
  );

  const chooseFrom = (value: string) => {
    setFrom(value);
    // Three hours is the usual length, so preselect it.
    if (value !== now) setUntil(halfHourSlots(clockToday(value).getTime() + 1, 6)[5]);
  };
  const reset = () => {
    setFrom(now);
    setUntil('');
    setDuration('3h');
    setAudience('Everyone');
    setSelectedCircles([]);
    setSelectedPeople([]);
    setNote('');
    setAllowMessages(true);
    setPublishError('');
  };
  const close = (force = false) => {
    if (publishing && !force) return;
    reset();
    onClose();
  };
  const publish = () => {
    const audienceIds =
      audience === 'Choose people' ? selectedPeople : audience === 'Choose circles' ? selectedCircles : [];
    setPublishing(true);
    setPublishError('');
    Promise.resolve(onPublish(duration, note.trim(), audience, audienceIds, allowMessages, times))
      .then(() => close(true))
      .catch(() => setPublishError('Couldn’t share that right now. Try again.'))
      .finally(() => setPublishing(false));
  };
  const blocked =
    publishing ||
    (from !== now && !times) ||
    (audience === 'Choose people' && selectedPeople.length === 0) ||
    (audience === 'Choose circles' && selectedCircles.length === 0);

  return (
    <SheetShell
      visible={visible}
      kicker="I’M FREE"
      title="When are you around?"
      onClose={() => close()}
      footer={
        <ActionButton
          label={t(publishing ? 'Sharing…' : 'Tell friends I’m free')}
          icon="radio-button-on"
          disabled={blocked}
          onPress={publish}
        />
      }
    >
      <ChoiceRow label="From" options={[now, ...slots]} value={from} onChange={chooseFrom} />
      {from === now ? (
        <ChoiceRow label="For" options={freeDurations} value={duration} onChange={setDuration} wrap />
      ) : (
        <>
          <ChoiceRow label="Until" options={untilSlots} value={until} onChange={setUntil} />
          <YText style={sheetStyles.helper}>{t('Friends see the times now. You show as free once it starts.')}</YText>
        </>
      )}
      <YTextInput
        label="Add a note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder={t('Up for anything.')}
      />
      <ChoiceRow label="Who sees it" options={audienceOptions} value={audience} onChange={setAudience} wrap />
      {audience === 'Choose circles' && (
        <CirclePicker
          circles={circles}
          selectedIds={selectedCircles}
          onToggle={(id) => setSelectedCircles((current) => toggled(current, id))}
        />
      )}
      {audience === 'Choose people' && (
        <PersonPicker
          people={audiencePeople}
          selectedIds={selectedPeople}
          onToggle={(id) => setSelectedPeople((current) => toggled(current, id))}
        />
      )}
      <OptionRow
        icon="chatbubble-ellipses-outline"
        title="Allow messages"
        description="Quick notes while you’re free"
        value={allowMessages}
        onChange={setAllowMessages}
      />
      {publishError ? <YText style={sheetStyles.error}>{t(publishError)}</YText> : null}
    </SheetShell>
  );
}

// A row that shows the current choice and opens to change it.
function Foldout({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <View style={sheetStyles.foldout}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t(label)}: ${value}`}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={sheetStyles.foldoutHead}
      >
        <YText style={sheetStyles.foldoutLabel}>{t(label)}</YText>
        <YText style={sheetStyles.foldoutValue} numberOfLines={1}>
          {value}
        </YText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open && <View style={sheetStyles.foldoutBody}>{children}</View>}
    </View>
  );
}

function PersonPicker({
  people,
  selectedIds,
  onToggle,
}: {
  people: Person[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <View style={sheetStyles.personPicker}>
      <YText style={sheetStyles.helper}>
        {t(selectedIds.length ? `${selectedIds.length} selected` : 'Pick the friends who should see this.')}
      </YText>
      {people.length ? (
        people.slice(0, 6).map((person) => {
          const selected = selectedIds.includes(person.id);
          return (
            <Pressable
              key={person.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onToggle(person.id)}
              style={sheetStyles.personChoice}
            >
              <YText style={sheetStyles.personChoiceName}>{person.name}</YText>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={selected ? colors.brandText : colors.faint}
              />
            </Pressable>
          );
        })
      ) : (
        <YText style={sheetStyles.helper}>{t('Add a friend first, then you can choose them here.')}</YText>
      )}
    </View>
  );
}

function CirclePicker({
  circles,
  selectedIds,
  onToggle,
}: {
  circles: Circle[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <View style={sheetStyles.personPicker}>
      <YText style={sheetStyles.helper}>
        {t(selectedIds.length ? `${selectedIds.length} selected` : 'Pick one or more circles.')}
      </YText>
      {circles.map((circle) => {
        const selected = selectedIds.includes(circle.id);
        return (
          <Pressable
            key={circle.id}
            accessibilityRole="checkbox"
            accessibilityLabel={`${t('Circle')} ${circle.name}`}
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(circle.id)}
            style={sheetStyles.circleChoice}
          >
            <View style={sheetStyles.circleChoiceIcon}>
              <Ionicons name="people-outline" size={17} color={selected ? colors.brandInk : colors.muted} />
            </View>
            <View style={sheetStyles.circleChoiceCopy}>
              <YText style={sheetStyles.circleChoiceName}>{circle.name}</YText>
              <YText style={sheetStyles.circleChoiceCount}>
                {t(`${circle.memberIds.length} ${circle.memberIds.length === 1 ? 'friend' : 'friends'}`)}
              </YText>
            </View>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selected ? colors.brandText : colors.faint}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function OptionRow({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={t(title)}
      accessibilityHint={t(description)}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={sheetStyles.optionLine}
    >
      <View style={sheetStyles.optionIcon}>
        <Ionicons name={icon} size={18} color={colors.ink} />
      </View>
      <View style={sheetStyles.optionCopy}>
        <YText style={sheetStyles.optionTitle}>{t(title)}</YText>
        <YText style={sheetStyles.helper}>{t(description)}</YText>
      </View>
      <Switch
        accessible={false}
        importantForAccessibility="no"
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceMuted, true: colors.brand }}
        thumbColor={value ? colors.brandInk : colors.muted}
      />
    </Pressable>
  );
}

function YTextInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  return (
    <View style={sheetStyles.inputWrap}>
      <YText style={sheetStyles.inputLabel}>{t(label)}</YText>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? t(label)}
        style={[sheetStyles.input, props.multiline && sheetStyles.multilineInput]}
        placeholderTextColor={colors.faint}
      />
    </View>
  );
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
  wrap = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  wrap?: boolean;
}) {
  const { colors } = useTheme();
  const sheetStyles = useThemedStyles(makeSheetStyles);
  const t = useT();
  const choices = options.map((item) => (
    <Pressable
      key={item}
      accessibilityRole="radio"
      accessibilityLabel={`${t(label)}: ${t(item)}`}
      accessibilityState={{ selected: value === item }}
      onPress={() => onChange(item)}
      style={({ pressed }) => [
        sheetStyles.choiceChip,
        value === item && sheetStyles.choiceChipSelected,
        pressed && sheetStyles.choicePressed,
      ]}
    >
      <YText style={[sheetStyles.choiceChipText, value === item && { color: colors.brandInk }]}>{t(item)}</YText>
    </Pressable>
  ));
  return (
    <View style={sheetStyles.choiceRow}>
      <YText style={sheetStyles.inputLabel}>{t(label)}</YText>
      {wrap ? (
        <View style={sheetStyles.choiceListWrap}>{choices}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheetStyles.choiceList}>
          {choices}
        </ScrollView>
      )}
    </View>
  );
}

function toggled(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

// "HH:MM" as a time today.
function clockToday(clock: string) {
  const [hour, minute] = clock.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

// The chosen start: now, or the next time the clock shows that slot.
function startTime(start: string) {
  if (start === now) return new Date();
  const date = clockToday(start);
  if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);
  return date;
}
function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatRoomTime(start: Date, end: Date) {
  const startDay = formatDay(start);
  const endDay = formatDay(end);
  return start.toDateString() === end.toDateString()
    ? `${startDay} · ${formatTime(start)}–${formatTime(end)}`
    : `${startDay} ${formatTime(start)}–${endDay} ${formatTime(end)}`;
}
function formatDay(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysAway = Math.round((target.getTime() - startOfToday.getTime()) / 86400000);
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

const makeSheetStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
    sheet: {
      backgroundColor: colors.canvas,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderTopWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: spacing.xxl,
      paddingTop: 10,
      paddingBottom: 28,
      minHeight: 440,
      maxHeight: '96%',
    },
    scrollContent: { paddingBottom: spacing.md },
    foldout: {
      marginTop: spacing.lg,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      ...sticker(colors, 3),
    },
    foldoutHead: {
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    foldoutLabel: { ...display, fontSize: 16 },
    foldoutValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: colors.muted },
    foldoutBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    footerScrollContent: { paddingBottom: spacing.md },
    creationContent: { paddingBottom: 6 },
    footer: { paddingTop: spacing.md },
    handle: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.line,
      marginBottom: spacing.lg,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    headerCopy: { flex: 1, paddingRight: spacing.md },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    back: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kicker: { ...type.label, color: colors.muted, marginBottom: 6 },
    activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    activityChoice: {
      width: '23.1%',
      minHeight: 84,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 2,
      borderColor: colors.line,
    },
    activityChoiceSelected: { backgroundColor: colors.brand, ...sticker(colors, 3) },
    choicePressed: { transform: [{ translateY: 2 }], opacity: 0.8 },
    choiceLabel: { fontSize: 11, fontWeight: '800' },
    choiceLabelSelected: { color: colors.brandInk },
    check: { position: 'absolute', top: 5, right: 5 },
    timeRow: { flexDirection: 'row', gap: spacing.md },
    timeField: { flex: 1 },
    inputWrap: { marginTop: spacing.lg },
    inputLabel: { ...type.label, color: colors.muted, letterSpacing: 0.7 },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.button,
      paddingHorizontal: 15,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.ink,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.line,
    },
    multilineInput: { minHeight: 86, textAlignVertical: 'top' },
    helper: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 8 },
    choiceRow: { marginTop: spacing.lg },
    choiceList: { gap: 8, paddingTop: 9 },
    choiceListWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 9 },
    choiceChip: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderWidth: 2,
      borderColor: colors.line,
    },
    choiceChipSelected: { backgroundColor: colors.brand, ...sticker(colors, 3) },
    choiceChipText: { fontSize: 14, fontWeight: '800', color: colors.ink },
    question: { fontSize: 15, fontWeight: '800', marginTop: spacing.xl },
    optionLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
      backgroundColor: 'transparent',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.line,
      paddingVertical: spacing.md,
    },
    optionMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionCopy: { flex: 1 },
    optionTitle: { fontSize: 14, fontWeight: '800' },
    toggle: { minWidth: 42, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
    toggleOn: { backgroundColor: colors.brand },
    toggleOff: { backgroundColor: colors.surfaceMuted },
    toggleText: { fontSize: 11, fontWeight: '900', color: colors.brandInk },
    toggleOffText: { color: colors.muted },
    personPicker: { marginTop: spacing.md, gap: 5 },
    personChoice: {
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: 13,
      backgroundColor: colors.surfaceMuted,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    personChoiceName: { fontSize: 14, fontWeight: '700' },
    circleChoice: {
      minHeight: 56,
      paddingHorizontal: 10,
      borderRadius: 13,
      backgroundColor: colors.surfaceMuted,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    circleChoiceIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.canvas,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleChoiceCopy: { flex: 1 },
    circleChoiceName: { fontSize: 14, fontWeight: '800' },
    circleChoiceCount: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    error: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: spacing.md },
  });
