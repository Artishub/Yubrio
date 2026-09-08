import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoomMomentCard, SectionTitle, YText } from '@/components/ui';
import { HomePulse } from '@/components/home-pulse';
import { AvailabilitySheet } from '@/components/sheets';
import { colors, spacing, type } from '@/design/tokens';
import { useDemo } from '@/stores/demo-store';
import { copy } from '@/design/copy';
import { getOrCreateAvailabilityConversation, sendAvailabilityMessage } from '@/lib/supabase/repositories';
import { fetchAvailabilityMessages, findAvailabilityConversation } from '@/lib/supabase/repositories';
import { useQuery } from '@tanstack/react-query';
import { subscribeToAvailabilityConversation, subscribeToHome } from '@/lib/supabase/realtime';
import { queryClient } from '@/lib/query/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatRemainingDuration } from '@/lib/validation/rules';

export default function HomeScreen() {
  const router = useRouter();
  const { me, people, circles, rooms, availability, remoteActive, remoteLoading, remoteError, retryHome, joinedRoom, publishAvailability } = useDemo();
  const currentUser = me;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [freeOpen, setFreeOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [messageFor, setMessageFor] = useState<{ id: string; personId: string; name: string } | null>(null);
  const [roomIndex, setRoomIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const liveAvailability = useMemo(() => availability.filter((item) => !item.expiresAt || item.expiresAt > now).map((item) => ({ ...item, expiresIn: item.expiresAt ? formatRemainingDuration(item.expiresAt, now) : item.expiresIn })), [availability, now]);
  const visibleAvailability = useMemo(() => liveAvailability.filter((item) => item.personId !== me.id), [liveAvailability, me.id]);
  const roomCardWidth = Math.min(Math.max(width - spacing.xl * 2, 280), 380);
  const openRoom = (roomId: string) => router.push({ pathname: '/room/[id]', params: { id: roomId } });
  const joinRoomFromHome = async (roomId: string) => {
    setActionError('');
    try {
      await joinedRoom(roomId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Couldn’t join that room. Try again.');
    }
  };
  const refreshHome = async () => {
    if (!remoteActive || refreshing) return;
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey: ['home', me.id] });
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (!remoteActive) return;
    return subscribeToHome(me.id, () => { void queryClient.invalidateQueries({ queryKey: ['home'] }); });
  }, [me.id, remoteActive]);

  return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} refreshControl={remoteActive ? <RefreshControl refreshing={refreshing} onRefresh={() => void refreshHome()} tintColor={colors.brand} colors={[colors.brand]} progressBackgroundColor={colors.surface} /> : undefined} contentContainerStyle={[styles.content, { paddingTop: Math.max(32, insets.top + 12), paddingBottom: insets.bottom + 110 }]}> 
    <YText style={[type.title, styles.headline]}>{copy.home.headline}</YText>
    <HomePulse isFree={liveAvailability.some((item) => item.personId === me.id)} friends={visibleAvailability.map((item) => { const person = people.find((p) => p.id === item.personId); return person ? { person, expiresIn: item.expiresIn, note: item.note, canMessage: item.canMessage, availabilityId: item.id } : null; }).filter(Boolean) as { person: typeof me; expiresIn: string; note: string; canMessage: boolean; availabilityId: string }[]} onFree={() => setFreeOpen(true)} onMessage={(friend) => { if (friend.canMessage && friend.person.id !== me.id) setMessageFor({ id: friend.availabilityId, personId: friend.person.id, name: friend.person.name }); }} />
    {remoteLoading && <View accessibilityRole="progressbar" style={styles.status}><ActivityIndicator size="small" color={colors.brand} /><YText style={styles.statusText}>Loading your people…</YText></View>}{remoteError && <Pressable accessibilityRole="button" accessibilityLabel="Retry loading your people" onPress={retryHome} style={styles.errorStatus}><Ionicons name="cloud-offline-outline" size={18} color={colors.error} /><YText style={styles.errorStatusText}>Couldn’t load your people. Tap to retry.</YText></Pressable>}{actionError ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" onPress={() => setActionError('')} style={styles.errorStatus}><Ionicons name="warning-outline" size={18} color={colors.error} /><YText style={styles.errorStatusText}>{actionError}</YText></Pressable> : null}
    <View style={styles.sectionHeader}><SectionTitle>{copy.home.rooms}</SectionTitle>{rooms.length ? <YText style={styles.swipeHint}>{roomIndex + 1} / {rooms.length}</YText> : null}</View>{remoteLoading ? <View style={styles.roomLoading}><View style={styles.loadingMark}><ActivityIndicator size="small" color={colors.brand} /></View><View style={styles.loadingCopy}><YText style={styles.loadingTitle}>Looking for something to happen…</YText><YText style={styles.loadingText}>Your people will show up here.</YText></View></View> : rooms.length ? <><ScrollView horizontal pagingEnabled snapToInterval={roomCardWidth + spacing.md} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomDeck} onMomentumScrollEnd={(event) => setRoomIndex(Math.round(event.nativeEvent.contentOffset.x / (roomCardWidth + spacing.md)))}>{rooms.map((room) => { const roomPeopleIds = room.joined && !room.people.includes(me.id) ? [me.id, ...room.people] : room.people; return <View key={room.id} style={{ width: roomCardWidth }}><RoomMomentCard room={room} people={roomPeopleIds.map((id) => people.find((person) => person.id === id)).filter(Boolean) as typeof people} onOpen={() => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openRoom(room.id); }} onYeb={!room.joined ? () => { void joinRoomFromHome(room.id); } : undefined} /></View>; })}</ScrollView><View accessibilityLabel={`Room ${roomIndex + 1} of ${rooms.length}`} style={styles.deckDots}>{rooms.map((room, index) => <View key={room.id} style={[styles.deckDot, index === roomIndex && styles.deckDotActive]} />)}</View></> : <View style={styles.empty}><YText style={styles.emptyTitle}>{copy.home.quietTitle}</YText><YText style={styles.emptyCopy}>{copy.home.quietCopy}</YText></View>}
  </ScrollView>{freeOpen && <AvailabilitySheet visible onClose={() => setFreeOpen(false)} excludePersonId={currentUser.id} people={people} circles={circles} onPublish={(duration, note, audience, audienceIds, canMessage) => publishAvailability({ id: `free-${Date.now()}`, personId: currentUser.id, expiresIn: formatAvailabilityDuration(duration), note, canMessage, audience, audienceIds })} />}{messageFor && <QuickMessageSheet availabilityId={messageFor.id} personId={messageFor.personId} name={messageFor.name} remoteActive={remoteActive} onClose={() => setMessageFor(null)} onSuggest={() => { setMessageFor(null); router.push('/(tabs)/create'); }} />}</View>;
}

