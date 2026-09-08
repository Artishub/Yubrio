import { ActivityType } from '@/design/tokens';

export type Person = { id: string; name: string; initials: string; color: string; online?: boolean };
export type Room = {
  id: string; activity: ActivityType; title: string; detail?: string; time: string; startsAt?: number; endAt: number;
  people: string[]; participantDetails?: Person[]; count: number; location?: string; online?: string; locationMode?: 'in_person' | 'online' | 'undecided'; placeName?: string; onlineDetails?: string; joined?: boolean; arrival?: string; arrivalByPerson?: Record<string, string>; audience?: string; audienceIds?: string[]; creatorId?: string;
  chatEnabled?: boolean; participantsCanInvite?: boolean;
};
export type Availability = { id: string; personId: string; expiresIn: string; expiresAt?: number; note: string; canMessage: boolean; audience?: string; audienceIds?: string[] };
export type Circle = { id: string; name: string; memberIds: string[] };
export type RoomSuggestion = { id: string; roomId: string; activity: ActivityType; title: string; authorId: string; authorName?: string };
export type FriendRequest = { id: string; direction: 'incoming' | 'outgoing'; person: Person };
