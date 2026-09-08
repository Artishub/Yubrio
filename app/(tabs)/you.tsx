import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionButton, Avatar, SectionTitle, YText } from '@/components/ui';
import { AvailabilitySheet } from '@/components/sheets';
import { colors, radius, spacing, type } from '@/design/tokens';
import { useDemo } from '@/stores/demo-store';
import { useAuth } from '@/stores/auth-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { displayName } from '@/utils/display-name';
import { getPushPermissionStatus, registerForPushNotificationsAsync } from '@/lib/notifications/register';
import { persistPushToken } from '@/lib/supabase/repositories';

const notificationPreferencesKey = '@yubrio/notification-preferences';
type NotificationPreferences = { availability: boolean; rooms: boolean; chat: boolean };
type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'needs_setup' | 'unavailable' | 'unknown';
const defaultNotificationPreferences: NotificationPreferences = { availability: true, rooms: true, chat: true };

export default function YouScreen() {
  const [freeOpen, setFreeOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [availabilityPending, setAvailabilityPending] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences);
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>('unknown');
  const [pushPending, setPushPending] = useState(false);
  const [pushError, setPushError] = useState('');
  const { me, people, circles, availability, publishAvailability, clearAvailability, updateProfile } = useDemo();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const currentUser = me;
  const handle = currentUser.id === 'artjom' ? 'artjom' : currentUser.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'friend';
  const currentAvailability = availability.find((item) => item.personId === currentUser.id);

  const openProfile = () => { setProfileName(currentUser.name); setProfileError(''); setProfileOpen(true); };
  const saveProfile = async () => {
    if (!profileName.trim() || profilePending) return;
    setProfilePending(true);
    setProfileError('');
    try { await updateProfile(profileName); setProfileOpen(false); }
    catch (error) { setProfileError(error instanceof Error ? error.message : 'Couldn’t update your profile. Try again.'); }
    finally { setProfilePending(false); }
  };

  useEffect(() => {
    AsyncStorage.getItem(notificationPreferencesKey).then((value) => {
      if (!value) return;
      try {
        const saved = JSON.parse(value) as Partial<NotificationPreferences>;
        setNotificationPreferences({ ...defaultNotificationPreferences, ...saved });
      } catch {
        // Ignore stale local preferences and keep the safe defaults.
      }
    });
  }, []);

  const updateNotificationPreference = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(next);
    void AsyncStorage.setItem(notificationPreferencesKey, JSON.stringify(next));
  };

  useEffect(() => {
    if (!notificationsOpen) return;
    let active = true;
    void getPushPermissionStatus().then((status) => { if (active) setPushStatus(status); }).catch(() => { if (active) setPushStatus('unavailable'); });
    return () => { active = false; };
  }, [notificationsOpen]);

  const enablePush = async () => {
    if (pushPending) return;
    setPushPending(true);
    setPushError('');
    try {
      const token = await registerForPushNotificationsAsync({ requestPermission: true });
      if (!token) {
        const status = await getPushPermissionStatus();
        setPushStatus(status);
        setPushError(status === 'denied' ? 'Notifications are off. Allow them in iPhone Settings, then try again.' : status === 'needs_setup' ? 'Install the Yubrio development build on your iPhone first.' : 'Push alerts are only available on a physical phone.');
        return;
      }
      await persistPushToken(token);
      setPushStatus('granted');
    } catch {
      setPushError('Couldn’t enable push alerts. Try again.');
    } finally {
      setPushPending(false);
    }
  };

  return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(64, insets.top + 24), paddingBottom: insets.bottom + 110 }]}>
    <YText style={type.title}>You</YText>
    <View style={styles.profile}><Avatar person={currentUser} size={68} /><View style={styles.profileCopy}><YText style={styles.name}>{displayName(currentUser.name)}</YText><YText style={styles.handle}>@{handle}</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={openProfile} style={styles.editButton}><Ionicons name="create" size={21} color={colors.brand} /></Pressable></View>
    <View style={[styles.availability, { backgroundColor: 'transparent', borderRadius: 0, borderWidth: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: 0, paddingVertical: spacing.xl }]}>
      {currentAvailability ? <>
        <View style={styles.availabilityTop}><View style={styles.signal}><View style={styles.signalDot} /><YText style={styles.signalText}>You’re available</YText></View><YText style={styles.expires}>{currentAvailability.expiresIn}</YText></View>
        <YText style={styles.availabilityTitle}>{currentAvailability.note || 'Up for anything.'}</YText>
        <YText style={styles.availabilityCopy}>Visible to {audienceLabel(currentAvailability.audience)} · {currentAvailability.canMessage ? 'Messages on' : 'Messages off'}</YText>
        <View style={styles.availabilityActions}><ActionButton label="Change availability" icon="options-outline" variant="secondary" onPress={() => setFreeOpen(true)} style={styles.changeButton} /><Pressable accessibilityRole="button" disabled={availabilityPending} onPress={() => { setAvailabilityPending(true); setAvailabilityError(''); void clearAvailability(currentUser.id).catch(() => setAvailabilityError('Couldn’t end your availability. Try again.')).finally(() => setAvailabilityPending(false)); }} style={[styles.endButton, availabilityPending && styles.disabledAction]}><YText style={styles.endText}>{availabilityPending ? 'Ending…' : 'End'}</YText></Pressable></View>{availabilityError ? <YText accessibilityRole="alert" style={styles.error}>{availabilityError}</YText> : null}
      </> : <>
        <View style={styles.quietIcon}><Ionicons name="radio-button-on-outline" size={22} color={colors.brand} /></View>
        <YText style={styles.availabilityTitle}>You’re not marked free.</YText>
        <YText style={styles.availabilityCopy}>Let your people know when you have room for something.</YText>
        <ActionButton label="I’m free" icon="radio-button-on" onPress={() => setFreeOpen(true)} style={{ marginTop: spacing.xl }} />
      </>}
    </View>
    <View style={styles.sectionGap} /><SectionTitle>Preferences</SectionTitle>
    <View style={styles.settings}>
      <Pressable accessibilityRole="button" accessibilityLabel="Notification preferences" onPress={() => setNotificationsOpen(true)} style={styles.settingRow}><View style={styles.settingIcon}><Ionicons name="notifications-outline" size={19} color={colors.ink} /></View><View style={styles.settingCopy}><YText style={styles.settingTitle}>Notifications</YText><YText style={styles.settingDescription}>Keep up with the good stuff</YText></View><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>
      {session && <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={signingOut} onPress={() => { setSigningOut(true); setAccountError(''); void signOut().catch(() => setAccountError('Couldn’t sign out. Try again.')).finally(() => setSigningOut(false)); }} style={[styles.settingRow, signingOut && styles.disabledAction]}><View style={styles.settingIcon}><Ionicons name="log-out-outline" size={19} color={colors.muted} /></View><View style={styles.settingCopy}><YText style={styles.settingTitle}>{signingOut ? 'Signing out…' : 'Sign out'}</YText><YText style={styles.settingDescription}>You can come back anytime</YText></View></Pressable>}
    </View>
    {accountError ? <YText accessibilityRole="alert" style={styles.error}>{accountError}</YText> : null}
  </ScrollView><AvailabilitySheet visible={freeOpen} onClose={() => setFreeOpen(false)} excludePersonId={currentUser.id} people={people} circles={circles} onPublish={(duration, note, audience, audienceIds, canMessage) => publishAvailability({ id: `free-${Date.now()}`, personId: currentUser.id, expiresIn: formatAvailabilityDuration(duration), note, canMessage, audience, audienceIds })} /><EditProfileModal visible={profileOpen} name={profileName} pending={profilePending} error={profileError} onChange={(name) => { setProfileName(name); setProfileError(''); }} onClose={() => { if (!profilePending) setProfileOpen(false); }} onSave={saveProfile} /><NotificationPreferencesModal visible={notificationsOpen} preferences={notificationPreferences} canEnablePush={Boolean(session)} pushStatus={pushStatus} pushPending={pushPending} pushError={pushError} onEnablePush={() => void enablePush()} onClose={() => setNotificationsOpen(false)} onChange={updateNotificationPreference} /></View>;
}