type QuickMessage = { id: string; body: string; pending?: boolean; mine?: boolean };

function QuickMessageSheet({ availabilityId, personId, name, remoteActive, onClose, onSuggest }: { availabilityId: string; personId: string; name: string; remoteActive: boolean; onClose: () => void; onSuggest: () => void }) {
  const [localMessages, setLocalMessages] = useState<QuickMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);
  const { me } = useDemo();
  const conversation = useQuery({ queryKey: ['availability-conversation', availabilityId, personId], queryFn: () => findAvailabilityConversation(availabilityId, personId), enabled: remoteActive, staleTime: 15_000 });
  const history = useQuery({ queryKey: ['availability-messages', conversation.data], queryFn: () => fetchAvailabilityMessages(conversation.data as string), enabled: remoteActive && Boolean(conversation.data), staleTime: 15_000 });
  const messages = useMemo(() => {
    const remoteMessages: QuickMessage[] = history.data?.map((item: any) => ({ id: item.id, body: item.body, mine: item.author_id === me.id })) ?? [];
    if (!history.data) return localMessages;
    const remoteBodies = new Map<string, number>();
    remoteMessages.forEach((item) => remoteBodies.set(item.body, (remoteBodies.get(item.body) ?? 0) + 1));
    const unsynced = localMessages.filter((item) => {
      const remaining = remoteBodies.get(item.body) ?? 0;
      if (remaining > 0) { remoteBodies.set(item.body, remaining - 1); return false; }
      return true;
    });
    return [...remoteMessages, ...unsynced];
  }, [history.data, localMessages, me.id]);
  useEffect(() => { const conversationId = conversation.data; if (!remoteActive || !conversationId) return; return subscribeToAvailabilityConversation(conversationId, () => { void queryClient.invalidateQueries({ queryKey: ['availability-messages', conversationId] }); }); }, [conversation.data, remoteActive]);
  const send = async (text: string) => { const trimmed = text.trim(); if (!trimmed) return; const localId = makeLocalMessageId(); setLocalMessages((items) => [...items, { id: localId, body: trimmed, pending: remoteActive, mine: true }]); setDraft(''); setSendError(false); if (remoteActive) { try { const conversationId = await getOrCreateAvailabilityConversation(availabilityId, personId); await sendAvailabilityMessage(conversationId, trimmed); void queryClient.invalidateQueries({ queryKey: ['availability-conversation', availabilityId, personId] }); void queryClient.invalidateQueries({ queryKey: ['availability-messages', conversationId] }); } catch { setLocalMessages((items) => items.filter((item) => item.id !== localId)); setSendError(true); } } };
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={styles.messageOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.messageSheet}><View style={styles.messageHeader}><View><YText style={styles.kicker}>QUICK NOTE TO</YText><YText style={type.section}>{name}</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close message" onPress={onClose} style={styles.sheetClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View><YText style={styles.messageHint}>This little conversation stays open while {name} is free.</YText>{sendError && <YText style={{ color: colors.error, fontSize: 13, fontWeight: '700', marginTop: 10 }}>Couldn’t send that. Try again.</YText>}{messages.length === 0 ? <><YText style={styles.messagePrompt}>Keep it light.</YText><View style={styles.quickOptions}>{['Coffee?', 'Wanna game?', 'I’m heading downtown too.'].map((text) => <Pressable key={text} accessibilityRole="button" onPress={() => void send(text)} style={styles.quickOption}><YText style={styles.quickOptionText}>{text}</YText><Ionicons name="arrow-up" size={16} color={colors.muted} /></Pressable>)}</View></> : <View style={styles.messageList}>{messages.map((item) => <View key={item.id} style={[styles.messageBubble, item.mine ? styles.sentBubble : styles.receivedBubble, item.pending && styles.pendingBubble]}><YText style={[styles.messageBubbleText, item.mine ? styles.sentBubbleText : styles.receivedBubbleText]}>{item.body}</YText></View>)}</View>}<Pressable accessibilityRole="button" onPress={onSuggest} style={styles.suggestAction}><Ionicons name="sparkles-outline" size={18} color={colors.brand} /><YText style={styles.suggestActionText}>Suggest an activity</YText><Ionicons name="arrow-forward" size={16} color={colors.faint} /></Pressable><View style={styles.messageComposer}><TextInput accessibilityLabel={`Message ${name}`} value={draft} onChangeText={setDraft} onSubmitEditing={() => void send(draft)} returnKeyType="send" placeholder="Say something..." placeholderTextColor={colors.faint} style={styles.messageInput} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim()} onPress={() => void send(draft)} style={[styles.sendButton, !draft.trim() && styles.disabledAction]}><Ionicons name="arrow-up" size={18} color={colors.brandInk} /></Pressable></View></View></KeyboardAvoidingView></Modal>;
}

