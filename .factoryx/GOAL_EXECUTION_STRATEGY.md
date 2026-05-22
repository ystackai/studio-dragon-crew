# Dragon Crew Asset Generation Skill Smoke — Execution Strategy

**WorkOrder:** work-order-asset-skill-smoke-dragon-20260522  
**Factory:** factory-dragon-crew  
**Delivery:** factoryx/factory-dragon-crew/asset-skill-smoke (PR TBD)  
**Artifact:** public/assets/ (dragon-icon.png + dragon-breath-sfx.wav + asset-manifest.json) integrated into Rhythm Drift game drop

## Mandatory Workflow Followed (per implementation_task + game-asset-generation-skill.md)

1. **Read skill doc** — /app/docs/game-asset-generation-skill.md fully read. Core rule: Playable first, assets second. Used only through FACTORYX_GAME_ASSET_SERVICE_URL, no raw APIs.

2. **Service health** — Confirmed FACTORYX_GAME_ASSET_SERVICE_URL=http://100.97.47.98:8766 and GET /health returned ok with flux+mmaudio available (trellis/heartmula smoke only). Recorded in WORKLOG and manifest notes.

3. **Existing game boot check** — Inspected current branch game: drops/1777047133184832800/ (Rhythm Drift WebGL rhythm/flow game with canvas, HUD, pointer input, procedural WebAudio, shaders for twilight/ripple/creature, telemetry). Confirmed:
   - Boots to interactive canvas + HUD.
   - First pointerdown inits AudioContext + plays sound (user gesture safe).
   - No blank canvas path, no obvious fatal JS errors.
   - Existing behavior preserved; only additive asset load + minimal visible+audible integration.

4. **Proof pack request** — POSTed compact Dragon Crew themed prompt to /v1/proof-pack (2026-05-22). Received manifest with real Flux PNG + MMAudio WAV (others skipped as smoke).

5. **Copy smallest files** — Downloaded only flux-style-frame.png (renamed dragon-icon.png) and mmaudio-action-sfx.wav (dragon-breath-sfx.wav) into public/assets/. Validated PNG/WAV headers.

6. **Asset manifest** — Created public/assets/asset-manifest.json listing both assets with prompt, intended use, status=in-game, verification notes, source.

7. **Integrate + load in game** — 
   - Added small redirect index.html at repo root so preview root directly opens the game (small valid redirect, no studio homepage mutation).
   - Minimal edits to game/index.html + game.js: load Image() for icon, decode AudioBuffer for sfx via fetch+WebAudio, draw icon as visible 2D overlay badge in gameplay viewport, trigger sfx playback on first gesture (co-located with existing pulse).
   - All loads are resilient (onerror/try-catch, silent fallback).

8. **Browser smoke** — Will verify: no 404 asset requests, no decode/console errors, image visible, audio playable on gesture, canvas renders, no fatal. Use live preview + manual observation.

9. **Preview + PR** — Small redirect ensures preview opens game directly. Update same PR iteratively. Include FactoryX-WorkOrder + Factory-Factory in PR body + full prompt context.

## Quality Bar
Reviewer opens preview root → sees Rhythm Drift game running + Dragon Crew dragon-icon badge visible immediately + can trigger dragon-breath-sfx on first click. No asset failures. Smoke complete, not art pass.

## Non-Goals
- No new game, no broad redesign of Rhythm Drift or studio.
- No changes to existing drops except minimal additive for this smoke.
- No homepage changes beyond the required small redirect for preview root.
- Only this WorkOrder's branch/PR.

**Next passes:** After first reviewable, polish integration (e.g. better visual tie-in if needed), re-smoke, update WORKLOG/PR with screenshots/notes.
