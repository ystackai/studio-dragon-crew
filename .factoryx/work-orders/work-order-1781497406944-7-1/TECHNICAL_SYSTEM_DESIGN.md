# Emberflight Gauntlet — Technical System Design

**WorkOrder:** work-order-1781497406944-7-1 (strategy) / work-order-1781497948507-7-10 (technical design gate)  
**Factory:** factory-dragon-crew  
**Project:** dragon-crew  
**Role:** planner-default (technical design gate)  
**Branch:** factoryx/factory-dragon-crew/work-order-1781497406944-7-1 (canonical; current checkout source of truth)  
**Title:** Technical design: Emberflight Gauntlet  
**Archetype:** creative_game  
**Planning Template:** browser-game-2d  
**Payload Experiment:** overnight-seven-games-20260615 (dragon-crew-retry1)  
**Required Preview Entrypoint:** games/88-emberflight-gauntlet/index.html  
**Status:** Technical design gate — no production implementation yet (per protocol). Strategy is plan of record.

---

## Purpose and Scope of This Document

This is the technical counterpart to `GOAL_EXECUTION_STRATEGY.md`. It translates product intent, player fantasy, house style, core loop, art/audio direction, placeholder retirement rules, and Game Feel Checklist into concrete:

- Filesystem and module layout (game tree + Work Order memory)
- Data flow, state machine, and timing model
- Libraries, tools, and engine decisions (canvas 2D primary)
- Asset and evidence generation pipeline
- Input, collision, rendering, audio, and scoring subsystems
- Verification steps, acceptance evidence, and rollback considerations
- Risks, mitigations, and explicit implementation non-goals for the taste-gate slice

All durable planning remains under `.factoryx/work-orders/work-order-1781497406944-7-1/`. No games/ tree, no assets, no index.html, and no runtime code changes are made at this gate. The next phase (taste-gate slice) will implement a 30–60s browser-playable vertical slice of one verb in one space, using this design as the plan of record. Material deviations will be recorded here and in WORKLOG.md before proceeding.

References (read before impl):
- `GOAL_EXECUTION_STRATEGY.md` (full vision, loop, mood, asset retirement checklist, game feel)
- `.factoryx/FACTORY_CONTEXT.md` (house style: weight/temperature/consequence, fire as hungry, human as witness, light/atmosphere as character; Fire Dragon persona)
- `.factoryx/skills/game-designer-2d/SKILL.md` (design pass, impl guidance, review checklist)
- Prior drops: `drops/1777399670138868166/` (Elemental Sanctuary: single-file canvas + full WebAudio procedural bed/reverb/phase, gesture audio, minimal HUD, readable states), `drops/1777047133184832800/` (Rhythm Drift: WebGL2 + flow under pressure, resilient asset load, minimal HUD, input cadence), asset-skill-smoke patterns (real generated assets + manifest + resilient decode + graceful fallback)
- `team/avatars/generated/fire-dragon.png` + `prompts/dragon-portraits.json` + `personas/fire-dragon.md` (primary visual north star for scale, palette, ember glow, noble but powerful read)
- Overnight FactoryX game protocol + Game Feel Checklist (embedded in payload and strategy)

---

## Architecture Overview

**Primary stack (taste-gate slice):**
- Single (preferred) or minimal-split self-contained `games/88-emberflight-gauntlet/index.html` + vanilla ES5+/modern browser JS + 2D `<canvas>`.
- No frameworks, no bundlers, no runtime npm deps. Matches sanctuary precedent for fast particle/text/input/collision iteration and strict <2 MB total payload discipline.
- Optional: isolated WebGL2 offscreen or overlay layer *only* for heat-haze/distortion post-effect if 2D multi-pass cost proves too high for "powerful" read (Rhythm Drift precedent exists and can be mined; keep isolated so canvas path remains primary and reviewable).
- Game loop: `requestAnimationFrame` + time-delta accumulation + optional fixed-timestep update for consistent feel. Pause on `blur`/`visibilitychange`. Delta clamp to avoid spiral-of-death on slow frames.
- Audio: Web Audio API only. Context created on first user gesture anywhere (no autoplay). Procedural continuous bed (drone + wind + reverb, retuned from sanctuary to warmer fire palette) + triggered short real asset cues for signature moments (breath burst, crash, ring chain). Master gain + mute control (persisted in sessionStorage/localStorage for retries within page lifetime).
- Input: Unified pointer (mouse/touch) + keyboard. Whole canvas is primary active surface (≥44 px effective touch targets). No tiny buttons.
- State machine (minimal): `ready` (pre-gesture, minimal affordance to start), `flying` (core loop), `crashed` (immediate readable death + score breakdown + large retry), optional transient `paused`.
- Assets: Small coherent authored/generated set committed inside the game tree (dragon frames or spritesheet + 1–3 short audio cues). Everything else (canyon strata, most particles, rings, hazards, wind) is procedural canvas 2D (paths, gradients, alpha layers, noise) for payload, stylistic coherence with prior drops, and infinite-feel variation. Manifest-driven load with decode verification + graceful fallback (never blocks core loop).
- Total tree budget: <2 MB uncompressed for the entire `games/88-emberflight-gauntlet/` (gzipped much smaller). No giant unoptimized images/audio. Real assets reserved for hero readability (dragon bank/breath/crash states + one signature audio cue).