function formatAvailabilityDuration(duration: string) { return duration === 'Today' ? 'until tonight' : `${duration} left`; }
function audienceLabel(audience?: string) { if (audience === 'circle' || audience === 'Choose circles') return 'your circles'; if (audience === 'people' || audience === 'Choose people') return 'selected friends'; return 'everyone'; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingTop: 48, paddingHorizontal: spacing.xl, paddingBottom: 125 }, kicker: { ...type.label, color: colors.muted, marginBottom: 8 }, profile: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 22, marginBottom: 26 }, profileCopy: { flex: 1 }, name: { fontSize: 20, fontWeight: '800' }, handle: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: 2 }, editButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' }, disabledAction: { opacity: 0.5 },
  availability: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, borderWidth: 1, borderColor: colors.glassBorder }, availabilityTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, signal: { flexDirection: 'row', alignItems: 'center', gap: 7 }, signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }, signalText: { color: colors.brand, fontSize: 13, fontWeight: '800' }, expires: { color: colors.muted, fontSize: 12, fontWeight: '700' }, availabilityTitle: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 22 }, availabilityCopy: { color: colors.muted, fontWeight: '600', fontSize: 13, lineHeight: 19, marginTop: 6 }, availabilityActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }, changeButton: { flex: 1 }, endButton: { minHeight: 50, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' }, endText: { color: colors.muted, fontSize: 13, fontWeight: '800' }, error: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: spacing.md }, quietIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.glassHighlight, alignItems: 'center', justifyContent: 'center' }, sectionGap: { height: 28 }, settings: { backgroundColor: 'transparent', paddingHorizontal: 0, borderTopWidth: 1, borderTopColor: colors.line }, settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }, settingIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, settingCopy: { flex: 1 }, settingTitle: { fontSize: 14, fontWeight: '800' }, settingDescription: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 2 }, version: { textAlign: 'center', color: colors.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 28 },
  preferenceBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }, preferenceSheet: { backgroundColor: colors.canvas, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.xxl, paddingBottom: 34 }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }, modalClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, preferenceIntro: { color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '600', marginBottom: spacing.lg }, profileInput: { minHeight: 54, backgroundColor: colors.surface, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, color: colors.ink, fontSize: 16 }, preferenceList: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: spacing.lg }, preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }, preferenceDone: { minHeight: 52, borderRadius: radius.button, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg }, preferenceDoneText: { color: colors.brandInk, fontSize: 16, fontWeight: '900' }, pushRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.glassBorder, marginBottom: spacing.lg }, pushIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, pushEnable: { minHeight: 38, paddingHorizontal: 13, borderRadius: 12, backgroundColor: colors.brand, borderBottomWidth: 3, borderBottomColor: colors.brandPressed, alignItems: 'center', justifyContent: 'center' }, pushEnablePressed: { transform: [{ translateY: 2 }], borderBottomWidth: 1 }, pushEnableText: { color: colors.brandInk, fontSize: 12, fontWeight: '900' }, pushEnabled: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});

