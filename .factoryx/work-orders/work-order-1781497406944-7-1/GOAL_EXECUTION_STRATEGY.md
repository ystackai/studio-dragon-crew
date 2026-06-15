# Emberflight Gauntlet — Goal Execution Strategy

**WorkOrder:** work-order-1781497406944-7-1  
**Factory:** factory-dragon-crew  
**Project:** dragon-crew  
**Role:** planner-default (strategy gate)  
**Branch:** factoryx/factory-dragon-crew/work-order-1781497406944-7-1  
**Title:** Strategy: Emberflight Gauntlet  
**Archetype:** creative_game  
**Planning Template:** browser-game-2d  
**Payload Experiment:** overnight-seven-games-20260615 (dragon-crew-retry1)  
**Required Preview Entrypoint:** games/88-emberflight-gauntlet/index.html  
**Status:** Strategy gate — no production implementation yet

---

## Vision and Player Fantasy

The player is a young but capable dragon rider (or the Emberflight dragon itself in mythic first-person weight) hurtling through a living ember canyon at dangerous speed. The fantasy is **not** "cute dragon pet" or "press button to win" — it is **commanding an ancient, heavy, fire-blooded creature through a hostile, beautiful, moving environment** where every bank, every burst of flame, and every chained ring feels like a negotiation with power, heat, and momentum.

The dragon must feel **alive and consequential**: its wings have mass, its breath has temperature and limited fuel, its presence changes the air (sparks, heat haze, smoke trails). Success feels like riding a storm you partially control. Failure feels like the canyon taking its due — swift, readable, and motivating for one more run.

Primary emotional payoff: the moment a well-timed short fire burst clears a cluster of hazards *and* lights up a chain of rings, producing a visible/audible cascade of score, embers, and forward surge. The player should feel "I am the fire in this canyon" within 60 seconds.

---

## Mood, World, References, and Emotional Target

**World:** A narrow, winding ember canyon at twilight / golden-hour bleed. Jagged basalt and cooled-lava walls glow with faint vein lines. Hanging ember stalactites drip sparks. Wind gusts carry glowing motes. Occasional "veins" of brighter magma that pulse. The space feels ancient, patient, and actively hostile to the small fast thing moving through it — echoing the Dragon Crew house style: "weight, temperature, and consequence." Light and atmosphere are characters: heat shimmer, low contrast silhouettes at speed, bloom on flame.

**Mood & Emotional Target (per house style):**
- Ancient patience mixed with sudden terrifying intensity.
- The dragon/rider is a guest who must move with respect and precision; the canyon does not care.
- Wonder with teeth: beauty (glowing rings, ember waterfalls) always carries risk.
- Never cartoonish, never purely "cool badass." The fire has hunger and cost.

**Key References & Evidence from Studio:**
- House Style (FACTORY_CONTEXT.md): elemental materiality, fire as hungry/flickering/ember trails/heat haze; scale and presence (dragon larger than human elements); light as character; consequence and resistance; ritual and repetition.
- Fire Dragon persona (personas/fire-dragon.md + .codex/agents/fire-dragon.toml): radiant, bold; "hunger, transformation, and the price of warmth"; "feel the temperature on their skin"; "the cost of power."
- Prior playable slices:
  - Elemental Sanctuary (drops/1777399670138868166, 1777356037620358949): breath as core verb (hold to inhale, release to exhale), phase-driven audio layers, pentatonic drones + reverb + gesture-only audio, elemental icons, clean readable fail/success states, canvas 2D + WebAudio procedural richness.
  - Rhythm Drift (drops/1777047133184832800 + shaders/): flow state under time pressure, input cadence producing visible ripples/particles, WebGL2 + procedural textures, minimal HUD, strong "active vs drift" tension, resilient asset loading patterns.
  - Dragonbound Depths history (WORKLOG excerpts): Ember + Cinder dragon companion, layered authored environments, ember motes/pollen, god-ray effects, strong silhouette readability, "13s+ no-input survival" as safety gate, real sprite authorship over blobs.