**Why this shape:**
- Matches "Overnight FactoryX game protocol" + "taste-gate slice first" (one verb, one space, browser-playable evidence before systems expansion).
- Sanctuary proved rich procedural audio + canvas 2D can deliver ritualistic, consequential feel with zero external deps after load.
- Rhythm Drift proved flow + time pressure + minimal HUD + resilient loading work at speed.
- House style demands weight, sparks, smoke, heat haze, ember trails — all achievable with 2D canvas + particles + simple easing without 3D engine or GLTF.

**Non-Web tech / external services (design-time only):**
- Asset generation: FACTORYX_GAME_ASSET_SERVICE (or equivalent Flux for PNG frames, MMAudio for WAV cues) invoked outside runtime. Only smallest usable files committed.
- Verification: local `node --check`, browser devtools (console, network, performance, device emulation), manual play + screenshots, autoreview skill where helpful.
- No server, no DB, no cloud save, no leaderboards in this slice.

---

## Filesystem and Module Layout

### Work Order Memory (durable, all planning/feedback here)
```
.factoryx/work-orders/work-order-1781497406944-7-1/
  GOAL_EXECUTION_STRATEGY.md          (source of product intent; already present)
  TECHNICAL_SYSTEM_DESIGN.md          (this file; created at this gate)
  WORKLOG.md                          (append gate closure + observations)
  PREVIEW.md                          (update with shape confirmation)
  VERIFICATION.md                     (update with design-time verification items + planned runtime steps)
  (FEEDBACK.md if playtest notes appear later)
```

### Game Deliverable Tree (created in taste-gate impl phase only; none present now)
```
games/88-emberflight-gauntlet/
  index.html                          (required preview entrypoint; self-contained playable first screen or minimal split per playbook)
  assets/                             (small coherent set only)
    dragon-flight.png                 (or dragon-spritesheet.png; 4–6 frames: level, bankL, bankR, breath-windup, breath-active, crash)
    ember-burst.png                   (optional small atlas/streak for additive fire/impact; or derive from dragon glow)
    ring-ember.png                    (optional forged-ring prop for collectible readability)
    hazard-rock.png                   (1–2 optional facet overlays for authored diorama read on key strata)
    breath-burst.wav                  (or .mp3; 1.5–3s real MMAudio cue: low whoosh + crackle + vent hiss)
    crash-impact.wav                  (heavy thud + debris + dying sizzle)
    ring-chime.wav                    (optional resonant chain success tone)
  asset-manifest.json                 (or manifest.generated.json; lists each file, source prompt/reference, intended use, size, decode verification steps, status)
  (optional, if split justified:)
  game.js
  styles.css
  (no node_modules/, no dist/, no build caches)
```

**Preview contract (already enacted at strategy gate):**
- `.factoryx/preview-entrypoint` contains exactly `games/88-emberflight-gauntlet/index.html`.
- Preview root (local or `/factoryx/previews/<factory>/<work-order>/`) must land directly in the playable game. No landing page, no giant explanation as first screen.
- Relative paths so copied trees work.

**.factoryx/ root notes (for context, not game code):**
- `preview-entrypoint` (already written with exact path)
- `FACTORY_CONTEXT.md`, `skills/game-designer-2d/`, `skills/autoreview/`

**Commit rules:** Only the smallest useful real assets. Validate magic bytes + decode on load. Inlined data: urls acceptable only for tiniest glyphs. Document every real asset's prompt in manifest.

---

## Core Data Flow and Timing

