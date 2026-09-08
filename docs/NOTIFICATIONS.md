# Notifications

Push is selective and deep-links to the relevant context.

The in-app Activity tab is the lightweight home for actionable room and availability signals. It should stay sparse, link back to the relevant room or Rooms surface, and never become a permanent social inbox.

Examples: “Max is free for the next 3h.”, “Coffee in 20?”, “Sarah opened a room.”, “Jonas said Yeb!”, “Plans changed.”, “Drinks moved to 18:30.”

Do not notify on every passive state change or create engagement pressure. Store push tokens per device, group or coalesce updates where possible, and add user controls before broadening notification volume.

`src/lib/notifications/register.ts` requests permissions only on a physical device and returns the Expo push token for persistence in `push_tokens`. Notification payloads should carry a route such as `/room/[id]` so the response can deep-link into context.

The You tab exposes local controls for availability, room/invite, and room-chat notifications. These preferences are persisted on-device and are a client-side opt-in layer for the future push delivery worker; they do not replace server-side authorization or notification targeting. Push permission is requested only after the user taps “Enable” in You → Notifications. A physical EAS development, preview, or production build must be installed first; web and Expo Go do not provide the app identity required for Expo push tokens. Once the app is linked to an EAS project, a granted device token is persisted to `push_tokens` for the signed-in user.
