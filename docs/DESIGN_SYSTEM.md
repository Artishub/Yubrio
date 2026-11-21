# Design system

## Foundation

- Two modes, chosen under You → Appearance and stored on the device: **Dark** (the default, whatever the system setting) and **Glass**, a brighter mode. There is no plain light mode. `src/design/tokens.ts` holds one palette per mode with the same role names plus `material` (`sticker` or `glass`); components read colors through `useTheme()` and build style sheets with `useThemedStyles(makeStyles)`, never from a fixed import.
- Dark mode is “stickers and color blocks”: flat saturated fills, a solid outline and a hard offset shadow. Glass mode keeps the same layout but turns every card and button into a translucent pane with a light rim and soft shadow over a pastel light backdrop (`Backdrop`). Both come from the one `sticker(colors)` helper, so a component never checks the mode itself. Titles, section heads and buttons use the round display face Fredoka Bold (`display` in tokens, loaded in the root layout); body text stays the system sans at 13–16px.
- Surfaces: warm dark brown canvas with dark sticker cards in Dark; translucent white panes in Glass. Rooms are blocks in their activity color: deep, muted tones in Dark and lightly tinted glass in Glass. Keep contrast calm: lime is reserved for primary buttons, the join button and the “Now” pill, never for whole cards. Text on an activity color is `onColor` (cream in Dark, near-black in Glass); text on lime is `brandInk`.
- Activities are emoji on a white, outlined, slightly rotated sticker (`ActivityIcon`). Free friends are avatar stickers with a white rim, alternately tilted a few degrees.
- Home opens on your own status: a card with a one-tap “I’m free” (3 hours, all friends) and an options button for times and audience; once free, the card shows the state with Change and End. Below it, free friends appear as a horizontal row of faces (solid ring and dot = free now, dashed ring = free later), then rooms. Room creation lives in the Open tab action; the empty rooms state may offer it once.
- The bottom bar has three destinations: Home, centered Open, and Friends. Profile and settings open from the avatar at the top of Home. There is no Activity tab; in-app signals live on Home until push notifications exist.
- Rooms use `RoomRow` in a short vertical list so several are visible at once: a block in the activity color with the emoji sticker, title, time (with a “Now” pill while running), place, who is in, and a lime join button. It is a list of what is open right now, never an infinite feed.
- Friends uses a lightweight invite prompt, people summary, and horizontal circle rail; keep the invite state inline and quiet on the shared canvas.
- People avatars use bright solid fills with dark initials and the sticker outline.
- Room detail is intentionally editorial: a left-weighted activity header, one clear primary state, and transparent People/Suggestions/Chat sections separated by rhythm rather than repeated containers.
- Radii: cards 20px, sheets 30px, buttons 14px, chips 999px, sticker icons and avatars fully round.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.

## Semantic color roles

- `canvas`: the app background, warm dark `#211D19` in Dark and a pale blue-grey under the backdrop in Glass.
- `surface`: cards, `#2E2924` in Dark and translucent white in Glass. `outline` is the card edge (black in Dark, a white rim in Glass); `paper` is the white a sticker is cut from.
- `ink`: soft near-white primary text.
- `muted`: readable cool gray secondary text.
- `brand`: acid lime for primary action fills and active state. Use `brandText` when the brand color is text or an icon on the canvas: it is lime in dark mode and a dark green in light mode so it stays readable.
- `electric`, `violet`, `sky`, and `coral`: small expressive accents used to distinguish activity without recoloring entire cards.
- The `glass*` roles feed `GlassBackdrop`, which is used only behind the tab bar in Glass mode (native Liquid Glass on iOS 26+, blur elsewhere). On web the panes also blur what is behind them; on native they are translucent without blur.
- Activities: coffee amber, drinks brick, food rust, gaming violet, walk teal, gym green, hangout blue, custom taupe, availability olive. They are fills, not text colors.
- Never use color alone to communicate state.

## Components

`Screen`, `YText`, `Button`, `IconButton`, `Card`, `RoomCard`, `AvailabilityCard`, `PersonRow`, `ActivityIcon`, `InitialAvatar`, `Chip`, `SegmentedControl`, `Sheet`, `EmptyState`, `JoinButton`, `FloatingTabBar`.

## Interaction rules

- Buttons are stickers: on press they move into their own shadow (the shadow disappears) instead of shrinking; primary actions receive light haptics.
- Joining uses medium/light haptic, a short spring, label change, and participant entrance. Joining or opening a room also plays `JoinBurst`: one ring and a few activity-colored sparks, under 500ms, skipped with reduced motion.
- Room creation uses a success haptic and visible insertion into Home.
- Keep the canvas visually quiet until a live signal, room, or response creates a reason for color and motion.
- Keep the home list short and scannable; let the activity icon and color distinguish rows.
- The free friends row scrolls horizontally; never make swiping the only way to reach a core action.
- The floating tab bar is a solid sticker in Dark and a glass pane in Glass.
- A room row can be dragged right to join: it reveals the join mark, catches with a haptic tick at the join point and springs back. The join button stays, so the gesture is never the only way.
- Home blocks use `StretchOnScroll`: while a block crosses the top edge or the tab bar it stretches in the scroll direction, blurs, dims and fades, tied directly to the finger. Amounts live in `motion.stretch`. It is off with reduced motion.
- Motion is 100–180ms for feedback, 200–350ms for transitions, 300–500ms for celebration. Respect reduced motion.

## Accessibility

Minimum touch target 44px. Every icon button has an accessibility label. Contrast target is WCAG AA. Dynamic type must not hide essential actions. Status includes text, not only color.
