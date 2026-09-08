# Technical stack

- Expo managed/CNG, React Native, TypeScript, Expo Router.
- Supabase Auth, PostgreSQL, Realtime, and generated typed client.
- TanStack Query for server state; Zustand only for small global UI state.
- Zod for input and API validation.
- Reanimated + Gesture Handler for motion/gestures; Expo Haptics for tactile feedback; Expo Notifications for push; Expo GlassEffect/Blur where appropriate. Native Liquid Glass is capability-gated to iOS 26+ and falls back safely elsewhere.
- EAS Build and EAS Update; prefer physical iPhone testing with development builds and cloud native builds on an 8 GB M1 Mac.
- `expo-camera` is used only for scanning Yubrio friend QR links; camera access is requested at the scanner, not at app launch.

## Structure

`app/` routes; `src/components/` primitives and Yubrio UI; `src/features/` home, rooms, availability, friends, messaging; `src/design/` tokens/typography/motion; `src/lib/` Supabase/query/validation; `src/stores/`; `src/types/`; `src/utils/`.

## Runtime modes

When Supabase env vars are absent, use seeded local demo state with the same domain types and mutations. Keep backend adapters behind feature hooks so the UI does not know whether data is local or remote.

When Supabase is configured, demo records are never rendered while the first home query is loading or has failed; the UI stays calm and offers retry instead.

`src/lib/supabase/repositories.ts` is the remote adapter for session lookup, visible rooms/availability, room creation/join/leave, availability publishing, and contextual messages. Multi-table room, availability, and circle writes use authenticated `SECURITY INVOKER` database functions so partial parent/audience writes cannot leak through a failed request. `src/lib/supabase/realtime.ts` scopes subscriptions to the currently open room and removes the channel on cleanup.

When Supabase is configured, `AuthProvider` gates the app behind passwordless email sign-in, uses PKCE, and persists sessions with native AsyncStorage. `app/auth/callback.tsx` exchanges the callback code and handles the configured deep link. Keep the redirect URL in `src/config/links.ts` and Supabase Auth’s allow-list.
