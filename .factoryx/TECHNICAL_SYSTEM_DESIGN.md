# Dragon Crew Asset Skill Smoke — Technical System Design

**Scope:** Minimal proof that FactoryX game asset generation skill (Flux + MMAudio via service) produces usable browser assets that load and appear in an existing playable game without breaking it.

## Architecture
- **Asset Service:** Single source of truth via `FACTORYX_GAME_ASSET_SERVICE_URL` (http://100.97.47.98:8766). POST /v1/proof-pack returns JSON manifest + fetchable asset URLs. Only real backends (flux, mmaudio) used; others ignored per "smallest useful".
- **Repo Asset Layout:** `public/assets/{*.png,*.wav,asset-manifest.json}` — served at `/assets/*` from preview root. Matches skill doc recommendation. No other asset pipelines introduced.
- **Game Integration (Rhythm Drift drop):** 
  - Runtime: WebGL2 + 2D overlay for icon (new Image() + drawImage on a HUD canvas or direct DOM img positioned over gl-canvas).
  - Audio: Existing WebAudioContext (inited on pointerdown gesture). Added decodeAudioData for the WAV buffer + playBuffer() helper. Triggered on first gesture alongside existing pulse (ensures user activation).
  - Fallbacks: All loads wrapped; missing assets → silent/no-op or placeholder; Audio play failures → no throw, just log once.
- **Preview Delivery:** New root `index.html` (HTTP meta + JS redirect, <1s) points to `drops/1777047133184832800/index.html` so `/factoryx/previews/.../asset-skill-smoke/` directly lands on the integrated game. No change to studio.json, README, preview/ gallery, or any homepage semantics.
- **Verification:** 
  - Static: node --check on edited .js (if applicable).
  - Browser smoke (manual on live preview): no failed fetches (Network tab), no console errors (decode, play, CORS), image visible at first frame, audio audibly triggered on tap, canvas renders without blank, game loop stable.
  - Manifest + worklog capture service health, request, files, verification results.

## Data Flow
1. Operator/Agent → POST proof-pack (Dragon Crew prompt) → service generates/copies Flux PNG + MMAudio WAV.
2. Agent downloads → public/assets/ + writes manifest.
3. Game HTML/JS loads assets at init/gesture time (relative to preview root).
4. On gesture: AudioBufferSourceNode plays decoded clip; 2D badge renders dragon icon.
5. Telemetry / console remains clean.

## Constraints / Decisions
- **Minimal diff:** Only additive code (no refactor of shaders, state, render loop). ~20-30 LOC total across 2 files.
- **No redesign:** Rhythm Drift remains the exact same playable experience + one visible badge + one extra sfx on start.
- **User gesture:** Audio strictly after pointerdown (matches existing pattern).
- **Paths:** Absolute `/assets/...` for cross-drop compatibility under preview tree.
- **Formats:** PNG for transparency/2D ease; WAV for universal WebAudio decode (no MP3 patent issues).
- **Polish limit:** Smoke only — if first version passes "see image + hear sfx in <1min play", stop. Further visual binding only if reviewer feedback.

## Files Changed
- public/assets/dragon-icon.png (new)
- public/assets/dragon-breath-sfx.wav (new)
- public/assets/asset-manifest.json (new)
- .factoryx/GOAL_EXECUTION_STRATEGY.md (new)
- .factoryx/TECHNICAL_SYSTEM_DESIGN.md (new)
- .factoryx/WORKLOG.md (updated)
- index.html (new, redirect)
- drops/1777047133184832800/index.html (minimal: img badge + script hook)
- drops/1777047133184832800/game.js (minimal: load + play helpers + call on gesture)

## Risks & Mitigations
- Audio decode fail on some browsers: try/catch + feature detect.
- Path 404 under preview: verified absolute /assets/ works from subdir pages.
- Game already "harden" state on branch: integration tested to not regress existing render/input.

All acceptance criteria from WorkOrder payload addressed.
