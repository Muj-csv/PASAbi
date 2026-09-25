# Learning log

Devlog for FirstCommit. One entry per build phase.

## Phase 0 — Foundation (2026-09-25)

- **Scaffolded instead of guessing versions.** Ran `create-expo-app` into a temp directory and lifted the parts we needed, rather than hand-writing `package.json`. It pins a coherent set — Expo SDK 57, React 19.2.3, React Native 0.86.3, RN Web 0.21, TypeScript 6.0.3 — that we would have got subtly wrong by hand. Then deleted the template's example screens, components, hooks and demo assets instead of keeping them "for later".
- **Skipped npm workspaces.** `packages/core` and `packages/transport` are plain folders reached through tsconfig `paths`, which Metro resolves natively. No `watchFolders`, no hoisting surprises, one `npm install`. Worth revisiting only if a package ever needs to be published on its own.
- **The docs were wrong about layout, and the framework proved it.** We had specified `app/storage/` for the observation store, but `app/` is the Expo Router routes directory — every file in it becomes a route, so the store would have been served as a page. Routes moved to `src/app/`, non-route code to `src/`. A layout that reads fine on paper can be wrong the moment a real framework touches it.
- **Made core purity enforceable, then checked the enforcement.** `packages/core` must not import react/react-native/expo or touch the DOM. That is now an ESLint rule rather than a convention — and we verified it by adding a deliberate `import { Platform } from "react-native"`, confirming lint failed, and removing it. An unverified guard is not a guard.
- **Proved the alias end to end, not just in the typechecker.** The static web export renders `PROTO_VERSION` from `@pasabi/core` into `dist/index.html`. `tsc` passing only means the types resolve; the exported HTML means Metro resolved it too.
