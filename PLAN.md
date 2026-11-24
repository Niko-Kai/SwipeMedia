# Build Plan — Swipe Media (React Native / Expo dev build → Android emulator)

Source of truth: `dev-data/user_flow.md` (flow map, screen detail, global rules) + `dev-data/v3.figcraft` page **2 - Nov 11 2026 - v2** (visuals). Repo rules: `AGENTS.md` (expo-dev-client, `npx expo install`, `npx tsc --noEmit` after every change, app lives in `mobile/android`).

Verified environment: Node 26.4 · JDK 17 · Android SDK 36/37 · emulator `emulator-5554` (Medium_Phone_API_37.0, API ≥ 30 — required for every MediaStore feature below).

## Product scope (from the spec)

The daily loop is `02 → 04 → 05 → 05a → 05b → 02`. Everything else hangs off it.
No account, all processing on-device, trash is 30-day and free, compression keeps a copy (originals to trash), paywall is always a modal over its caller.

## Tech decisions (smallest set that covers the spec)

| Need | Choice | Why not the alternative |
|---|---|---|
| App shell / navigation | Expo Router (native stack, `presentation: modal` for `06 paywall` and `02a` sheet) | react-navigation wiring is what Router generates anyway |
| Media access + permission | `expo-media-library` ( paginated `getAssetsAsync`) | raw MediaStore queries duplicate it |
| Swipe deck | `react-native-gesture-handler` + `react-native-reanimated` (` PanGesture` + stamp overlay), card inset 24 px + `setSystemGestureExclusionRects` (RN core) | no deck library needed; 3 gestures only (up/left/right — no down) |
| Trash (batched) | **One native module** `MediaTools` (ExpoModulesCore): `requestTrash(uris)` → single `MediaStore.createTrashRequest()` (user taps Allow **once**); `getStorageStats()` (StatFs); needed because expo-media-library has no Android trash-request API — spike confirms in P3 | 36 separate system dialogs is a spec violation; one native call fixes it |
| Compression | `MediaTools.compress()` on **androidx.media3 MediaTransformer** (1080p/720p presets), progress via events, run inside a foreground service (`mediaProcessing` type) | ffmpeg-kit is retired/unmaintained; MediaTransformer is the supported Android transcoding path |
| Session state | React Context + `useReducer` + **pure tally/scope functions** (the spec's ledger as unit tests) | a state library for one session's numbers is overkill |
| Share card (`05b`) | `react-native-view-shot` → PNG to `cacheDir` → `expo-sharing` (`FileProvider`) | never touches the camera roll — spec rule |
| Billing (`06`) | `react-native-iap` (Play Billing), **last phase**; until then a debug entitlement flag exercises both tiers. Emulator has no Play Store — real purchases verified on a physical device later | shipping order: core loop first |
| Fonts/icons | `@expo-google-fonts/inter`, `@expo/vector-icons` (bundled) | spec: Inter only, lowercase voice |
| 02a date picker | house-built 6×7 month grid (RN core) | no dependency for one screen |
| Tests | `jest-expo` on all pure logic (tally math, scope builders, entitlement gates, ledger reconciliation) | TDD per skills map; device flows get a manual checklist |

Design tokens (one `theme.ts`): `#7C5CFF` primary · `#14121B` canvas · radii 999 pills / 40 frames / 18–20 cards / 12 thumbs · Inter · one primary action per screen.

## App location (per `AGENTS.md`)

Expo project root = `mobile/android` → the generated native folder will be `mobile/android/android`. Honors the repo rule as written; flag to user if you'd rather have app at `mobile/` (one-line change before P0 scaffold).

## Phases — each ends with a working app on the emulator

**P0 — Scaffold + shell (design parity first).**
`npx create-expo-app@latest . --template default` in `mobile/android`, TypeScript strict, `jest-expo`, `theme.ts`, fonts, dark status bar. Router stubs for all 15 screens with real headers/nav from the flow map. Mock data = the spec's reconciled ledger behind `EXPO_PUBLIC_MOCK_MEDIA=1`. Deploy: `npx expo run:android` (compiles native dev build, installs on `emulator-5554`, boots Metro). Loops after: `npx expo start --dev-client`.
Gate: `tsc` clean · jest green · side-by-side screen check against page **2 - Nov 11 2026 - v2**.

**P1 — Permission + dashboard reads real media.**
`00/00a` real flow: request Photos & Videos (`READ_MEDIA_IMAGES/VIDEO`, iOS-style partial not needed on Android), "not now" → denied screen, deep-link to app settings. `02` reads MediaStore via expo-media-library (scopes: today / yesterday / 7 days / large videos > 50 MB / screenshots), `getStorageStats()` for the 64 GB bar, `00b` empty deck. `02a` range sheet.
Gate: tsc · jest (scope-builder/date-range tests, TDD) · dashboard numbers vs `adb`-seeded media reconcile with the ledger.

**P2 — Swipe core (`04`, `04a`, `04b`, `03`).**
Gesture deck: up = remove-to-session, left = prev, right = keep/advance; violet `↑ remove` stamp while dragging; `12 of 84` progress; session tally + undo (44 px icon buttons). `03` gallery grid 3-col, tap-select, select-all, batch N. Session store + tally math written test-first (the ledger rows are the test cases).
Gate: gestures don't fight edge-back (exclusion rects verified on emulator) · jest ledger tests green.

**P3 — Safe removal (`05`, `05b`, `02b`) + native trash request.**
`05 confirm` (nothing real until Apply), `MediaTools.requestTrash()` spike first — one Allow dialog for the whole batch. `02b` list from MediaStore trash state (days-left, restore, empty-now with its real disk-reclaim note). `05b` complete + share card via view-shot → `cacheDir` → FileProvider.
Gate: one system dialog for N items · restore decrements badge · share never writes to the gallery.

**P4 — Compression + foreground service (`05a`, `02c`).**
`MediaTools.compress()` MediaTransformer presets (Balanced 1080p / Max Savings 720p from `02c`), originals trashed in the same batch request. Foreground service with progress notification (`35%`, per-file bar, cancel → back to `05`), foregroundServiceType declared via config plugin.
Gate: compression of a seeded 48.6 MB video visibly shrinks it · job survives app switch on emulator · cancel works mid-batch.

**P5 — Pro + billing (`06`).**
Paywall modal over caller (annual/weekly/lifetime, restore), free-tier gates (1 cleanup/day, compress over limit → modal), purchase resumes the exact flow the spec defines (from `05` straight into `05a`). `react-native-iap` config plugin; debug entitlement toggles tiers on emulator.
Gate: both tiers reachable on emulator · flow returns to caller on close · known limit: real purchases testable only on a Play-testing physical device (noted in build).

**P6 — Harden.**
Error/empty states, a11y labels, resume-after-kill of the compression job, final stylesheet sweep vs the FigCraft page, full-suite + ledger reconciliation in CI-able script.

## Deploy & day-to-day on this machine

```powershell
# once per machine, first build (compiles native, ~5-10 min):
cd mobile\android
npx expo run:android          # installs on emulator-5554, starts Metro

# every later session (JS-only, seconds):
npx expo start --dev-client  # press r to reload, a to re-select device
# native/dependency change → rebuild with expo install then run:android again
```

New packages: **always `npx expo install <pkg>`** · after every change: **`npx tsc --noEmit`** · bugs follow the skills order: root cause → failing test → minimal fix.

## Top risks (checked in order)

1. `expo-media-library`'s Android API surface for trash (spike P3) — if it landed trash requests since my knowledge cutoff, drop most of `MediaTools.requestTrash`.
2. MediaTransformer availability/behavior on emulator encoder (software ACodec) may be slow — seed small videos for dev.
3. API 34+ foreground-service rules (notification permission at first job, `mediaProcessing` type) — first real test is P4 on the API 37 emulator.
4. Play Billing cannot be exercised on an emulator — UI + debug-entitlement only, physical device before release.
5. First Gradle build on this Windows box is slow; subsequent builds incremental.

**Skipped by design (YAGNI):** offline sync, analytics, app-local trash DB (MediaStore is the truth), photo compression beyond presets, iOS passes until Android loop is done, EAS cloud builds (local run suffices for the emulator).
