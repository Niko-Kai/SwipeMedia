# swipe media — mobile app

Expo (SDK 58) + React Native app. Status and plan live in the repository root (`README.md`, `PLAN.md`, `AGENTS.md`); design sources in `dev-data/`.

```bash
npx expo install <pkg>   # always this, never npm install
npx tsc --noEmit         # after every change
npm test                 # jest
npx expo run:android     # build + install on the running emulator
npx expo start --dev-client  # later sessions (JS-only)
```
