Summary of changes for Expo/Metro and web fixes

- Fixes applied:
  - `metro.config.js`: Added resolver hook to resolve `zod/v4` imports and preserved `withRorkMetro` integration.
  - `app/ai-transform.tsx`: Replaced static `expo-media-library` import with a lazy dynamic import on native-only code paths to avoid web native-module errors.
  - `package.json`: Aligned `expo-router` and related Expo packages to Expo SDK 56 (dependency upgrades and reinstall performed).

- Scan results (flagged Expo imports that may need platform guards or lazy-loading):
  - `app/ai-chat.tsx`: `expo-image-picker`, `expo-linear-gradient`
  - `app/ai-transform.tsx`: `expo-image-picker`, `expo-image`, `expo-linear-gradient` (media-library now dynamically imported)
  - `app/profile.tsx`: `expo-image-picker`, `expo-image`, `expo-linear-gradient`
  - `app/booking.tsx`, `app/budget-engine.tsx`, `app/home.tsx`, `app/my-events.tsx`, `app/events.tsx`, `app/event-detail.tsx`, `app/vendor-detail.tsx`, `components/GradientButton.tsx`, `components/ScreenFrame.tsx`: `expo-linear-gradient`, `expo-image`

- Recommendations / next steps:
  1. Replace any remaining static imports of native-only modules (e.g., `expo-media-library`, `expo-file-system`, `expo-sharing`, `expo-camera`) with dynamic imports or `Platform` guards so web builds don't try to load native modules.
  2. For modules that have official web support (e.g., `expo-image`, `expo-image-picker` has a web fallback), prefer their web-friendly APIs or add runtime checks before using native-only APIs like saving to device gallery.
  3. Consider adding simple web polyfills or Metro resolver aliases to map native-only modules to lightweight web stubs if you need to keep the same code paths.
  4. Run `npx expo install --check` and apply recommended minor version fixes flagged by Expo tooling.

- Files edited during this pass:
  - `metro.config.js`
  - `app/ai-transform.tsx`
  - `package.json` (dependencies updated, `node_modules` reinstalled)

If you want, I can open a branch, commit these changes and create a PR with this summary. Or I can start replacing the static `expo-image-picker` imports with lazy imports where appropriate. Which should I do next?