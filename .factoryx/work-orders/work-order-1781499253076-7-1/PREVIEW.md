# Emberflight Gauntlet — PREVIEW (work-order-1781499253076-7-1)

**Entrypoint:** games/88-emberflight-gauntlet/index.html (exact, per .factoryx/preview-entrypoint)

**How to open for review:**
- Direct file: open games/88-emberflight-gauntlet/index.html (file:// works for visuals; prefer http for gesture audio init).
- Via preview tooling: .factoryx/preview-entrypoint contains the relative path `games/88-emberflight-gauntlet/index.html`; review root should serve the game as first content.
- Local: `python3 -m http.server 8765` from repo root, then http://localhost:8765/games/88-emberflight-gauntlet/index.html
- Deployed (after push + CI on canonical branch): PR preview / FactoryX preview tree for factory-dragon-crew/work-order should surface the entrypoint directly. Always cache-bust (?v=ts or hard refresh) on retests.
- Do not rely on preview/index.html (prior avatar gallery); do not append review links after </html>.

**Default experience (first screen = game):**
- Loads straight into ember canyon flight. Dragon (powerful layered silhouette: mass body, tension wings, whipping tail, horned head with fierce ember eye, vents) visible in strata. Drifting embers, glowing rings ahead, minimal HUD (score top-left, chain pill, breath pips top-right, depth, mute icon, fading legend bottom "DRAG TO BANK • TAP OR HOLD TO BREATHE").
- Idle: living preview (gentle bank + flap + particles) — no static.
- First pointerdown / key / touch: starts full run + audio (wind rush on speed, breath whoosh+roar on gesture, chimes on chains, impact on death). No menus, no landing, no options.
- Core loop (10s to grok): drag or arrows/WASD to set bank target (weighty spring-damp, head leads), tap/hold/space for short breath bursts (lights scene, pops cinders, claims orbs for bonus). Weave walls/hazards, chain rings for score + visible xN combo.
- Death: immediate overlay "INTO THE VEIN" + sub + score + chain + "DRAG OR SPACE TO RISE AGAIN". One action restarts clean.
- During run (escalation in this WO): at depth ~6800+, "Ember Sovereign" boss phase triggers (vast silhouette looms with 3 glowing vents, directed cinder attacks, presence pressure); player must weave + breathe the vents 3x for shatter (big spark/smoke/flash/score/combo payoff) — clear heroic escalation beat. Occasional "crew" rescue targets (small humble ally silhouettes) for chain bonus + distinct collect. Chain >=4 gives visible speed/score boost. Juice: screen shake on crash + breath kick, flash on shatter/impact, sparks/pops on every hit.

**Responsive notes:**
- Canvas full-bleed, DPR-capped (2x), logical 960x540 16:9 scaled to fit with letterbox margins. HUD safe (top 14-18px, bottom legend).
- Tested: 360px wide (portrait sim) to 1920+; drag anywhere steers (large target), press anywhere bursts; text/HUD never clips or overlaps playfield.
- Touch-action:none + pointer events; keyboard primary + pointer/touch parallel.

**Screenshots / Evidence (capture on each pass, attach to PR or store under preview/):**
- Desktop load (0-5s): dragon powerful in heat canyon, strata seams, embers, rings visible, HUD minimal.
- Action mid-run (20-40s): banked dragon (head leads), breath cone illuminating, chain x3+ active, sparks/smoke trails, hazards.
- Boss trigger (escalation): large silhouette enters frame right or high, glowing vents, fireballs incoming, walls tighter, player engaging.
- Crash state: impact flash + overlay legible, retry prompt clear.
- Narrow viewport: no overlap, controls (full canvas) thumb-friendly, legend/HUD readable.
- Mute: icon top-right, toggles without breaking game.

**Current known preview path issues:** None. Single self-contained file = zero 404 risk for core loop + fx. If future generated assets added (e.g. via service), they will live alongside with manifest note; paths relative.

**Last updated:** 2026-06-15 (current WO init; entrypoint confirmed correct post recent correction commit; will update with boss screenshots + live deployed evidence after push)