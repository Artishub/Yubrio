import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon, ActionButton, Avatar, PersonRow, YText, YebButton } from '@/components/ui';
import { ActivityType, activityMeta, colors, spacing, type } from '@/design/tokens';
import { copy } from '@/design/copy';
import { roomSuggestions as seededRoomSuggestions } from '@/data/demo';
import { Room, RoomSuggestion } from '@/types';
import { useDemo } from '@/stores/demo-store';
import { subscribeToRoom } from '@/lib/supabase/realtime';
import { queryClient } from '@/lib/query/client';
import { createRoomSuggestion, fetchRoomById, fetchRoomMessages, fetchRoomSuggestions, inviteFriendsToRoom, sendRoomMessage } from '@/lib/supabase/repositories';
import { useQuery } from '@tanstack/react-query';
import { roomMessages as seededRoomMessages } from '@/data/demo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { displayName, displayTitle } from '@/utils/display-name';
import { filterInvitableFriendIds, isValidClockTime } from '@/lib/validation/rules';
import * as Haptics from 'expo-haptics';

export default function RoomScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { rooms, roomArchive, me, remoteActive } = useDemo();
  const localRoom = rooms.find((item) => item.id === id) ?? roomArchive.find((item) => item.id === id);
  const remoteRoom = useQuery({ queryKey: ['room', id], queryFn: () => fetchRoomById(id), enabled: remoteActive && Boolean(id) && !id.startsWith('room-'), staleTime: 15_000 });
  const room = remoteRoom.data ? mapRemoteRoom(remoteRoom.data, me.id) : localRoom;
  const [initialNow] = useState(Date.now);
  const [expiredRoomId, setExpiredRoomId] = useState<string | null>(() => room && room.endAt <= initialNow ? room.id : null);
  const roomEndAt = room?.endAt;
  const roomId = room?.id;
  useEffect(() => {
    if (!roomEndAt || !roomId) return;
    const remaining = roomEndAt - new Date().getTime();
    const timer = setTimeout(() => setExpiredRoomId(roomId), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [roomEndAt, roomId]);
  if (!room) return <View style={[styles.missingRoot, { paddingTop: Math.max(24, insets.top + 12) }]}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={styles.navButton}><Ionicons name="arrow-back" size={21} color={colors.ink} /></Pressable><View style={styles.missingCopy}>{remoteRoom.isPending ? <><ActivityIndicator color={colors.brand} /><YText style={styles.missingText}>Finding that room…</YText></> : remoteRoom.isError ? <><ActivityIcon activity="custom" size={58} /><YText style={type.section}>That room wouldn’t load.</YText><YText style={styles.missingText}>Check your connection and try again.</YText><ActionButton label="Try again" icon="refresh" onPress={() => void remoteRoom.refetch()} style={{ marginTop: spacing.lg }} /></> : <><ActivityIcon activity="custom" size={58} /><YText style={type.section}>This room has gone quiet.</YText><YText style={styles.missingText}>It may have expired or the link is no longer available.</YText><ActionButton label="Back to home" icon="arrow-forward" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.lg }} /></>}</View></View>;
  return <RoomContent room={room} archived={expiredRoomId === room.id} />;
}