function formatAvailabilityDuration(duration: string) { return duration === 'Today' ? 'until tonight' : `${duration} left`; }
function makeLocalMessageId() { return `local-${new Date().getTime()}-${Math.random().toString(36).slice(2)}`; }
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingTop: 64, paddingHorizontal: spacing.xl, paddingBottom: 125 },
  headline: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.lg, marginBottom: spacing.md },
  swipeHint: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  roomDeck: { gap: spacing.md, paddingBottom: spacing.sm },
  deckDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: spacing.xxxl },
  deckDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.line },
  deckDotActive: { width: 18, backgroundColor: colors.brand },
  empty: { padding: spacing.xl, backgroundColor: colors.surface, borderRadius: 22 },
  roomLoading: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder },
  loadingMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  loadingCopy: { flex: 1 },
  loadingTitle: { fontSize: 14, fontWeight: '800' },
  loadingText: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyCopy: { color: colors.muted, marginTop: 4, fontSize: 15, fontWeight: '600' },
  messageOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  messageSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: colors.glassBorder },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { ...type.label, color: colors.brand, marginBottom: 8 },
  sheetClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  messageHint: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '600', marginTop: 12 },
  messagePrompt: { fontSize: 17, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  quickOptions: { gap: 10 },
  quickOption: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickOptionText: { fontSize: 15, fontWeight: '700' },
  messageList: { gap: 8, marginTop: 20, minHeight: 58 },
  messageBubble: { maxWidth: '88%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  sentBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6, backgroundColor: colors.brand },
  receivedBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6, backgroundColor: colors.surfaceMuted },
  pendingBubble: { opacity: 0.7 },
  messageBubbleText: { fontSize: 14, fontWeight: '800' },
  sentBubbleText: { color: colors.brandInk },
  receivedBubbleText: { color: colors.ink },
  suggestAction: { minHeight: 50, marginTop: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassHighlight, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestActionText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  messageComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 14 },
  messageInput: { flex: 1, minHeight: 40, color: colors.ink, fontSize: 14, paddingVertical: 8 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  disabledAction: { opacity: 0.45 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: spacing.lg },
  statusText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  errorStatus: { minHeight: 44, borderRadius: 14, backgroundColor: 'rgba(200, 86, 79, 0.12)', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginBottom: spacing.lg },
  errorStatusText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700' },
});
