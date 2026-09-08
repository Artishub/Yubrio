import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActionButton, ActivityIcon, YText } from '@/components/ui';
import { ActivityType, activityMeta, colors, radius, spacing, type } from '@/design/tokens';
import { Circle, Person, Room } from '@/types';
import { people as seededPeople } from '@/data/demo';
import { isValidClockTime } from '@/lib/validation/rules';

const activities: ActivityType[] = ['coffee', 'drinks', 'food', 'walk', 'gaming', 'gym', 'hangout', 'custom'];
const durations = ['1 hour', '3 hours', '6 hours', 'All day', 'Custom'];

function SheetShell({ visible, children, onClose, footer }: { visible: boolean; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={sheetStyles.backdrop}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[sheetStyles.scrollContent, footer !== undefined && footer !== null ? sheetStyles.footerScrollContent : undefined]}>{children}</ScrollView>
        {footer ? <View style={sheetStyles.footer}>{footer}</View> : null}
      </View>
    </View>
  </Modal>;
}

export function CreateRoomSheet({ visible, onClose, onCreate, creatorId = 'artjom', circles = [], people = seededPeople }: { visible: boolean; onClose: () => void; onCreate: (room: Room) => void; creatorId?: string; circles?: Circle[]; people?: Person[] }) {
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState<ActivityType>('drinks');
  const [when, setWhen] = useState('Now');
  const [customStart, setCustomStart] = useState('');
  const [duration, setDuration] = useState('3 hours');
  const [customDuration, setCustomDuration] = useState('');
  const [where, setWhere] = useState('In person');
  const [place, setPlace] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [onlineDetails, setOnlineDetails] = useState('');
  const [audience, setAudience] = useState('All friends');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [participantsCanInvite, setParticipantsCanInvite] = useState(true);
  const [formError, setFormError] = useState('');
  const audienceOptions = useMemo(() => ['All friends', ...(circles.length ? ['Choose circles'] : []), 'Choose people'], [circles]);
  const audiencePeople = useMemo(() => people.filter((person) => person.id !== creatorId), [creatorId, people]);

  const reset = () => {
    setStep(0); setActivity('drinks'); setWhen('Now'); setCustomStart(''); setDuration('3 hours'); setCustomDuration(''); setWhere('In person'); setFormError('');
    setPlace(''); setGameTitle(''); setGameMode(''); setOnlineDetails(''); setAudience('All friends'); setSelectedCircles([]); setSelectedPeople([]); setTitle(''); setChatEnabled(true); setParticipantsCanInvite(true);
  };
  const close = () => { reset(); onClose(); };
  const next = () => {
    if (step === 1 && when === 'Custom' && !isValidClockTime(customStart)) {
      setFormError('Use a time like 18:30.');
      return;
    }
    setFormError('');
    if (step < 3) { setStep((value) => value + 1); return; }
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const meta = activityMeta[activity];
    const start = getStartTime(when, customStart);
    const end = new Date(start.getTime() + durationHours(duration, customDuration) * 60 * 60 * 1000);
    const connectionDetails = [gameTitle.trim(), gameMode.trim(), onlineDetails.trim()].filter(Boolean).join(' · ');
    onCreate({
      id: `room-${Date.now()}`,
      activity,
      title: title.trim() || meta.label,
      detail: where === 'Online' ? 'Online · Join after Yeb' : undefined,
      time: formatRoomTime(start, end),
      startsAt: start.getTime(),
      endAt: end.getTime(),
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
  const heading = step === 0 ? 'What sounds good?' : step === 1 ? 'When works?' : step === 2 ? 'Where is it?' : 'Who should see it?';

  return <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
    <View style={sheetStyles.backdrop}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close room creation" onPress={close} style={StyleSheet.absoluteFill} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <View style={sheetStyles.sheetHeader}>
          <View style={sheetStyles.headerCopy}>
            <View style={sheetStyles.stepRow}>
              {step > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => { setStep((value) => value - 1); setFormError(''); }} style={sheetStyles.back}><Ionicons name="arrow-back" size={18} color={colors.ink} /></Pressable>}
              <YText style={sheetStyles.kicker}>OPEN A ROOM · {step + 1}/4</YText>
            </View>
            <YText style={type.section}>{heading}</YText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={sheetStyles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={sheetStyles.creationContent}>
          {step === 0 && <>
            <View style={sheetStyles.activityGrid}>{activities.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: activity === item }} accessibilityLabel={activityMeta[item].label} onPress={() => setActivity(item)} style={({ pressed }) => [sheetStyles.activityChoice, activity === item && sheetStyles.activityChoiceSelected, pressed && sheetStyles.choicePressed]}><ActivityIcon activity={item} size={42} /><YText style={sheetStyles.choiceLabel}>{activityMeta[item].label}</YText>{activity === item && <Ionicons name="checkmark-circle" size={17} color={colors.ink} style={sheetStyles.check} />}</Pressable>)}</View>
            <YTextInput label="Give it a name (optional)" value={title} onChangeText={setTitle} placeholder={activityMeta[activity].label} />
          </>}
          {step === 1 && <>
            <ChoiceRow label="Start" options={['Now', 'Later today', 'Custom']} value={when} onChange={(value) => { setWhen(value); setFormError(''); }} />
            {when === 'Custom' && <YTextInput label="Start time" value={customStart} onChangeText={(value) => { setCustomStart(value); setFormError(''); }} placeholder="18:30" keyboardType="numbers-and-punctuation" />}
            <ChoiceRow label="Duration" options={durations} value={duration} onChange={setDuration} wrap />
            {duration === 'Custom' && <><YTextInput label="How many hours?" value={customDuration} onChangeText={(value) => { setCustomDuration(value); setFormError(''); }} placeholder="Up to 24" keyboardType="decimal-pad" /><YText style={[sheetStyles.helper, customDuration.trim() && !validCustomHours(customDuration) && sheetStyles.error]}>{customDuration.trim() && !validCustomHours(customDuration) ? 'Use a number greater than 0 and no more than 24.' : 'Enter a duration up to 24 hours.'}</YText></>}
            <YText style={sheetStyles.helper}>Rooms gently disappear after 24 hours.</YText>
          </>}
          {step === 2 && <>
            <ChoiceRow label="Format" options={['In person', 'Online', 'Undecided']} value={where} onChange={setWhere} wrap />
            {where === 'In person' && <YTextInput label="Place (optional)" value={place} onChangeText={setPlace} placeholder="Decide together" />}
            {where === 'Online' && <>
              {activity === 'gaming' && <>
                <YTextInput label="Game (optional)" value={gameTitle} onChangeText={setGameTitle} placeholder="League of Legends" />
                <YTextInput label="Mode (optional)" value={gameMode} onChangeText={setGameMode} placeholder="ARAM" />
              </>}
              <YTextInput label={activity === 'gaming' ? 'Join details (optional)' : 'Link or details (optional)'} value={onlineDetails} onChangeText={setOnlineDetails} placeholder={activity === 'gaming' ? 'Discord, username, server, or link' : 'Discord, server, or link'} multiline />
            </>}
            {where === 'Undecided' && <YText style={sheetStyles.helper}>You can figure it out together in the room.</YText>}
          </>}
          {step === 3 && <>
            <ChoiceRow label="Audience" options={audienceOptions} value={audience} onChange={setAudience} wrap />
            {audience === 'Choose circles' && <CirclePicker circles={circles} selectedIds={selectedCircles} onToggle={(id) => setSelectedCircles((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />}
            {audience === 'Choose people' && <PersonPicker people={audiencePeople} selectedIds={selectedPeople} onToggle={(id) => setSelectedPeople((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />}
            <OptionRow icon="chatbubble-ellipses-outline" title="Room chat" description="A small place for coordination" value={chatEnabled} onChange={setChatEnabled} />
            <OptionRow icon="person-add-outline" title="Participants can invite others" description="Let people bring a friend" value={participantsCanInvite} onChange={setParticipantsCanInvite} />
          </>}
          {formError ? <YText accessibilityRole="alert" style={sheetStyles.error}>{formError}</YText> : null}<ActionButton label={step === 3 ? 'Open room' : 'Continue'} icon={step === 3 ? 'sparkles' : 'arrow-forward'} disabled={(step === 1 && duration === 'Custom' && !validCustomHours(customDuration)) || (step === 3 && ((audience === 'Choose people' && selectedPeople.length === 0) || (audience === 'Choose circles' && selectedCircles.length === 0)))} onPress={next} style={{ marginTop: spacing.xl }} />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

export function AvailabilitySheet({ visible, onClose, onPublish, people = seededPeople, circles = [], excludePersonId }: { visible: boolean; onClose: () => void; onPublish: (duration: string, note: string, audience: string, audienceIds: string[], canMessage: boolean) => void | Promise<void>; people?: Person[]; circles?: Circle[]; excludePersonId?: string }) {
  const [duration, setDuration] = useState('3h');
  const [customDuration, setCustomDuration] = useState('');
  const [audience, setAudience] = useState('Everyone');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [note, setNote] = useState('Up for anything.');
  const [allowMessages, setAllowMessages] = useState(true);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const audienceOptions = useMemo(() => ['Everyone', ...(circles.length ? ['Choose circles'] : []), 'Choose people'], [circles]);
  const audiencePeople = useMemo(() => people.filter((person) => person.id !== excludePersonId), [excludePersonId, people]);
  const togglePerson = (id: string) => setSelectedPeople((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleCircle = (id: string) => setSelectedCircles((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const reset = () => { setDuration('3h'); setCustomDuration(''); setAudience('Everyone'); setSelectedCircles([]); setNote('Up for anything.'); setAllowMessages(true); setSelectedPeople([]); setPublishError(''); };
  const close = (force = false) => { if (publishing && !force) return; reset(); onClose(); };
  return <SheetShell visible={visible} onClose={close} footer={<ActionButton label={publishing ? 'Sharing…' : 'Tell friends I’m free'} icon="radio-button-on" disabled={publishing || (duration === 'Custom' && !validCustomHours(customDuration)) || (audience === 'Choose people' && selectedPeople.length === 0) || (audience === 'Choose circles' && selectedCircles.length === 0)} onPress={() => { const selectedDuration = duration === 'Custom' ? `${customDuration.trim()}h` : duration; const selectedAudienceIds = audience === 'Choose people' ? selectedPeople : audience === 'Choose circles' ? selectedCircles : []; setPublishing(true); setPublishError(''); Promise.resolve(onPublish(selectedDuration, note.trim(), audience, selectedAudienceIds, allowMessages)).then(() => close(true)).catch(() => setPublishError('Couldn’t share that right now. Try again.')).finally(() => setPublishing(false)); }} />}> 
    <View style={sheetStyles.sheetHeader}><View style={sheetStyles.headerCopy}><YText style={sheetStyles.kicker}>I’M FREE</YText><YText style={type.section}>How long are you around?</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => close()} style={sheetStyles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
    <ChoiceRow label="Duration" options={['1h', '3h', '6h', 'Today', 'Custom']} value={duration} onChange={setDuration} wrap />
    {duration === 'Custom' && <><YTextInput label="How many hours?" value={customDuration} onChangeText={(value) => { setCustomDuration(value); setPublishError(''); }} placeholder="Up to 24" keyboardType="decimal-pad" /><YText style={[sheetStyles.helper, customDuration.trim() && !validCustomHours(customDuration) && sheetStyles.error]}>{customDuration.trim() && !validCustomHours(customDuration) ? 'Use a number greater than 0 and no more than 24.' : 'Enter a duration up to 24 hours.'}</YText></>}
    <YTextInput label="Add a note (optional)" value={note} onChangeText={setNote} placeholder="Up for anything." />
    <YText style={sheetStyles.question}>Who should see this?</YText>
    <ChoiceRow label="Audience" options={audienceOptions} value={audience} onChange={setAudience} wrap />
    {audience === 'Choose circles' && <CirclePicker circles={circles} selectedIds={selectedCircles} onToggle={toggleCircle} />}
    {audience === 'Choose people' && <PersonPicker people={audiencePeople} selectedIds={selectedPeople} onToggle={togglePerson} />}
    <OptionRow icon="chatbubble-ellipses-outline" title="Allow messages" description="Quick notes while you’re free" value={allowMessages} onChange={setAllowMessages} />
    {publishError ? <YText style={sheetStyles.error}>{publishError}</YText> : null}
  </SheetShell>;
}

function PersonPicker({ people, selectedIds, onToggle }: { people: Person[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <View style={sheetStyles.personPicker}><YText style={sheetStyles.helper}>{selectedIds.length ? `${selectedIds.length} selected` : 'Pick the friends who should see this.'}</YText>{people.length ? people.slice(0, 6).map((person) => { const selected = selectedIds.includes(person.id); return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => onToggle(person.id)} style={sheetStyles.personChoice}><YText style={sheetStyles.personChoiceName}>{person.name}</YText><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? colors.brand : colors.faint} /></Pressable>; }) : <YText style={sheetStyles.helper}>Add a friend first, then you can choose them here.</YText>}</View>;
}

function CirclePicker({ circles, selectedIds, onToggle }: { circles: Circle[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <View style={sheetStyles.personPicker}><YText style={sheetStyles.helper}>{selectedIds.length ? `${selectedIds.length} selected` : 'Pick one or more circles.'}</YText>{circles.map((circle) => { const selected = selectedIds.includes(circle.id); return <Pressable key={circle.id} accessibilityRole="checkbox" accessibilityLabel={`Circle ${circle.name}`} accessibilityState={{ checked: selected }} onPress={() => onToggle(circle.id)} style={sheetStyles.circleChoice}><View style={sheetStyles.circleChoiceIcon}><Ionicons name="people-outline" size={17} color={selected ? colors.brandInk : colors.muted} /></View><View style={sheetStyles.circleChoiceCopy}><YText style={sheetStyles.circleChoiceName}>{circle.name}</YText><YText style={sheetStyles.circleChoiceCount}>{circle.memberIds.length} {circle.memberIds.length === 1 ? 'friend' : 'friends'}</YText></View><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? colors.brand : colors.faint} /></Pressable>; })}</View>;
}

function OptionRow({ icon, title, description, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={title} accessibilityHint={description} accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={sheetStyles.optionLine}>
      <View style={sheetStyles.optionIcon}><Ionicons name={icon} size={18} color={colors.ink} /></View>
      <View style={sheetStyles.optionCopy}><YText style={sheetStyles.optionTitle}>{title}</YText><YText style={sheetStyles.helper}>{description}</YText></View>
      <Switch accessible={false} importantForAccessibility="no" value={value} onValueChange={onChange} trackColor={{ false: colors.surfaceMuted, true: colors.brand }} thumbColor={value ? colors.brandInk : colors.muted} />
  </Pressable>;
}

function YTextInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={sheetStyles.inputWrap}><YText style={sheetStyles.inputLabel}>{label}</YText><TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} style={[sheetStyles.input, props.multiline && sheetStyles.multilineInput]} placeholderTextColor={colors.faint} /></View>;
}

function ChoiceRow({ label, options, value, onChange, wrap = false }: { label: string; options: string[]; value: string; onChange: (value: string) => void; wrap?: boolean }) {
  const choices = options.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityLabel={`${label}: ${item}`} accessibilityState={{ selected: value === item }} onPress={() => onChange(item)} style={({ pressed }) => [sheetStyles.choiceChip, value === item && sheetStyles.choiceChipSelected, pressed && sheetStyles.choicePressed]}><YText style={[sheetStyles.choiceChipText, value === item && { color: colors.brandInk }]}>{item}</YText></Pressable>);
  return <View style={sheetStyles.choiceRow}><YText style={sheetStyles.inputLabel}>{label}</YText>{wrap ? <View style={sheetStyles.choiceListWrap}>{choices}</View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheetStyles.choiceList}>{choices}</ScrollView>}</View>;
}

function durationHours(value: string, custom = '') { if (value === 'Custom') return validCustomHours(custom) ? Number(custom) : 3; return value === '1 hour' ? 1 : value === '6 hours' ? 6 : value === 'All day' ? 24 : 3; }
function validCustomHours(value: string) { const hours = Number(value.trim()); return Number.isFinite(hours) && hours > 0 && hours <= 24; }
function getStartTime(value: string, custom: string) {
  const now = new Date();
  if (value === 'Now') return now;
  if (value === 'Custom') {
    const match = /^(\d{1,2}):(\d{2})$/.exec(custom.trim());
    if (match) {
      const hour = Number(match[1]); const minute = Number(match[2]);
      if (hour < 24 && minute < 60) { const start = new Date(); start.setHours(hour, minute, 0, 0); if (start.getTime() < now.getTime()) start.setDate(start.getDate() + 1); return start; }
    }
  }
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000); later.setMinutes(Math.ceil(later.getMinutes() / 30) * 30, 0, 0); return later;
}
function formatTime(date: Date) { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatRoomTime(start: Date, end: Date) { const startDay = formatDay(start); const endDay = formatDay(end); return start.toDateString() === end.toDateString() ? `${startDay} · ${formatTime(start)}–${formatTime(end)}` : `${startDay} ${formatTime(start)}–${endDay} ${formatTime(end)}`; }
function formatDay(date: Date) { const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const daysAway = Math.round((target.getTime() - today.getTime()) / 86400000); if (daysAway === 0) return 'Today'; if (daysAway === 1) return 'Tomorrow'; return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.canvas, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderTopWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.xxl, paddingTop: 10, paddingBottom: 28, minHeight: 440, maxHeight: '96%' },
  scrollContent: { paddingBottom: 6 }, footerScrollContent: { paddingBottom: spacing.md }, creationContent: { paddingBottom: 6 },
  footer: { paddingTop: spacing.md },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }, headerCopy: { flex: 1, paddingRight: spacing.md }, stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }, close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, kicker: { ...type.label, color: colors.muted, marginBottom: 6 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, activityChoice: { width: '23.1%', minHeight: 84, borderRadius: 17, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.line }, activityChoiceSelected: { borderColor: colors.brand, backgroundColor: colors.glassHighlight }, choicePressed: { transform: [{ translateY: 2 }], opacity: 0.8 }, choiceLabel: { fontSize: 11, fontWeight: '800' }, check: { position: 'absolute', top: 5, right: 5 },
  inputWrap: { marginTop: spacing.lg }, inputLabel: { ...type.label, color: colors.muted, letterSpacing: 0.7 }, input: { backgroundColor: colors.surface, borderRadius: radius.button, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, color: colors.ink, marginTop: 8, borderWidth: 1, borderColor: colors.line }, multilineInput: { minHeight: 86, textAlignVertical: 'top' }, helper: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 8 },
  choiceRow: { marginTop: spacing.lg }, choiceList: { gap: 8, paddingTop: 9 }, choiceListWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 9 }, choiceChip: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 11, borderWidth: 1, borderColor: colors.line, borderBottomWidth: 3, borderBottomColor: colors.canvas }, choiceChipSelected: { backgroundColor: colors.brand, borderColor: colors.brand, borderBottomColor: colors.brandPressed }, choiceChipText: { fontSize: 14, fontWeight: '800', color: colors.ink }, question: { fontSize: 15, fontWeight: '800', marginTop: spacing.xl },
  optionLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, backgroundColor: 'transparent', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: spacing.md }, optionMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, optionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' }, optionCopy: { flex: 1 }, optionTitle: { fontSize: 14, fontWeight: '800' }, toggle: { minWidth: 42, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 }, toggleOn: { backgroundColor: colors.brand }, toggleOff: { backgroundColor: colors.surfaceMuted }, toggleText: { fontSize: 11, fontWeight: '900', color: colors.brandInk }, toggleOffText: { color: colors.muted }, personPicker: { marginTop: spacing.md, gap: 5 }, personChoice: { minHeight: 44, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, personChoiceName: { fontSize: 14, fontWeight: '700' }, circleChoice: { minHeight: 56, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 10 }, circleChoiceIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }, circleChoiceCopy: { flex: 1 }, circleChoiceName: { fontSize: 14, fontWeight: '800' }, circleChoiceCount: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 }, error: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: spacing.md },
});
