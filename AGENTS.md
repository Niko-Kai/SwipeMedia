# AGENTS.md

Instructions for AI agents working in this repo.

## Project

**Swipe Media** — a swipe-based photo & video cleanup app.
Currently in design/spec stage; application code will live in the locations below.

## Code locations

- Android app: `.\mobile\android`
- API app: `.\api`
- Web app: `.\web-app`

(The paths above are canonical even if they don't exist yet — create them when the first implementation lands.)

## Project rules (must follow)

- **Expo dev client, never Expo Go**: build and run the mobile app with `expo-dev-client`.
- **Installing packages**: always install with `npx expo install <pkg>` — never plain `npm install` for runtime deps in the mobile app.
- **Typecheck after changes**: run `npx tsc --noEmit` after every code change.
- **Reading images**: use a separate OpenCode session with model `mistral/Deepseek V4.1 Flash 1017`.
- **Azure**: any database or container app is deployed to Azure Cloud via Azure CLI, in resource group `swipe-media-rg`, free tier only.

## Design & user flow sources

- UI designs: `.\dev-data\v3.figcraft` — follow the designs on page **2 - Nov 11 2026 - v2**.
- User flow: `.\dev-data\user_flow.md`

Always check these before implementing any screen or feature; they define the product's flows, copy, and visual system.
