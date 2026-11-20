# Design system

## Foundation

- Dark and light mode. `src/design/tokens.ts` holds one palette per mode with the same role names; components read colors through `useTheme()` and build style sheets with `useThemedStyles(makeStyles)`, never from a fixed import. The mode follows the system by default and can be set to Auto, Light, or Dark under You → Appearance (stored on the device).
- The look is “stickers and color blocks”: flat saturated fills, a solid outline and a hard offset shadow (`sticker(colors)`), no blur, glass or soft glow. Titles, section heads and buttons use the round display face Fredoka Bold (`display` in tokens, loaded in the root layout); body text stays the system sans at 13–16px.
- Surfaces: warm cream canvas in light and warm dark brown in dark, white or dark sticker cards, and full activity-color blocks for rooms. Text on an activity color or on lime is always `onColor` (near-black) in both modes.
- Activities are emoji on a white, outlined, slightly rotated sticker (`ActivityIcon`). Free friends are avatar stickers with a white rim, alternately tilted a few degrees.
- Home opens on your own status: a card with a one-tap “I’m free” (3 hours, all friends) and an options button for times and audience; once free, the card shows the state with Change and End. Below it, free friends appear as a horizontal row of faces (solid ring and dot = free now, dashed ring = free later), then rooms. Room creation lives in the Open tab action; the empty rooms state may offer it once.
- The bottom bar has three destinations: Home, centered Open, and Friends. Profile and settings open from the avatar at the top of Home. There is no Activity tab; in-app signals live on Home until push notifications exist.
- Rooms use `RoomRow` in a short vertical list so several are visible at once: a block in the activity color with the emoji sticker, title, time (with a “Now” pill while running), place, who is in, and a black Yeb button with lime text that reads the same on every color. It is a list of what is open right now, never an infinite feed.
- Friends uses a lightweight invite prompt, people summary, and horizontal circle rail; keep the invite state inline and quiet on the shared canvas.
- People avatars use bright solid fills with dark initials and the sticker outline.
- Room detail is intentionally editorial: a left-weighted activity header, one clear primary state, and transparent People/Suggestions/Chat sections separated by rhythm rather than repeated containers.
- Radii: cards 20px, sheets 30px, buttons 14px, chips 999px, sticker icons and avatars fully round.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.

## Semantic color roles

- `canvas`: the app background, warm cream `#FFF6E5` in light and warm dark `#211D19` in dark.
- `surface`: sticker cards, white in light and `#2E2924` in dark. `outline` is the sticker edge and hard shadow color; `paper` is the white a sticker is cut from.
- `ink`: soft near-white primary text.
- `muted`: readable cool gray secondary text.
- `brand`: acid lime for primary action fills and active state. Use `brandText` when the brand color is text or an icon on the canvas: it is lime in dark mode and a dark green in light mode so it stays readable.
- `electric`, `violet`, `sky`, and `coral`: small expressive accents used to distinguish activity without recoloring entire cards.
- The `glass*` roles remain as solid fallbacks for older code; do not add new glass or blur surfaces.
- Activities: coffee amber, drinks coral, food orange, gaming violet, walk cyan, gym green, hangout blue, custom sand, availability lime. They are fills, not text colors.
- Never use color alone to communicate state.

## Components

`Screen`, `YText`, `Button`, `IconButton`, `Card`, `RoomCard`, `AvailabilityCard`, `PersonRow`, `ActivityIcon`, `InitialAvatar`, `Chip`, `SegmentedControl`, `Sheet`, `EmptyState`, `YebButton`, `FloatingTabBar`.

## Interaction rules

- Buttons are stickers: on press they move into their own shadow (the shadow disappears) instead of shrinking; primary actions receive light haptics.
- Yeb uses medium/light haptic, a short spring, label change, and participant entrance. Joining or opening a room also plays `YebBurst`: one ring and a few activity-colored sparks, under 500ms, skipped with reduced motion.
- Room creation uses a success haptic and visible insertion into Home.
- Keep the canvas visually quiet until a live signal, room, or response creates a reason for color and motion.
- Keep the home list short and scannable; let the activity icon and color distinguish rows.
- The free friends row scrolls horizontally; never make swiping the only way to reach a core action.
- The floating tab bar is a solid sticker with outline and hard shadow.
- A room row can be dragged right to Yeb: it reveals the Yeb mark, catches with a haptic tick at the join point and springs back. The Yeb button stays, so the gesture is never the only way.
- Home blocks use `StretchOnScroll`: while a block crosses the top edge or the tab bar it stretches in the scroll direction, blurs, dims and fades, tied directly to the finger. Amounts live in `motion.stretch`. It is off with reduced motion.
- Motion is 100–180ms for feedback, 200–350ms for transitions, 300–500ms for celebration. Respect reduced motion.

## Accessibility

Minimum touch target 44px. Every icon button has an accessibility label. Contrast target is WCAG AA. Dynamic type must not hide essential actions. Status includes text, not only color.
