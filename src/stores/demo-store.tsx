import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { availability as seededAvailability, circles as seededCircles, rooms as seededRooms } from '@/data/demo';
import { currentUser, people as seededPeople } from '@/data/demo';
import { Availability, Circle, Person, Room } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createCircle as createRemoteCircle, createRoom as createRemoteRoom, fetchAcceptedFriends, fetchActiveRooms, fetchOwnProfile, fetchOwnedCircles, fetchVisibleAvailability, joinRoom as joinRemoteRoom, leaveRoom as leaveRemoteRoom, publishAvailability as publishRemoteAvailability, clearAvailability as clearRemoteAvailability, updateOwnProfile } from '@/lib/supabase/repositories';
import { useAuth } from '@/stores/auth-store';
import { activityMeta } from '@/design/tokens';
import { queryClient } from '@/lib/query/client';
import { roomArchivePolicy } from '@/config/policies';
import { availabilityDurationMs, formatRemainingDuration, isRoomInArchive } from '@/lib/validation/rules';

type DemoContextValue = {
  me: Person; people: Person[]; circles: Circle[]; rooms: Room[]; roomArchive: Room[]; availability: Availability[]; remoteActive: boolean; remoteLoading: boolean; remoteError: boolean; retryHome: () => void; joinedRoom: (id: string, arrival?: string) => Promise<void>; leaveRoom: (id: string) => Promise<void>; addRoom: (room: Room) => Promise<string>; addCircle: (circle: Circle) => Promise<void>; addFriendByHandle: (handle: string) => boolean; publishAvailability: (item: Availability) => Promise<void>; clearAvailability: (personId: string) => Promise<void>; updateProfile: (name: string) => Promise<void>;
};
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [rooms, setRooms] = useState(seededRooms);
  const [roomArchive, setRoomArchive] = useState<Room[]>([]);
  const roomsRef = useRef(rooms);
  const [availability, setAvailability] = useState(seededAvailability);
  const [people, setPeople] = useState(seededPeople);
  const [circles, setCircles] = useState(seededCircles);
  const [profileOverride, setProfileOverride] = useState<{ key: string; name: string } | null>(null);
  const remoteEnabled = isSupabaseConfigured && Boolean(session);
  const profileKey = session?.user.id ?? 'demo';
  const profileName = profileOverride?.key === profileKey ? profileOverride.name : null;
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  const sessionName = profileName ?? session?.user.user_metadata?.display_name ?? session?.user.email?.split('@')[0] ?? 'You';
  const me: Person = session && remoteEnabled ? { id: session.user.id, name: sessionName, initials: sessionName.slice(0, 1).toUpperCase(), color: '#D9F96B' } : { ...currentUser, ...(profileName ? { name: profileName, initials: profileName.slice(0, 1).toUpperCase() } : {}) };
  const remoteHome = useQuery({ queryKey: ['home', session?.user.id], queryFn: async () => Promise.all([fetchActiveRooms(), fetchVisibleAvailability(), fetchAcceptedFriends(), fetchOwnedCircles(), fetchOwnProfile()]), enabled: remoteEnabled, staleTime: 30_000 });
  useEffect(() => { if (!remoteHome.data || !session) return; const hydrate = () => { const [remoteRooms, remoteAvailability, remoteFriends, remoteCircles, ownProfile] = remoteHome.data!; if (ownProfile?.display_name) setProfileOverride({ key: session.user.id, name: ownProfile.display_name }); const profiles = new Map<string, Person>(); profiles.set(session.user.id, { id: session.user.id, name: ownProfile?.display_name ?? sessionName, initials: ownProfile?.initials ?? sessionName.slice(0, 1).toUpperCase(), color: ownProfile?.avatar_color ?? '#D9F96B' }); remoteFriends.forEach((profile: any) => profiles.set(profile.id, { id: profile.id, name: profile.display_name, initials: profile.initials, color: profile.avatar_color })); remoteRooms.forEach((row: any) => (row.room_members ?? []).forEach((member: any) => { if (member.profiles) profiles.set(member.profiles.id, { id: member.profiles.id, name: member.profiles.display_name, initials: member.profiles.initials, color: member.profiles.avatar_color }); })); remoteAvailability.forEach((row: any) => { if (row.profiles) profiles.set(row.profiles.id, { id: row.profiles.id, name: row.profiles.display_name, initials: row.profiles.initials, color: row.profiles.avatar_color }); }); setPeople([...profiles.values()]); setRooms(remoteRooms.map((row: any) => mapRemoteRoom(row, session.user.id))); setRoomArchive([]); setAvailability(remoteAvailability.map((row: any) => mapRemoteAvailability(row))); setCircles(remoteCircles.map((row: any) => ({ id: row.id, name: row.name, memberIds: (row.circle_members ?? []).map((member: any) => member.profile_id) }))); }; const task = setTimeout(hydrate, 0); return () => clearTimeout(task); }, [remoteHome.data, session, sessionName]);
  useEffect(() => { const prune = () => { const now = Date.now(); const expired = roomsRef.current.filter((room) => room.endAt <= now); if (expired.length) setRoomArchive((archived) => [...expired, ...archived.filter((room) => !expired.some((item) => item.id === room.id))].filter((room) => isRoomInArchive(room.endAt, now, roomArchivePolicy.durationHours))); setRooms((items) => items.filter((room) => room.endAt > now)); setRoomArchive((items) => items.filter((room) => isRoomInArchive(room.endAt, now, roomArchivePolicy.durationHours))); setAvailability((items) => items.filter((item) => !item.expiresAt || item.expiresAt > now)); }; prune(); const timer = setInterval(prune, 60_000); return () => clearInterval(timer); }, []);
  const joinedRoom = useCallback(async (id: string, arrival?: string) => { const previous = rooms; const viewerId = session?.user.id ?? currentUser.id; setRooms((items) => items.map((room) => { if (room.id !== id) return room; const arrivalByPerson = { ...room.arrivalByPerson }; if (arrival) arrivalByPerson[viewerId] = arrival; else delete arrivalByPerson[viewerId]; return { ...room, joined: true, arrival, arrivalByPerson, count: room.joined ? room.count : room.count + 1 }; })); if (!remoteEnabled || id.startsWith('room-')) return; try { await joinRemoteRoom(id, arrivalDate(arrival)); void queryClient.invalidateQueries({ queryKey: ['home'] }); void queryClient.invalidateQueries({ queryKey: ['room', id] }); } catch { setRooms(previous); throw new Error('Couldn’t join that room. Try again.'); } }, [remoteEnabled, rooms, session]);
  const leaveRoom = useCallback(async (id: string) => { const previous = rooms; const viewerId = session?.user.id ?? currentUser.id; setRooms((items) => items.map((room) => { if (room.id !== id || !room.joined) return room; const arrivalByPerson = { ...room.arrivalByPerson }; delete arrivalByPerson[viewerId]; return { ...room, joined: false, arrival: undefined, arrivalByPerson, count: Math.max(0, room.count - 1) }; })); if (!remoteEnabled || id.startsWith('room-')) return; try { await leaveRemoteRoom(id); void queryClient.invalidateQueries({ queryKey: ['home'] }); void queryClient.invalidateQueries({ queryKey: ['room', id] }); } catch { setRooms(previous); throw new Error('Couldn’t leave that room. Try again.'); } }, [remoteEnabled, rooms, session]);
  const addRoom = useCallback(async (room: Room) => {
    setRooms((items) => [room, ...items]);
    if (!remoteEnabled) return room.id;
    try {
      const isCircle = room.audience === 'Choose circles' || circles.some((circle) => circle.name === room.audience);
      const saved = await createRemoteRoom({ activity: room.activity, title: room.title, startsAt: new Date(room.startsAt ?? Date.now()), endsAt: new Date(room.endAt), locationMode: room.locationMode ?? (room.online ? 'online' : room.location ? 'in_person' : 'undecided'), placeName: room.placeName ?? room.location, onlineDetails: room.onlineDetails ?? room.online, audience: room.audience === 'Choose people' ? 'people' : isCircle ? 'circle' : 'everyone', circleIds: isCircle ? room.audienceIds : undefined, profileIds: room.audience === 'Choose people' ? room.audienceIds : undefined, chatEnabled: room.chatEnabled, participantsCanInvite: room.participantsCanInvite });
      setRooms((items) => items.map((item) => item.id === room.id ? { ...item, id: saved.id as string } : item));
      void queryClient.invalidateQueries({ queryKey: ['home', session?.user.id] });
      return saved.id as string;
    } catch {
      setRooms((items) => items.filter((item) => item.id !== room.id));
      throw new Error('Couldn’t open that room. Try again.');
    }
  }, [circles, remoteEnabled, session]);
  const addCircle = useCallback(async (circle: Circle) => { if (!remoteEnabled) { setCircles((items) => [...items, circle]); return; } const saved = await createRemoteCircle(circle.name, circle.memberIds); setCircles((items) => [...items, saved]); }, [remoteEnabled]);
  const addFriendByHandle = useCallback((handle: string) => {
    const normalized = handle.trim().toLowerCase();
    const person = normalized === currentUser.id ? currentUser : people.find((item) => item.id.toLowerCase() === normalized || item.name.toLowerCase() === normalized);
    if (!person || person.id === currentUser.id) return Boolean(person);
    setPeople((items) => items.some((item) => item.id === person.id) ? items : [...items, person]);
    return true;
  }, [people]);
  const publishAvailability = useCallback(async (item: Availability) => { const now = Date.now(); const expiresAt = item.expiresAt ?? now + availabilityDurationMs(item.expiresIn, now); const previous = availability; setAvailability((items) => [{ ...item, expiresAt }, ...items.filter((existing) => existing.personId !== item.personId)]); if (!remoteEnabled) return; try { const audience = audienceValue(item.audience); await publishRemoteAvailability({ expiresAt: new Date(expiresAt), audience, circleIds: audience === 'circle' ? item.audienceIds : undefined, profileIds: audience === 'people' ? item.audienceIds : undefined, note: item.note, allowMessages: item.canMessage }); await queryClient.invalidateQueries({ queryKey: ['home', session?.user.id] }); } catch (error) { setAvailability(previous); throw error; } }, [availability, remoteEnabled, session]);
  const clearAvailability = useCallback(async (personId: string) => { const previous = availability; setAvailability((items) => items.filter((item) => item.personId !== personId)); if (!remoteEnabled) return; try { await clearRemoteAvailability(); await queryClient.invalidateQueries({ queryKey: ['home', session?.user.id] }); } catch { setAvailability(previous); throw new Error('Couldn’t end your availability. Try again.'); } }, [availability, remoteEnabled, session]);
  const updateProfile = useCallback(async (name: string) => { if (!remoteEnabled) { setProfileOverride({ key: profileKey, name: name.trim() }); return; } try { const saved = await updateOwnProfile(name); setProfileOverride({ key: profileKey, name: saved.display_name }); void queryClient.invalidateQueries({ queryKey: ['home', session?.user.id] }); } catch { throw new Error('Couldn’t update your profile. Try again.'); } }, [profileKey, remoteEnabled, session]);
  const remoteReady = remoteEnabled && remoteHome.isSuccess;
  const visiblePeople = remoteEnabled && !remoteReady ? [] : people;
  const visibleCircles = remoteEnabled && !remoteReady ? [] : circles;
  const visibleRooms = remoteEnabled && !remoteReady ? [] : rooms;
  const visibleAvailability = remoteEnabled && !remoteReady ? [] : availability;
  const value: DemoContextValue = { me, people: visiblePeople, circles: visibleCircles, rooms: visibleRooms, roomArchive: remoteEnabled && !remoteReady ? [] : roomArchive, availability: visibleAvailability, remoteActive: remoteReady, remoteLoading: remoteEnabled && remoteHome.isPending, remoteError: remoteEnabled && remoteHome.isError, retryHome: () => { void remoteHome.refetch(); }, joinedRoom, leaveRoom, addRoom, addCircle, addFriendByHandle, publishAvailability, clearAvailability, updateProfile };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

