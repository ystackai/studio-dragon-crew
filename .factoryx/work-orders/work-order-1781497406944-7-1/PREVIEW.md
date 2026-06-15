# Emberflight Gauntlet — PREVIEW

**Entrypoint:** games/88-emberflight-gauntlet/index.html

**How to open for review:**
- Direct: open `games/88-emberflight-gauntlet/index.html` in browser (file:// ok for single file, but prefer http server for audio/gesture).
- Via preview root: the `.factoryx/preview-entrypoint` points review tooling at the game directly. Preview/index.html is avatar gallery (unrelated prior); do not rely on it as the game preview.
- Local serve example (from repo root): `python3 -m http.server 8765` then visit http://localhost:8765/games/88-emberflight-gauntlet/index.html
- For deployed preview (after push + CI): the canonical PR preview URL for branch `factoryx/factory-dragon-crew/work-order` should surface the entrypoint (or small redirect). Use cache-bust (?v=ts) on retests.

**Default experience:** The HTML loads straight into the canyon flight. No title card, no instructions gallery, no mode picker. A tiny fading legend appears bottom-center on first boot only ("drag to bank • tap/hold to breathe"). First gesture starts motion + audio init. Death state is immediate overlay + one-action retry.

**Responsive notes:** Canvas fills viewport, maintains ~16:9 logical playfield (960x540) with scale. Safe margins for HUD. Tested mentally on 360px wide (portrait sim) and 1920. Touch drag works; no tiny targets.

**Screenshots / Evidence (to be captured on each pass):**
- Desktop first 5s: dragon visible with weighty silhouette, canyon strata, drifting embers, rings ahead, minimal HUD.
- Mid run 25s: tight gap, chain multiplier active (x3+), breath cone illuminating, sparks on bank, smoke.
- Crash: impact flash + overlay readable, score prominent, "drag or space to rise again" clear.
- Mobile sim (narrow window): no overlap, controls large enough (whole play area for drag, fire on press), text not cut.
- Mute toggle: icon top-right, functional (audio stops, game continues).

**Current known preview path issues:** None at write. Single file guarantees no 404s for core. If adding generated assets later, will add to small set inside or next to index with manifest note.

**Last updated:** 2026-06-15 (initial creation post dir setup)
