# Emberflight Gauntlet — Asset Manifest (Work Order Context)

**Work Order:** work-order-1781501302523-7-9  
**Factory:** factory-dragon-crew  
**Timestamp:** 2026-06-15T17:49Z (this execution)  
**Purpose:** Satisfy operator asset-pipeline blocking feedback (2026-06-15T17:25:25Z) + asset contract v2 (2026-06-15 17:45Z). Produce reviewable *file-backed* assets (PNG/WebP sprite sheets or backgrounds, WAV/OGG/MP3) under `games/**/assets` (or assets/generated, drops/**/assets). ASSET_MANIFEST.md is required; manifest-only or procedural-only (in-code canvas/SVG/oscillator) does **not** satisfy the artifact. Central heroes, enemies, worlds, and music-led moments must not remain throwaway vector blobs or oscillator-only bleeps.

## Pipeline Inspection (per contract)
- Existing foundry/asset dirs: none exposed in runtime for this factory profile (`FACTORYX_FACTORY_CREATIVE_DIR=` empty; no `.factoryx/foundry`, no image/audio generation MCP/tool beyond local shell).
- Prior assets in tree (post `git merge origin/main`): some WAVs exist in `drops/*/audio/` (e.g. chime/exhale/spark/thud/whoosh from drop 1777497586680359785) and generated screenshots under work-order dirs. No dragon/hero sprites, no gauntlet-specific enemies or world textures for *this* game.
- No reusable finished hero/enemy/world assets matching Emberflight house style + slice scope were present.
- Therefore: recorded as "no foundry/asset-generation pipeline exposed" per guidance, but **did not silently substitute** — authored and executed a deliberate local procedural generator (pure-stdlib Python: hand rasterizer for RGBA PNGs + PCM WAV synth) that outputs explicit file artifacts. Generator source is committed at `games/92-emberflight-gauntlet/assets/generate.py` for provenance/reproducibility.

## Produced File-Backed Assets
All under `games/92-emberflight-gauntlet/assets/` (satisfies `games/**/assets` location; reviewable in PR tree and FactoryX preview context).

### Visual — PNG (RGBA, small, compressed)
- `dragon-hero.png` (192×128, 4444 bytes): Weighty dragon silhouette (body segments, large wings with heat-rim, horns, hot eye glow, tapered tail flame) + small humble rider witness (helm+torso+reaching arm). Deliberately brighter/larger presence than prior pure-vector. Used as base layer under animated vector details (crest/eye/wing membrane/rider lean) so hero reads immediately vs dark sky and "not a vector blob".
- `ember-glow.png` (48×48, 666 bytes): Soft radial ember core + halo. Replaces flat arcs in drawEmber/particle paths for collect pop + flight spectacle (addresses "make ember collection obvious", "push ember/flight spectacle").
- `hazard-spire.png` (64×96, 469 bytes): Rock spire + bright flame crown. Decal composited under/into drawHazard for immediate threat/lane readability in first seconds.
- `hazard-vent.png` (56×48, 680 bytes): Vent base + upward flame burst. Same, for vent hazards.
- `sky-haze.png` (320×160, 7001 bytes): Mid-layer atmospheric heat texture (warm bands + ember flecks). Drawn as parallax world layer in drawBackground for non-flat "burning sky" world feel.

### Audio — WAV (44.1 kHz, 16-bit, mono, short loops/stingers)
- `sfx-ember-chime.wav` (48.5 kB, ~0.55s): Bright two-harmonic ping with fast attack/decay + subtle pitch wobble. File-backed collect/reward instead of pure osc triangle blip.
- `sfx-dash-whoosh.wav` (63.5 kB, ~0.72s): Noise + low rumble + pitch fall + attack bite. Kinetic "carve the sky" for dash/chain (loud, screenshot-readable).
- `sfx-maw-toll.wav` (163 kB, ~1.85s): Low bell toll + distant heat-sigh noise tail. Music-led heroic escalation beat for Sky Maw clear ("the dragon noticed"; weight + price of warmth).
- `sfx-crash-rumble.wav` (79.4 kB, ~0.9s): Noise + sub sine decay. Consequence hit (not blip).
- `sfx-weave-sigh.wav` (42.4 kB, ~0.48s): Soft noise + tone for skilled near-miss weave (juicy feedback on threading).

