# Data model and authorization

## Core tables

`profiles`, `friendships`, `friend_links`, `circles`, `circle_members`, `availability`, `availability_audiences`, `rooms`, `room_audiences`, `room_members`, `room_invites`, `room_suggestions`, `room_messages`, `availability_conversations`, `availability_messages`, `games`, `user_game_profiles`, `push_tokens`, `notifications`.

Use UUID primary keys, `created_at`/`updated_at`, server-owned timestamps, and unique constraints for reciprocal friendships, room membership, and availability conversation pairs. Store room start/end explicitly; validate end-start ≤ 24h.

## RLS rules

- Profiles: readable only to accepted friends, the current user, or the other participant in a pending friendship request, with minimal fields.
- Friendships: participants can read/update their own relationships.
- Circles and circle members: owner only.
- Availability: author plus accepted friends included by `availability_audiences` (everyone, private circles, or selected people); message writes only when the viewer is actually included, `allow_messages` is enabled, and the availability is within the two-hour grace period.
- Rooms: creator, accepted friends included by room audience, and current members; mutations follow creator/participant invite rules.
- Direct room invitees can read the invited room for its active period and short archive window, even when the original audience did not include them; this is checked by `private.can_view_room`, never by client-side filtering.
- Room members/messages/suggestions: active participants and eligible creator/room audience users.
- Push tokens/notifications: current user only.
- Friend links: direct table access is revoked; the signed-in owner creates a token and a narrow resolver returns only the shared profile preview. Direct friendship inserts/updates are revoked; requests go through `request_friend_by_link`, and incoming requests are handled by `respond_to_friend_request`, preserving reciprocal `pending`/`accepted`/`blocked` behavior.

Complex audience checks use private, narrowly scoped database helpers so private circle membership is not exposed through nested API reads. Document policies beside migrations and test them with an authenticated and unauthorized role. Never rely on client-side filtering.

Migration `0007_realtime_publication.sql` adds only the room, availability, friendship, circle, and contextual-message tables needed by active screens to the `supabase_realtime` publication. Home and Friends subscribe only to the current user’s relevant contexts; RLS remains the privacy boundary.

Migration `0008_atomic_mutations.sql` exposes three authenticated, `SECURITY INVOKER` RPCs: `create_circle_atomic`, `create_room_atomic`, and `publish_availability_atomic`. Each keeps its parent row, audience rows, and initial membership in one transaction while preserving the caller's RLS policies.

Migration `0009_atomic_mutation_authorization.sql` re-checks accepted-friend and circle-owner boundaries inside those RPCs. Migration `0011_tighten_availability_messaging.sql` applies the same audience boundary to contextual conversation creation and message inserts. Migration `0012_invited_room_visibility.sql` lets direct invitees discover private rooms within the active and short archive window. Migration `0013_realtime_room_invites.sql` adds only direct room invitations to the Realtime publication. Apply migrations 0001–0013 in order in the configured Yubrio Supabase project.
