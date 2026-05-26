# Skinshi Mobile

Expo Router React Native app for Skinshi.

## What This App Is

- Mobile companion to the web app.
- Uses Expo Router for navigation.
- Uses NativeWind for styling.
- Talks to shared tRPC/API packages in the monorepo.

## Important Setup Notes

- Entry point is `expo-router/entry` in `package.json`.
- Global styles are imported from `app/_layout.tsx`.
- The app uses a custom Babel config for Expo + NativeWind.
- Firebase Auth uses React Native persistence via AsyncStorage.
- Expo `scheme` is set in `app.json` for Linking and production builds.

## Main Folders

- `app/` route files and layouts
- `src/components/` shared UI pieces
- `src/context/` app state/providers
- `src/lib/` Firebase and tRPC setup

## Navigation

- `app/_layout.tsx` sets up providers and the root stack.
- `app/(tabs)/_layout.tsx` defines the bottom tabs.
- Tabs are icon-only.

## UI Rules

- Match the dark web theme, but keep layouts mobile-first.
- Prefer card-based layouts over dense list rows.
- Use real Steam case art and profile images where available.
- Inventory and bet pool cards should show the item image above the name.

## Image Loading

- Steam inventory `icon_url` values are partial paths.
- Use the shared `RemoteImage` component in `src/components/RemoteImage.tsx`.
- It normalizes Steam image URLs and falls back to a placeholder.

## Firebase

- Auth is initialized in `src/lib/firebase.ts`.
- Persistence should stay enabled with `@react-native-async-storage/async-storage`.

## Useful Scripts

- `pnpm dev` - start Expo
- `pnpm ios` - start iOS
- `pnpm android` - start Android
- `pnpm web` - start web
- `pnpm lint` - lint the app
- `pnpm typecheck` - TypeScript check
- `pnpm build` - Expo export

## Common Gotchas

- Don’t add Babel plugins under `plugins` if they are actually presets.
- Don’t hardcode image URLs without checking whether the API returns a path fragment.
- Don’t use text labels in the bottom tabs.
- Keep back button titles intentional on nested screens.

## Design Direction

- The web app is the source of truth for branding and hierarchy.
- Mobile should feel like the same product, not a separate theme.
- Favor compact, readable cards and touch-friendly spacing.