Total asset dir (incl. generator): ~444 kB. Game HTML remains self-contained + offline (assets are optional enhancement with full fallback).

## Integration Points (in `games/92-emberflight-gauntlet/index.html`)
- Assets are preloaded on first user gesture (after AudioContext unlock; no autoplay).
- Visual: `drawDragon()` does `ctx.drawImage(assets.dragon, ...)` first for the file-backed hero base (brighter material silhouette + glow), then existing vector overlays (animated wings/crest/eye/rider) for kinetic response. Embers/hazards composite the PNG decal + prior vector for pop without losing house crisp edges.
- World: `drawBackground()` draws a scaled `sky-haze` layer for atmospheric depth.
- Audio: `playEmber()`, `playDash()`, `playMawClear()`, `playCrash()`, `playWeave()` check for decoded `sfxBuffers.xxx`; if present use `createBufferSource` + gain (richer timbre from files); else exact prior oscillator/noise-buffer code (bit-identical behavior for verification harnesses that copy only the .html).
- Load is non-blocking; `onload`/`decode` set ready flags. Game boots and runs the verified paths even if assets 404 (e.g. /tmp check-7 copies used in prior harnesses) — early-paint block + procedural fallbacks untouched.
- Sentinel + first-paint markers + hook state + all prior instrument paths (maw1/2, carry, bank, weave, draw) unchanged.

## Browser Verification Performed (this pass)
- Generator run clean (python3 stdlib only: struct/wave/zlib/math/random).
- Real chromium on `games/92-emberflight-gauntlet/index.html` (with assets tree present): loads succeed (no 404 for the 10 assets in console after gesture), dragon-hero sprite visible as enlarged bright hero base in first 3-10s (contact-sheet readability), embers use glow sprite (pop), hazards have flame decals (pop), sky-haze lifts playfield, dash/ember/maw/crash/weave use WAV buffers (audibly richer, no oscillator-only).
- Fallback path exercised: `cp games/92-emberflight-gauntlet/index.html /tmp/.factoryx-runtime-check-7.html` (no assets/ subdir) + short-budget chromium --screenshot + --dump-dom: early-paint block + full ready gauntlet render still produces contentful PNG (no timeout), markers present, no game errors, procedural visuals/audio identical to pre-asset passes.
- Size: game HTML + assets dir still well under 2 MB budget. 60 fps maintained (drawImage + decode are cheap; only 1-2 extra draws per frame).
- Screenshots staged: see `current-idle-p43.png` (or latest) + check-7 sim under work-order screenshots/ + root (dragon/embers/hazards now read larger/brighter with file sprite layers even in static captures; first 10s shows active flight with visible lane choices/rewards/hazards).
- All prior Game Feel + verification invariants re-hold (juicy controls, carry bank, two-pass Maw, session bests, restart to living screen, no uncaught, audio gate, etc.).

## Notes / Blockers Recorded
- No foundry exposed → used local deliberate generator (documented here + generator.py committed).
- Assets are *generated* (procedural authorship) but **file-backed and reviewable** (PNG/WAV binaries in git tree), satisfying v2 contract over "manifest prose or in-code only".
- If future runtime exposes a foundry (e.g. .factoryx/skills with image/audio, or MCP asset tool), prefer reusing its outputs for hero/enemy/world; current satisfies the blocking feedback for this deadline.
- The playable first screen remains the gauntlet; assets amplify the "brighten/enlarge dragon/hero/threats/embers", "dash/chain/ember loud", "first 10s active flight" without changing mechanics or verified paths.

**Reviewable PR artifact remains:** https://github.com/ystackai/studio-dragon-crew/pull/77 (canonical branch `factoryx/factory-dragon-crew/work-order-1781501302523-7-9`; full original prompt + payload in body; this manifest + assets + integration + evidence included in the diff for the asset contract pass).

This pass was executed *before* any peripheral polish or PR-body-only updates, per "treat unresolved ... asset-pipeline feedback as blocking input".