**Main loop (in index.html script):**
```js
let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  const dt = Math.min(Math.max(rawDt, 0.001), 0.1); // clamp
  last = now;
  update(dt);   // fixed or semi-fixed substeps optional for feel
  draw();
  requestAnimationFrame(frame);
}
```

**GameState (single source of truth object or minimal class):**
- `mode`: 'ready' | 'flying' | 'crashed'
- Player: `x, y, vx, vy, bankAngle, bankTarget, pitch, heat, heatRecoverTimer, fireActiveUntil`
- World: `scrollX` (auto-advance), hazard list (simple structs: type, x, y, w, h, phase), ring list, target list, windZones
- Score: `distance, rings, targets, combo, comboTimer, peakCombo`
- Particles: pooled array of {x,y,vx,vy,life, type:'ember'|'smoke'|'spark'|'scorepop'}
- Audio: context, masterGain, buffers (for real cues), procedural nodes (drone oscs, wind noise, reverb convolver, lowpass)
- Session: `bestStreak`, `mute`, `firstGestureDone`
- Death record: `cause` (hazard id or 'wall'), `finalScore`, `breakdown`

**Update(dt) flow (flying mode):**
1. Input intent → apply to `bankTarget` / `pitchTarget` / `fireRequest` (easing applied here or in integrate).
2. Dragon dynamics: `bankAngle = lerp(bankAngle, bankTarget, bankEasing * dt)`; apply inertia (vy damped by bank, forward speed modulated slightly by pitch/heat). Add smoke/ember trail particles on wing edges when banking or breathing.
3. World advance: `scrollX += forwardSpeed * dt` (constant base + slight ramp or wind variance). Spawn/despawn hazards/rings/targets ahead using authored pattern seeds + light random jitter for "alive" canyon (no heavy proc gen).
4. Forces: apply wind shear zones (instant velocity delta + visual distortion cue). Gravity feel on y (subtle).
5. Heat: if `fireActive` decrement; else recover slowly. Clamp 0–1.
6. Collision:
   - Broad: simple rects or circles for dragon (bank-adjusted AABB or oriented ellipse) vs walls (left/right canyon bounds) + hazards.
   - Narrow: point-in-ring for threading (tolerance on center + velocity alignment bonus); flame-cone overlap for targets.
   - On hit hazard/wall: immediate `mode = 'crashed'`, spawn heavy tumble particles + smoke, trigger crash cue, record cause + stats, slow sim briefly for readability (optional 200–400ms slow-mo then freeze).
7. Rings/targets: if threaded/flamed and within combo window, increment combo + multiplier, spawn score pop particles, trigger chime or impact cue, extend combo timer. Bonus if flame inside ring chain.
8. Particles: age, integrate velocity (wind + drag), fade alpha, recycle to pool.
9. Score pops: drift upward, scale down, remove.
10. Combo decay: if `comboTimer` expires, reset multiplier.
11. Camera/follow: if any (simple: dragon y influences a gentle vertical bias on draw offset; keep canyon readable at speed).

**Crashed mode update:** minimal (tumble anim or fixed pose + heavy trailing particles, optional camera shake via offset). Listen for retry gesture (space or anywhere tap/click) → reset state (preserve session best), `mode = 'flying'`, clear particles or seed a few, resume audio bed if needed.

**Ready mode:** on first gesture anywhere → init AudioContext (resume if suspended), start procedural bed at low volume, `mode = 'flying'`, seed initial canyon elements, begin scroll.

**Draw order (back to front for readability at speed):**
1. Background strata + parallax walls (multiple offset layers, subtle facet lines, magma veins that pulse slowly).
2. Distant god-ray motes / heat shimmer (low alpha, slow drift).
3. Hazards (hanging stalactites with glowing tips; rising geysers with soft vs hard contrast).
4. Wind shear distortion fields (if WebGL haze: sample; else 2D: faint fast dust devils or horizontal shear lines).
5. Rings (glowing metallic with inner vein pulse; highlight when chain active).
6. Targets (similar language but distinct rhythm/shape; flameable).
7. Dragon: `drawImage` selected frame (or procedural path+gradient fallback) translated/rotated by bank/pitch/breathPhase; chest vents brighten on breath; wing membrane translucency via globalAlpha or separate pass; scale catch-light shift.
8. Flame cone/jet (additive particles or short texture burst + throat glow on dragon art).
9. Active particles (embers additive on top, smoke normal alpha below or layered).
10. Score pops + combo flash.
11. HUD (score top-left or center-top in ember-gold; heat gauge top-right as vent bar or icon that fills/pulses with color; minimal fps in dev).
12. If crashed: semi-transparent overlay, "Ember claimed" or stoic line, breakdown list (rings/targets/distance/combo), large centered "Fly Again" (space or tap anywhere), session best if beaten.