- Asset generation precedent (asset-skill-smoke): real Flux PNG + MMAudio WAV pulled via service, inlined/committed small, manifest-driven, graceful fallback, integrated visibly/audibly on gesture.
- Dragon portraits (team/avatars/generated/fire-dragon.png + prompts/dragon-portraits.json): photorealistic friendly Fire Dragon — amber/copper/crimson scales, soft ember glow between plates, noble welcoming face, volcanic stone, golden hour. Base reference for heroic but not monstrous hero; action variants will be derived.
- Game Feel Checklist (embedded in Work Order): input <100ms response + easing; hit/score feedback; audio only after gesture; touch ≥44px + keyboard; 60fps mid-laptop; <2MB total; no external net deps; core verb in first 30s.

**Non-Goals (explicit from protocol + taste-gate):**
- No landing page, marketing hero, giant explanation panel, or option gallery as default experience.
- No save/load, inventory, multiple levels, broad procedural generation systems, achievements, or persistent meta-progression unless explicitly added later.
- No cartoon or low-effort placeholder hero (vector blobs, circles, untextured primitives).
- No autoplay audio; no external CDNs or network calls at runtime.
- No over-scope into full 3D engine, GLTF, physics libs, or multi-biome worlds for this slice.

---

## Core Interaction Loop and Progression

**One strong verb in one space (Taste-gate slice first):**
Primary verb: **Fly with weight + Bank + Short tactical fire bursts**.

The canyon auto-scrolls forward at speed (player controls lateral/vertical position + facing via banking). The dragon has inertia and "mass" — sharp turns cost time/energy and leave a visible smoke/ember trail; recovery has easing. 

- **Move/Aim:** Pointer drag (or arrows/WASD) banks and pitches the dragon. Vertical drag primarily controls altitude in the canyon slice; horizontal controls lateral bank/position. Banking visibly tilts wings/body and narrows or widens the effective collision silhouette.
- **Act (fire):** Short burst (space / tap / click while gesturing) — limited duration "tactical" flame cone or jet. Costs "heat" resource that recovers slowly. Successful hits on targets or chaining rings produces strong visual (lit particles, screen heat flash), audio punch, and score/combo surge. Flame can also briefly clear small debris or give micro-boost.
- **Threat / Timer pressure:** Forward speed is constant or slightly increasing; walls, hanging hazards, rising ember geysers, and "wind shear" gusts that shove the dragon. A "heat" or "stamina" meter for flame encourages planning bursts rather than holding. Distance or time survived + rings chained + targets flamed = score.
- **Score / Progression (within run):** Combo multiplier for threading rings in sequence without break; bonus for flaming a target while inside a ring chain; visible "ember score pop" numbers that linger and drift. High-score or best-streak persists for the browser session only.
- **Failure / Retry:** Collision with hazard or wall triggers immediate, readable crash: dragon tumbles with heavy smoke + sparks, camera or world slows briefly, clear "Ember claimed" or stoic line, final score breakdown (rings, targets, distance, combo peak), large inviting "Fly Again" (space / tap anywhere). Restart is near-instant (1-2s) with minimal reset state, preserving the "one more run" compulsion. No long death animations that frustrate.

**30–60s evaluability target (per protocol):**
- 0–10s: See dragon in motion, feel weight on first bank, understand that fire button exists and has a visible short burst + heat cost.
- 10–30s: Thread first ring, feel consequence of over-banking or missed burst, hear first layered audio response.
- 30–60s: Chain 2–3 rings + flame a target for visible cascade; experience a near-miss or clean crash + retry. Player can judge "is this fun/powerful" without reading instructions.

**Fail/retry loop must be satisfying:** death state shows the exact hazard that got you, score is celebrated on success runs with the same weight as failure is respected. No "you died" shame; the canyon is vast and old.

---

## Art / Audio / Interaction Direction

