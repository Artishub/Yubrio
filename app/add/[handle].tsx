import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ActionButton, Avatar, YText } from '@/components/ui';
import { colors, radius, spacing, type } from '@/design/tokens';
import { currentUser, people } from '@/data/demo';
import { useAuth } from '@/stores/auth-store';
import { useDemo } from '@/stores/demo-store';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { requestFriendByLink, resolveFriendLink } from '@/lib/supabase/repositories';
import { queryClient } from '@/lib/query/client';
import { Person } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddFriendScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/friends');
  };
  const { handle: rawHandle } = useLocalSearchParams<{ handle?: string }>();
  const handle = Array.isArray(rawHandle) ? rawHandle[0] : rawHandle ?? '';
  const { session, demoMode } = useAuth();
  const { me, people: connectedPeople, addFriendByHandle } = useDemo();
  const insets = useSafeAreaInsets();
  const [added, setAdded] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'existing' | ''>('');
  const [error, setError] = useState('');
  const remoteProfile = useQuery({ queryKey: ['friend-link', handle], queryFn: () => resolveFriendLink(handle), enabled: isSupabaseConfigured && Boolean(handle), staleTime: 60 * 60 * 1000 });
  const demoProfile = useMemo(() => [currentUser, ...people].find((item) => item.id.toLowerCase() === handle.toLowerCase() || item.name.toLowerCase() === handle.toLowerCase()), [handle]);
  const profile = remoteProfile.data ? mapRemoteProfile(remoteProfile.data) : demoProfile;
  const alreadyConnected = profile ? connectedPeople.some((item) => item.id === profile.id) : false;
  const isSelf = profile?.id === me.id;
  const name = profile?.name ?? (handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'Yubrio friend');
  const add = async () => {
    setError('');
    if (!demoMode && !session) { router.replace('/'); return; }
    try {
      if (session && isSupabaseConfigured && !demoProfile) {
        const result = await requestFriendByLink(handle);
        setRequestStatus(result === 'accepted' ? 'accepted' : result === 'pending' ? 'pending' : 'existing');
        await queryClient.invalidateQueries({ queryKey: ['home', session.user.id] });
      } else if (profile && !isSelf) {
        addFriendByHandle(profile.id);
        setRequestStatus('accepted');
      }
      setAdded(true);
    } catch {
      setError('Couldn’t add this friend right now. Try again.');
    }
  };

  const invalid = isSupabaseConfigured && Boolean(handle) && !remoteProfile.isLoading && !remoteProfile.isError && remoteProfile.data === null;

  const connectionLabel = isSelf ? 'This is your own friend link' : alreadyConnected ? 'Already in your people' : requestStatus === 'pending' ? 'Friend request sent' : requestStatus === 'accepted' ? 'Added to your people' : 'Connection already exists';
  return <View style={styles.root}><View style={[styles.fieldLayer, styles.pointerNone]}><View style={[styles.colorField, styles.fieldOne]} /><View style={[styles.colorField, styles.fieldTwo]} /></View><ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(56, insets.top + 16), paddingBottom: insets.bottom + 24 }]}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.ink} /></Pressable><View style={styles.mark}><Ionicons name="sparkles" size={25} color={colors.brandInk} /></View><YText style={styles.kicker}>A FRIEND LINK</YText><YText style={type.title}>{invalid ? 'This link has gone quiet.' : isSelf ? 'That’s your link.' : `Meet ${name}.`}</YText><YText style={styles.copy}>{invalid ? 'Ask your friend to share a new one.' : isSelf ? 'Share it with a friend to connect on Yubrio.' : 'Yubrio keeps plans between people who choose each other.'}</YText>{!invalid && <View style={styles.profileCard}><Avatar person={profile ?? { id: handle || 'friend', name, initials: name.slice(0, 1).toUpperCase(), color: colors.brand }} size={72} /><YText style={styles.profileName}>{name}</YText><YText style={styles.profileHandle}>@{profile?.id ?? (handle || 'friend')}</YText>{added || alreadyConnected || isSelf ? <View style={styles.connected}><Ionicons name={isSelf ? 'link-outline' : requestStatus === 'pending' ? 'time-outline' : 'checkmark-circle'} size={18} color={isSelf ? colors.muted : requestStatus === 'pending' ? colors.coffee : colors.gym} /><YText style={[styles.connectedText, (requestStatus === 'pending' || isSelf) && { color: isSelf ? colors.muted : colors.coffee }]}>{connectionLabel}</YText></View> : null}</View>}{remoteProfile.isError && !demoProfile ? <YText style={styles.error}>Couldn’t check the profile right now. You can still try the link.</YText> : null}{error ? <YText style={styles.error}>{error}</YText> : null}{invalid || isSelf ? <ActionButton label="Go to Friends" icon="arrow-forward" onPress={() => router.replace('/(tabs)/friends')} /> : !added && !alreadyConnected ? <ActionButton label={session || demoMode ? `Add ${name}` : 'Sign in to add'} icon="person-add-outline" onPress={() => void add()} /> : <ActionButton label="Go to Friends" icon="arrow-forward" onPress={() => router.replace('/(tabs)/friends')} />}</ScrollView></View>;
}

function mapRemoteProfile(row: { profile_id: string; display_name: string; initials: string; avatar_color: string }): Person { return { id: row.profile_id, name: row.display_name, initials: row.initials, color: row.avatar_color }; }

const styles = StyleSheet.create({
  pointerNone: { pointerEvents: 'none' },
  root: { flex: 1, backgroundColor: colors.canvas }, fieldLayer: { ...StyleSheet.absoluteFill, overflow: 'hidden' }, colorField: { position: 'absolute', opacity: 0.12, transform: [{ rotate: '18deg' }] }, fieldOne: { width: 220, height: 84, top: 134, right: -112, backgroundColor: colors.electric }, fieldTwo: { width: 170, height: 70, bottom: 110, left: -98, backgroundColor: colors.coral }, content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 48 }, back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glassSurface, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 46 }, mark: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }, kicker: { ...type.label, color: colors.muted, marginBottom: 8 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 10, maxWidth: 330 }, profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.glassBorder, padding: 28, marginVertical: 30 }, profileName: { fontSize: 22, fontWeight: '800', marginTop: 15 }, profileHandle: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: 3 }, connected: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceMuted }, connectedText: { color: colors.gym, fontSize: 13, fontWeight: '800' }, error: { color: colors.error, textAlign: 'center', fontSize: 13, fontWeight: '700', marginBottom: 16 },
});