function RoomContent({ room, archived }: { room: Room; archived: boolean }) {
  const router = useRouter();
  const { me, people, remoteActive, joinedRoom, leaveRoom } = useDemo();
  const insets = useSafeAreaInsets();
  const currentUser = me;
  const [laterOpen, setLaterOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [membershipOverride, setMembershipOverride] = useState<'joined' | 'left' | null>(null);
  const [arrivalOverride, setArrivalOverride] = useState<string | null>(null);
  const [membershipPending, setMembershipPending] = useState(false);
  const [membershipError, setMembershipError] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState<RoomSuggestion[]>(seededRoomSuggestions[room.id] ?? []);
  const [pendingSuggestions, setPendingSuggestions] = useState<RoomSuggestion[]>([]);
  const [suggestionError, setSuggestionError] = useState('');
  const meta = activityMeta[room.activity];
  const roomPeople = useMemo(() => {
    const profiles = new Map([...people, ...(room.participantDetails ?? [])].map((person) => [person.id, person]));
    return room.people.map((personId) => profiles.get(personId)).filter(Boolean) as typeof people;
  }, [people, room.participantDetails, room.people]);
  const memberPeople = useMemo(() => room.people
    .filter((personId) => personId !== currentUser.id)
    .map((personId) => roomPeople.find((person) => person.id === personId))
    .filter(Boolean) as typeof people, [room.people, roomPeople, currentUser.id]);
  const isJoined = membershipOverride === 'joined' ? true : membershipOverride === 'left' ? false : Boolean(room.joined);
  const arrivalByPerson = useMemo(() => {
    const next = { ...room.arrivalByPerson };
    if (membershipOverride === 'left') delete next[currentUser.id];
    if (membershipOverride === 'joined') {
      if (arrivalOverride) next[currentUser.id] = arrivalOverride;
      else delete next[currentUser.id];
    }
    return next;
  }, [arrivalOverride, currentUser.id, membershipOverride, room.arrivalByPerson]);
  const currentUserDetail = room.creatorId === currentUser.id ? 'Created room' : arrivalByPerson[currentUser.id] ? arrivalDetail(arrivalByPerson[currentUser.id]) : room.arrival ? arrivalDetail(room.arrival) : 'You’re in';
  const displayCount = Math.max(0, room.count + (membershipOverride === 'joined' && !room.joined ? 1 : membershipOverride === 'left' && room.joined ? -1 : 0));
  const canInvite = !archived && isJoined && (room.creatorId === currentUser.id || room.participantsCanInvite !== false);
  const invitableIds = filterInvitableFriendIds(people.map((person) => person.id), currentUser.id, room.people, invitedIds);
  const invitePeople = people.filter((person) => invitableIds.includes(person.id));
  const sendInvites = async (inviteeIds: string[]) => {
    if (!inviteeIds.length) return;
    setInviteError(false);
    try {
      if (remoteActive && !room.id.startsWith('room-')) await inviteFriendsToRoom(room.id, inviteeIds);
      setInvitedIds((current) => [...new Set([...current, ...inviteeIds])]);
      setInviteNotice(`${inviteeIds.length} invite${inviteeIds.length === 1 ? '' : 's'} sent`);
      setInviteOpen(false);
    } catch {
      setInviteError(true);
    }
  };
  const updateMembership = async (arrival?: string) => {
    setMembershipPending(true);
    setMembershipError('');
    try {
      await joinedRoom(room.id, arrival);
      setMembershipOverride('joined');
      setArrivalOverride(arrival ?? null);
      setLaterOpen(false);
    } catch {
      setMembershipError('Couldn’t join that room. Try again.');
    } finally {
      setMembershipPending(false);
    }
  };
  const leave = async () => {
    setMembershipPending(true);
    setMembershipError('');
    try {
      await leaveRoom(room.id);
      setMembershipOverride('left');
      setArrivalOverride(null);
    } catch {
      setMembershipError('Couldn’t leave that room. Try again.');
    } finally {
      setMembershipPending(false);
    }
  };

  const remoteMessages = useQuery({ queryKey: ['room-messages', room.id], queryFn: () => fetchRoomMessages(room.id), enabled: remoteActive && !room.id.startsWith('room-') && (isJoined || archived), staleTime: 15_000 });
  const remoteSuggestions = useQuery({ queryKey: ['room-suggestions', room.id], queryFn: () => fetchRoomSuggestions(room.id), enabled: remoteActive && !room.id.startsWith('room-'), staleTime: 15_000 });
  const remoteSuggestionRows = remoteSuggestions.data?.map((item: any) => ({ id: item.id, roomId: item.room_id, activity: item.activity as ActivityType, title: item.title, authorId: item.author_id, authorName: item.profiles?.display_name ?? 'Friend' })) ?? null;
  const suggestions = [...(remoteSuggestionRows ?? localSuggestions), ...pendingSuggestions];
  const remoteMessageRows = remoteMessages.data?.map((item: any) => <ChatRow key={item.id} name={item.profiles?.display_name ?? 'Friend'} text={item.body} people={roomPeople} fallback={currentUser} />);
  const fallbackMessageRows = (seededRoomMessages[room.id] ?? []).map((item) => <ChatRow key={`${item.author}-${item.body}`} name={item.author} text={item.body} people={roomPeople} fallback={currentUser} />);
  useEffect(() => { if (!remoteActive || !room.id || room.id.startsWith('room-')) return; return subscribeToRoom(room.id, () => { void queryClient.invalidateQueries({ queryKey: ['home'] }); void queryClient.invalidateQueries({ queryKey: ['room', room.id] }); void queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] }); void queryClient.invalidateQueries({ queryKey: ['room-suggestions', room.id] }); }); }, [remoteActive, room.id]);
  const sendMessage = async () => { const trimmed = message.trim(); if (archived || !isJoined || !trimmed || room.chatEnabled === false || sendingMessage) return; setSendingMessage(true); setMessageError(''); setMessage(''); try { if (remoteActive && !room.id.startsWith('room-')) { await sendRoomMessage(room.id, trimmed); await queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] }); } else { setSent((items) => [...items, trimmed]); } } catch { setMessage(trimmed); setMessageError('Couldn’t send that. Try again.'); } finally { setSendingMessage(false); } };

  return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(56, insets.top + 16), paddingBottom: insets.bottom + 42 }]}>
    <View style={styles.nav}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }} style={styles.navButton}><Ionicons name="arrow-back" size={21} color={colors.ink} /></Pressable><View style={styles.navContext}><View style={[styles.navDot, { backgroundColor: meta.color }]} /><YText style={styles.navContextText}>{meta.label}</YText></View><View style={{ width: 44 }} /></View>
    <View style={[styles.hero, { position: 'relative', overflow: 'hidden' }]}><View pointerEvents="none" style={[styles.heroField, { backgroundColor: meta.color }]} /><View style={styles.heroTop}><ActivityIcon activity={room.activity} size={54} /><View style={styles.heroCopy}><YText style={styles.heroStatus}>{archived ? 'ENDED' : 'ROOM OPEN'}</YText><YText style={styles.heroTitle}>{displayTitle(room.title)}</YText><YText style={styles.heroTime}>{room.time}</YText></View></View>{room.detail && <YText style={styles.heroDetail}>{room.detail}</YText>}{archived && <View style={styles.archiveBanner}><Ionicons name="archive-outline" size={17} color={colors.muted} /><YText style={styles.archiveText}>This room has ended. Chat is read-only.</YText></View>}</View>
    <View style={styles.infoCard}><View style={styles.infoIcon}><Ionicons name={room.online ? 'game-controller-outline' : 'location-outline'} size={19} color={colors.ink} /></View><View style={styles.infoCopy}><YText style={styles.infoTitle}>{room.online ?? room.location ?? 'Decide together'}</YText><YText style={styles.meta}>{room.online ? 'Available after you join' : 'Shared with the room'}</YText></View></View>
    {!archived && <View style={styles.actionArea}>{isJoined ? <><YebButton joined onPress={() => undefined} /><Pressable accessibilityRole="button" disabled={membershipPending} onPress={() => void leave()} style={({ pressed }) => [styles.leaveButton, pressed && styles.tactilePressed, membershipPending && styles.disabledAction]}><YText style={styles.leaveText}>{membershipPending ? 'Updating…' : 'Leave room'}</YText></Pressable></> : <><YebButton onPress={() => { if (!membershipPending) void updateMembership(); }} /><Pressable accessibilityRole="button" accessibilityLabel="Yeb, but later" disabled={membershipPending} onPress={() => { tactilePress(); setLaterOpen(true); }} style={({ pressed }) => [styles.laterButton, pressed && styles.tactilePressed, membershipPending && styles.disabledAction]}><YText style={styles.laterText}>Yeb, but later</YText><Ionicons name="time-outline" size={17} color={colors.ink} /></Pressable></>}</View>}{membershipError ? <YText style={styles.actionError}>{membershipError}</YText> : null}
    <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.peopleHeading}><YText style={type.section}>People</YText><YText style={styles.peopleHint}>{displayCount} {displayCount === 1 ? 'person' : 'people'}</YText></View>{canInvite && <Pressable accessibilityRole="button" accessibilityLabel="Invite friends" onPress={() => { tactilePress(); setInviteError(false); setInviteOpen(true); }} style={({ pressed }) => [styles.inviteButton, pressed && styles.tactilePressed]}><Ionicons name="person-add-outline" size={15} color={colors.brand} /><YText style={styles.inviteButtonText}>Invite</YText></Pressable>}</View><View style={styles.peopleCard}>{memberPeople.length ? memberPeople.map((person) => <PersonRow key={person.id} person={person} detail={person.id === room.creatorId ? 'Created room' : arrivalByPerson[person.id] ? arrivalDetail(arrivalByPerson[person.id]) : 'In the room'} />) : isJoined ? <PersonRow person={currentUser} detail={currentUserDetail} /> : <YText style={styles.peopleEmpty}>No one is in yet.</YText>}{isJoined && memberPeople.length > 0 && <PersonRow person={currentUser} detail={currentUserDetail} />}</View>{inviteNotice ? <YText style={styles.inviteNotice}>{inviteNotice}</YText> : null}</View>
    {(suggestions.length > 0 || (!archived && isJoined)) && <View style={styles.section}><View style={styles.sectionHeader}><YText style={type.section}>Suggestions</YText>{!archived && isJoined && <Pressable accessibilityRole="button" accessibilityLabel="Suggest an activity" onPress={() => { tactilePress(); setSuggestionError(''); setSuggestOpen(true); }} style={({ pressed }) => [styles.suggestButton, pressed && styles.tactilePressed]}><Ionicons name="add" size={16} color={colors.brand} /><YText style={styles.suggestButtonText}>Suggest</YText></Pressable>}</View>{suggestionError ? <YText style={styles.chatError}>{suggestionError}</YText> : null}{suggestions.length ? <View style={styles.suggestionList}>{suggestions.map((suggestion) => <View key={suggestion.id} style={styles.suggestion}><ActivityIcon activity={suggestion.activity} size={38} /><View style={styles.suggestionCopy}><YText style={styles.suggestionTitle}>{suggestion.title}</YText><YText style={styles.meta}>{suggestion.authorName ?? (suggestion.authorId === currentUser.id ? 'You' : 'Friend')} suggested</YText></View></View>)}</View> : <YText style={styles.suggestionEmpty}>Nothing suggested yet.</YText>}</View>}
    <View style={styles.section}><View style={styles.sectionHeader}><YText style={type.section}>{copy.room.chat}</YText></View>{room.chatEnabled === false ? <View style={styles.chatOff}><Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.muted} /><YText style={styles.chatOffText}>Room chat is off for this room.</YText></View> : <View style={styles.chatCard}>{!isJoined && !archived ? <View style={styles.chatJoinPrompt}><Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.muted} /><YText style={styles.chatOffText}>Join the room to chat with everyone.</YText></View> : <>{remoteMessages.isLoading ? <View style={styles.chatStatus}><ActivityIndicator size="small" color={colors.brand} /><YText style={styles.chatStatusText}>Loading chat…</YText></View> : remoteMessages.isError ? <YText style={styles.chatError}>Couldn’t load chat. Try again later.</YText> : remoteMessages.data ? remoteMessageRows : fallbackMessageRows}{sent.map((text, index) => <View key={`${text}-${index}`} style={[styles.chatRow, styles.myChat]}><Avatar person={currentUser} size={28} /><View style={styles.chatCopy}><YText style={styles.chatName}>You</YText><YText style={styles.chatText}>{text}</YText></View></View>)}{messageError ? <YText style={styles.chatError}>{messageError}</YText> : null}{!archived && <View style={styles.composer}><TextInput accessibilityLabel="Room message" value={message} onChangeText={setMessage} editable={!sendingMessage} onSubmitEditing={() => void sendMessage()} returnKeyType="send" placeholder="Say something..." placeholderTextColor={colors.faint} style={styles.composerInput} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={sendingMessage || !message.trim()} onPress={() => { tactilePress(); void sendMessage(); }} style={({ pressed }) => [styles.sendButton, pressed && styles.tactilePressed, (sendingMessage || !message.trim()) && styles.disabledAction]}><Ionicons name="arrow-up" size={18} color={colors.brandInk} /></Pressable></View>}</>}</View>}</View>
  </ScrollView><LaterModal visible={laterOpen} onClose={() => setLaterOpen(false)} onChoose={(arrival) => void updateMembership(arrival)} /><SuggestModal visible={suggestOpen} onClose={() => setSuggestOpen(false)} onCreate={(activity, title) => { const suggestion: RoomSuggestion = { id: `suggestion-${Date.now()}`, roomId: room.id, activity, title, authorId: currentUser.id, authorName: 'You' }; setSuggestionError(''); setSuggestOpen(false); if (remoteActive && !room.id.startsWith('room-')) { setPendingSuggestions((items) => [...items, suggestion]); void createRoomSuggestion(room.id, activity, title).then(() => { setPendingSuggestions((items) => items.filter((item) => item.id !== suggestion.id)); return queryClient.invalidateQueries({ queryKey: ['room-suggestions', room.id] }); }).catch(() => { setPendingSuggestions((items) => items.filter((item) => item.id !== suggestion.id)); setSuggestionError('Couldn’t save that suggestion. Try again.'); }); } else { setLocalSuggestions((items) => [...items, suggestion]); } }} /><InviteModal visible={inviteOpen} people={invitePeople} error={inviteError} onClose={() => setInviteOpen(false)} onSend={(ids) => void sendInvites(ids)} /></View>;
}

