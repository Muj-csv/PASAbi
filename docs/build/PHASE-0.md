# Phase 0: Foundation

**Goal:** an Expo monorepo that runs on iOS, Android and web, with the web build live on Vercel and CI green.

## Tasks
1. Expo project (TypeScript, Expo Router, React Native Web) with the package layout in `CLAUDE.md`: `packages/core/`, `packages/transport/`, `src/app/`.
2. `packages/core/` wired as a pure-TS workspace package with a test runner. It must not be able to import `react`, `react-native` or DOM types — enforce with tsconfig/lint, not with good intentions.
3. GitHub Actions: `npm test`, typecheck, and a web build.
4. Deploy the web build to Vercel and put the preview URL in the README.
5. Placeholder screens only, enough to prove routing works on all three targets.

## Acceptance
- `npx expo start` runs on a simulator; `npx expo start --web` runs in a browser.
- The Vercel preview URL loads and the team can open it.
- CI green on a pull request.

## Don't touch
The engine, the observation model, transports, real UI.

## In parallel, not part of this phase
Start **Apple Developer enrolment** (D-011). It takes 24–48 h and blocks nothing else.

Stop and report the Vercel URL and the CI run.
