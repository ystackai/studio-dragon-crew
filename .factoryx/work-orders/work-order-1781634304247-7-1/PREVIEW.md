# Emberflight Gauntlet Rework — Preview

**Work Order:** work-order-1781634304247-7-1
**Preview root:** games/92-emberflight-gauntlet/index.html (direct; opens the playable gauntlet with improved assets)

The reviewable artifact is the Emberflight Gauntlet game. Open the preview to the gauntlet flight slice. First interaction (pointerdown or key) starts the run; steer with mouse/touch/keyboard, Space/Shift or click to dash. Collect embers, weave spires/vents, clear Maw beats, crash/restart.

Assets from foundry (or enhanced generator per runtime limits) should be visible immediately in first 10s: larger weightier dragon+rider base sprite, more material ember glows, hazard decals with flame, richer sky haze, and audible richer sfx on dash/collect/maw/crash.

See VERIFICATION.md for browser evidence + screenshots.
See WORKLOG.md for passes.

**Known preview notes (from prior on deliverable):**
- Self-contained after load; no external after initial.
- 60fps on mid hardware in normal density.
- Responsive: canvas scales, large effective touch targets via steering band.

## Evidence (Pass 1)
- Idle: current-idle-rework.png (308kB) — v2 dragon/rider/embers/hazards/haze visible cold.
- Interact sim: check7-rework-current.png (324kB) — post-gesture state with new art + markers.
- Direct entry: games/92-emberflight-gauntlet/index.html
