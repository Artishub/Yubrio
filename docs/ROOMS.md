# Rooms

Rooms are temporary, activity-centered social spaces. They expire after their end time and never become permanent groups.

## Creation

Progressive steps: What (preset/custom), When (start + duration, max 24h), Where (in person/online/undecided), Who (friends/circles/specific people), Options (chat on by default, participant invites on/off). The common path should take 10–20 seconds.

## Detail

Show activity icon/title, scheduled time or remaining time, location/connection, People, and Chat if enabled. Primary state is “Yeb!”; joined state is “You’re in.” Creator appears as “Created room”, not host/admin/owner.

Gaming stays an activity type. For online gaming rooms, creation can optionally capture a game, mode, and flexible join details such as a username, Discord, server, or link. These are displayed as compact connection details rather than creating permanent game communities.

## Joining later

“Yeb, but later” supports 30 min, 1 hour, or custom arrival. Show arrival timing in the participant list; joining remains immediate.

## Inviting

When the creator enables participant invites, joined participants see an Invite action and can invite only their accepted Yubrio friends. Invites are private and never expose a room publicly.

An invited friend can see that room even when they were not part of its original audience. That access is limited to the room and its short two-hour archive window; joining still requires the normal room membership policy.

## Lifecycle decisions

- Maximum duration 24h; server validates start/end.
- Creator can leave. The room continues if participants remain; creator-only settings become immutable until ownership transfer exists.
- Duplicate room membership is prevented by a unique constraint.
- Expired rooms leave active Home and become read-only archive context for two hours by default.
- Time/location changes notify joined participants and update in realtime for the active room only.
