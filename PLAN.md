# Implementation Plan — Swipe Media (React Native / Expo dev build → Android emulator)

Sources of truth: `dev-data/user_flow.md` (flows, screen detail, copy, global rules) · `dev-data/v3.figcraft` page **2 - Nov 11 2026 - v2** (visuals) · `AGENTS.md` (repo rules: expo-dev-client, `npx expo install`, `npx tsc --noEmit` after changes, TDD).
Environment (verified): Node 26.4 · JDK 17 · Android SDK 36/37 · `emulator-5554` (Medium_Phone API 37 ⇒ every API-30+ MediaStore feature available) · push target `Niko-Kai/SwipeMedia`.

---

## 1. App layout

Expo app root = `mobile/`. `expo run:android` generates the native Gradle project at `mobile/android/`.

```
mobile/
  app/                        # expo-router (one file per spec screen)
    _layout.tsx               # root stack: dark theme, fonts, GestureHandlerRootView
    index.tsx                 # entry: first-run? → 00 : → 02
    landing.tsx               # 00
    permission-denied.tsx      # 00a
    empty-deck.tsx            # 00b   (route param: scope)
    dashboard.tsx             # 02
    pick-range.tsx            # 02a   (stack modal, sheet UI)
    trash.tsx                 # 02b
    settings.tsx              # 02c
    gallery.tsx               # 03
    swipe.tsx                 # 04    (04a/04b are overlay states of this screen, NOT routes)
    confirm.tsx               # 05
    applying.tsx              # 05a
    complete.tsx              # 05b
    paywall.tsx               # 06    (modal presentation over caller)
  src/
    theme/tokens.ts           # colors, radii, spacing, type scale
    components/               # Screen, PrimaryButton, Pill, Card, Toast, MeterBar, ShareMeter, IconBtn(44px)
    features/
      media/                  # expo-media-library pager + Asset normalizer
      scopes/                 # pure scope builders (today, yesterday, last7d, largeVideos, screenshots, dateRange)
      session/                # session reducer + pure tally math (the ledger, as tests)
      trashstore/             # trashed-by-us records, daysLeft, restore, empty
      compress/               # presets (balanced/max), job queue client
      billing/               # entitlement gate, daily-cleanup counter, products
      share/                  # share-card capture (view-shot → cacheDir → expo-sharing)
    native/mediatools/        # Expo module (Kotlin) + manifest config plugin
  scripts/seed-media.ps1      # push sample photos/videos to emulator + media scan
```

**Key architecture decision — staging vs commit.** Spec global rule: *"nothing changes until you apply."* So all mid-session actions (`04` remove/compress, `03` batch, the `in trash`/`compressed` badges in `04a/04b`) mutate only the in-memory session. Real system operations happen exactly once, in `05a`:

```
apply(session) →
  1. compress queued items sequentially (MediaTransformer, foreground service)
  2. ONE MediaStore.createTrashRequest() for removed + compressed-originals  (user taps Allow once, per spec `05a`)
  3. persist session record + trash rows → 05b
```

### Screens ↔ spec ↔ phase map

| Spec screen | Route file | Phase | Notes |
|---|---|---|---|
| 00 landing | `landing.tsx` | P0 stub → P1 real | permission request via expo-media-library |
| 00a permission denied | `permission-denied.tsx` | P1 | `Linking.openSettings()` deep-link, retry |
| 00b empty deck | `empty-deck.tsx` | P1 | scope with 0 items |
| 02 dashboard | `dashboard.tsx` | P1 | real MediaStore counts + StatFs storage bar |
| 02a pick a range | `pick-range.tsx` | P1 | house 6×7 Monday-first month grid (per spec) |
| 04/04a/04b swipe | `swipe.tsx` | P2 | up=remove · left=prev · right=keep; **no down gesture** |
| 03 gallery | `gallery.tsx` | P2 | 3-col grid, tap-select, select-all, batch dock |
| 02b trash | `trash.tsx` | P3 | our trash records + system trash state |
| 05 confirm | `confirm.tsx` | P3 | totals from session selectors |
| 05a applying | `applying.tsx` | P3 (removals) → P4 (compression) | |
| 05b complete | `complete.tsx` | P3 | share card via cacheDir + FileProvider |
| 02c settings | `settings.tsx` | P4 | compression presets, privacy copy, build string |
| 06 paywall | `paywall.tsx` | P0 stub → P5 | modal over caller, returns to caller |

