# Emberflight Gauntlet — Goal Execution Strategy

**Work Order:** work-order-1781501302523-7-9  
**Factory:** factory-dragon-crew  
**Deadline:** 2026-06-15T14:28:32Z (polish_until_deadline mode)  
**Preview Entrypoint:** games/92-emberflight-gauntlet/index.html  
**Branch:** factoryx/factory-dragon-crew/work-order-1781501302523-7-9

## Core Mandate (from Payload)
Build an ambitious, polished Dragon Crew action game. First screen = playable game. Heroic and kinetic feel: fly/dash a dragon/crew through a burning sky gauntlet, weave hazards, rescue allies or collect embers, chain boosts, clear boss/escalation beat. 

Juicy controls, scoring/combo feedback, restart, sound/visual effects (feasible), responsive layout. Browser verification evidence, screenshots, GitHub PR + FactoryX preview.

Strict avoids: placeholder animation, static scenes, menu-only variants.

## Taste-Gate First (per WORKFLOW.md)
- One primary interaction/traversal verb in one scene/space.
- One strong camera/perspective decision.
- Get browser-playable evidence BEFORE expanding systems.
- If slice not interesting after honest play — pivot before polishing.
- Acceptance: concrete criteria over adjectives.
- No save/load, inventory, multiple levels, procgen, broad settings, achievements unless requested.

**Chosen Slice (Pass 0):**
- Verb: "Weave & Dash" — vertical steering with inertia + timed boost/dash that rewards precision chaining.
- Space: "Burning Sky Gauntlet" — single forward-scrolling sky corridor with layered fire/ember atmosphere, rock spires, flame vents as primary hazards, ember motes as collectibles, occasional small ally silhouettes for "rescue" graze.
- Perspective: Classic side-view runner with strong depth via 3-4 parallax layers (far embers, mid clouds/haze, near spires/hazards). Dragon as large, weighty silhouette (head + wing + body segments) that feels like a vast creature you ride/guide rather than tiny ship. Player presence via small rider silhouette + ember wake.
- Duration for evaluation: first 30-60s must deliver core loop feel: launch into motion, immediate responsive steering, first hazards, first ember collect, first near-miss, first crash or boost chain.

**Concrete Acceptance for Slice (before systems expansion):**
- New player discovers primary action (steer + dash) in <15s without text.
- Input latency feels instant (<100ms visible response: position, trail, audio cue if triggered).
- Collision has clear, juicy consequence (crash anim + particles + sound + score freeze) vs success (collect pop + combo + ember trail).
- Easing on dragon motion, camera drift, particle lifetimes, hazard approach.
- 60fps stable on mid hardware during normal density.
- Self-contained <2MB total (single HTML or minimal split + inline assets).
- Audio: only after explicit user gesture (click/tap to start or first input).
- Keyboard (arrows/WASD + Space/Shift), pointer drag/tap/click, touch all drive same verbs.
- Clear restart path from fail state.
- No dead menus; first load = live play surface (optional subtle "tap/click to fly" affordance that disappears on interaction).
- House style: mythic weight, heat, ember trails, not cartoon; light/atmosphere as character (flicker, haze, glow that shifts with player action).

## Execution Phases (size per risk/uncertainty)
- Phase 0 (Taste Gate): Build minimal end-to-end playable slice in one file or tight set. Verify in real browser runtime (no syntax-only). Screenshot + console clean. If boring on play, redesign verb/space before more code.
- Phase 1 (Core Expansion if slice passes): Add rescue allies as distinct graze targets (different from embers: give bigger combo or temp shield), light boss escalation (first "Sky Maw" serpent that forces weave pattern + one dash window), scoring + persistent combo meter with visible decay.
- Phase 2 (Juice & Feel): Every action has immediate multi-sensory feedback. Screen shake, color flashes, streak lines, wing flaps tied to dash, heat distortion on near misses. Audio: low roaring wind base + whoosh on dash + crystalline ember chimes + impact rumble. All post-gesture.
- Phase 3 (Polish & Responsive): Touch target sizing, safe areas, DPR handling, pause-on-blur or explicit pause, death UX with exact score + best ember chain, subtle vignette + film grain for mythic weight.
- Phase 4 (Verification & Evidence): Real browser verification per PREVIEW/VERIFICATION notes (pageerror, console.error, network, in-game state post-interaction). Screenshots from live preview. Update PR body.
- Ongoing (until deadline): Small iterative passes on same branch/PR. Re-verify live preview after each push. Update WORKLOG + PR with observations. Stop only on blocker or deadline.

## Risk Management
- High uncertainty on "feels heroic/kinetic": mitigate by taste-gate + honest playtest before feature creep. Use codex agents (fire-dragon for direction coherence, ice-dragon for core code, snow for visual, sea for audio) if materialized.
- Performance: procedural everything; pool objects; limit draw calls; profile with simple FPS counter.
- Scope creep: slice must pass taste before any "more content". Payload forbids placeholder/static/menu-only.
- Preview: direct to games/92-emberflight-gauntlet/ (no appending links after </html>, no hijacking root homepage).
- Git: only canonical branch; one PR; include full prompt + context in PR body per rules. Rebase/merge forward as needed before push.
- Deadline: polish_until_deadline means keep improving feel/evidence even after "reviewable"; use remaining time.

## Crew Agent Usage
- Fire Dragon (director): keep the burning center (the gauntlet flight verb) coherent; call out when heat/consequence is missing.
- Ice Dragon (core coder): primary implementation of loop, input, collision, render.
- Snow Dragon (artist): visual authorship — silhouettes, ember materiality, light temperature.
- Sea Dragon (musician): procedural audio that feels like negotiating with fire (weight, crackle, whoosh tails).
- Lava Dragon (writer): any in-game text minimal and mythic; PR/release notes.

## Exit Criteria for WO
- Playable first screen meets all Game Feel Checklist items.
- Live preview opens clean (no runtime errors, playable interaction captured in verification).
- PR open on canonical branch with accurate scope, preview path, evidence, known issues.
- WORKLOG/PREVIEW/VERIFICATION updated with real artifacts and observations.
- Code changes only; no drive-by refactors outside scope.

**Initial Status:** Phase 0 planning + slice start. Will create context files, then implement slice immediately for browser evidence.
