# Design system

## Foundation

- Dark and light mode. `src/design/tokens.ts` holds one palette per mode with the same role names; components read colors through `useTheme()` and build style sheets with `useThemedStyles(makeStyles)`, never from a fixed import. The mode follows the system by default and can be set to Auto, Light, or Dark under You → Appearance (stored on the device).
- System sans for platform readability; confident 30–34px titles, 15–17px body, 11–13px metadata.
- Surfaces: deep ink canvas, quiet charcoal structure, sparse activity color fields, and restrained dark glass for floating/live surfaces.
- On iOS 26+ builds, `GlassBackdrop` uses Expo's native `GlassView`; web, Android, and older iOS use the existing blur/frosted fallback. Keep glass to floating navigation, live cards, and contextual surfaces rather than applying it to every panel.
- Home opens on your own status: a card with a one-tap “I’m free” (3 hours, all friends) and an options button for times and audience; once free, the card shows the state with Change and End. Below it, free friends appear as a horizontal row of faces (solid ring and dot = free now, dashed ring = free later), then rooms. Room creation lives in the Open tab action; the empty rooms state may offer it once.
- The bottom bar has three destinations: Home, centered Open, and Friends. Profile and settings open from the avatar at the top of Home. There is no Activity tab; in-app signals live on Home until push notifications exist.
- Rooms use `RoomRow` in a short vertical list so several are visible at once: activity icon, title, time (with a “Now” mark while running), place in the activity color, who is in, and a Yeb button. It is a list of what is open right now, never an infinite feed.
- Friends uses a lightweight invite prompt, people summary, and horizontal circle rail; keep the invite state inline and quiet on the shared canvas.
- People avatars use bright solid fills with dark initials for quick recognition against the dark canvas.
- Room detail is intentionally editorial: a left-weighted activity header, one clear primary state, and transparent People/Suggestions/Chat sections separated by rhythm rather than repeated containers.
- Radii: cards 20px, sheets 30px, buttons 14px, icon containers 14px, semantic chips 999px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.

## Semantic color roles

- `canvas`: the app background, ink-black `#090B0D` in dark and warm off-white `#F5F6F1` in light.
- `surface`: the quiet elevated surface, charcoal `#14191D` in dark and white in light.
- `ink`: soft near-white primary text.
- `muted`: readable cool gray secondary text.
- `brand`: acid lime for primary action fills and active state. Use `brandText` when the brand color is text or an icon on the canvas: it is lime in dark mode and a dark green in light mode so it stays readable.
- `electric`, `violet`, `sky`, and `coral`: small expressive accents used to distinguish activity without recoloring entire cards.
- `glassSurface`, `glassBorder`, and `glassHighlight`: translucent dark material roles used for the floating tab bar, live availability, and active room cards. Glass should clarify layering and state, not decorate every surface.
- Activities: coffee amber, drinks coral, food tomato, gaming violet, walk sky, gym green, hangout blue, custom slate, availability lime.
- Never use color alone to communicate state.

## Components

`Screen`, `YText`, `Button`, `IconButton`, `Card`, `RoomCard`, `AvailabilityCard`, `PersonRow`, `ActivityIcon`, `InitialAvatar`, `Chip`, `SegmentedControl`, `Sheet`, `EmptyState`, `YebButton`, `FloatingTabBar`.

## Interaction rules

- Buttons compress slightly on press; primary actions receive light haptics.
- Yeb uses medium/light haptic, a short spring, label change, and participant entrance. Joining or opening a room also plays `YebBurst`: one ring and a few activity-colored sparks, under 500ms, skipped with reduced motion.
- Room creation uses a success haptic and visible insertion into Home.
- Keep the canvas visually quiet until a live signal, room, or response creates a reason for color and motion.
- Keep the home list short and scannable; let the activity icon and color distinguish rows.
- The free friends row scrolls horizontally; never make swiping the only way to reach a core action.
- Use blur/material behind floating controls and live surfaces when supported; keep a coherent opaque fallback for web and older platforms. Prefer one material treatment per visual group and preserve readable contrast.
- A room row can be dragged right to Yeb: it reveals the Yeb mark, catches with a haptic tick at the join point and springs back. The Yeb button stays, so the gesture is never the only way. A room that is running has a thin border and soft glow in its activity color.
- Home blocks use `StretchOnScroll`: while a block crosses the top edge or the tab bar it stretches in the scroll direction, blurs, dims and fades, tied directly to the finger. Amounts live in `motion.stretch`. It is off with reduced motion.
- Motion is 100–180ms for feedback, 200–350ms for transitions, 300–500ms for celebration. Respect reduced motion.

## Accessibility

Minimum touch target 44px. Every icon button has an accessibility label. Contrast target is WCAG AA. Dynamic type must not hide essential actions. Status includes text, not only color.