All motion uses easing (no linear teleports). Hit/score feedback at exact contact frame (color pop on ring, particle flash, transient audio, launched score number).

---

## Input System

**Unified model:**
- Pointer (mouse + touch): `pointerdown` anywhere (on canvas) = start game (if ready) or trigger short fire burst (if flying and heat allows). `pointermove` drag anywhere = bank intent (dx → bankTarget) + pitch intent (dy → pitchTarget). Large active surface; no precision required.
- Keyboard (parallel, always): ArrowLeft/Right or A/D → bank; ArrowUp/Down or W/S → pitch; Space (or Enter) → short tactical fire burst (keydown starts, keyup or timer ends the burst; prevents default scroll).
- Touch specifics: `touch-action: none` on canvas; prevent default on moves; effective target ≥44 px (whole canvas qualifies). Portrait + landscape tested; viewport meta present.
- Response budget: visual update on next frame (<16 ms at 60 fps target); audio latency within WebAudio norms. Bank tilt + trail + particles emit immediately on gesture.
- Mute: persistent corner control (icon or "AUDIO" text). Toggles master gain. Survives retries in session. State stored in sessionStorage.

**Gesture audio contract:** AudioContext + first bed voice only after explicit user gesture. No page-load sound.

---

## Rendering, Collision, and Feel Details

- Canvas: full-window (`width/height` set to CSS pixel size * dpr for crispness, or logical + scale for perf). `imageSmoothingEnabled = false` for sharp silhouettes at speed where appropriate; true for soft smoke.
- Dragon collision silhouette: bankAngle modulates width/height or uses a rotated convex shape. Tune iteratively against visual (screenshots of "I was clearly clear but died" are blockers).
- Particles: fixed-size pool (e.g. 256–512). Emitters for: wing trail (smoke + ember on bank), breath (forward cone on burst + chest vents), impact (on flame hit or crash), score (on collect). Velocity + wind + gravity + drag + life. Alpha + scale curves.
- Heat haze / bloom: first attempt pure 2D (soft radial gradients + globalAlpha flicker on hot zones). Escalate to isolated WebGL2 only if "powerful" read requires distortion and perf budget allows (keep effect toggleable for verification).
- Easing everywhere: position, bankAngle, particle emit rate, score pop drift, heat gauge fill, combo label pulse. Use simple lerp or small ease lib (inline `function easeOutCubic(t){...}`).
- Readability at speed: high local contrast on glowing elements (rings, dragon rim, hazard tips) against low-value basalt. Rim light + bloom on flame. Silhouette must remain crisp.
- HUD: low-opacity, high-contrast, positioned to avoid play space overlap. Ember-gold for score/combo. Heat as glowing bar or "vent" icon (fills with color, pulses when low or on burst). Retry large, breathing glow, centered.

---

## Audio System (Procedural + Real Cues)

Modeled on Elemental Sanctuary (pentatonic drone, reverb impulse, phase/layer evolution, gesture-only init) but fire-tempered per strategy:

- Bed (continuous, low energy until gesture): warmer detuned pentatonic/modal (emphasis 138–233 range), slow LFO vibrato, long reverb tail, distant canyon wind noise layer. Evolves subtly with combo (more voices or brighter harmonics on high chains) or speed.
- Action cues (short, real-feeling, triggered):
  - Bank/turn: low-end weight whoosh + high spark crackle (can be procedural or real short asset).
  - Fire burst: primary hero cue — real 1.5–3s MMAudio (low roar + sharp ember crackle tail + body vent hiss). Layered so short taps feel tactical; longer feels dangerous. Chest/throat visual sync.
  - Ring thread: clean resonant chime (higher harmonic of drone) that stacks musically on chains.
  - Target flame hit: satisfying low+bright impact transient.
  - Near-miss gust: rising tension tone or air rush (procedural).
  - Crash: heavy low thud + debris scatter + dying ember sizzle (real cue preferred for weight). Immediate space for retry prompt tone.