Design tokens (`theme/tokens.ts`, from the spec's design system): primary `#7C5CFF` · canvas `#14121B` · Inter only · lowercase copy (strings taken verbatim from `user_flow.md`) · radii 999 pills / 40 frames / 18–20 cards / 12 thumbs · one primary action per screen.

---

## 2. Session state machine (the core of P2/P3)

```
type StagedItem = { id, uri, filename, sizeBytes, mediaType }
type Session = {
  scope: Scope, queue: StagedItem[], index: number,
  removed: StagedItem[],                 // pending trash
  compressed: { item, newSizeBytes }[],  // pending trash(original)+keep(copy)
  lastAction: null | { kind, item },     // enables 04 undo (one level, per spec)
}
State: idle → active(04|03) → confirm(05) → applying(05a) → complete(05b) | discarded
Actions: remove(item) · compress(item, newSize) · undo() · deckFinished() · apply() · discard() · cancelApply() · share() · done()
```

Pure selectors — **these are the ledger tests** (`session/tally.test.ts`):

| Selector | Ledger fixture it must reproduce |
|---|---|
|`tallyAfterRemove` | 600.0 → 604.2 MB (lantern 4.2 MB) |
| `tallyAfterCompress` | 600.0 → 635.7 MB (48.6 → 12.9 = 35.7 freed) |
| `sessionFreed` | 24 removed (1.2 GB) + 12 compressed (600 MB) = **1.8 GB** |
| `storageAfter` | 58.2 − 1.8 = 56.4 used · 5.8 + 1.8 = 7.6 free |
| `trashCount` | 36 = 24 + 12 |
| `savedTotal` | 9.4 + 1.8 = 11.2 GB |
| `formatBytes` | `1.8 GB`, `600.0 MB` (one decimal, auto unit) |

Written test-first: red → green per `test-driven-development` skill.

---

## 3. Native module `MediaTools` (Expo module, Kotlin — Android only)

One module, three capabilities, added incrementally:

```kotlin
// P1
getStorageStats(): { totalBytes, freeBytes }          // StatFs on external storage

// P3
requestTrash(uris, trash: Boolean): TrashResult        // MediaStore.createTrashRequest —
                                                      // ONE system dialog for the whole batch (spec 05a);
                                                      // trash=false restores (spec 02b)
requestDelete(uris): DeleteResult                      // MediaStore.createDeleteRequest — "empty trash now" (one dialog)
// getTrashState(uris): presence check for 02b rows (media purged after 30 days must vanish from our list)

// P4
compressVideo(uri, preset): void                      // androidx.media3 MediaTransformer,
                                                      // progress via events, runs in CompressService
```

- **02b trash listing**: Android restricts querying trashed media, so we keep our own records (`trashstore`: `{uri, id, name, sizeBytes, trashedAt}`, daysLeft = 30 − elapsed, persisted in AsyncStorage), reconciled with `getTrashState` on open. Restore = `requestTrash(trash=false)`. `05b`/`02b` keep the spec's truth: trashed bytes still occupy storage until emptied.
- **P4 service**: `CompressService` foreground service, `foregroundServiceType="mediaProcessing"` + `POST_NOTIFICATIONS` (runtime ask at first job) via a small manifest config plugin (`src/native/mediatools/plugin/`). Progress events (per-item + overall) emitted natively, consumed by a `useCompressJobs` hook. Cancel: stop service, delete partial outputs, back to `05` (spec).
- Module lives in `mobile/src/native/mediatools/` with `expo-module.config.json`; auto-linked into the dev build — no EAS needed.

---

## 4. Phases

### P0 — Scaffold + design-parity shell (½ day)
1. `npx create-expo-app@latest mobile -t default` ( ships expo-router; delete sample screens), TypeScript strict.
2. `npx expo install expo-dev-client expo-font @expo-google-fonts/inter expo-status-bar expo-system-ui react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens`
3. Dev deps: `npx expo install -- --save-dev jest-expo jest @types/jest @testing-library/react-native`; `package.json` → `"jest": { "preset": "jest-expo" }`.
4. `theme/tokens.ts` + primitives (`Screen`, `PrimaryButton`, `Pill`, `Toast`, `MeterBar`).
5. All 15 route files as styled stubs (real headers, back/exit wiring per flow map; bodies mocked with the ledger's sample data behind `EXPO_PUBLIC_MOCK_MEDIA=1`). Paywall = modal presentation from day one.
6. First failing test → `formatBytes` red → green (TDD warm-up).
7. **Deploy**: `cd mobile && npx expo run:android` → installs on `emulator-5554`, Metro up.
**Gate**: `npx tsc --noEmit` clean · `npx jest` green · `expo lint` clean · per-screen screenshot vs FigCraft page (image reading routed per `AGENTS.md` rule) · navigation matches the mermaid flow map.

### P1 — Permission + dashboard on real media (1–1.5 days)
1. `npx expo install expo-media-library expo-linking`
2. `features/media`: normalized `Asset`, pager (`getAssetsAsync`, 60/page, `modificationTime` desc), `features/scopes` pure builders: today/yesterday/last7d (creationTime windows) · largeVideos (video && size > 50 MB per spec) · screenshots (`filename LIKE 'Screenshot_%'`) · dateRange. MediaStore counts/sizes per scope for the dashboard cards.
3. `00/00a`: `requestPermissionsAsync` → **allow access** → `02`; **not now** → `00a` (`Linking.openSettings()`, try-again). `index.tsx` splits on permission + first-run flag.
4. `MediaTools.getStorageStats()` → `58.2/5.8 GB`–style bar (real total from StatFs; `saved so far` = persisted cumulative, starts 0 ≠ mock).
5. `02` fully real; `00b` on empty scope; `02a` month-grid range sheet (Monday-first per spec).
6. `scripts/seed-media.ps1`: `adb push` sample JPGs (incl. a 4.2 MB one) + 0:12 test MP4 → `adb shell cmd content call --method scan_volume --uri content://media/ --arg external_primary`.
7. Tests (TDD): scope builders (date windows incl. today-boundary), month-grid math (fixture: June 2026, starts Monday, today=23st), `formatBytes` edge cases.
**Gate**: tsc/jest · dashboard numbers reconcile with seeded device · permissions denied→granted loop works on emulator.

### P2 — Swipe core + gallery (1.5–2 days)
1. `swipe.tsx` deck: `PanGesture` with direction threshold; **up** = stage-remove, **left** = previous, **right** = keep/advance; card inset 24 px, stacked next card, violet `↑ remove` stamp while dragging, `12 of 84` + tally + progress bar, 44 px undo/compress, 22 px gallery icon.
2. `04a/04b` as in-card overlay states + toasts (`moved to trash`/`video compressed` — copy verbatim from spec) — staged, not real (§1 staging rule).
3. System-gesture exclusion: **spike** whether our RN exposes `setSystemGestureExclusionRects` directly; fallback = deck-level gesture capture (`activeOffsetX`) which keeps edge swipe from fighting the OS, verified by tests on emulator edge swipes.
4. Session reducer + selectors (§2) — all written test-first.
5. `03` gallery: 3-col flat grid, tap toggles selection (accent stroke + ✓), select-all, floating dock `N selected / bytes`, batch **remove N** / **compress N** (compress = staged until P4 wires real encoding), **swipe mode** → `04` same scope.
**Gate**: tsc/jest (reducer, undo, direction classifier, gallery totals) · manual: 20 fast alternating gestures, edge-back never steals a swipe, undo restores exactly one level.

### P3 — Safe removal end-to-end (1.5 days)
1. `MediaTools`: `requestTrash`, `requestDelete`, `getTrashState`; manifest bits for the module.
2. `npx expo install @react-native-async-storage/async-storage react-native-view-shot expo-sharing expo-file-system` — trash rows, settings, cumulative saved, session snapshot.
3. `05 confirm`: destination card (removed/compressed split, `copies kept, originals in trash`), **apply cleanup** → progress (P3: trash-only path, compress ships P4), **discard** → `02`.
4. Apply pipeline (removals only): one `createTrashRequest` dialog for N items → persist trash rows + cumulative freed → `05b`.
5. `02b`: rows (filename, size, `29d left` chip, **restore**), `showing 5 of 36 · newest first`, `empty trash now` → one delete dialog, `06`-free for everyone (spec: trash is not Pro).
6. `05b`: totals (reuse selectors — no second math), `1.8 GB freed!`, **share result** → card component captured with view-shot → PNG in `cacheDir` → `expo-sharing` (its FileProvider; nothing hits the camera roll), `done` → `02` with updated `saved so far` + trash badge.
**Gate**: tsc/jest (daysLeft 29/30 edges, ledger totals on fixture session) · manual: **one** Allow for a whole batch, restore decrements badge, share opens system sheet with cached PNG only, `05b` shows the still-reserved-in-trash note.

### P4 — Compression + foreground service (2–3 days)
1. `MediaTools.compressVideo` (MediaTransformer presets: balanced ⇒ 1080p, max ⇒ 720p) + `CompressService` + manifest plugin (`mediaProcessing` FGS type, `POST_NOTIFICATIONS`), progress + per-item events, notification mirrors progress (spec), cancel → stop + delete partials → `05`.
2. `applying.tsx` full UI: overall + per-item bars, `compressing video 3 of 12`, up-next queue, `est. left`, cancel.
3. Wire **compress** in `04` (over limit → `06` as modal per spec) and `03`; originals trashed in the single apply batch.
4. `02c settings`: preset rows (persisted), subscription card + `restore purchases` (works P5), privacy statement card, `swipe media 3.0.0 (build 308)` from app.json.
**Gate**: tsc/jest (job queue order, preset mapping, reducer-with-fake-compressor pipeline) · manual: seeded 48.6 MB 0:12 clip visibly shrinks (~35 MB saved), survives app switch mid-job + notification present, cancel returns to `05` with nothing half-committed.

### P5 — Pro, limits, billing (1 day)
1. `npx expo install react-native-iap` (+ its config plugin). SKUs: annual/weekly/lifetime — spec prices stay product-configurable sample data.
2. `entitlement.ts` (pure, tested): free = 1 cleanup/day + balanced preset; Pro = unlimited + 720p; trash always free. Daily counter persisted.
3. `06 paywall` real UI: modal over caller (annual/weekly/lifetime, restore, terms/privacy/refunds), close → caller unchanged; purchase from `05` → `05a` with queue intact (global resume flag), from `04` → deck resumes (entitlement re-hook).
4. Emulator has no Play Store: purchases stubbed via entitlement override `EXPO_PUBLIC_FORCE_PRO=1`; real purchase verification deferred to a Play-testing physical device (documented in the gate).
**Gate**: tsc/jest (entitlement truth table, daily limit at midnight rollover) · manual: limit hit → modal → returns to exact caller state; Pro unlocks compress + unlimited runs.

### P6 — Harden + final spec sweep (1–1.5 days)
1. Session snapshot every action → cold-start restores an interrupted session to `05` (spec-safety: nothing lost).
2. Empty/error states (permission revoked mid-flow → `00a`; scope query fails; codec error on one item → skip + report, batch continues).
3. A11y labels on all actions (swipe deck has visible legend as the accessible affordance), contrast pass on tokens.
4. Full walk of every spec rule on the emulator (the §2 ledger must reconcile on real seeded data, end to end), screenshot-vs-FigCraft final review (image session per `AGENTS.md`), bump versionName `3.0.0 (build 308)`.

**Total estimate: ~9–11 focused dev days.**

---

## 5. Commands (this machine)

```
# first native build (compiles Gradle ~5-10 min, installs to emulator-5554, starts Metro)
cd mobile && npx expo run:android

# every later session                                  # gates after any change
npx expo start --dev-client            # r reload · a device   npx tsc --noEmit ; npx jest
# native/dependency change: npx expo install <pkg>, then expo run:android again
```

Bugs follow the skills order (`AGENTS.md`): root cause (`systematic-debugging`) → failing test → minimal fix. New non-trivial logic = test-first.

## 6. Risks & spikes (in strike order)

1. **P3 spike**: current `expo-media-library` Android surface — if library trash requests exist now, shrink `MediaTools`.
2. **P3**: `createDeleteRequest` behavior on already-trashed items (purge path for "empty trash") — confirm on API 37; else untrash→delete.
3. **P2**: system-gesture exclusion API availability in RN core → fallback deck-capture pattern (§ P2.3).
4. **P4**: MediaTransformer on the emulator's software encoder may be slow — seed small test videos; real-device timing check later.
5. **P5**: Play Billing untestable on emulator — entitlement override now, Play-testing track on a physical device before release.
6. Windows Gradle first build is slow; ColdBooted emulator + `adb devices` check before every session.

**Out of scope (per spec/YAGNI):** offline sync, analytics, own trash DB as truth (MediaStore is truth + our records), iOS pass, EAS cloud builds, photo quality presets beyond spec's two.