### Visual Identity (House Style + Emberflight)
- **Palette:** Deep near-black basalt (#0a0806), ember orange (#ff6a2a), copper/amber (#c46a2f), heat gold (#f5c16c), smoke gray-violet (#3a2f2a), occasional magma vein crimson. Low overall value with high local contrast on glowing elements.
- **Materials:** Basalt feels dense and ancient (subtle facet highlights, not flat). Ember effects have real "hungry" flicker and trailing persistence. Heat haze distortion on hot zones. Smoke is volumetric-feeling (layered alpha, slow dissipation, wind affected).
- **Dragon (hero art):** Powerful, not mascot. Large wingspan relative to canyon slice. Visible weight in banking (wing dip + body roll). Ember vents along neck/chest that glow brighter on burst. Scales catch light with metallic sheen. Wings have membrane translucency and structural "finger" weight. When breathing fire, chest/ throat brightens and particles eject forward with force.
- **Lighting:** God-ray style ember motes in air when calm; harsh directional flare and bloom when flame is active; rim light on dragon and ring edges to keep readability at speed.
- **UI/HUD:** Minimal, high-contrast, low-opacity, positioned to avoid overlap with play space. Score/combo in ember-gold. Heat gauge as a glowing bar or "vent" icon that fills with color and pulses. Retry prompt large and centered on death with subtle breathing glow. No card panels.

### Musical & Audio Identity
- **Sparse, triggered, consequential (like Elemental Sanctuary but fire-tempered).** Default to off or extremely quiet until first user gesture.
- **Bed:** Low pentatonic or modal drone (inspired by sanctuary 432Hz reference + fire-tuned intervals: emphasis on 138–233 range but warmer, slightly detuned for "heat"). Slow LFO vibrato, long reverb tail, occasional distant "canyon wind" noise. Evolves subtly with speed or combo (more voices or brighter harmonics on high chains).
- **Action cues (short, punchy, real-feeling):**
  - Bank/turn whoosh with low-end weight + high spark crackle.
  - Fire burst: short roar (low oscillator + noise burst) + sharp ember crackle tail + body "vent" hiss. Layered so short taps feel tactical; held bursts feel dangerous.
  - Ring thread: clean resonant chime (higher harmonic of drone) that stacks musically on chains.
  - Target flame hit: satisfying "impact + bloom" low + bright transient.
  - Near-miss gust: rising tension tone or air rush.
  - Crash: heavy low thud + debris scatter + dying ember sizzle (then immediate space for retry prompt tone).
- **Mute control:** Simple, large, always-visible speaker icon (or "AUDIO" text) in corner. Toggles master gain. Remembers state across retries in session. AudioContext only created after first gesture anywhere.
- **Goal:** The mix should make the player *feel* the dragon's power and the canyon's heat in their chest — not just hear beeps. Use real generated short cues (via asset service precedent) for key hero sounds rather than pure oscillator beeps.

### Interaction Feel (Game Feel Checklist alignment)
- Easing on all dragon motion, camera follow (if any), particle emission, score pops, heat gauge.
- Every input produces immediate perceptible response (bank tilt + trail, burst flash + particles + audio).
- Hit/score feedback at the exact frame of contact (particle flash, color pop on ring, audio transient, score number launch).
- Touch targets large; whole canvas is active surface. Keyboard fully supported in parallel.
- 60fps target on mid hardware via careful particle budgets and requestAnimationFrame with time delta.

---

## Real Asset Plan (Authored / Generated)

**Guiding rule (from protocol + house style + asset-skill precedent):** Placeholder primitives, vector-blob characters, and oscillator-only beeps are **not** the target. We will generate and integrate a **small coherent set** of real assets and retire placeholders before calling the slice review-worthy.

**Sources:**
- Existing: team/avatars/generated/fire-dragon.png (and contact-sheet) as primary reference for scale language, scale texture, ember glow between plates, noble head profile, color story.
- Generated via FACTORYX_GAME_ASSET_SERVICE (Flux + MMAudio) as done in asset-skill-smoke: small proof-pack style requests for action-specific assets only. Commit only the smallest useful files; validate headers; include in manifest notes.
- Procedural augmentation: canyon walls, background strata, most sparks/smoke/heat-haze/motes, ring geometry, and many particle behaviors will be code-driven (canvas 2D paths + gradients + alpha) for payload and stylistic coherence with prior sanctuary/drift work. Real images are reserved for hero dragon readability and key 1–2 audio events.

**Planned small coherent asset set (target < ~800kB compressed total for game dir):**
- **Dragon hero (visual):** 1 contact-sheet style PNG (or 4–6 separate small frames) covering: level flight (wings mid), bank left, bank right, breath wind-up, breath active (throat/vent glow + wing flare), crash tumble. Derived from fire-dragon portrait prompt + "in flight profile, banking turn, short burst breath attack, powerful but not roaring aggression, golden-hour ember canyon rim light, photorealistic scales with readable silhouette at small size."
- **Fire / VFX elements (small):** 1–2 compact ember/spark atlas or streak textures for burst cone and impact hits (additive blend). Optional single heat-haze distortion map if using WebGL layer.
- **Props (minimal):** 1 ring/target "forged ember" prop (glowing metallic ring with inner vein, readable as collectible vs hazard at speed). 1–2 rock hazard silhouette variants if needed for variety.
- **Audio (real, not beeps):** 1 short (1.5–3s) "dragon breath burst" whoosh+crackle (MMAudio). 1 short "heavy impact crash + sizzle". Possibly 1 resonant "chain ring success" chime. All start after gesture; mixed with rich procedural bed and stingers.
- **UI / misc:** Tiny (or none) — rely on canvas text + simple stroked shapes for heat gauge, score, retry. If any icon, derive from existing dragon portrait crop or generate 64px "flame vent" glyph.

**Asset manifest (to be created in impl under the game dir or .factoryx/work-orders/...):** lists each file, source prompt or reference, intended use (e.g. "dragon-bank-left: 128x64 frame for tilt state"), verification (decode + visible in first 30s play), status.

**Integration plan:** Assets loaded via Image() + fetch/decodeAudioData (resilient, with try/catch and silent vector fallback only for smoke). Draw with context.drawImage using src/dest rects for frames. AudioBufferSource + gain for triggered cues layered over master procedural graph (modeled on sanctuary reverb + drone + filter system, retuned to ember palette).

**Payload discipline:** All assets committed inside games/88-emberflight-gauntlet/ (or inlined as conservative data: urls for tiniest). No node_modules, no build step unless repo already has one for this path. Total game tree <2MB uncompressed, gzipped much smaller.

---

## Character and Creature Art Plan (Embodied Dragon)

The central hero **is** the dragon (or dragon + small rider silhouette for scale per house style). Human figure, if present, is witness/scale only — never the power center.

**Contact / reference sheet basis:** Use existing fire-dragon.png + generated action variants. Key poses/frames to plan (selected for readability under motion + canyon scale):
- Level cruise (wings at mid-beat, neck extended, ember vents low glow).
- Bank left / bank right (strong wing dip + body roll 15–30°, tail counter-curl, scale catch-light shift).
- Breath wind-up (neck compression, chest plates separate slightly, vents brightening).
- Breath active (flame jet forward-down or forward, wing flare for stability, full vent glow + particle ejection from mouth/throat).
- Crash / tumble (wings folded or flailing, body corkscrew, heavy trailing smoke, head down).
- Optional portrait/idle for death screen or score recap (calm noble gaze from source portrait, perhaps with a single ember drifting across frame).

**Enemy / hazard silhouettes (supporting cast, not heroes):** 
- Hanging ember stalactites (dense, faceted, glowing tips).
- Rising geyser plumes (soft vs hard contrast for readability).
- Wind-shear "shapers" (subtle transparent distortion fields or fast dust devils).
- Ring props and target "runes" (forged, metallic, inner fire — distinct from hazards via glow rhythm and shape language).

**Asset manifest contract for impl:** Enough frames/poses that a developer can replace any remaining procedural dragon renderer (e.g. path + gradient dragon) with `drawImage` calls selected by `bankAngle`, `breathActive`, `velocity`, `state` without changing game feel or collision. Silhouettes must remain crisp and high-contrast against canyon walls at game speed.

**Rider (if included):** Tiny, hooded, gripping, reacting to banks and bursts — provides human scale per "The human figure as witness." One or two small frames only; subordinate to dragon.

---

## Placeholder Retirement Checklist

We will **not** present the game as review-worthy while central hero, enemies, or musical identity still depend on throwaways.

Identified temporary stand-ins (to be retired with real/generated assets before final taste-gate or review pass):

1. **Dragon body/wings (initial):** Procedural canvas paths + linear gradients + simple wing triangles. → **Replace with:** 4–6 frame real dragon sheet (Flux generated from fire-dragon base + flight prompts); drawImage + source rects; keep procedural only for fine wing membrane edges or secondary accents.
2. **Fire breath:** Basic triangle + particle points in orange. → **Replace with:** Short burst texture atlas (or multi-pass additive particles driven by real ember texture) + chest vent glow sourced from dragon art; audio burst from real MMAudio file.
3. **Sparks / smoke trails:** Pure `ctx.arc` + `fillStyle` rgba. → **Replace/augment with:** 1 small real spark streak texture (additive) + layered alpha smoke quads using subtle noise or tiny generated texture; wind-affected velocity.
4. **Rings / targets:** Stroked circles + fill. → **Replace with:** 1 real "ember-forged ring" prop image (or crisp vector + glow overlay from generated metallic texture); same for target crystals with inner vein.
5. **Canyon walls/hazards:** Simple rects + jagged lines. → **Augment (not fully retire):** Keep heavy procedural for infinite-feel strata and parallax layers (performance + style match to sanctuary/drift); add 1–2 real rock facet overlays or normal-ish detail maps in key focal bands for "authored diorama" read like Dragonbound.
6. **Audio bed + cues:** Pure oscillators + impulse reverb (already rich per sanctuary precedent). → **Retire "beep-only" perception:** Add 1–3 short real generated cues (breath, crash, ring-chain) as primary hero feedback; keep procedural for continuous wind/drone/whoosh layers and variation. Document in manifest "procedural is intentional for bed; real assets for signature moments."
7. **UI icons / heat gauge:** Text + rects. → Optional: tiny 1–2 glyph crops from dragon portrait or generated 64px vent/flame.

**Retirement gate:** Before asking for review or marking taste-gate complete, at least the dragon hero (bank/breath/crash states) and one signature real audio cue must be visibly/audibly present and driving the "powerful" read in screenshots and 60s play. Vector fallbacks remain only for secondary atmospheric elements.

---

## Engine, Asset Pipeline, Controls, and Verification Implications

**Engine / Tech:**
- Primary: Single (or minimal-split) `index.html` + vanilla JS + 2D Canvas (preferred for fast iteration on particles, text, input, collision, and <2MB discipline). Matches many successful prior drops.
- Optional: A lightweight WebGL2 overlay or offscreen for heat-haze/distortion post if 2D perf allows without complicating the first slice (Rhythm Drift precedent exists and can be mined).
- No frameworks, no build, no external runtime deps. Self-contained after load.
- Game loop: `requestAnimationFrame` with `dt` accumulation, fixed timestep where helpful for consistent feel, pause on blur.
- State machine: ready (pre-gesture overlay minimal), flying (core loop), crashed (readable death + retry affordance), paused (if needed, rare for this).

**Asset Pipeline:**
- Generate via service (Flux/MMAudio) → download smallest files → validate (magic bytes, decode test) → commit under games/88-emberflight-gauntlet/assets/ or inlined judiciously → reference via relative paths or data: for tiniest.
- Manifest: `games/88-emberflight-gauntlet/asset-manifest.json` (or in WO context) with prompt, use, size, verification steps.
- Load: eager on first gesture or idle after start; resilient onerror paths that keep game playable (never block core loop).
- Decode checks in verification: `img.complete && img.naturalWidth > 0`; `audioCtx.decodeAudioData` success + playable buffer; no 404s in Network panel.

**Controls (keyboard + pointer/touch, responsive):**
- Pointer: mousedown/touchstart anywhere begins or triggers burst if in flight; drag anywhere translates to bank/pitch intent (map dx/dy to angular velocity with easing and clamp). Large active surface.
- Keyboard: ArrowLeft/Right or A/D for bank, ArrowUp/Down or W/S for pitch, Space (or Enter) for short fire burst. Prevent default scroll.
- Touch: ≥44px effective (whole canvas qualifies); no tiny buttons. Virtual "fire" can be anywhere or a persistent but unobtrusive zone.
- Response: <100ms visual (bank angle updates immediately, particles emit on gesture, flame cone appears on burst). Audio latency acceptable within WebAudio norms.
- Mobile: viewport meta, touch-action none on canvas, test in portrait + landscape; HUD and text scale/readable; no overlap.
- Mute: persistent control (localStorage or session) that survives retries.

**Verification Implications (per Work Order protocol + Game Feel Checklist):**
- **Repo checks:** Run any existing node --check, lint, or studio verify scripts before push. Fix console errors, blank canvas, missing asset paths.
- **Browser runtime (mandatory):** Open preview locally (or via deployed /factoryx/previews/...), interact immediately (no giant instructions), capture:
  - First 10s: dragon visible in flight, first bank with visible tilt/weight/ember trail.
  - 30–60s: fire burst with sparks/smoke, at least one ring threaded or target hit with score feedback, one crash + retry cycle.
  - Evidence: screenshots (desktop + simulated mobile), console clean (no pageerror, no 404, no uncaught), Network tab showing only local assets after load, FPS counter stable ~60 during normal play.
- **Decode + real assets:** Explicit checks/logs that dragon image(s) decoded to usable size, real audio buffer plays on burst/crash, not silent oscillator fallback.
- **Game Feel gates (checkbox before review):** core verb in 30s; input response + easing; hit feedback; gesture audio only; touch/keyboard; 60fps mid-laptop; <2MB; offline after load.
- **Autoreview / crew:** Use .factoryx/skills/autoreview where helpful for closeout, but human-visible playtest + screenshots are primary. Water/Ice/Snow/Sea dragons can be invoked for code, visuals, audio passes.
- **Known risk areas to watch:** Particle count explosion at speed (cap + pool); hitbox vs visual mismatch on banking dragon (tune iteratively with screenshots); audio context state across retries; mobile text scaling; heat haze perf if added.

**Preview setup (to be enacted in impl, noted here):**
- Write `.factoryx/preview-entrypoint` containing exactly `games/88-emberflight-gauntlet/index.html`.
- The entrypoint file or a tiny root redirect (per prior drops) makes the Work Order preview root open directly into the playable game, not a marketing page or gallery.
- Prefer relative links so copied preview trees work under `/factoryx/previews/<factory>/<work-order>/`.

---

## What Not to Build (This Gate + Scope Discipline)

- No production code changes outside the strategy doc and WO memory files until this strategy is committed and direction confirmed.
- No multiple game modes or variant switchers in the first slice (one strongest playable mode only; compact switcher only if later justified).
- No full canyon "level editor" or heavy procedural world gen; one strong authored-feeling space with enough variation to feel alive for 60–90s runs.
- No complex enemy AI or multi-phase bosses for the taste-gate (simple moving hazards + patterns suffice).
- No large audio files or music tracks; no external fonts or icon sets.
- No persistent leaderboards, cloud saves, or social features.
- No drive-by refactors to unrelated studio files, drops, or the preview gallery.
- Do not call the slice "done" or request review while hero dragon or signature audio still depend on throwaway placeholders (see retirement checklist).
- If the first 30–60s slice is mediocre after honest play, pivot the verb/space/feel before polishing or expanding systems.

---

## Audience / Admin Experience, Guiding Tradeoffs, References, Progress Updates

**Audience:** Players who want a short, intense, high-agency arcade experience with mythic weight — dragon fantasy fans tired of mascot dragons, fans of "flow state under pressure" games (Resogun, F-Zero, old arcade flyers), anyone who enjoyed the breath ritual in Elemental Sanctuary or the cadence in Rhythm Drift. Session length target: 1–3 minutes per "run + retry" loop; immediately graspable, deeply repeatable.

**Admin / Reviewer Experience:** Direct load of the preview entrypoint yields the playable game as the first (and only) screen. No scrolling past copy. A new player can be handed the URL and judged in <60s. Screenshots and short play videos will be attached to PR and WO notes. Console and network are clean by construction. The PR body will carry full FactoryX Work Order context + implemented scope + verification output + known limitations.

**Guiding Tradeoffs:**
- **Weight & power vs accessibility:** Inertia and heat cost make the dragon feel powerful and ancient, but must not feel "floaty" or "unresponsive." Tune with visible trails and fast feedback; default to generous but clear limits.
- **Real assets for hero vs payload/iteration:** Small coherent set (dragon frames + 1–2 audio) generated once, committed, inlined where helpful. Everything else procedural or lightweight to stay under 2MB and match studio's "lightweight assets" WORKFLOW.
- **2D canvas vs WebGL:** Canvas 2D for particle speed, text, input directness, and simplicity on first slice. WebGL only if a specific effect (haze, better lighting) proves necessary for "powerful" read and can be isolated.
- **Procedural audio identity vs real cues:** Rich sanctuary-style synth bed + stingers for continuous feel and zero file weight; real short cues only for the signature "I breathed fire / I crashed" moments that sell the fantasy.
- **One canyon slice vs scope creep:** Ruthlessly limit to one verb (fly+bank+burst), one space, strong fail/retry. Everything else (deeper progression, more biomes, co-op) is future work after the taste-gate passes honest play.

**References / Evidence (publicly shareable):**
- Dragon Crew House Style + Fire Dragon persona (quoted in sections above).
- Prior drops: Elemental Sanctuary (breath ritual + audio), Rhythm Drift (flow + WebGL + input), Dragonbound ember visuals and authored chamber lessons.
- Asset skill smoke (real generated assets + manifest + resilient load + preview redirect pattern).
- Game Feel Checklist and Overnight FactoryX game protocol (full text in Work Order payload).
- Existing fire-dragon.png + dragon-crew-contact-sheet.png as visual north star.

**Progress Updates Worth Sharing Publicly (strategy gate):**
- This document is the strategy gate deliverable for Emberflight Gauntlet, the dragon arcade survival entry in the overnight-seven-games-20260615 experiment.
- Core thesis: a powerful, weighted dragon flight verb with short tactical fire bursts can be fun to judge in 60s and will feel at home in the Dragon Crew elemental house style.
- Next (after commit of this strategy): taste-gate slice implementation on the same branch — one 30–60s playable canyon flight with bank, burst, rings, crash/retry, using real dragon art + audio where central, procedural everywhere else for speed/weight/feel.
- All durable notes (this strategy, WORKLOG, PREVIEW evidence, VERIFICATION output) live under `.factoryx/work-orders/work-order-1781497406944-7-1/`.
- No PR or human review will be requested from the strategy gate. Implementation will follow taste-gate discipline: get browser-playable evidence of one interesting verb in one space before expanding systems.

---

**Strategy Sign-off (for this gate):**  
The direction above is the plan of record. Any material deviation during implementation (e.g., switch from canvas 2D to full 3D, addition of multiple modes as default, abandonment of real asset plan for dragon) will be recorded as an update to this document and the WO WORKLOG before proceeding.

**Last updated:** 2026-06-15 — Strategy gate closure: `.factoryx/preview-entrypoint` file created (exact `games/88-emberflight-gauntlet/index.html`) to resolve prior verification skip before any impl.

**Execution note (this agent run):** Strategy artifacts complete and aligned to creative_game archetype + browser-game-2d + house style + game feel + overnight protocol. Prior run verification-skip ("no preview entrypoint could be resolved") addressed by creating the root `.factoryx/preview-entrypoint` file at this gate (contents exactly match the payload-declared path). Updated companion WO memory files (WORKLOG/PREVIEW/VERIFICATION) with the resolution. gh pr list/view: no PR (correct per gate). Branch inspected, in sync post-fetch. No production changes, no games/ tree, no assets. Plan of record stands; taste-gate slice (with real playable first screen) follows only after this committed gate. All durable planning kept under `.factoryx/work-orders/work-order-1781497406944-7-1/`.