- Mixing: masterGain → destination. Dry + reverb split (convolver with generated impulse). Low-pass filter for sweeps. Drag pitch modulation optional. Mute sets master.gain.value = 0 or restored.
- Implementation: `AudioEngine` IIFE or module inside script (like sanctuary). `initOnGesture()`, `playBurst()`, `playCrash()`, `setMute(bool)`, `updateBed(combo, heat)` per frame or on events.
- Resilience: decode failures or missing files → silent (procedural only) but log; never crash loop. Buffers loaded eagerly after first gesture or on idle.

**Asset audio files:** committed as small WAV or MP3 (validate duration <3s, size contribution to <2MB budget). Manifest records exact prompt used for generation.

---

## Asset and Evidence Generation Pipeline

**Visual hero (dragon):**
- Base reference: `team/avatars/generated/fire-dragon.png` (amber/copper/crimson, ember glow between plates, noble face, golden-hour rim).
- Generate 4–6 action frames or one contact-sheet PNG via service: "in flight profile, banking turn left/right (strong wing dip + body roll 15–30°), short burst breath attack (neck compression, chest plates, vents brightening, flame jet forward, wing flare), crash tumble (wings folded/flailing, heavy trailing smoke), powerful but not roaring, golden-hour ember canyon rim light, photorealistic scales with readable silhouette at small canvas size."
- Integrate: `const dragonImg = new Image(); dragonImg.onload = ...; dragonImg.src = 'assets/dragon-....png';` then `ctx.drawImage(..., sx, sy, sw, sh, dx, dy, dw, dh)` using frame rects selected by `bankAngle > 10 ? 'bankR' : bankAngle < -10 ? 'bankL' : breathActive ? 'breath' : 'level'`.
- Fallback: if load/decode fails, render procedural path + linear/radial gradients + wing triangles (retire before review per strategy retirement checklist).

**Other small real assets (as needed for hero readability):**
- 1–2 ember/spark streak textures (additive blend for burst cone + impact).
- 1 "ember-forged ring" prop (glowing metallic with inner vein) + target variant.
- 1–2 rock facet overlays for key hazard bands (augment procedural canyon walls).

**Audio real cues:** 1–3 short files as listed above. Generate via MMAudio service with prompts matching strategy (e.g. "short powerful dragon breath burst whoosh with ember crackle tail and body vent hiss, cinematic, warm, 2 seconds").

**Manifest (`asset-manifest.json`):**
```json
{
  "dragon-bank-left": { "path": "assets/dragon-....png", "frame": {...}, "source": "Flux prompt: ... derived from fire-dragon.png", "sizeKB": 87, "verify": "img.complete && naturalWidth>0 && visible in first 10s bank", "status": "committed" },
  "breath-burst": { "path": "assets/breath-burst.wav", "source": "MMAudio: ...", "durationSec": 2.1, "verify": "decodeAudioData success && plays on burst gesture", "status": "committed" }
}
```
Load code asserts the listed verifications on startup/gesture and logs results (visible in console for verification).

**Generation workflow (impl phase, outside browser runtime):**
1. Use service (or manual equivalent) with house-style prompts.
2. Download smallest usable file (crop/optimize).
3. Validate (file command or magic bytes, decode test in node or browser).
4. Commit under `assets/`.
5. Update manifest + index.html references.
6. Retire placeholders: at minimum dragon hero (bank/breath/crash) + one real audio cue must drive "powerful dragon" read in screenshots and 60s play before review.

**Evidence generation (verification artifacts):**
- Screenshots: desktop (first flight, bank, burst with sparks/smoke, chain, crash+retry) + mobile viewport emulation (no overlap, readable, large targets). Capture via browser or external tool; attach or describe paths in PREVIEW.md / PR body.
- Console/Network dumps: clean (no pageerror, no 404 after load, no uncaught, only local assets).
- FPS: stable ~60 during normal play (profile in devtools Performance tab; cap particle emit if drops).
- Decode proof: explicit logs or test asserts for dragon naturalWidth/Height and audio buffer playable.
- Play video or GIF optional but screenshots + "interacted 60s" narrative required.

---

## Verification, Browser Runtime, and Quality Bar

**Design-time (this gate, already satisfied by reading + inspection):**
- Read strategy + companions + FACTORY_CONTEXT + game-designer-2d skill + sanctuary/rhythm drop patterns + fire-dragon asset.
- Confirmed no production changes outside WO memory.
- `.factoryx/preview-entrypoint` already present with exact path (addressed prior "no preview entrypoint could be resolved" skip).
- gh pr list/view: no PR on branch (correct; will not create from this gate).
- Branch in sync with origin tip for this Work Order.