function EditProfileModal({ visible, name, pending, error, onChange, onClose, onSave }: { visible: boolean; name: string; pending: boolean; error: string; onChange: (name: string) => void; onClose: () => void; onSave: () => void }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.preferenceBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.preferenceSheet}>
        <View style={styles.modalTop}><View><YText style={styles.kicker}>YOUR PROFILE</YText><YText style={type.section}>What should friends call you?</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close profile editor" disabled={pending} onPress={onClose} style={[styles.modalClose, pending && styles.disabledAction]}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
        <YText style={styles.preferenceIntro}>This is the name people see when you open something.</YText>
        <TextInput accessibilityLabel="Display name" value={name} onChangeText={onChange} autoCapitalize="words" autoCorrect={false} maxLength={60} returnKeyType="done" onSubmitEditing={onSave} placeholder="Your name" placeholderTextColor={colors.faint} style={styles.profileInput} />
        {error ? <YText accessibilityRole="alert" style={styles.error}>{error}</YText> : null}
        <ActionButton label={pending ? 'Saving…' : 'Save profile'} icon="checkmark" disabled={pending || !name.trim()} onPress={onSave} style={{ marginTop: spacing.lg }} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function NotificationPreferencesModal({ visible, preferences, canEnablePush, pushStatus, pushPending, pushError, onEnablePush, onClose, onChange }: { visible: boolean; preferences: NotificationPreferences; canEnablePush: boolean; pushStatus: PushPermissionStatus; pushPending: boolean; pushError: string; onEnablePush: () => void; onClose: () => void; onChange: (key: keyof NotificationPreferences, value: boolean) => void }) {
  const rows: { key: keyof NotificationPreferences; icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
    { key: 'availability', icon: 'radio-button-on-outline', title: 'Friends become free', description: 'See when your people have time.' },
    { key: 'rooms', icon: 'sparkles-outline', title: 'Rooms and invites', description: 'Know when someone opens something.' },
    { key: 'chat', icon: 'chatbubble-ellipses-outline', title: 'Room chat', description: 'Keep up with plans you joined.' },
  ];
  const pushLabel = !canEnablePush ? 'Sign in to receive alerts' : pushStatus === 'granted' ? 'Push alerts are on' : pushStatus === 'denied' ? 'Notifications are off' : pushStatus === 'needs_setup' ? 'Install the Yubrio development build first' : pushStatus === 'unavailable' ? 'Use a physical phone to enable' : 'Get a nudge when plans move';
  const pushUnavailable = !canEnablePush || pushStatus === 'unavailable' || pushStatus === 'needs_setup';
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.preferenceBackdrop}><View style={styles.preferenceSheet}><View style={styles.modalTop}><View><YText style={styles.kicker}>PREFERENCES</YText><YText style={type.section}>Notifications</YText></View><Pressable accessibilityRole="button" accessibilityLabel="Close notification preferences" onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View><YText style={styles.preferenceIntro}>Choose the moments worth a nudge. You can change this anytime.</YText><View style={styles.pushRow}><View style={styles.pushIcon}><Ionicons name={pushStatus === 'granted' ? 'notifications' : 'notifications-outline'} size={19} color={colors.brandInk} /></View><View style={styles.settingCopy}><YText style={styles.settingTitle}>Push alerts</YText><YText style={styles.settingDescription}>{pushLabel}</YText></View>{pushStatus === 'granted' ? <View accessible accessibilityLabel="Push alerts enabled" style={styles.pushEnabled}><Ionicons name="checkmark" size={15} color={colors.brandInk} /></View> : canEnablePush ? <Pressable accessibilityRole="button" accessibilityLabel="Enable push alerts" disabled={pushPending || pushUnavailable} onPress={onEnablePush} style={({ pressed }) => [styles.pushEnable, pressed && styles.pushEnablePressed, (pushPending || pushUnavailable) && styles.disabledAction]}><YText style={styles.pushEnableText}>{pushPending ? 'Enabling…' : 'Enable'}</YText></Pressable> : null}</View>{pushError ? <YText accessibilityRole="alert" style={styles.error}>{pushError}</YText> : null}<View style={styles.preferenceList}>{rows.map((row) => <View key={row.key} style={styles.preferenceRow}><View style={styles.settingIcon}><Ionicons name={row.icon} size={19} color={colors.ink} /></View><View style={styles.settingCopy}><YText style={styles.settingTitle}>{row.title}</YText><YText style={styles.settingDescription}>{row.description}</YText></View><Switch accessibilityLabel={row.title} value={preferences[row.key]} onValueChange={(value) => onChange(row.key, value)} trackColor={{ false: colors.surfaceMuted, true: colors.brand }} thumbColor={preferences[row.key] ? colors.brandInk : colors.muted} /></View>)}</View><Pressable accessibilityRole="button" onPress={onClose} style={styles.preferenceDone}><YText style={styles.preferenceDoneText}>Done</YText></Pressable></View></View></Modal>;
}
