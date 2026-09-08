# Design system

## Foundation

- Dark-first mobile UI with a composed light-mode structure ready for later theming.
- System sans for platform readability; confident 30–34px titles, 15–17px body, 11–13px metadata.
- Surfaces: deep ink canvas, quiet charcoal structure, sparse activity color fields, and restrained dark glass for floating/live surfaces.
- On iOS 26+ builds, `GlassBackdrop` uses Expo's native `GlassView`; web, Android, and older iOS use the existing blur/frosted fallback. Keep glass to floating navigation, live cards, and contextual surfaces rather than applying it to every panel.
- Rooms opens directly on a live signal board: “See who is available” is the headline, “I’m free” is the primary in-content action, and room creation lives in the dedicated Open tab action. Use activity icons, status marks, and the tab action for energy; avoid duplicate room-creation buttons, orbital bubbles, oversized circles, decorative fields, or noise.
- The bottom bar has five destinations: Rooms, Friends, centered Open, Activity, and You. Activity is a compact signal tray for actionable updates, never an infinite feed or permanent Messages inbox.
- Active rooms use `RoomMomentCard` in a horizontal, paged deck. Use the deck for discovery and the room route for detail; do not turn it into an infinite feed. Keep the surface neutral and let the activity icon, status mark, and a restrained accent rail carry the distinction.
- Friends uses a lightweight invite prompt, people summary, and horizontal circle rail; keep the invite state inline and quiet on the shared canvas.
- People avatars use bright solid fills with dark initials for quick recognition against the dark canvas.
- Room detail is intentionally editorial: a left-weighted activity header, one clear primary state, and transparent People/Suggestions/Chat sections separated by rhythm rather than repeated containers.
- Radii: cards 20px, sheets 30px, buttons 14px, icon containers 14px, semantic chips 999px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.

## Semantic color roles

- `canvas`: `#090B0D`, the ink-black app background.
- `surface`: `#14191D`, the quiet elevated charcoal surface.
- `ink`: soft near-white primary text.
- `muted`: readable cool gray secondary text.
- `brand`: acid lime for primary action and active state.
- `electric`, `violet`, `sky`, and `coral`: small expressive accents used to distinguish activity without recoloring entire cards.
- `glassSurface`, `glassBorder`, and `glassHighlight`: translucent dark material roles used for the floating tab bar, live availability, and active room cards. Glass should clarify layering and state, not decorate every surface.
- Activities: coffee amber, drinks coral, food tomato, gaming violet, walk sky, gym green, hangout blue, custom slate, availability lime.
- Never use color alone to communicate state.

## Components

`Screen`, `YText`, `Button`, `IconButton`, `Card`, `RoomCard`, `AvailabilityCard`, `PersonRow`, `ActivityIcon`, `InitialAvatar`, `Chip`, `SegmentedControl`, `Sheet`, `EmptyState`, `YebButton`, `FloatingTabBar`.

## Interaction rules

- Buttons compress slightly on press; primary actions receive light haptics.
- Yeb uses medium/light haptic, a short spring, label change, and participant entrance.
- Room creation uses a success haptic and visible insertion into Home.
- Keep the canvas visually quiet until a live signal, room, or response creates a reason for color and motion.
- Use spatial grouping and horizontal room moments to break list rhythm; avoid stacking several rounded rectangles with identical weight.
- Horizontal room decks use native paging/swipe behavior with visible position dots; never make swiping the only way to reach a core action.
- Use blur/material behind floating controls and live surfaces when supported; keep a coherent opaque fallback for web and older platforms. Prefer one material treatment per visual group and preserve readable contrast.
- Motion is 100–180ms for feedback, 200–350ms for transitions, 300–500ms for celebration. Respect reduced motion.

## Accessibility

Minimum touch target 44px. Every icon button has an accessibility label. Contrast target is WCAG AA. Dynamic type must not hide essential actions. Status includes text, not only color.
