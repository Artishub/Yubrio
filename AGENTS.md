# Yubrio workspace guide

This file routes work across the product specification. Read the relevant document before changing that area; keep the MVP small, calm, and friend-centered.

## Product truth

- `PRODUCT.md` — durable product purpose, users, constraints, and assumptions.
- `docs/MVP_SCOPE.md` — what belongs in P0/P1/P2; verify new features here.

## Routing

- UI, design, motion, accessibility → `docs/DESIGN_SYSTEM.md` + `docs/UX_PRINCIPLES.md`
- Home, empty states, navigation → `docs/USER_FLOWS.md` + `docs/DESIGN_SYSTEM.md`
- Rooms and room lifecycle → `docs/ROOMS.md`
- “I’m free” and expiry → `docs/AVAILABILITY.md`
- Friends, QR, circles, audiences → `docs/FRIENDS_AND_CIRCLES.md`
- Temporary conversations and room chat → `docs/MESSAGING.md`
- Push and in-app alerts → `docs/NOTIFICATIONS.md`
- Database, RLS, realtime → `docs/DATA_MODEL.md`
- Expo, Supabase, query/state architecture → `docs/TECH_STACK.md`
- Any new feature → re-check `docs/MVP_SCOPE.md` first

## Working rules

- Prefer feature-oriented code under `src/`; keep copy centralized.
- Treat friendships as reciprocal; never add public stranger discovery or a feed.
- Use design tokens instead of raw colors, radii, and magic numbers.
- Keep demo mode usable when Supabase is not configured.
- After meaningful work: run `npm run typecheck`, `npm run lint`, and manually verify the core flows on a narrow mobile viewport.

