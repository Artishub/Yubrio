# Yubrio

Demo-first Expo Router MVP for making spontaneous time with friends easier.

## Run

```bash
npm install
npm start -- --clear
```

The default command targets the Yubrio development build. Use `npm run start:web` to preview the web fallback. Use a physical device with a development build for haptics and native behavior. On iOS 26+, the build also renders native Liquid Glass on selected surfaces; older iOS, Android, and web use the frosted fallback. The app starts with seeded local data when Supabase environment variables are absent.

## Test on iPhone

Yubrio targets Expo SDK 57. The App Store version of Expo Go currently supports SDK 54, so SDK 57 must be tested with a development build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform ios
```

If this is the first build, EAS may ask to create or link the Yubrio project. Accept that prompt; it adds the project identity needed for native push alerts. Expo Go cannot run this SDK 57 project reliably because the App Store client currently targets SDK 54.

If you installed the SDK 57 Expo Go build from [sign.expo.dev](https://sign.expo.dev), start Metro with:

```bash
npm run start:go -- --clear
```

Open the install link from EAS on the iPhone, then run Metro with:

```bash
npm start
```

## EAS Update

After the first EAS build, link updates to the EAS project once:

```bash
npx eas-cli@latest update:configure
```

Then publish JavaScript/UI changes without a new native build:

```bash
npx eas-cli@latest update --branch development --message "Describe the change"
# or publish to preview builds:
npx eas-cli@latest update --branch preview --message "Describe the change"
```

Install a new development build after native dependency or app-config changes; EAS Update is for JavaScript and bundled assets.

## Supabase

Copy `.env.example` to `.env`, add the project URL and anon key, then apply the migrations in `supabase/migrations/` in order. Add `yubrio://auth/callback` (or your configured redirect URL) to Supabase Auth’s allowed redirect URLs.

With Supabase configured, the app uses passwordless email sign-in and hydrates active rooms/availability from the remote adapter. Without it, the seeded local demo remains the default.

## Checks

```bash
npm run typecheck
npm run lint
npx expo export --platform web
npx expo install --check
```

For a native iPhone development build, run `eas build --profile development --platform ios`, install the build, then start Metro with `npx expo start --dev-client`.