**Implementation / taste-gate verification (mandatory before any review request):**
1. Repo checks: `node --check games/88-emberflight-gauntlet/index.html` (and game.js if split). Fix all.
2. Local serve + open: e.g. `python -m http.server` or equivalent; load `games/88-emberflight-gauntlet/index.html` (or via preview root). First paint must be the playable game.
3. Real browser runtime exercise (devtools open):
   - Desktop + device emulation (mobile portrait/landscape).
   - First gesture inits AudioContext; no sound before.
   - 0–10s: dragon visible in powered flight, first bank with visible tilt/weight/ember trail.
   - 10–30s: thread ring, feel consequence of over-bank or missed burst, layered audio.
   - 30–60s: chain 2–3 + flame target for cascade; near-miss or crash + retry cycle. Judge "fun/powerful".
   - Mute toggle works; sounds only after gesture.
   - Touch + keyboard both drive the same verbs.
4. Capture + attach evidence (update this file's companions + later PR body):
   - Screenshots as above.
   - Console: clean (pageerror, console.error, 404s after load).
   - Network: only local after initial load; offline replay works.
   - Asset decode: dragon usable size + visible as hero; real audio cue audible on burst/crash (not silent osc fallback).
   - FPS: ~60 stable mid-play (note any particle or haze cost and fixes).
   - Game Feel Checklist items explicitly ticked with notes (see strategy for full list; core verb in 30s, <100ms response + easing, hit feedback, gesture audio, touch≥44px+kb, 60fps, <2MB, no external net).
5. Placeholder retirement re-check: dragon bank/breath/crash states and ≥1 signature real audio cue must be present and selling "powerful dragon" in the captured evidence. Vector blobs or pure-oscillator beeps as hero are blockers.
6. Autoreview / crew: run `.factoryx/skills/autoreview` (or equivalent) as closeout if present; treat as advisory; verify findings in real code/play. Invoke fire-dragon / snow-dragon / sea-dragon agents from `.codex/agents/` for direction/visual/audio passes where helpful.
7. Live preview retest after push: open FactoryX preview URL, bust cache, repeat 60s interaction, post observations/screenshots.

**Failure = blocker:** uncaught errors, blank canvas, missing asset decode, broken controls, <30 fps sustained, >2 MB tree, external network calls at runtime, or "first screen requires reading copy" all must be fixed before further polish or review ask. Do not stop at "static check passed."

**Quality bar (per protocol):** first screen makes sense without extra explanation; interaction coherent to judge in <60s; live preview opens without runtime errors; human review waits until coherent + preview correct + PR body accurate.

---

## Risks, Mitigations, and Known Tradeoffs

- **Particle explosion / perf at speed/combo:** Cap emit rate, use fixed pool, cull offscreen, profile early. Fallback: lower max particles on detected slow frames.
- **Bank angle vs collision mismatch ("I didn't hit that"):** Make silhouette match visual (use same transform for hit test or debug-draw hit shape). Iterate with screenshots of near-misses.
- **AudioContext state across retries:** Resume() on gesture; recreate sources each trigger; keep nodes connected. Test rapid crash/retry.
- **Asset load timing / decode failure:** Load after first gesture or on idle; never block loop. Have procedural fallback always ready; log decode results visibly for verification.
- **Heat haze cost if WebGL added:** Isolate behind flag; measure before/after; provide pure-2D path that still feels "powerful."
- **Mobile text scaling / overlap / tiny targets:** Use relative units or canvas text with dpr-aware sizing; whole-canvas input; test emulation + real devices if possible. HUD safe margins.
- **Total size creep:** Generate smallest usable assets; measure tree after each real asset add; prefer procedural for atmosphere.
- **"Powerful dragon" read depends on real art/audio:** Retirement checklist is non-negotiable for review-worthiness. If generated assets are weak, regenerate or augment with code detail before claiming taste-gate pass.
- **One canyon slice feels repetitive:** Light authored pattern variation + wind + combo pressure + near-miss tension must carry 60–90s repeatability. If mediocre after honest play, pivot verb/space per strategy before polishing.
- **Branch/PR hygiene:** Stay on canonical Work Order branch. Rebase/merge main forward cleanly. No parallel FactoryX branches. Update PR body (when opened post-gate) with full context, scope, preview path, verification output, screenshots, known limitations.
- **Deadline pressure (polish_until_deadline):** Use full budget for quality; first slice mediocre → pivot or polish rather than stop.

**Guiding tradeoffs (from strategy):**
- Weight & power (inertia, heat cost, massy trails) vs accessibility (responsive <100 ms feel, generous but clear limits, visible feedback).
- Real assets for hero readability vs payload/iteration speed (small coherent set only; procedural everywhere else).
- 2D canvas (particle speed, direct input, simplicity) vs isolated WebGL (specific effect only).
- Procedural audio identity (rich bed, zero file weight, variation) vs real cues (signature "I breathed fire / I crashed" moments).

---

## Implementation Non-Goals (This Slice / Gate)

- No production code or asset changes to games/, drops/, team/, public/, or any runtime outside the taste-gate phase after this design is committed.
- No multiple game modes or variant switchers as default experience (one strongest playable mode; compact switcher only if later justified).
- No full canyon level editor, heavy procedural world gen, multiple biomes, or broad settings.
- No complex enemy AI, multi-phase bosses, or inventory/progression systems.
- No persistent leaderboards, cloud saves, achievements, or meta.
- No large audio tracks or external fonts/CDNs/icon sets.
- No drive-by refactors to unrelated studio files.
- Do not present as review-worthy while central hero dragon or signature audio still depend on throwaway placeholders (see retirement checklist in strategy).
- If the 30–60s slice is not interesting after honest play, pivot the verb/space/feel before expanding or polishing.
- No PR or human review request from this technical design gate.

---

## Rollout, Branch, and Preview Notes

- Work exclusively on the checked-out Work Order branch (current source of truth). Rebase/merge `main` as needed to stay current; push updates to `factoryx/factory-dragon-crew/work-order-1781497406944-7-1` (or the exact `FACTORYX_GITHUB_WORK_ORDER_BRANCH` if set and different; current inspection shows 7-1 is active and remote has matching tip).
- No PR created from this gate. When taste-gate evidence exists and is coherent, a single canonical PR from the branch to main will carry the FactoryX Work Order Context section (full prompt + scope + preview path + verification output + screenshots + known limitations).
- `.factoryx/preview-entrypoint` already ensures the preview root resolves directly to the game HTML (no marketing appends).
- After push + any deploy, re-verify live preview root opens the playable game and supports the 60s interaction without runtime errors.

---

## Progress and Sign-off (Technical Design Gate)

This document is the technical design gate deliverable. It specifies filesystem/modules, data flow, libraries/tools (canvas 2D + WebAudio, vanilla, no deps), asset/evidence generation (real small coherent set + manifest + resilient load + decode proof), verification (browser runtime + game feel checklist + retirement + autoreview), risks, and non-goals — all derived directly from the strategy as source of product intent and the `creative_game` / `browser-game-2d` archetype.

**Next (after commit of this design):** taste-gate slice implementation on the same branch — one 30–60s playable ember-canyon dragon flight (bank + short tactical burst + rings/targets + weighty trails + readable crash/retry) as `games/88-emberflight-gauntlet/index.html`. Default directly into the game. Real assets for dragon hero states + ≥1 signature audio cue. Procedural for canyon/particles/bed. Full local verification + evidence capture + WO memory updates before any PR or review.

**Strategy sign-off reminder:** The direction in GOAL_EXECUTION_STRATEGY.md remains the plan of record. Any material deviation (e.g. default to multi-mode, abandon real asset plan for dragon, switch to full 3D) will be recorded as an update to both strategy and this design + WORKLOG before proceeding.

**Gate execution (this agent run):** Inspected branch (HEAD 0e3acb2 on 7-1; remote in sync; gh confirms no PR and no blocking comments/reviews — correct per gate). Re-read strategy + all WO companions + FACTORY_CONTEXT + game-designer-2d skill + sanctuary/rhythm drop sources + fire-dragon asset + preview-entrypoint. Confirmed every required technical section is addressed. No production changes to games/ or elsewhere. `.factoryx/preview-entrypoint` already present. All durable notes kept under `.factoryx/work-orders/work-order-1781497406944-7-1/`. Ready to commit this design and proceed to taste-gate slice (implementation) on the same branch.

**Last updated:** 2026-06-15 — Technical design gate.

---

*We do not tame the dragons. We learn how to stand in their presence without being consumed.* (House style)
