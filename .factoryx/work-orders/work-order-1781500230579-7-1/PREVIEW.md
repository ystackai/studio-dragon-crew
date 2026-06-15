# Emberflight Gauntlet — Preview Notes

**WorkOrder:** work-order-1781500230579-7-1  
**Required Preview Entrypoint:** games/90-emberflight-gauntlet/index.html  
**Branch:** factoryx/factory-dragon-crew/work-order-1781500230579-7-1

---

## Preview Root Contract

- Preview root opens the game directly or via small valid redirect/index.
- Prefer `games/90-emberflight-gauntlet/` relative.
- Do not append links after closed HTML or mutate public homepage (preview/index.html remains avatar gallery).
- Single self-contained index.html.

## Current Shape

- Artifact: `games/90-emberflight-gauntlet/index.html` (self-contained canvas 2D + WebAudio playable action game).
- First screen after load/gesture = flying dragon in burning sky gauntlet, immediate controls, hazards, collectibles, rescue, escalation to boss.
- `.factoryx/preview-entrypoint` will be written with exact path for FactoryX preview tooling.

## Evidence to Capture (update on each polish)

- Direct path to playable game.
- Screenshots: 
  - First flight / dragon in motion (powered, not static).
  - Dash / boost trail + ember collect.
  - Ally rescue (crew silhouette + pop).
  - Hazard near-miss or hit feedback.
  - Boss visible with vents + player strike or shatter.
  - Crashed + restart affordance (desktop + mobile viewport).
- Browser runtime: console clean (no pageerror, no uncaught, network only local), FPS ~60, audio after gesture, controls responsive.
- Offline replay works post-load.
- Any limitations noted.

**Last updated:** 2026-06-15 — created for WO 1781500230579-7-1; entrypoint games/90-emberflight-gauntlet/index.html per payload. Will append live URLs, screenshots, observations after first push + verification.
