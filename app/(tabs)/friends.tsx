import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActionButton, Avatar, PersonRow, SectionTitle, YText } from '@/components/ui';
import { activityMeta, colors, radius, spacing, type } from '@/design/tokens';
import { Circle, FriendRequest, Person } from '@/types';
import { useDemo } from '@/stores/demo-store';
import { friendInviteUrl } from '@/config/links';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchPendingFriendRequests, getOrCreateFriendLink, respondToFriendRequest } from '@/lib/supabase/repositories';
import { subscribeToFriendships } from '@/lib/supabase/realtime';
import { useAuth } from '@/stores/auth-store';
import { queryClient } from '@/lib/query/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/design/copy';

export default function FriendsScreen() {
  const { me, people, circles, addCircle } = useDemo();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const friendPeople = people.filter((person) => person.id !== me.id);
  const [addOpen, setAddOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);
  const [circleError, setCircleError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const remoteLink = useQuery({ queryKey: ['friend-link', session?.user.id], queryFn: getOrCreateFriendLink, enabled: Boolean(session) && isSupabaseConfigured && addOpen, staleTime: 60 * 60 * 1000 });
  const pendingRequests = useQuery({ queryKey: ['friend-requests', session?.user.id], queryFn: fetchPendingFriendRequests, enabled: Boolean(session) && isSupabaseConfigured, staleTime: 15_000 });
  const [resolvedRequests, setResolvedRequests] = useState<string[]>([]);
  const friendHandle = remoteLink.data ?? me.id;
  const remoteLinkEnabled = Boolean(session) && isSupabaseConfigured;
  const requests = (pendingRequests.data ?? []).filter((request) => !resolvedRequests.includes(request.id));
  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    return subscribeToFriendships(session.user.id, () => {
      void queryClient.invalidateQueries({ queryKey: ['friend-requests', session.user.id] });
      void queryClient.invalidateQueries({ queryKey: ['home', session.user.id] });
    });
  }, [session]);
  const openAdd = () => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddOpen(true); };
  const openCircle = () => { if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCircleError(''); setCircleOpen(true); };
  const resolveRequest = async (request: FriendRequest, action: 'accepted' | 'blocked') => {
    setResolvedRequests((current) => [...current, request.id]);
    try {
      await respondToFriendRequest(request.id, action);
      await queryClient.invalidateQueries({ queryKey: ['friend-requests', session?.user.id] });
      await queryClient.invalidateQueries({ queryKey: ['home', session?.user.id] });
    } catch {
      setResolvedRequests((current) => current.filter((id) => id !== request.id));
    }
  };
  return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(64, insets.top + 24), paddingBottom: insets.bottom + 110 }]}>
    <View style={styles.header}><View><YText style={type.title}>Friends</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Add friend" onPress={openAdd} style={({ pressed }) => [styles.addButton, pressed && styles.actionPressed]}><Ionicons name="person-add-outline" size={17} color={colors.brandInk} /><YText style={styles.addButtonText}>Add</YText></Pressable></View>
    {friendPeople.length ? <View style={[styles.friendSummary, { backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0, paddingVertical: 18, borderWidth: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.glassBorder }]}><View style={styles.avatarStack}>{friendPeople.slice(0, 4).map((person, index) => <View key={person.id} style={{ marginLeft: index === 0 ? 0 : -8, zIndex: 4 - index }}><Avatar person={person} size={35} /></View>)}</View><View style={styles.summaryCopy}><YText style={styles.summaryTitle}>{friendPeople.length + ' friends on Yubrio'}</YText><YText style={styles.summaryDescription}>The good kind of close circle.</YText></View><Ionicons name="sparkles-outline" size={20} color={colors.brand} /></View> : <EmptyFriendInvite onPress={openAdd} />}
    <SectionTitle>Circles</SectionTitle>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.circleRow, { flexWrap: 'nowrap', paddingRight: spacing.xl, gap: 10 }]}>{circles.map((circle, index) => <View key={circle.id} style={[styles.circleCard, { width: 152, minHeight: 104, borderRadius: 18, borderLeftWidth: 3, borderLeftColor: circleTint(circle.name, index) }]}><View style={[styles.circleIcon, { backgroundColor: circleTint(circle.name, index) }]}><Ionicons name={circleIcon(circle.name)} size={20} color={colors.ink} /></View><YText style={styles.circleName} numberOfLines={1}>{circle.name}</YText><YText style={styles.circleCount}>{circle.memberIds.length ? circle.memberIds.length + ' ' + (circle.memberIds.length === 1 ? 'friend' : 'friends') : 'No friends yet'}</YText></View>)}<Pressable accessibilityRole="button" accessibilityLabel="Create a new circle" onPress={openCircle} style={({ pressed }) => [styles.circleCard, styles.newCircleCard, { width: 152, minHeight: 104, borderRadius: 18, borderLeftWidth: 3, borderLeftColor: colors.line }, pressed && styles.actionPressed]}><View style={styles.newCircleIcon}><Ionicons name="add" size={20} color={colors.muted} /></View><YText style={styles.circleName}>New circle</YText></Pressable></ScrollView>
    {pendingRequests.isError && <Pressable accessibilityRole="button" accessibilityLabel="Retry loading friend requests" onPress={() => void pendingRequests.refetch()} style={styles.requestError}><Ionicons name="cloud-offline-outline" size={17} color={colors.error} /><YText style={styles.requestErrorText}>Couldn’t load friend requests. Tap to retry.</YText></Pressable>}
    {requests.length > 0 && <><View style={styles.sectionGap} /><SectionTitle>Friend requests</SectionTitle><View style={styles.list}>{requests.map((request) => <FriendRequestRow key={request.id} request={request} onAccept={() => void resolveRequest(request, 'accepted')} onBlock={() => void resolveRequest(request, 'blocked')} />)}</View></>}
    {friendPeople.length > 0 && <><View style={styles.sectionGap} /><SectionTitle>All friends</SectionTitle><View style={styles.list}>{friendPeople.map((person) => <PersonRow key={person.id} person={person} detail={person.online ? 'Online now' : 'Yubrio friend'} />)}</View></>}
  </ScrollView><AddFriendModal visible={addOpen} onClose={() => setAddOpen(false)} handle={friendHandle} loading={remoteLinkEnabled && remoteLink.isPending} error={remoteLinkEnabled && remoteLink.isError} onRetry={() => void remoteLink.refetch()} onScan={() => { setAddOpen(false); setScanOpen(true); }} /><ScanFriendModal visible={scanOpen} onClose={() => setScanOpen(false)} onFound={(handle) => { setScanOpen(false); router.push({ pathname: '/add/[handle]', params: { handle } }); }} /><CreateCircleModal visible={circleOpen} error={circleError} onClose={() => { setCircleError(''); setCircleOpen(false); }} people={friendPeople} onSave={async (circle) => { try { await addCircle(circle); setCircleError(''); setCircleOpen(false); } catch { setCircleError('Couldn’t save that circle. Try again.'); throw new Error('circle-save-failed'); } }} /></View>;
}

