import { Availability, Circle, Person, Room, RoomSuggestion } from '@/types';

const demoNow = Date.now();

export const people: Person[] = [
  { id: 'lisa', name: 'Lisa', initials: 'L', color: '#F6B49E' },
  { id: 'jonas', name: 'Jonas', initials: 'J', color: '#B9A8EF', online: true },
  { id: 'max', name: 'Max', initials: 'M', color: '#A8D5BF' },
  { id: 'sarah', name: 'Sarah', initials: 'S', color: '#F1D184', online: true },
  { id: 'alex', name: 'Alex', initials: 'A', color: '#A8C9E8' },
  { id: 'justin', name: 'Justin', initials: 'J', color: '#E9AFCB' },
];

export const currentUser: Person = { id: 'artjom', name: 'Artjom', initials: 'A', color: '#D9F96B' };

export const circles: Circle[] = [
  { id: 'close-friends', name: 'Close Friends', memberIds: ['lisa', 'jonas', 'sarah', 'max'] },
  { id: 'gaming', name: 'Gaming', memberIds: ['jonas', 'max', 'alex'] },
  { id: 'work', name: 'Work', memberIds: ['lisa', 'sarah', 'justin', 'alex', 'max'] },
];

export const rooms: Room[] = [
  { id: 'drinks', activity: 'drinks', title: 'Drinks after work', time: 'Today · 17:00–22:00', startsAt: demoNow - 1000 * 60 * 60, endAt: demoNow + 1000 * 60 * 60 * 3, people: ['max', 'lisa'], count: 2, location: 'Ludwigstraße · Gießen', creatorId: 'max', chatEnabled: true, participantsCanInvite: true },
  { id: 'league', activity: 'gaming', title: 'League tonight', detail: 'ARAM · Discord', time: 'Today · 20:00–23:00', startsAt: demoNow + 1000 * 60 * 60, endAt: demoNow + 1000 * 60 * 60 * 6, people: ['jonas'], count: 1, online: 'League of Legends', creatorId: 'jonas', chatEnabled: true, participantsCanInvite: true },
  { id: 'coffee', activity: 'coffee', title: 'Coffee?', detail: 'Starting soon', time: 'Today · 15:30–17:00', startsAt: demoNow - 1000 * 60 * 15, endAt: demoNow + 1000 * 60 * 60, people: ['sarah'], count: 1, location: 'Near the station', creatorId: 'sarah', chatEnabled: true, participantsCanInvite: true },
];

export const availability: Availability[] = [
  { id: 'sarah-free', personId: 'sarah', expiresIn: '2h left', expiresAt: Date.now() + 2 * 60 * 60 * 1000, note: 'Up for anything.', canMessage: true },
  { id: 'alex-free', personId: 'alex', expiresIn: 'until tonight', expiresAt: Date.now() + 7 * 60 * 60 * 1000, note: 'Maybe coffee or gaming.', canMessage: true },
];

export const roomMessages: Record<string, { author: string; body: string }[]> = {
  drinks: [{ author: 'Lisa', body: 'I can get there around 18:00.' }, { author: 'Max', body: 'I’ll grab a table.' }],
  league: [{ author: 'Jonas', body: 'Plans looking good.' }, { author: 'Lisa', body: 'I can make it around 17:30.' }],
  coffee: [{ author: 'Sarah', body: 'Near the station works.' }],
};

export const roomSuggestions: Record<string, RoomSuggestion[]> = {
  drinks: [{ id: 'suggestion-drinks-food', roomId: 'drinks', activity: 'food', title: 'Grab something to eat too', authorId: 'lisa', authorName: 'Lisa' }],
};
