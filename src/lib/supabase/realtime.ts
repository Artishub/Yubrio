import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/** Subscribe only while Home is active; RLS still decides which rows are delivered. */
export function subscribeToHome(userId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase.channel(`home:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'circles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members' }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_invites', filter: `invitee_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

/** Subscribe only to friendship changes involving the current user. */
export function subscribeToFriendships(userId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase.channel(`friendships:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

/** Subscribe only while a room is open; callers must return the cleanup function. */
export function subscribeToRoom(roomId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase.channel(`room:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_invites', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_suggestions', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function subscribeToAvailabilityConversation(conversationId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase.channel(`availability-conversation:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'availability_messages', filter: `conversation_id=eq.${conversationId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