function ChatRow({ name, text, people, fallback }: { name: string; text: string; people: ReturnType<typeof useDemo>['people']; fallback: ReturnType<typeof useDemo>['me'] }) { return <View style={styles.chatRow}><Avatar person={people.find((person) => person.name === name) ?? fallback} size={28} /><View style={styles.chatCopy}><YText style={styles.chatName}>{displayName(name)}</YText><YText style={styles.chatText}>{text}</YText></View></View>; }

function InviteModal({ visible, people, error, onClose, onSend }: { visible: boolean; people: ReturnType<typeof useDemo>['people']; error: boolean; onClose: () => void; onSend: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const close = () => { setSelectedIds([]); onClose(); };
  const send = () => { if (!selectedIds.length) return; onSend(selectedIds); setSelectedIds([]); };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={close}><View style={styles.backdrop}><View style={styles.inviteSheet}><View style={styles.modalTop}><View><YText style={styles.kicker}>BRING THEM ALONG</YText><YText style={type.section}>Who should we invite?</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close invite friends" onPress={close} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View><YText style={styles.inviteHelper}>Only your accepted Yubrio friends can receive this invite.</YText><ScrollView style={styles.inviteScroll} contentContainerStyle={[styles.inviteList, !people.length && styles.inviteListEmpty]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{people.length ? people.map((person) => { const selected = selectedIds.includes(person.id); return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => setSelectedIds((ids) => selected ? ids.filter((id) => id !== person.id) : [...ids, person.id])} style={styles.invitePerson}><Avatar person={person} size={34} /><YText style={styles.invitePersonName}>{displayName(person.name)}</YText><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={21} color={selected ? colors.brand : colors.faint} /></Pressable>; }) : <View accessible accessibilityLabel="No friends left to invite" style={styles.inviteEmpty}><Ionicons name="checkmark-circle-outline" size={24} color={colors.brand} /><YText style={styles.inviteEmptyTitle}>Everyone’s already in.</YText><YText style={styles.inviteEmptyCopy}>There are no other friends to invite right now.</YText></View>}</ScrollView>{error && <YText style={styles.inviteError}>Couldn’t send those invites. Try again.</YText>}{people.length ? <ActionButton label="Send invites" icon="paper-plane-outline" disabled={!selectedIds.length} onPress={send} style={{ marginTop: spacing.lg }} /> : null}</View></View></Modal>;
}

function SuggestModal({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (activity: ActivityType, title: string) => void }) {
  const [activity, setActivity] = useState<ActivityType>('food');
  const [title, setTitle] = useState('');
  const close = () => { setTitle(''); onClose(); };
  const create = () => { const trimmed = title.trim(); if (!trimmed) return; onCreate(activity, trimmed); setTitle(''); };
  const options: ActivityType[] = ['coffee', 'drinks', 'food', 'walk', 'gaming', 'hangout'];
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={close}><View style={styles.backdrop}><View style={styles.suggestSheet}><View style={styles.sheetHandle} /><View style={styles.modalTop}><View><YText style={styles.kicker}>A SMALL IDEA</YText><YText style={type.section}>What should we try?</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close suggestion" onPress={close} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View><View style={styles.suggestionChoices}>{options.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: activity === item }} onPress={() => setActivity(item)} style={[styles.suggestionChoice, { width: '31%' }, activity === item && styles.suggestionChoiceSelected]}><ActivityIcon activity={item} size={31} /><YText style={styles.suggestionChoiceText}>{activityMeta[item].label}</YText></Pressable>)}</View><TextInput accessibilityLabel="Suggestion" value={title} onChangeText={setTitle} placeholder="e.g. Grab food together" placeholderTextColor={colors.faint} style={styles.suggestionInput} /><ActionButton label="Suggest it" icon="sparkles" disabled={!title.trim()} onPress={create} style={{ marginTop: spacing.lg }} /></View></View></Modal>;
}

function LaterModal({ visible, onClose, onChoose }: { visible: boolean; onClose: () => void; onChoose: (arrival: string) => void }) { const [custom, setCustom] = useState(''); const customValid = isValidClockTime(custom); const choose = (arrival: string) => { setCustom(''); onChoose(arrival); }; const close = () => { setCustom(''); onClose(); }; return <Modal visible={visible} animationType="slide" transparent onRequestClose={close}><View style={styles.backdrop}><View style={styles.laterSheet}><View style={styles.sheetHandle} /><View style={styles.modalTop}><View><YText style={styles.kicker}>NO RUSH</YText><YText style={type.section}>When will you join?</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>{['in 30 minutes', 'in 1 hour'].map((choice) => <Pressable key={choice} accessibilityRole="button" accessibilityLabel={choice} onPress={() => choose(choice)} style={styles.arrivalChoice}><View style={styles.clockIcon}><Ionicons name="time-outline" size={18} color={colors.brandInk} /></View><YText style={styles.arrivalText}>{choice}</YText><Ionicons name="arrow-forward" size={18} color={colors.faint} /></Pressable>)}<TextInput accessibilityLabel="Custom arrival time" value={custom} onChangeText={setCustom} placeholder="Custom time · e.g. 19:30" placeholderTextColor={colors.faint} style={{ minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginTop: 10 }} />{custom.trim() && !customValid ? <YText style={styles.arrivalError}>Use a time like 19:30.</YText> : null}<Pressable accessibilityRole="button" accessibilityLabel="Use custom arrival time" accessibilityState={{ disabled: !customValid }} disabled={!customValid} onPress={() => choose(`around ${custom.trim()}`)} style={[styles.arrivalChoice, !customValid && { opacity: 0.45 }]}><View style={styles.clockIcon}><Ionicons name="create-outline" size={18} color={colors.brandInk} /></View><YText style={styles.arrivalText}>Use this time</YText><Ionicons name="arrow-forward" size={18} color={colors.faint} /></Pressable></View></View></Modal>; }

function arrivalDetail(arrival: string) { return `Joining ${arrival}`; }

function mapRemoteRoom(row: any, userId: string): Room {
  const members = row.room_members ?? [];
  const activity = activityMeta[row.activity as ActivityType] ? row.activity as ActivityType : 'custom';
  const start = new Date(row.starts_at);
  const end = new Date(row.ends_at);
  const time = formatRemoteRoomTime(start, end);
  const arrivalByPerson = Object.fromEntries(members.filter((member: any) => member.arrival_at).map((member: any) => [member.profile_id, formatArrival(member.arrival_at)]));
  return {
    id: row.id,
    activity,
    title: row.title,
    time,
    startsAt: start.getTime(),
    endAt: end.getTime(),
    people: members.map((member: any) => member.profile_id),
    participantDetails: members.flatMap((member: any) => member.profiles ? [{ id: member.profiles.id, name: member.profiles.display_name, initials: member.profiles.initials, color: member.profiles.avatar_color }] : []),
    count: members.length,
    location: row.place_name ?? undefined,
    online: row.location_mode === 'online' ? row.online_details ?? 'Online' : undefined,
    locationMode: row.location_mode,
    placeName: row.place_name ?? undefined,
    onlineDetails: row.online_details ?? undefined,
    creatorId: row.creator_id,
    chatEnabled: row.chat_enabled,
    participantsCanInvite: row.participants_can_invite,
    joined: members.some((member: any) => member.profile_id === userId),
    arrivalByPerson,
  };
}

function formatArrival(value: string) { const date = new Date(value); if (!Number.isFinite(date.getTime())) return 'Joining later'; return `around ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; }

function tactilePress() {
  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function formatRemoteRoomTime(start: Date, end: Date) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) return 'Time to be decided';
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (start.toDateString() === end.toDateString()) return `${startTime}–${endTime}`;
  const day = (date: Date) => { const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const daysAway = Math.round((target.getTime() - today.getTime()) / 86400000); if (daysAway === 0) return 'Today'; if (daysAway === 1) return 'Tomorrow'; return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); };
  return `${day(start)} ${startTime}–${day(end)} ${endTime}`;
}

const styles = StyleSheet.create({
  pointerNone: { pointerEvents: 'none' },
  heroField: { position: 'absolute', width: 240, height: 98, top: -34, right: -74, opacity: 0.13, transform: [{ rotate: '18deg' }], borderBottomLeftRadius: 52 },
  infoTitle: { fontSize: 14, fontWeight: '800' },
  inviteScroll: { maxHeight: 320 },
  chatJoinPrompt: { minHeight: 80, alignItems: 'center', justifyContent: 'center', gap: 8 },
  root: { flex: 1, backgroundColor: colors.canvas }, missingRoot: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl, paddingTop: 56 }, missingCopy: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }, missingText: { color: colors.muted, textAlign: 'center', fontSize: 15, lineHeight: 21, fontWeight: '600', marginTop: 8, maxWidth: 300 }, content: { paddingTop: 44, paddingHorizontal: spacing.xl, paddingBottom: 50 }, nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, navButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' }, navContext: { flexDirection: 'row', alignItems: 'center', gap: 7 }, navDot: { width: 7, height: 7, borderRadius: 4 }, navContextText: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' }, hero: { alignItems: 'flex-start', marginBottom: 22, paddingVertical: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.glassBorder }, heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, heroCopy: { flex: 1 }, heroStatus: { color: colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 }, heroDetail: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 14 }, archiveBanner: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 8 }, archiveText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, heroTitle: { fontSize: 32, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1 }, heroTime: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 6 }, infoCard: { backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, infoIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' }, infoCopy: { flex: 1 }, meta: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3 }, actionArea: { marginTop: 22, gap: 8 }, laterButton: { height: 50, borderRadius: 15, backgroundColor: colors.surfaceMuted, borderBottomWidth: 3, borderBottomColor: colors.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, laterText: { fontSize: 14, fontWeight: '800' }, leaveButton: { height: 42, alignItems: 'center', justifyContent: 'center' }, leaveText: { fontSize: 13, fontWeight: '800', color: colors.muted }, section: { marginTop: 36 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, peopleHint: { color: colors.muted, fontSize: 13, fontWeight: '700' }, peopleCard: { backgroundColor: 'transparent', paddingHorizontal: 0 }, chatCard: { backgroundColor: 'transparent', padding: 0 }, chatOff: { minHeight: 70, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center', gap: 8 }, chatOffText: { color: colors.muted, fontSize: 14, fontWeight: '700' }, chatRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 16 }, myChat: { backgroundColor: colors.surfaceMuted, padding: 8, marginHorizontal: 0, borderRadius: 13 }, chatCopy: { flex: 1 }, chatName: { fontSize: 12, fontWeight: '900' }, chatText: { fontSize: 14, fontWeight: '600', marginTop: 2 }, composer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 2 }, composerInput: { flex: 1, fontSize: 14, color: colors.ink, paddingVertical: 9 }, sendButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brand, borderBottomWidth: 3, borderBottomColor: colors.brandPressed, alignItems: 'center', justifyContent: 'center' }, suggestion: { marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingVertical: 12 }, suggestionCopy: { flex: 1 }, suggestionTitle: { fontSize: 15, fontWeight: '800' }, suggestButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.glassHighlight, borderBottomWidth: 3, borderBottomColor: colors.line }, suggestButtonText: { color: colors.brand, fontSize: 13, fontWeight: '800' }, suggestionList: { backgroundColor: 'transparent', padding: 0, gap: 0 }, suggestionEmpty: { color: colors.muted, fontSize: 14, fontWeight: '600' }, suggestSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }, suggestionChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, suggestionChoice: { width: '31.8%', minHeight: 70, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: 'transparent' }, suggestionChoiceSelected: { borderColor: colors.brand, backgroundColor: colors.glassHighlight }, suggestionChoiceText: { fontSize: 11, fontWeight: '800' }, suggestionInput: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginTop: 18, borderWidth: 1, borderColor: colors.line }, kicker: { ...type.label, color: colors.muted, marginBottom: 7 }, backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }, laterSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }, sheetHandle: { alignSelf: 'center', height: 4, width: 38, borderRadius: 3, backgroundColor: colors.line, marginBottom: 20 }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, modalClose: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, arrivalChoice: { minHeight: 60, backgroundColor: colors.surface, borderRadius: 14, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: colors.line }, clockIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, arrivalText: { flex: 1, fontSize: 15, fontWeight: '800' }, tactilePressed: { transform: [{ translateY: 2 }, { scale: 0.985 }], borderBottomWidth: 1 },
  peopleEmpty: { color: colors.muted, fontSize: 14, fontWeight: '600', paddingVertical: 18 }, peopleHeading: { gap: 3 }, inviteButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.glassHighlight }, inviteButtonText: { color: colors.brand, fontSize: 13, fontWeight: '800' }, inviteNotice: { color: colors.brand, fontSize: 12, fontWeight: '800', marginTop: 8 }, actionError: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 }, chatStatus: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, chatStatusText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, chatError: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 12 }, disabledAction: { opacity: 0.5 }, inviteSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: '88%' }, inviteHelper: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '600', marginBottom: 14 }, inviteList: { gap: 6 }, inviteListEmpty: { flexGrow: 1 }, inviteEmpty: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center', padding: 24 }, inviteEmptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 12 }, inviteEmptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center', marginTop: 5, maxWidth: 230 }, invitePerson: { minHeight: 52, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10 }, invitePersonName: { flex: 1, fontSize: 14, fontWeight: '800' }, inviteError: { color: colors.error, fontSize: 13, fontWeight: '700', marginTop: 12 }, arrivalError: { color: colors.error, fontSize: 13, fontWeight: '700', marginTop: 8 },
});
