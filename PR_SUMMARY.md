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

--

Additional updates included in this PR (branch `fix/web-lazy-native-imports`):

- Dependency upgrades and verification:
  - Ran `npx expo install --check` and installed recommended SDK 56 compatible versions for packages including `react`, `react-dom`, `react-native`, `expo-image-picker`, and related Expo packages. Installs were performed using `npm install --legacy-peer-deps` to avoid bun on Windows.
  - Verified `expo-router` and `@expo/router-server` align to Expo SDK 56 compatible versions.

- Web shim for `expo-media-library`:
  - Added `web-shims/expo-media-library.js` (a lightweight no-op fallback) and updated `metro.config.js` to resolve `expo-media-library` to the shim when bundling for web. This prevents runtime errors like "Cannot find native module 'ExpoMediaLibraryNext'" during web builds.

- Test fixes:
  - Fixed unit tests in `__tests__/validation.test.ts` by importing Vitest globals (`describe`, `it`, `expect`) and removing an accidental export. All tests now pass locally (26 passed).

- Commits in this PR:
  - `chore(web): lazy-load native-only Expo modules for web compatibility` — lazy-loaded `expo-image-picker` and ensured `expo-media-library` is dynamically imported.
  - `chore: add web shim for expo-media-library and resolve in metro.config.js` — added shim and resolver mapping.
  - `test: fix vitest globals and remove accidental export in validation tests` — test fixes.

Validation performed locally:
1. Cleaned `node_modules` and `package-lock.json`, installed dependencies with `npm install --legacy-peer-deps`.
2. Ran `npx expo install --check` and applied recommended package updates.
3. Started the Expo web dev server with `npx expo start --web --clear` to validate bundling; resolved the `zod/v4` and `expo-media-library` errors by the resolver and shim.
4. Ran `npm test` (Vitest) — all tests passed locally.

Next actions I can take now (pick one):
- Run the app flows in the browser and report runtime behavior for AI Chat, Profile avatar upload, and AI Transform save/download.
- Update the GitHub PR description/body with this expanded summary. (I can paste the updated PR body here for you to copy, or I can update the PR directly if you provide a GitHub token with repo write access.)
- Continue replacing other static native-only imports with lazy imports or shims.