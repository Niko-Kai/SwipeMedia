# Swipe Media

A swipe-based photo & video cleanup app for Android. Swipe through your library, remove what you don't need, compress the heavy stuff, and watch the storage come back — all on-device, with no account and no upload.

> **Status:** P0–P5 implemented and running on the Android emulator as an Expo development build. Real MediaStore data (permission → scopes → gallery → deck), staged sessions with swipe gestures, one-dialog batched trash with a 30-day restore ledger, on-device video compression (Media3 transformer + foreground service), share card to the system sheet, and pro/free entitlement gates. Gates: `tsc` · eslint · jest (41 tests) green. P6 hardening in progress; real Play Billing needs a Play-enabled device.

## Repo layout

| Path | What it is |
|---|---|
| `mobile/` | Expo SDK 58 + React Native app (routes in `src/app/`, one per spec screen) |
| `dev-data/user_flow.md` | Full product spec: flow map, screen-by-screen detail, global rules |
| `dev-data/v3.figcraft` | FigCraft design source (UI mockups) |
| `.agents/skills/` | Five skills agents load before working (usage map in `AGENTS.md`) |
| `PLAN.md` | Phased build plan: layout, session state machine, native module spec, tests, gates |
| `AGENTS.md` | Working rules for AI agents (build locations, conventions, skills, Azure targets) |

Planned implementation layout:

- `mobile/` — Expo Android app (`expo-dev-client`, never Expo Go)
- `api/` — API app
- `web-app/` — web app

## Product concepts

- **Swipe-first cleanup** — swipe up = remove, left = previous, right = keep.
- **30-day trash** — nothing is deleted instantly; every removal is restorable for 30 days.
- **Privacy** — scanning, matching, and compression run entirely on-device. Nothing leaves the phone.
- **Pro tier** — unlimited cleanups and max-savings compression via Google Play Billing; trash + restore is free for everyone.

## Design source

UI follows the FigCraft file in `dev-data/`, page **2 - Nov 11 2026 - v2**, together with the flow spec in `user_flow.md`. Check both before implementing any screen.