function mapRemoteRoom(row: any, userId: string): Room { const members = row.room_members ?? []; const activity = activityMeta[row.activity as keyof typeof activityMeta] ? row.activity : 'custom'; const start = new Date(row.starts_at); const end = new Date(row.ends_at); const time = formatRemoteRoomTime(start, end); const arrivalByPerson = Object.fromEntries(members.filter((member: any) => member.arrival_at).map((member: any) => [member.profile_id, formatArrival(member.arrival_at)])); return { id: row.id, activity, title: row.title, time, startsAt: start.getTime(), endAt: end.getTime(), people: members.map((member: any) => member.profile_id), participantDetails: members.flatMap((member: any) => member.profiles ? [{ id: member.profiles.id, name: member.profiles.display_name, initials: member.profiles.initials, color: member.profiles.avatar_color }] : []), count: members.length, location: row.place_name ?? undefined, online: row.location_mode === 'online' ? row.online_details ?? 'Online' : undefined, locationMode: row.location_mode, placeName: row.place_name ?? undefined, onlineDetails: row.online_details ?? undefined, creatorId: row.creator_id, chatEnabled: row.chat_enabled, participantsCanInvite: row.participants_can_invite, joined: members.some((member: any) => member.profile_id === userId), arrivalByPerson }; }
function formatArrival(value: string) { const date = new Date(value); if (!Number.isFinite(date.getTime())) return 'Joining later'; return `around ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; }
function formatRemoteRoomTime(start: Date, end: Date) { if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) return 'Time to be decided'; const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); if (start.toDateString() === end.toDateString()) return startTime + '–' + endTime; const day = (date: Date) => { const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const daysAway = Math.round((target.getTime() - today.getTime()) / 86400000); if (daysAway === 0) return 'Today'; if (daysAway === 1) return 'Tomorrow'; return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }; return day(start) + ' ' + startTime + '–' + day(end) + ' ' + endTime; }
function mapRemoteAvailability(row: any): Availability { return { id: row.id, personId: row.profile_id, expiresIn: remaining(new Date(row.expires_at)), expiresAt: new Date(row.expires_at).getTime(), note: row.note ?? '', canMessage: row.allow_messages, audience: row.audience, audienceIds: (row.availability_audiences ?? []).map((item: any) => item.circle_id ?? item.profile_id).filter(Boolean) }; }
function remaining(date: Date) { return formatRemainingDuration(date.getTime()); }
function audienceValue(value?: string): 'everyone' | 'circle' | 'people' { if (value === 'Choose people') return 'people'; if (value === 'Choose circles' || (value && value !== 'Everyone' && value !== 'All friends')) return 'circle'; return 'everyone'; }
function arrivalDate(value?: string) { if (!value) return undefined; if (value.includes('30')) return new Date(Date.now() + 30 * 60 * 1000); if (value.includes('1 hour')) return new Date(Date.now() + 60 * 60 * 1000); const match = value.match(/(\d{1,2}):(\d{2})/); if (!match) return undefined; const date = new Date(); date.setHours(Number(match[1]), Number(match[2]), 0, 0); if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1); return date; }

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
