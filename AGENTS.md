# AGENTS.md

Instructions for AI agents working in this repo.

## Project

**Swipe Media** — a swipe-based photo & video cleanup app.
Currently in design/spec stage; application code will live in the locations below.

## Code locations

- Android app: Expo app root `.\mobile` (JS, config, assets); generated native project `.\mobile\android`
- API app: `.\api`
- Web app: `.\web-app`

(The paths above are canonical even if they don't exist yet — create them when the first implementation lands.)

## Skills — load before the work, not after

Five skills live in `.\.agents\skills\`. Load the matching skill **before** starting the task:

- **Any coding task** → `ponytail` — smallest change that fully solves it; no speculative options, wrappers, or "for later" code. Default level `full`; the user can switch with `/ponytail lite|full|ultra` or deactivate with "stop ponytail" / "normal mode".
- **Every feature or bugfix, before writing implementation code** → `test-driven-development` — write the failing test, watch it fail, write minimal code to pass, then the whole suite green (not just your file).
- **Any bug, test failure, or unexpected behavior, before proposing fixes** → `systematic-debugging` — root cause first, always. After 3+ failed fixes, stop and question the architecture instead of attempting another.
- **"review this" / "review the last commit" / a PR / "is this over-engineered"** → `ponytail-review` — reads the connected code, not only the diff; every finding needs a concrete failing case; report in Must fix / Should fix / Nice to have with a verdict.
- **Structural code questions** ("who calls X", "what does X call", architecture, impact of a change, dead code, high fan-out) → `codebase-memory` — query the knowledge graph instead of grepping (MCP server configured in `.agents\mcp_config.json`; evidence tiers Scout/Verify/Auditor per its SKILL.md).

They interlock: a bug fix goes root cause (`systematic-debugging`) → reproducing failing test (`test-driven-development`) → minimal implementation (`ponytail`), and is never done before `npx tsc --noEmit` and the full suite pass.

## Project rules (must follow)

- **Expo dev client, never Expo Go**: build and run the mobile app with `expo-dev-client`.
- **Installing packages**: always install with `npx expo install <pkg>` — never plain `npm install` for runtime deps in the mobile app.
- **Typecheck after changes**: run `npx tsc --noEmit` after every code change.
- **Reading images**: use a separate OpenCode session with model `mistral/Deepseek V4.1 Flash 1017`.
- **Azure**: any database or container app is deployed to Azure Cloud via Azure CLI, in resource group `swipe-media-rg`, free tier only.

## Design & user flow sources

- UI designs: `.\dev-data\v3.figcraft` — follow the designs on page **4 - Nov 25 2026 - v4**.
- User flow: `.\dev-data\user_flow.md`

Always check these before implementing any screen or feature; they define the product's flows, copy, and visual system.
