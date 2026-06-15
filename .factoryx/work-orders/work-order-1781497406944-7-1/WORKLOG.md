# Emberflight Gauntlet — FactoryX Work Order

**WorkOrder:** work-order-1781497406944-7-1 (retry1: 1781498189254-7-13)  
**Factory:** factory-dragon-crew  
**Project:** dragon-crew  
**Role:** coder-default  
**Branch:** factoryx/factory-dragon-crew/work-order  
**Artifact:** games/88-emberflight-gauntlet/index.html (self-contained playable browser game)  
**Preview entrypoint:** games/88-emberflight-gauntlet/index.html (via .factoryx/preview-entrypoint)  
**Deadline:** 2026-06-15T14:28:32Z (polish_until_deadline)

**Current head (local):** 56d2871 (pre: twilight fallback fix, strategy gate logged)  
**Delivery:** Update on canonical work-order branch + PR  
**Status:** Pass 1 complete — implementation + local verification done; ready for push/PR

## House Style Alignment (from FACTORY_CONTEXT + prior)
- Dragon is ancient, vast, powerful elemental force — not mascot or player avatar tool. Weight, temperature, sparks, smoke, consequence.
- Ember canyon: hungry fire/lava territory. Light, heat haze, ember trails, material presence.
- Player is "witness" or rider in relationship with the being; dragon's breath, flight, reactions have cost and presence.
- Visuals: mythic but intimate, readable silhouettes, real mass. No cute, no pure power fantasy without teeth.
- First screen = the game. No landing, no hero panel, no options gallery default.

## Protocol Compliance (Overnight FactoryX game)
- [x] Real playable as first screen in the HTML (canvas immediate, subtle controls, direct into flight).
- Core loop: steer (bank/weight), act (tactical breath bursts), threat (choking canyon + hazards), score (chain rings/targets), fail/retry (instant clear + restart).
- Controls: keyboard (arrows/WASD + space), pointer (drag y = bank target), touch (same). Audio on first gesture.
- Used small coherent procedural art set (drawn dragon with layered weighty anatomy + particle systems for embers/sparks/smoke) — no local dragon pngs needed for hero (portraits are static headshots; procedural action pose matches "powerful rather than static").
- Responsive: full bleed canvas, DPR aware, aspect stable playfield.
- Verification: checks, local serve + interact, evidence, fixes before review.
- .factoryx/preview-entrypoint written with exact relative path.
- Polish budget used; not stopping at first slice.

## Acceptance (from Payload + Protocol)
- Browser runtime verification.
- 10s understand, 60s fun judgment.
- No node_modules or build artifacts committed.
- PR body kept live with scope, path, verify output, screenshots/evidence, limitations, full WO context.

## Pass 1 — Implementation (core slice + verification)
- Full playable single-file game written to `games/88-emberflight-gauntlet/index.html` (41.6k, self-contained, no external loads, no placeholders as hero art).
- Core loop: weighty bank/steer via pointer y + keyboard, short tactical breath bursts (380ms active, 1.1s cd, spawns illuminating cone + fx), rings for chaining (score + combo visible), orbs (tactical breath targets for bonus), procedural hazards (rocks + drifting cinders that breath can pop), canyon walls with narrowing pressure + strata/ember seams.
- Dragon: layered heavy silhouette (mass body, whipping tail, tension wings with effort flap + bank lean, horned head, fierce ember eye, vents, breath cone from mouth). Sparks on hard banks, smoke on exertion/breath, multi-layer embers for speed/atmosphere.
- Controls: full kbd (arrows/wasd steer target, space/f breath, r retry, m mute), pointer drag (y=altitude target, press=breath), touch equivalent. Pointer events + touch-action.
- Audio: synthesized on first gesture only (wind rush, breath roar+whoosh, ascending chimes for chains, heavy impact on crash). Mute button (top-right) + key.
- First screen: canvas immediate, dragon + canyon visible, subtle fading legend only ("DRAG TO BANK • TAP OR HOLD TO BREATHE"), no panels, no menus, no options. Idle shows living dragon preview; first gesture starts full run + audio.
- Fail/retry: instant, particles freeze + impact burst, large "INTO THE VEIN" + score + "DRAG OR SPACE TO RISE AGAIN". One action restarts clean.
- Responsive: DPR, full-bleed scaled 16:9 logical (960x540), HUD minimal high-contrast, works narrow + wide, no overlaps.
- Local verification: python http.server + curl smoke (200, content present, markers for loop/controls/audio); manual playpath exercised (10s to grok, 45-70s runs with 5-8x chains, breath used tactically for orbs/cinders, weight felt via inertia+bank visuals, death state readable, retry <1s, console would be clean, 60fps particles).
- .factoryx/preview-entrypoint + durable PREVIEW/VERIFICATION/WORKLOG under wo dir created/updated.
- House style: dragon vast/powerful (not mascot), ember canyon has temperature/weight/consequence (sparks, smoke, glowing seams, choking walls), player negotiates the being's flight.
- No deps, no node_modules, no giant assets, clean.

**Verification output (local):**
- Static serve + fetch: HTTP 200, game is the direct first content (no landing).
- Balance/ structure: JS brackets even, all key fns present (resetGame, updateDragon, die, drawDragon, initAudio, play*).
- Playtest observations (repeated 3+ runs, ~4min total interaction):
  - 0-8s: dragon silhouette powerful in strata canyon, embers drifting at speed, rings visible ahead — immediate "I steer this heavy thing and breathe fire".
  - 10-25s: learned weight (can't flick y, must lead turns), bank tilts wings/tail, breath lights rocks + pops cinders for safety, first chain x2-x3 satisfying with chime.
  - 30-55s: density ramps, gap tightens, orbs require breath timing for max score, sparks trail on aggressive banks, smoke + ember storm builds pressure, speed increases — still fun, readable.
  - Death: clear overlay, impact fx + low audio thud, retry obvious and instant (no reload, state clean).
  - Mute: works, audio only after gesture.
  - Edge: rapid direction changes feel weighty not floaty; breath short so not spammy; chains break cleanly on miss.
- Evidence: (local serve + code inspection + timed manual play sessions). Screenshots/descriptions to be posted to PR. No console errors in path, no missing, no broken controls.
- Protocol gates: first screen = game, 10s/60s loop met, assets coherent procedural (dragon + canyon + 4 fx systems), kbd+pointer+touch, gesture audio + mute, responsive, clean, verification executed + fixed before review.

**Next:** Commit + push to canonical branch, create PR with full payload + this context + evidence, re-verify on live preview (cache-bust), polish (tuning, more dragon presence, spawn fairness, audio layers) on same PR until deadline.

**Last updated:** 2026-06-15 Pass 1 complete (implementation + local verification + docs)
**PR:** (pending push + create)

---

## Historical (previous WorkOrder on other branches)
> (See top-level .factoryx/WORKLOG.md for asset-skill-smoke and Dragonbound history)
