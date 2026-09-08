const assert = require('node:assert/strict');
const test = require('node:test');
const {
  audienceIncludes,
  availabilityDurationMs,
  canInviteToRoom,
  filterInvitableFriendIds,
  formatRemainingDuration,
  canMessageAvailability,
  isValidClockTime,
  isRoomActive,
  isRoomInArchive,
  isWithinMaxDuration,
} = require('../.test-build/rules.js');

const hour = 60 * 60 * 1000;

test('room duration accepts one minute through 24 hours, but not longer', () => {
  assert.equal(isWithinMaxDuration(0, hour), true);
  assert.equal(isWithinMaxDuration(0, 24 * hour), true);
  assert.equal(isWithinMaxDuration(0, 24 * hour + 1), false);
  assert.equal(isWithinMaxDuration(0, 0), false);
});

test('room expiry is strict at the end timestamp', () => {
  assert.equal(isRoomActive(100, 99), true);
  assert.equal(isRoomActive(100, 100), false);
});

test('expired rooms stay readable only during the short archive window', () => {
  assert.equal(isRoomInArchive(100, 100), true);
  assert.equal(isRoomInArchive(100, 100 + 2 * hour - 1), true);
  assert.equal(isRoomInArchive(100, 100 + 2 * hour), false);
  assert.equal(isRoomInArchive(101, 100), false);
});

test('audience visibility respects selected people and circle membership', () => {
  assert.equal(audienceIncludes({ audience: 'everyone', viewerId: 'friend' }), true);
  assert.equal(audienceIncludes({ audience: 'people', viewerId: 'friend', selectedProfileIds: ['friend'] }), true);
  assert.equal(audienceIncludes({ audience: 'people', viewerId: 'other', selectedProfileIds: ['friend'] }), false);
  assert.equal(audienceIncludes({ audience: 'circle', viewerId: 'friend', circleMemberIds: ['friend'] }), true);
  assert.equal(audienceIncludes({ audience: 'circle', viewerId: 'other', circleMemberIds: ['friend'] }), false);
});

test('availability messages stay open through the two-hour grace period', () => {
  assert.equal(canMessageAvailability({ expiresAt: 100, allowMessages: true, now: 100 + 2 * hour - 1 }), true);
  assert.equal(canMessageAvailability({ expiresAt: 100, allowMessages: true, now: 100 + 2 * hour }), false);
  assert.equal(canMessageAvailability({ expiresAt: 100, allowMessages: false, now: 100 }), false);
});

test('until tonight expires at the end of the current day', () => {
  const late = new Date(2026, 7, 29, 23, 30, 0, 0).getTime();
  const duration = availabilityDurationMs('until tonight', late);
  const endOfDay = new Date(2026, 7, 29, 23, 59, 59, 999).getTime();
  assert.equal(late + duration, endOfDay);
  assert.ok(duration < hour);
});

test('custom availability keeps decimal-hour durations', () => {
  const start = new Date(2026, 7, 29, 18, 0, 0, 0).getTime();
  assert.equal(availabilityDurationMs('0.5h', start), 30 * 60 * 1000);
});

test('remaining availability rounds up without showing stale zero time', () => {
  const start = Date.now();
  assert.equal(formatRemainingDuration(start + 61 * 60 * 1000, start), '1h left');
  assert.equal(formatRemainingDuration(start + 1, start), '1m left');
});

test('invite permission always allows the creator and optionally participants', () => {
  assert.equal(canInviteToRoom('creator', 'creator', false), true);
  assert.equal(canInviteToRoom('creator', 'friend', true), true);
  assert.equal(canInviteToRoom('creator', 'friend', false), false);
});

test('room invite candidates exclude the viewer, members, and duplicate invites', () => {
  assert.deepEqual(
    filterInvitableFriendIds(['viewer', 'member', 'new-friend', 'already-invited', 'new-friend'], 'viewer', ['member'], ['already-invited']),
    ['new-friend'],
  );
});

test('custom room times use a strict 24-hour clock format', () => {
  assert.equal(isValidClockTime('18:30'), true);
  assert.equal(isValidClockTime('7:05'), true);
  assert.equal(isValidClockTime('24:00'), false);
  assert.equal(isValidClockTime('18:60'), false);
  assert.equal(isValidClockTime('tonight'), false);
});
