# Emberflight Gauntlet — PREVIEW (work-order-1781501302523-7-9)

**Entrypoint:** games/92-emberflight-gauntlet/index.html (exact, per .factoryx/preview-entrypoint + payload)

**How to open:**
- Direct: open `games/92-emberflight-gauntlet/index.html` (file:// ok for visuals; http preferred for audio gesture).
- Local: `python3 -m http.server 8765` then http://localhost:8765/games/92-emberflight-gauntlet/index.html
- Deployed: after push to canonical `factoryx/factory-dragon-crew/work-order` + CI/deploy-preview, the FactoryX review root surfaces the game directly. Cache-bust on retests.

**Default experience (first screen = playable gauntlet):**
- Loads straight into brightened burning-sky ember canyon. Large, high-contrast dragon + rider silhouette (scale 1.42, bright gold/ember rims, crest flame, wing flame layers, harness) immediately visible against strata. Close rings/hazards (rocks + drifting cinders)/orbs/crew + 30+ embers + wing sparks seeded in first 300 units — visible lane choices, threats, rewards in <3s. No dim sparse scene.
- Idle: living preview (bank/flap + heavy ember spectacle).
- First gesture (drag/tap/touch/space): starts full run + audio (rich flame whoosh, chord chimes, wind bed, music-led low pulse). Core verb obvious: bank the weighty ancient being, flame-dash (breath) to clear or claim.
- 0-10s: active heroic flight. Weave bright pop hazards, thread glowing rings for chains (floating "xN" + score pops), rescue crew (bright "RESCUE" text), collect embers. Dash/chain/collect feedback is large shadowed high-sat text + particle bursts — readable in screenshots.
- Escalation: depth-gated Ember Sovereign boss with large bright vents; weave + flame the 3 vents for "MAW CLEARED" + massive payoff.
- Death + retry: immediate "INTO THE VEIN" overlay (still heroic tone), impact fx, "DRAG OR SPACE TO RISE AGAIN". Clean reset to living bright sky.
- Juice everywhere: screen shake on crash/breath, flash on shatter, eased motion, particle trails on every exertion/bank/collect.

**House style notes:** Dragon vast/opinionated (head leads, mass, consequence on breath), rider humble witness giving scale (bright but small on back), fire has temperature/trails, canyon remembers heat. Player negotiates presence, not power fantasy.

**Responsive:** Full-bleed DPR canvas (logical 960x540), HUD safe margins, full canvas as large touch target, kb + pointer + touch parallel. Works narrow (360w sim) to wide.

**Screenshots / Evidence (capture on passes):**
- Load/idle: large bright dragon+rider + close embers/hazards/rings/crew visible, first 10s feels kinetic not dim.
- Mid action: banked dragon with flame wings, breath cone, floating "FLAME"/"x4"/"+EMBER" text, sparks, bright cinder/ring pop.
- Boss + clear: looming sovereign, vent hits with "VENT" pops, shatter "MAW CLEARED".
- Crash + narrow: legible overlay + retry, no overlap.

**Current status (this pass):** Addressed operator playtest feedback (11:23/11:50/12:18/15:32Z + asset 17:25Z) + review merge conflict (rebased/merged main). Direct preview updated to 92-. ASSET_MANIFEST.md created documenting deliberate authored procedural system (no unrecorded placeholders).

**Last updated:** 2026-06-15 (polish pass for payload preview_entrypoint + blocking feedback).
