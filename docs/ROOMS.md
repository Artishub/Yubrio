# Rooms

Rooms are temporary, activity-centered social spaces. They expire after their end time and never become permanent groups.

## Creation

One sheet. What (activity and optional name) and When (start as “Now” or a half-hour slot, plus a duration up to 24h) are always visible and have defaults, so “Open room” works immediately. Where (in person/online/undecided with place, game and link) and Who sees it (friends/circles/specific people, chat on by default, participant invites on/off) are fold-out rows that show the current choice. Choosing Gaming switches Where to Online and opens it. Times are picked from chips, never typed. The common path should take a few seconds.

## Detail

Show activity icon/title, scheduled time or remaining time, location/connection, then People, Suggestions and Chat. Once the viewer has joined, Chat moves above People because it is what they use. Primary state is “I’m in!”; joined state is “You’re in.” Creator appears as “Created room”, not host/admin/owner.

Gaming stays an activity type. For online gaming rooms, creation can optionally capture a game, mode, and flexible join details such as a username, Discord, server, or link. These are displayed as compact connection details rather than creating permanent game communities. A link in the details gets an Open button once the viewer has joined. A gaming room without a name is titled after its game.

## Joining later

“In, but later” supports 30 min, 1 hour, or custom arrival. Show arrival timing in the participant list; joining remains immediate.

## Inviting

When the creator enables participant invites, joined participants see an Invite action and can invite only their accepted Roomhop friends. Invites are private and never expose a room publicly.

An invited friend can see that room even when they were not part of its original audience. That access is limited to the room and its short two-hour archive window; joining still requires the normal room membership policy.

## Lifecycle decisions

- Maximum duration 24h; server validates start/end.
- Creator can leave. The room continues if participants remain; creator-only settings become immutable until ownership transfer exists.
- Duplicate room membership is prevented by a unique constraint.
- Expired rooms leave active Home and become read-only archive context for two hours by default.
- Time/location changes notify joined participants and update in realtime for the active room only.
