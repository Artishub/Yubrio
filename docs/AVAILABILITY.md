# Availability

“I’m free” is a temporary presence signal without an activity requirement.

## Publish

Choose when: “Now” with a duration (1h, 3h, 6h, Today), or a start from half-hour chips with an end chosen the same way (for example 09:00–17:00); nothing is typed. A window that has not started yet is shown to friends as “Free 09:00–17:00” without the live status dot; once it starts it behaves like any other availability. Time windows currently work in demo mode only; the Supabase path stores the end time alone.

## Visibility and expiry

Only targeted friends can read the availability, and only those friends can message when messaging is enabled. Availability expires at `expires_at`; an associated conversation becomes inactive after a 1–2 hour grace period. Expired signals are removed from active Home without embarrassment messaging.

## Live behavior

Use scoped realtime subscriptions for relevant friends’ availability. Insert new cards with a quiet opacity/position transition. Offline publishing may be optimistic with a recoverable retry state.

