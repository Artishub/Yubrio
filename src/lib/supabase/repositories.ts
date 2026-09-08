import { roomDraftSchema } from '@/lib/validation/room';
import { supabase } from '@/lib/supabase/client';
import { roomCreationPolicy } from '@/config/policies';
import { Platform } from 'react-native';
import { User } from '@supabase/supabase-js';
import { canMessageAvailability } from '@/lib/validation/rules';
import { profileNameSchema } from '@/lib/validation/profile';

export type RoomDraft = {
  activity: string; title: string; startsAt: Date; endsAt: Date;
  locationMode: 'in_person' | 'online' | 'undecided'; placeName?: string;
  onlineDetails?: string; audience: 'everyone' | 'circle' | 'people';
  circleIds?: string[]; profileIds?: string[]; chatEnabled?: boolean;
  participantsCanInvite?: boolean;
};

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function ensureProfile(user: User) {
  const { data: existing, error: existingError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return;
  const displayName = user.user_metadata?.display_name?.trim() || user.email?.split('@')[0] || 'Yubrio friend';
  const { error } = await supabase.from('profiles').insert({ id: user.id, display_name: displayName, initials: displayName.slice(0, 1).toUpperCase(), avatar_color: '#D9F96B' });
  if (error && error.code !== '23505') throw error;
}

export async function fetchOwnProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('id, display_name, initials, avatar_color').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOwnProfile(name: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before editing your profile.');
  const displayName = profileNameSchema.parse(name);
  const { data, error } = await supabase.from('profiles').update({ display_name: displayName, initials: displayName.slice(0, 1).toUpperCase() }).eq('id', user.id).select('id, display_name, initials, avatar_color').single();
  if (error) throw error;
  return data;
}

export async function fetchActiveRooms() {
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase.from('rooms').select('*, room_members(profile_id, arrival_at, profiles(id, display_name, initials, avatar_color))').gt('ends_at', new Date().toISOString()).order('starts_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchRoomById(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_members(profile_id, arrival_at, profiles(id, display_name, initials, avatar_color))')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchVisibleAvailability() {
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase.from('availability').select('*, profiles!availability_profile_id_fkey(id, display_name, initials, avatar_color), availability_audiences(circle_id, profile_id, audience_kind)').gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAcceptedFriends() {
  const user = await getSessionUser();
  if (!user) return [];
  const { data: relationships, error: relationshipError } = await supabase.from('friendships').select('requester_id, addressee_id').eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  if (relationshipError) throw relationshipError;
  const ids = (relationships ?? []).map((relationship) => relationship.requester_id === user.id ? relationship.addressee_id : relationship.requester_id);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('profiles').select('id, display_name, initials, avatar_color').in('id', ids);
  if (error) throw error;
  return data;
}

export async function fetchPendingFriendRequests() {
  const user = await getSessionUser();
  if (!user) return [];
  const { data: relationships, error: relationshipError } = await supabase.from('friendships').select('id, requester_id, addressee_id').eq('status', 'pending').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  if (relationshipError) throw relationshipError;
  const rows = relationships ?? [];
  const otherIds = rows.map((relationship) => relationship.requester_id === user.id ? relationship.addressee_id : relationship.requester_id);
  if (!otherIds.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, display_name, initials, avatar_color').in('id', otherIds);
  if (profileError) throw profileError;
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return rows.flatMap((relationship) => {
    const profile = profileById.get(relationship.requester_id === user.id ? relationship.addressee_id : relationship.requester_id);
    if (!profile) return [];
    return [{ id: relationship.id as string, direction: relationship.addressee_id === user.id ? 'incoming' as const : 'outgoing' as const, person: { id: profile.id, name: profile.display_name, initials: profile.initials, color: profile.avatar_color } }];
  });
}

export async function fetchOwnedCircles() {
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase.from('circles').select('id, name, circle_members(profile_id)').eq('owner_id', user.id).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCircle(name: string, memberIds: string[]) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before creating a circle.');
  await ensureProfile(user);
  const { data, error } = await supabase.rpc('create_circle_atomic', { p_name: name.trim(), p_member_ids: [...new Set(memberIds)] });
  if (error) throw error;
  const circle = (Array.isArray(data) ? data[0] : data) as { id: string; name: string } | null;
  if (!circle?.id) throw new Error('Couldn’t create that circle.');
  return { id: circle.id, name: circle.name, memberIds };
}

export async function createRoom(draft: RoomDraft) {
  const parsed = roomDraftSchema.parse({ ...draft, audience: draft.audience === 'everyone' ? 'friends' : draft.audience });
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before opening a room.');
  await ensureProfile(user);
  const durationHours = (parsed.endsAt.getTime() - parsed.startsAt.getTime()) / (60 * 60 * 1000);
  if (durationHours > roomCreationPolicy.maxDurationHours) throw new Error('Rooms can last up to 24 hours.');
  const { data, error } = await supabase.rpc('create_room_atomic', {
    p_activity: draft.activity,
    p_title: draft.title,
    p_starts_at: parsed.startsAt.toISOString(),
    p_ends_at: parsed.endsAt.toISOString(),
    p_location_mode: draft.locationMode,
    p_place_name: draft.placeName ?? null,
    p_online_details: draft.onlineDetails ?? null,
    p_chat_enabled: draft.chatEnabled ?? true,
    p_participants_can_invite: draft.participantsCanInvite ?? true,
    p_audience_kind: draft.audience === 'circle' ? 'circle' : draft.audience === 'people' ? 'people' : 'everyone',
    p_circle_ids: draft.circleIds ?? [],
    p_profile_ids: draft.profileIds ?? [],
  });
  if (error) throw error;
  const room = (Array.isArray(data) ? data[0] : data) as { id: string } | null;
  if (!room?.id) throw new Error('Couldn’t create that room.');
  return room;
}

export async function joinRoom(roomId: string, arrivalAt?: Date) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before joining.');
  const { error } = await supabase.from('room_members').upsert({ room_id: roomId, profile_id: user.id, arrival_at: arrivalAt?.toISOString() ?? null }, { onConflict: 'room_id,profile_id' });
  if (error) throw error;
}

export async function leaveRoom(roomId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before leaving.');
  const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('profile_id', user.id);
  if (error) throw error;
}

export async function inviteFriendsToRoom(roomId: string, inviteeIds: string[]) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before inviting friends.');
  const ids = [...new Set(inviteeIds.filter((id) => id && id !== user.id))];
  if (!ids.length) return [];
  const { data, error } = await supabase.from('room_invites').upsert(ids.map((inviteeId) => ({ room_id: roomId, inviter_id: user.id, invitee_id: inviteeId })), { onConflict: 'room_id,invitee_id', ignoreDuplicates: true }).select();
  if (error) throw error;
  return data ?? [];
}

export async function publishAvailability(input: { expiresAt: Date; audience: 'everyone' | 'circle' | 'people'; circleIds?: string[]; profileIds?: string[]; note?: string; allowMessages?: boolean }) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before sharing availability.');
  const durationHours = (input.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
  if (durationHours <= 0 || durationHours > 24) throw new Error('Availability can last up to 24 hours.');
  const { data, error } = await supabase.rpc('publish_availability_atomic', {
    p_expires_at: input.expiresAt.toISOString(),
    p_audience: input.audience,
    p_circle_ids: input.circleIds ?? [],
    p_profile_ids: input.profileIds ?? [],
    p_note: input.note ?? null,
    p_allow_messages: input.allowMessages ?? true,
  });
  if (error) throw error;
  const availability = (Array.isArray(data) ? data[0] : data) as { id: string } | null;
  if (!availability?.id) throw new Error('Couldn’t share your availability.');
  return availability;
}

export async function clearAvailability() {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before ending availability.');
  const { error } = await supabase.from('availability').delete().eq('profile_id', user.id);
  if (error) throw error;
}

export async function sendRoomMessage(roomId: string, body: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before sending a message.');
  const { data, error } = await supabase.from('room_messages').insert({ room_id: roomId, author_id: user.id, body: body.trim() }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchRoomMessages(roomId: string) {
  const { data, error } = await supabase.from('room_messages').select('id, room_id, author_id, body, created_at, profiles(id, display_name, initials, avatar_color)').eq('room_id', roomId).order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return data;
}

export async function fetchRoomSuggestions(roomId: string) {
  const { data, error } = await supabase.from('room_suggestions').select('id, room_id, activity, title, author_id, profiles(display_name)').eq('room_id', roomId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRoomSuggestion(roomId: string, activity: string, title: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before suggesting an activity.');
  const { data, error } = await supabase.from('room_suggestions').insert({ room_id: roomId, activity, title: title.trim(), author_id: user.id }).select('id, room_id, activity, title, author_id').single();
  if (error) throw error;
  return data;
}

export async function sendAvailabilityMessage(conversationId: string, body: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before sending a message.');
  const { data: conversation, error: conversationError } = await supabase.from('availability_conversations').select('inactive_at, availability(expires_at, allow_messages)').eq('id', conversationId).single();
  if (conversationError) throw conversationError;
  const availability = conversation.availability as { expires_at?: string; allow_messages?: boolean } | null;
  if (!availability?.expires_at || !canMessageAvailability({ expiresAt: new Date(availability.expires_at).getTime(), allowMessages: Boolean(availability.allow_messages), now: Date.now() }) || (conversation.inactive_at && new Date(conversation.inactive_at).getTime() <= Date.now())) throw new Error('This conversation has gone quiet.');
  const { data, error } = await supabase.from('availability_messages').insert({ conversation_id: conversationId, author_id: user.id, body: body.trim() }).select().single();
  if (error) throw error;
  return data;
}

export async function getOrCreateAvailabilityConversation(availabilityId: string, friendId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before messaging.');
  const pair = `and(profile_a_id.eq.${user.id},profile_b_id.eq.${friendId}),and(profile_a_id.eq.${friendId},profile_b_id.eq.${user.id})`;
  const { data: existing, error: existingError } = await supabase.from('availability_conversations').select('id').eq('availability_id', availabilityId).or(pair).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id as string;
  const { data, error } = await supabase.from('availability_conversations').insert({ availability_id: availabilityId, profile_a_id: user.id, profile_b_id: friendId }).select('id').single();
  if (error) {
    if (error.code === '23505') {
      const { data: raced, error: racedError } = await supabase.from('availability_conversations').select('id').eq('availability_id', availabilityId).or(pair).maybeSingle();
      if (racedError) throw racedError;
      if (raced) return raced.id as string;
    }
    throw error;
  }
  return data.id as string;
}

export async function findAvailabilityConversation(availabilityId: string, friendId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before messaging.');
  const pair = `and(profile_a_id.eq.${user.id},profile_b_id.eq.${friendId}),and(profile_a_id.eq.${friendId},profile_b_id.eq.${user.id})`;
  const { data, error } = await supabase.from('availability_conversations').select('id').eq('availability_id', availabilityId).or(pair).maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

export async function fetchAvailabilityMessages(conversationId: string) {
  const { data, error } = await supabase.from('availability_messages').select('id, conversation_id, author_id, body, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return data;
}

export async function persistPushToken(token: string) {
  const user = await getSessionUser();
  if (!user) return;
  const { error } = await supabase.from('push_tokens').upsert({ profile_id: user.id, token, platform: Platform.OS }, { onConflict: 'token' });
  if (error) throw error;
}

export async function getOrCreateFriendLink() {
  const user = await getSessionUser();
  if (!user) throw new Error('You need to sign in before sharing a friend link.');
  await ensureProfile(user);
  const { data, error } = await supabase.rpc('get_or_create_friend_link');
  if (error) throw error;
  if (typeof data !== 'string' || !data) throw new Error('Couldn’t create a friend link.');
  return data;
}

export async function resolveFriendLink(token: string) {
  const { data, error } = await supabase.rpc('resolve_friend_link', { p_link_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

export async function requestFriendByLink(token: string) {
  const { data, error } = await supabase.rpc('request_friend_by_link', { p_link_token: token });
  if (error) throw error;
  return typeof data === 'string' ? data : 'pending';
}

export async function respondToFriendRequest(friendshipId: string, action: 'accepted' | 'blocked') {
  const { data, error } = await supabase.rpc('respond_to_friend_request', { p_friendship_id: friendshipId, p_action: action });
  if (error) throw error;
  return typeof data === 'string' ? data : action;
}
