# Emberflight Gauntlet — Preview Notes

**WorkOrder:** work-order-1781497406944-7-1  
**Required Preview Entrypoint:** games/88-emberflight-gauntlet/index.html  
**Phase:** Strategy gate (notes prepared; actual preview setup occurs in implementation)

---

## Preview Root Contract (per Work Order)

- The preview root for this Work Order **must open the game or artifact directly** (or through a small valid redirect/index page).
- Do **not** append review links after a closed HTML document.
- Do **not** mutate a public homepage just to expose a review link unless the Work Order explicitly asks for homepage work.
- Prefer relative preview links such as `games/<slug>/` so copied preview trees work under `/factoryx/previews/<factory>/<work-order>/`.
- Prefer a single self-contained `index.html` unless the playbook scaffold says otherwise.
- Write `.factoryx/preview-entrypoint` with the exact relative HTML entrypoint (`games/88-emberflight-gauntlet/index.html`).

**Current status (strategy gate):** No game built yet. This file records the intended preview shape and will be updated with URLs, redirect details, and evidence during/after taste-gate slice.

---

## Planned Preview Shape

- Primary artifact: `games/88-emberflight-gauntlet/index.html` (self-contained playable browser game as the first screen).
- Optional tiny redirect at repo root or `preview/` for convenience during local/CI deploys (see prior Rhythm Drift + asset-skill-smoke patterns), but the canonical entrypoint remains the games/ path.
- Once implemented: reviewer loads the preview root → lands directly in the ember canyon flight game → can immediately bank, burst, chain, crash, and retry without reading copy or navigating menus.

---

## Evidence to Capture (Implementation Phase)

When the slice exists, update this file + PR with:

- Direct link or relative path that opens the live game.
- Screenshots (desktop + mobile viewport) showing:
  - Dragon visible in powered flight within first seconds (not a static mascot or blob).
  - Visible banking/weight (wing tilt, trail, inertia feel).
  - Fire burst with sparks/smoke and heat feedback.
  - Ring/target chaining + score pop.
  - Readable crash state + prominent retry.
- Console / Network cleanliness notes from real browser session.
- Confirmation that audio started only after gesture and mute control is present and functional.
- Any known visual or control limitations at the time of capture.

**Last updated:** 2026-06-15 — Strategy gate (preview contract + planned shape recorded; no live preview yet).

**Execution note (this agent run):** Preview contract remains: write `.factoryx/preview-entrypoint` with exact `games/88-emberflight-gauntlet/index.html` during impl so that verifier and FactoryX preview root resolve directly to the playable game (addresses previous run skip). Payload already carries the preview_entrypoint field. No changes to shape; still no game or live preview at gate.