function EmptyFriendInvite({ onPress }: { onPress: () => void }) {
  return <View style={styles.emptyInvitePlain}>
    <YText style={styles.emptyInviteTitle}>{copy.friends.emptyTitle}</YText>
    <YText style={styles.emptyInviteCopy}>{copy.friends.emptyCopy}</YText>
    <Pressable accessibilityRole="button" accessibilityLabel={copy.friends.emptyAction} onPress={onPress} style={({ pressed }) => [styles.emptyInviteAction, pressed && styles.emptyInvitePressed]}><YText style={styles.emptyInviteActionText}>{copy.friends.emptyAction}</YText><Ionicons name="arrow-forward" size={17} color={colors.brandInk} /></Pressable>
  </View>;
}

function FriendRequestRow({ request, onAccept, onBlock }: { request: FriendRequest; onAccept: () => void; onBlock: () => void }) {
  if (request.direction === 'outgoing') return <PersonRow person={request.person} detail="Request sent" />;
  return <View style={styles.requestRow}><View style={styles.requestPerson}><Avatar person={request.person} size={38} /><View style={styles.requestCopy}><YText style={styles.requestName}>{request.person.name}</YText><YText style={styles.requestMeta}>Wants to connect</YText></View></View><View style={styles.requestActions}><Pressable accessibilityRole="button" accessibilityLabel={`Accept ${request.person.name}`} onPress={onAccept} style={styles.requestAccept}><Ionicons name="checkmark" size={17} color={colors.brandInk} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Block ${request.person.name}`} onPress={onBlock} style={styles.requestBlock}><Ionicons name="close" size={17} color={colors.muted} /></Pressable></View></View>;
}

function AddFriendModal({ visible, onClose, handle, loading, error, onRetry, onScan }: { visible: boolean; onClose: () => void; handle: string; loading: boolean; error: boolean; onRetry: () => void; onScan: () => void }) {
  const ready = !loading && !error && Boolean(handle);
  const appUrl = ready ? Linking.createURL(`/add/${encodeURIComponent(handle)}`) : '';
  const shareUrl = ready ? friendInviteUrl(handle) : '';
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.modal}><View style={styles.modalTop}><View><YText style={styles.kicker}>ADD FRIEND</YText><YText style={type.section}>Find your people.</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={23} color={colors.ink} /></Pressable></View>{loading ? <View accessible accessibilityRole="progressbar" style={styles.linkState}><ActivityIndicator color={colors.brand} /><YText style={styles.linkStateTitle}>Preparing your link…</YText><YText style={styles.linkStateCopy}>Just a second.</YText></View> : error ? <View style={styles.linkState}><Ionicons name="cloud-offline-outline" size={26} color={colors.error} /><YText style={styles.linkStateTitle}>Your link couldn’t load.</YText><YText style={styles.linkStateCopy}>Try again before sharing it.</YText><ActionButton label="Try again" icon="refresh" variant="secondary" onPress={onRetry} style={{ marginTop: 16 }} /></View> : <><View accessible accessibilityLabel="Your Yubrio friend QR code" style={styles.qrBox}><QRCode value={appUrl} size={154} color={colors.ink} backgroundColor={colors.surface} quietZone={10} ecl="M" /><YText style={styles.qrCode}>SCAN TO ADD {handle.toUpperCase()}</YText></View><YText style={styles.qrHint}>Your link only connects people who choose to add each other.</YText><ActionButton label="Scan a friend’s QR" icon="scan-outline" variant="secondary" onPress={onScan} style={{ marginBottom: 10 }} /><ActionButton label="Share my friend link" icon="share-outline" onPress={() => Share.share({ message: `Add me on Yubrio: ${shareUrl}` })} /></>}</View></View></Modal>;
}

function ScanFriendModal({ visible, onClose, onFound }: { visible: boolean; onClose: () => void; onFound: (handle: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanError, setScanError] = useState(false);
  const close = () => { setScanError(false); onClose(); };
  const handleScan = (data: string) => {
    const path = Linking.parse(data).path ?? data;
    const match = /(?:^|\/)add\/([^/?#]+)/.exec(path);
    if (!match) { setScanError(true); return; }
    onFound(decodeURIComponent(match[1]));
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={close}><View style={styles.backdrop}><View style={styles.scanSheet}><View style={styles.sheetHandle} /><View style={styles.modalTop}><View><YText style={styles.kicker}>ADD FRIEND</YText><YText style={type.section}>Scan their code.</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={close} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>{Platform.OS === 'web' ? <View style={styles.scanFallback}><Ionicons name="phone-portrait-outline" size={28} color={colors.muted} /><YText style={styles.scanFallbackText}>Open Yubrio on your phone to scan a friend’s QR code.</YText></View> : !permission ? <View style={styles.scanFallback}><YText style={styles.scanFallbackText}>Checking camera access…</YText></View> : !permission.granted ? <View style={styles.scanFallback}><Ionicons name="camera-outline" size={28} color={colors.muted} /><YText style={styles.scanFallbackText}>Yubrio needs camera access to scan friend links.</YText><ActionButton label="Allow camera" icon="camera-outline" onPress={() => void requestPermission()} style={{ marginTop: 14 }} /></View> : <View style={styles.cameraFrame}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => handleScan(data)} /><View style={[styles.scanCorners, styles.pointerNone]} /></View>}{scanError && <YText style={styles.scanError}>That code isn’t a Yubrio friend link.</YText>}<YText style={styles.scanHint}>Only Yubrio friend links can be scanned here.</YText></View></View></Modal>;
}

function CreateCircleModal({ visible, onClose, onSave, people, error }: { visible: boolean; onClose: () => void; onSave: (circle: Circle) => void | Promise<void>; people: Person[]; error?: string }) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const save = async () => { const trimmed = name.trim(); if (!trimmed) return; try { await onSave({ id: `circle-${Date.now()}`, name: trimmed, memberIds: selectedIds }); setName(''); setSelectedIds([]); } catch { /* Keep the form open so the user can retry. */ } };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.modal}><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScrollContent}><View style={styles.modalTop}><View><YText style={styles.kicker}>PRIVATE CIRCLE</YText><YText style={type.section}>Make a circle.</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={23} color={colors.ink} /></Pressable></View><TextInput accessibilityLabel="Circle name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Circle name" placeholderTextColor={colors.faint} style={styles.circleNameInput} /><YText style={styles.helper}>Only you see how your circles are organized.</YText><YText style={styles.selectLabel}>Add people · {selectedIds.length} selected</YText><View style={styles.peoplePicker}>{people.slice(0, 8).map((person) => { const selected = selectedIds.includes(person.id); return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggle(person.id)} style={styles.selectPerson}><Avatar person={person} size={32} /><YText style={styles.selectPersonName}>{person.name}</YText><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.brand : colors.faint} /></Pressable>; })}</View>{error ? <YText accessibilityRole="alert" style={styles.formError}>{error}</YText> : null}<ActionButton label="Save circle" icon="checkmark" disabled={!name.trim()} onPress={() => void save()} style={{ marginTop: 20 }} /></ScrollView></View></View></Modal>;
}

function circleTint(name: string, index: number) {
  const icon = circleIcon(name);
  if (icon === 'game-controller-outline') return activityMeta.gaming.tint;
  if (icon === 'briefcase-outline') return activityMeta.hangout.tint;
  if (icon === 'heart-outline') return activityMeta.availability.tint;
  return [colors.surfaceMuted, activityMeta.custom.tint][index % 2];
}
function circleIcon(name: string): keyof typeof Ionicons.glyphMap {
  const normalized = name.toLowerCase();
  if (normalized.includes('game') || normalized.includes('league') || normalized.includes('valorant')) return 'game-controller-outline';
  if (normalized.includes('work') || normalized.includes('uni')) return 'briefcase-outline';
  if (normalized.includes('close') || normalized.includes('friend')) return 'heart-outline';
  if (normalized.includes('gym') || normalized.includes('sport')) return 'barbell-outline';
  return 'people-outline';
}

const styles = StyleSheet.create({
  emptyInvitePlain: { minHeight: 148, marginBottom: 30, paddingVertical: 4, justifyContent: 'space-between' },
  pointerNone: { pointerEvents: 'none' },
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingTop: 48, paddingHorizontal: spacing.xl, paddingBottom: 125 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }, kicker: { ...type.label, color: colors.muted, marginBottom: 8 }, addButton: { minWidth: 74, height: 44, borderRadius: 14, backgroundColor: colors.brand, borderBottomWidth: 3, borderBottomColor: colors.brandPressed, paddingHorizontal: 13, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }, addButtonText: { color: colors.brandInk, fontSize: 13, fontWeight: '900' }, actionPressed: { transform: [{ translateY: 2 }, { scale: 0.98 }], borderBottomWidth: 1 }, friendSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, marginBottom: 30, borderWidth: 1, borderColor: colors.glassBorder }, avatarStack: { flexDirection: 'row', paddingLeft: 4 }, emptyFriendIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1 }, summaryTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 }, summaryDescription: { color: colors.muted, marginTop: 2, fontSize: 12, fontWeight: '600' }, emptyInvite: { overflow: 'hidden', minHeight: 214, borderRadius: 22, padding: 20, marginBottom: 30, backgroundColor: colors.glassSurface, borderWidth: 1, borderColor: colors.glassBorder, justifyContent: 'space-between' }, emptyInvitePressed: { transform: [{ translateY: 2 }, { scale: 0.99 }], opacity: 0.92 }, emptyInviteField: { position: 'absolute', width: 230, height: 90, top: -20, right: -60, backgroundColor: colors.electric, opacity: 0.14, transform: [{ rotate: '16deg' }] }, emptyInviteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, emptyInviteKicker: { ...type.label, color: colors.brand, fontSize: 10, letterSpacing: 1.2 }, emptyInviteMark: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, emptyInviteTitle: { fontSize: 26, lineHeight: 30, fontWeight: '900', letterSpacing: -0.8, maxWidth: 290, marginTop: 12 }, emptyInviteCopy: { color: colors.muted, fontSize: 14, lineHeight: 19, fontWeight: '600', marginTop: 5, maxWidth: 280 }, emptyInviteAction: { alignSelf: 'flex-start', minHeight: 42, marginTop: 18, borderRadius: 13, paddingHorizontal: 13, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', gap: 7 }, emptyInviteActionText: { color: colors.brandInk, fontSize: 13, fontWeight: '900' }, circleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, circleCard: { width: '48.2%', backgroundColor: colors.surface, padding: 12, borderRadius: 16, minHeight: 112, borderWidth: 1, borderColor: colors.glassBorder }, newCircleCard: { borderStyle: 'dashed', backgroundColor: colors.glassHighlight }, circleIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, newCircleIcon: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, circleName: { fontSize: 13, fontWeight: '800' }, circleCount: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 3 }, sectionGap: { height: 28 }, list: { backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0, borderTopWidth: 1, borderTopColor: colors.line }, backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }, modal: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 34, minHeight: 440, maxHeight: '92%' }, modalScrollContent: { paddingBottom: 2 }, scanSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 34 }, sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 20 }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 }, modalClose: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, qrBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 22, padding: 25, marginBottom: 20 }, qrCode: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 12 }, qrHint: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '600', marginBottom: 18 }, scanFallback: { minHeight: 260, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 28 }, scanFallbackText: { color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 10 }, cameraFrame: { height: 300, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface }, camera: { flex: 1 }, scanCorners: { position: 'absolute', top: 46, left: 46, right: 46, bottom: 46, borderWidth: 2, borderColor: colors.brand, borderRadius: 20 }, scanError: { color: colors.error, textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 12 }, scanHint: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '600', marginTop: 14 }, or: { color: colors.faint, textAlign: 'center', fontSize: 12, fontWeight: '700', marginVertical: 16 }, circleNameInput: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 15, color: colors.ink, fontSize: 16, borderWidth: 1, borderColor: colors.line }, helper: { color: colors.muted, fontWeight: '600', fontSize: 13, marginTop: 9 }, selectLabel: { ...type.label, color: colors.muted, marginTop: 22, letterSpacing: 0.7 }, peoplePicker: { gap: 4, marginTop: 9 }, selectPerson: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, selectPersonName: { flex: 1, fontWeight: '800' }, 
  requestRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 }, requestPerson: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }, requestCopy: { flex: 1 }, requestName: { fontSize: 15, fontWeight: '800' }, requestMeta: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 }, requestActions: { flexDirection: 'row', gap: 8 }, requestAccept: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, requestBlock: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }, requestError: { minHeight: 44, borderRadius: 14, backgroundColor: 'rgba(200, 86, 79, 0.12)', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginTop: 18 }, requestErrorText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700' }, linkState: { minHeight: 242, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 28 }, linkStateTitle: { fontSize: 16, fontWeight: '800', marginTop: 12, textAlign: 'center' }, linkStateCopy: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 5, textAlign: 'center' }, formError: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 14 },
});
