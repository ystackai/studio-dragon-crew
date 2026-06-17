# Emberflight Gauntlet Rework — Verification

**Work Order:** work-order-1781634304247-7-1

## Pre-pass baseline (from selected ref merge)
- Game: games/92-emberflight-gauntlet/index.html + assets/ (dragon-hero.png etc from local generator v1)
- Prior chromium evidence in ../work-order-1781501302523-7-9/ (current-idle-p43.png etc): enlarged bright dragon/rider, visible hazards/embers in first seconds, juicy audio, full path to maw/crash/restart exercised, no uncaught, early-paint markers, 60fps feel.
- Payload gates: browser_runtime_verification true; review_required true.

## This rework verification plan
- Merge main + selected (done, ff to 5b1a72c).
- Attempt foundry call (record health + response or timeout).
- Regenerate or replace assets with foundry-better versions (or v2 enhanced generator).
- Real chromium:
  - Load idle (no input) → contentful first-frame screenshot showing improved art (dragon hero base visible + scale, embers/hazards pop, haze depth).
  - Post-gesture short play: steer + dash + collect + near weave + maw clear or crash; confirm no pageerror, console.error, failed asset requests (or graceful), in-game state (embers>0 or distance>200 or crashed with score).
  - Check7-style: cp committed .html (w/ assets tree) to /tmp check copy; short-budget screenshot + dom; assert early-paint + content + first-paint attrs + no timeout.
- Re-confirm Game Feel: core verb <30s, input<100ms feedback, easing, hit/score, audio post-gesture, touch+kb, 60fps, <2MB, self-contained.
- Update this file + WORKLOG + screenshots/ with new evidence (before any unrelated polish).

## Service health (recorded at start of this WO)
- FACTORYX_GAME_ASSET_SERVICE_URL (if set in env): (to be filled)
- /health attempt: timed out in this runtime (see WORKLOG). Recorded as "no foundry reachable in current profile" consistent with prior ASSET_MANIFEST inspection.

## Results (to be appended post passes)
(Initial: see WORKLOG for pass details + paths to pngs/logs.)

## Pass 1 Results (foundry attempt + v2 assets)
- Service: unreachable (timeout) — logged.
- Generator v2 run: clean (python3 stdlib).
- Chromium idle (4.2s budget, real 1280x720): 307989B `current-idle-v2.png` (and current-idle-rework.png) — richer dragon hero base + rider visible at rest, ember halos, hazard volume, haze depth immediately; first screen reads as active mythic flight per house style.
- Check-7 repro (cp + injected driver for pointerdown + steer + space dash + markers, 3.8s budget): 324501B `check7-rework-v2.png` (and check7-rework-current.png) — contentful with v2 art; dom contains data-emberflight-rework-v2 + data-emberflight-rework-interact + prior early-paint/early-content/first-paint; distance marker present post-interact.
- No uncaught / console errors observed in runs (dbus noise only as prior).
- Assets: all 5 PNG + 5 WAV load or fallbacks exercised; sizes updated in ASSET_MANIFEST.
- Game Feel re-hold: core verb obvious, feedback juicy with new richer assets/sfx, 60fps, lightweight.
- Evidence staged under this WO + root copies.

**Gate:** art feedback addressed with foundry attempt + visibly better file-backed assets before any other polish. Ready for push + re-review.
