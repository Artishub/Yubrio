export type AudienceRule = {
  audience: 'everyone' | 'circle' | 'people';
  viewerId: string;
  circleMemberIds?: string[];
  selectedProfileIds?: string[];
};

export type AvailabilityMessageRule = {
  expiresAt: number;
  allowMessages: boolean;
  now?: number;
  gracePeriodHours?: number;
};

export function isWithinMaxDuration(startAt: number | Date, endAt: number | Date, maxHours = 24) {
  const start = toMilliseconds(startAt);
  const end = toMilliseconds(endAt);
  const duration = end - start;
  return duration > 0 && duration <= maxHours * 60 * 60 * 1000;
}

export function isRoomActive(endAt: number, now = Date.now()) {
  return endAt > now;
}

export function isRoomInArchive(endAt: number, now = Date.now(), archiveHours = 2) {
  return endAt <= now && endAt > now - archiveHours * 60 * 60 * 1000;
}

export function audienceIncludes({ audience, viewerId, circleMemberIds = [], selectedProfileIds = [] }: AudienceRule) {
  if (audience === 'everyone') return true;
  if (audience === 'circle') return circleMemberIds.includes(viewerId);
  return selectedProfileIds.includes(viewerId);
}

export function canMessageAvailability({ expiresAt, allowMessages, now = Date.now(), gracePeriodHours = 2 }: AvailabilityMessageRule) {
  return allowMessages && expiresAt + gracePeriodHours * 60 * 60 * 1000 > now;
}

export function availabilityDurationMs(expiresIn: string, now = Date.now()) {
  if (expiresIn === 'until tonight') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return Math.max(0, end.getTime() - now);
  }
  const hours = Number.parseFloat(expiresIn);
  return (Number.isFinite(hours) ? hours : 3) * 60 * 60 * 1000;
}

export function formatRemainingDuration(expiresAt: number, now = Date.now()) {
  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60000));
  return minutes >= 60 ? `${Math.max(1, Math.floor(minutes / 60))}h left` : `${minutes}m left`;
}

export function canInviteToRoom(creatorId: string, viewerId: string, participantsCanInvite: boolean) {
  return creatorId === viewerId || participantsCanInvite;
}

export function filterInvitableFriendIds(friendIds: string[], viewerId: string, memberIds: string[] = [], invitedIds: string[] = []) {
  const excluded = new Set([viewerId, ...memberIds, ...invitedIds]);
  return [...new Set(friendIds)].filter((friendId) => !excluded.has(friendId));
}

export function isValidClockTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60;
}

function toMilliseconds(value: number | Date) {
  return value instanceof Date ? value.getTime() : value;
}
