# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary users are people who already know one another and want to spend more time together spontaneously. They open Yubrio when they may be free, are looking for a low-pressure plan, or want to see which friends are available now.

## Product Purpose

Yubrio is a lightweight social availability layer: friends can say “I’m free”, open a temporary room around an activity, and respond with “Yeb!”. Success means the app helps friends make a real plan quickly, then gets out of the way.

## Positioning

Yubrio makes ephemeral availability visible between existing friends without becoming a feed, permanent inbox, event planner, community server, dating app, or nearby-stranger network.

## Operating Context

Mobile-first, usually used in short bursts during the day or before an evening plan. The user may have one hand free and little patience for forms. The first release should feel excellent on iPhone and remain safe and legible on Android.

## Capabilities and Constraints

- Temporary rooms: activity, time (maximum 24 hours), place/online details, audience, chat, and invite permission.
- Temporary “I’m free” availability with duration, audience, optional note, and optional messages.
- Immediate joining with “Yeb!” and “Yeb, but later”.
- Reciprocal friendships, private circles, contextual room/availability messaging, and realistic demo seed data.
- Supabase Auth/Postgres/Realtime are the target backend. Demo-first local state is the fallback when credentials are absent.
- No public discovery, permanent rooms, follower model, streaks, popularity counts, or infinite feed.

## Brand Commitments

The name is Yubrio. The signature positive response is “Yeb!” (ending in B). Brand behavior is calm by default and vibrant when friends become available or participate. Personality is friendly, tactile, expressive, and concise without becoming childish.

## Evidence on Hand

The master product and build prompt is the only supplied product evidence. Names, activities, and examples in the demo are synthetic and must not be presented as real users.

## Product Principles

1. Optimize for real time together, not time in the app.
2. Make spontaneous availability visible without making it performative.
3. Progressively disclose detail so common actions take seconds.
4. Keep privacy mutual and intentional; audiences control visibility.
5. Use delight to reinforce meaningful state changes, not to decorate every screen.

## Accessibility & Inclusion

Support dynamic type, screen readers, large touch targets, contrast, reduced motion, and color-independent status cues. Avoid requiring precise gestures for essential actions.

## Open decisions

- Exact auth providers and production domain are not configured yet.
- The first build assumes demo-first local fallback and adaptive mobile behavior based on the explicit brief.

