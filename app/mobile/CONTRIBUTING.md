# Mobile Contribution Checklist

Before changing `app/mobile`:

- Read `README.md` first.
- Keep `package.json` `main` set to `expo-router/entry`.
- Keep global CSS imported from `app/_layout.tsx`.
- Use `src/components/RemoteImage.tsx` for Steam images and inventory art.
- Keep bottom tabs icon-only.
- Match the dark, card-based mobile style used across the app.
- Run `pnpm typecheck` after edits.
- Avoid adding new dependencies unless they solve a real problem.
- Keep Expo `scheme` in `app.json`.
