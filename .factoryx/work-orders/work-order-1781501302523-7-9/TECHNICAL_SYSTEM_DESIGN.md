# Emberflight Gauntlet — Technical System Design

**WO:** work-order-1781501302523-7-9  
**Entrypoint:** games/92-emberflight-gauntlet/index.html (self-contained or minimal split for preview tree compatibility)

## Rendering & Runtime
- Single `<canvas id="game">` (or layered for UI) + 2D context for lightweight payload and broad compatibility.
- requestAnimationFrame loop at native refresh; fixed timestep sim (accumulator) + variable render for stability.
- DPR-aware: render at Math.min(dpr, 2), CSS size 100% for responsive (no letterbox distortion on aspect; play area uses safe center band).
- No external assets: all procedural (dragon via layered paths + gradients + ember points; hazards as flame/rock primitives with flicker; particles as small arcs/grads).
- Palette (house style fire/ember):
  - bg: #050203 → #120a08 deep void with heat.
  - primary flame: #ff5a1f, #ff9f4d, #f4d35e gold.
  - haze/glow: rgba(255,120,40,0.12) etc.
  - silhouette dragon/hazards: near-black with edge highlights.
- Layers (parallax factor):
  1. Far: slow ember field + faint stars.
  2. Mid: heat haze bands + slow cloud/smoke wisps.
  3. Play: dragon (player), hazards, embers, ally grazes, mid spires.
  4. Near: faster foreground rock shards + ember streaks for speed feel.
- Dragon representation (weight + presence): 
  - Body as 4-5 connected segments following a damped curve (player y + sinusoidal flight undulation).
  - Head with horn/jaw silhouette, eye glow that brightens on dash.
  - Wing membranes that spread on boost (scale + angle lerp with easing).
  - Tail flame trail (particle emitter tied to velocity + boost state).
  - Small rider figure on neck for human-scale witness (per house style).
- Camera: auto-scroll x at base speed (pixels/sec); boost multiplies scroll + adds forward "surge" particles. Y is player-controlled with inertia (no direct teleport).
- Particles: object pool (prealloc 200-300); types: ember (glowing + gravity flicker), impact flash, dash wake, hazard debris, rescue sparkles. All with lifetime, ease, color temp shift.

## Game State & Loop (minimal for slice)
- Mode: 'ready' (first touch starts), 'playing', 'crash', 'victory?' (for escalation later).
- Player: { y, vy, boostMeter (0-1), boostActiveUntil, lastDashTime, combo }
- World: distance (or time-based for endless slice), speed (base + boost factor), spawn timers for hazards/embers.
- Entities (pooled arrays):
  - Hazards: { x, y, w, h, type ('spire','vent','gust'), phase }
  - Embers: { x, y, collected:false, value }
  - Grazes (allies): { x, y, rescued:false }
  - Boss (escalation only after slice passes): phase state machine.
- Collision: AABB for slice speed + generous feeler for "weave" grace; on hit → enter crash (velocity dump, explosion particles, screen shake 200ms, state=crash).
- Scoring: distance * speedFactor + emberValue * comboMultiplier. Combo: +1 per ember within window, decay on miss/time or hit. Visible as streak number + bar.
- Boost/Chain: dash input when meter > threshold consumes a bit but grants temp speed + brief invuln window + resets some hazard timers for "threading". Meter refills on ember collects + near-miss grazes. Chain = consecutive dashes without full meter drop.
- Restart: from crash state, any key/pointer → reset entities, score, distance, state=playing (no reload).

## Input Model (responsive, multi-modal)
- Keyboard: ArrowUp/Down or W/S : steer y (add to vy target). Space or Shift : dash (if meter allows).
- Pointer: mousedown/touchstart on canvas: if playing, set drag anchor; move adjusts target y (vertical only for simplicity; horizontal gesture can map to dash if > threshold). Click/tap without drag = quick dash pulse.
- Touch: same as pointer; ensure 44px+ effective by using full canvas with dead zones only at edges if needed. preventDefault on all.
- Unified: input produces "steerTarget" and "dashRequested" events each frame; sim consumes with dt scaling.
- Latency target: direct write to player state + immediate visual (no tween delay on first response). Easing applied to motion, not input application.
- Audio gate: AudioContext created/resumed ONLY on first pointer/keyboard gesture that is a game action (or explicit start affordance that is itself the first interaction).

## Audio (Sea Dragon domain, post-gesture)
- Web Audio (no files): master gain, low rumble oscillator (wind + dragon breath), bandpass for embers (high crystalline pings with short decay + reverb tail via convolver or delay), whoosh noise for dash (filtered noise burst + pitch drop).
- Triggers: 
  - ember: short bell-like + harmonic.
  - dash: low roar swell + crackle tail.
  - graze rescue: warmer chord.
  - hit: sub drop + noise burst (harsh but brief).
  - near-miss: soft "heat sigh".
- Intensity: master lowpass or gain tied to boost/speed for "rushing" feel. Sparse by default.
- All nodes cleaned; no autoplay.

## Performance & Payload Budget
- Target: 60fps on mid laptop (Chrome/Firefox, 2023+ hardware). Measure with rAF timestamp delta + simple HUD fps (hidden in prod? or subtle).
- Techniques: 
  - ctx.save/restore minimized; batch similar draws.
  - Precompute gradients where stable.
  - Particle update in place; cull offscreen + dead.
  - Hazard/ember spawn limited (e.g. max 8 hazards, 12 embers on screen).
  - No heavy per-frame allocations in hot path.
- Total size: aim < 200kB gzipped for the HTML/JS (inline styles, no images). Current studio drops are well under.
- Offline: yes after first load (all inline).

## File Layout (for preview compatibility)
games/92-emberflight-gauntlet/
  index.html   # main (can be self-contained; if split: loads ./game.js ./style.css with relative paths)
  (optional game.js, styles.css for maintainability during polish — still single dir)

Preview trees will mount under /factoryx/.../ so relative links work. Root of game must be the playable surface.

## Escalation Path (post-slice)
- Distance or ember-count gate triggers "Sky Maw" encounter: a large segmented flame serpent that undulates across screen 1-2 times. Player must read its pattern, use 1-2 dashes to slip through gaps while it "breathes" (temporary hazard lanes). On success: big score + "chain" visual. Failure still just crash (no multi-life for slice).
- This provides the "clear boss/escalation beat" without complex AI.

## Safety & Edge Cases
- No uncaught errors: wrap main loop in try, surface minimal message + auto-restart affordance.
- Resize: re-compute playfield bounds; player y clamped to safe band (not screen edges to avoid "offscreen death").
- Visibility: pagehide/pause raf when hidden.
- Mobile: tested orientation; canvas touch-action: none.
- Console: zero errors/warns in normal play path + first interaction.

## Verification Hooks (for browser runtime)
- Expose minimal `window.__emberflight = { getState: () => ({score, combo, distance, mode}), forceDash: ... }` for verification scripts if present.
- On first real interaction after start, set an in-game flag observable (e.g. firstEmberCollected or playerBoosted).

## House Style Integration
- Dragon not tool/pet: its "personality" shows in weight (slow to turn, powerful dash that has recovery), heat (near-miss leaves temp glow on dragon edges), consequence (crash is violent but beautiful, ember snuff).
- Small human witness: the rider reacts (lean, arm reach on rescue).
- Light/atmosphere: screen-wide subtle heat warp (simple sin offset on sample rows or particle glow only); ember light affects local hazard contrast slightly.
- Never cartoon: high contrast silhouettes, soft gradients for heat not flat cel.

This design is intentionally narrow for taste-gate. Expand only after playable evidence confirms the core verb/space is compelling.
