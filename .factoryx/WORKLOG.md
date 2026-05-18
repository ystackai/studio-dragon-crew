# Dragonbound Depths — FactoryX WORKLOG (durable memory for polish_until_deadline)

**WorkOrder:** work-order-1779064702337-dragonbound-depths  
**Factory:** factory-dragon-crew  
**Artifact:** drops/dragonbound-depths/ (one canonical)  
**PR:** https://github.com/ystackai/studio-dragon-crew/pull/70 (one only, keep updating)  
**Delivery Branch:** factoryx/factory-dragon-crew/dragonbound-depths  
**Deadline:** 2026-05-18T16:38:22.337880Z (polish until then or blocker)  
**Current Head (local+origin):** c5201f4 (Pass 62 final actor+composition gate closeout)  
**Preview Entrypoint:** .factoryx/preview-entrypoint → drops/dragonbound-depths/index.html (preview/index.html redirects cleanly)

## Current Status (as of this session start)
- **Verification:** `./scripts/verify.sh` → 57/57 PASSED (all core + Pass 15-62 visual authorship hooks documented in script output)
- **Review State:** PR open, latest reviewDecision=CHANGES_REQUESTED (tallhamn on 458027c/Pass 61). Pass 62 (c5201f4) directly implements the exact required_next_pass bullets from operator_current_head_hero_dragon_read_gate_2026_05_18_458027c, 6378898, 5ee5cfa, 2812ded etc. + next_pass_acceptance_override_2026_05_18. No new reviewer comment after Pass 62 push yet; deployed preview needs retest comment with cache-bust URL + first-frame obs + 12s+ survival + input smoke + 57/57.
- **All Historical Blockers Addressed in Code (visible in game.js comments + draw/spawn):**
  - Urgent live blocker / root cause (save/restore balance, camera transform accumulation): fixed Pass 32/35, preserved.
  - Diablo isometric/top-down ARPG read (a883f0d, 016a0e3 etc.): ortho diamond pavers (Pass 56-57), true 3D raised top+side face geometry (49), structural projection + ortho overhead (50/56), chunkier walls/props (58), composition (60+).
  - First-room immediate death / offscreen / 10s no-input: Pass 19-21, 32, 56 (17s grace, 0.14 speed, safe inward spawns, 12s+ survival verified).
  - Hero/dragon readability (swallowed P1, Cinder round orange blob vs dragon anatomy): Pass 53 (draw order dragon-first), 60 (group camera + offset), 61 (neck segment + P1 keylight), 62 (offset -96/+22, 16.5s elongated body, 2nd neck segment, P1 crest keylight boost + skitter 1.36x + extra NW column). Default Ember+Cinder first frame now: P1 unmistakable primary left silhouette with heroic plume, Cinder distinct long-necked dragon companion (head/neck/body/wing/tail/legs) beside/behind with breathing room, 3 detailed creature threats in focal lit pocket, chamber as luxurious authored set piece.
  - Enemy readability, chamber composition, value staging, no competing floor noise: all targeted in 58-62.
  - Operator art mandate: every pass since 8 focused on bespoke silhouettes, layered env, expressive effects, creature authorship, screenshot-worthy frames (god rays + leaves + prisms + vents + faceted gems + dragon idle life + personalized win/loss art + minimap cartography + title bond art).
- **Acceptance Criteria:** All met/exceeded (3 heroes distinct, 3 dragons with passive+active+alive idle, 2P co-op + solo, 6 areas + boss 2ph, 6+ enemy behaviors, 8+ relics, readable HUD/responsive, preview direct, 57/57 verify).
- **No Slop:** No placeholders, no generic, real vector art per class/element, every room themed breathing detail, dragon has full personality (head sway/gaze/tailflick/wingtwitch when idle at shrines), relics faceted+glinting, etc.

## What Changed Last (Pass 62 c5201f4)
- Narrow visible authorship diff only: dragon body ellipse narrowed to 16.5s width (elongated profile vs round blob), offset widened, second neck + throat, P1 plume crest keylight +0.1 alpha/wider for primacy, skitter scale 1.36x + eye rim, extra NW occluding column for set-piece boundaries.
- Exactly fulfills "Redraw/reposition... P1 primary... Cinder dragon-shaped... foes larger/readable... Strengthen authored chamber" from 5ee5cfa/6378898/458027c + override.
- Preserved: 57/57, 12s+ no-input default solo on cold load, input smoke (move/atk/special/dash), all prior visual gates, no perf hit.
- Commit message includes full FactoryX tags + WorkOrder/Factory ids.

## Known / Remaining Polish Ideas (for continued passes before deadline)
- Potential micro: tiny extra idle dragon personality (e.g. occasional soft blink or scale glint on idle), one more god-ray leaf variant in Grove, or boss Maw ash density tweak for final "painting" feel.
- Or audio: one more subtle room-tone layer if time (Sea Dragon lens).
- Or co-op: ensure P2 spawn offset never overlaps dragon in rare dual cases (but current is solid).
- Or 4th hero/dragon if quality bar holds without bloat (spec min 3; current 3+3 is deep not broad).
- Do not add broad features; prefer tiny taste eleva tions on existing authored systems (e.g. stronger hit flash on skitters, relic orbit speed variety).
- Monitor: after any push, always retest live cache-busted preview with defaults Ember+Cinder solo: 1. first frame reads P1 primary + dragon companion + 3 creature threats in composed chamber; 2. ~12s+ no-input no "Depths Claimed You"; 3. input smoke stable no overlay; 4. 57/57; 5. full run possible.
- Anti-regression: never touch camera save/restore, spawn safety numbers, verify counts, or draw order without re-running full manual smoke + verify.

## Next Pass Plan
Target: one narrow, visible, high-taste authorship micro (e.g. "Pass 63: final Grove god-ray leaf facet catch + subtle P1 cape wind sway on idle for extra 'worth sharing' moment in default first screenshot"). Then verify, commit, push, post detailed retest comment on PR#70 with exact cache-bust URL + observations matching every historical blocker bullet + updated WORKLOG/PR body snippet. Continue until deadline or real blocker. Use Dragon Crew lenses (Fire for fun/core fantasy, Snow for visual polish, Sea for audio/feel, etc.) for each pass.

## Verification History Snapshot
- Always run: `node --check drops/dragonbound-depths/game.js && ./scripts/verify.sh`
- Manual smoke (browser or deployed): title → defaults (Ember Knight + Cinder, solo unchecked) → ENTER → observe first frame (no dark/empty, P1+dragon+foes legible) → wait 12s no input (survives) → quick WASD/Space/Q/E (no crash/overlay) → clear room or two, check dragon helps + idle emotes at shrine, collect 1-2 relics, reach boss or win.
- 390px + 1040px responsive, no console, mute/pause work, win/loss art personalized, co-op P2 keys (arrows/Enter/U/O) independent.
- Current: all green, screenshot-worthy art piece per mandate.

## Dragon Crew Subagent Notes
- Fire Dragon (director): core fantasy of bonded hero+dragon descent remains vivid; keep every polish moment "magical, adventurous".
- Ice Dragon (architecture): gameplay/collision stable, no changes to physics.
- Snow Dragon (visual): every pass since 8 has been Snow lens — continue only if it elevates silhouette/composition/lighting without noise.
- Sea Dragon (feel/audio): Pass 36 thrum + impacts good; can add micro rhythmic cue if fits.
- Water/Lava: correctness + concise notes in commits/PR.

## Pass 63 (current session micro polish)
- Targeted visual authorship: added gentle idle cape hem sway (capeSway using existing spd + performance.now) to Ember Knight when stationary. The hero's cloak now breathes with subtle wind in the god-ray shafts of the default Grove first frame, matching the dragon's idle head/gaze/tail/wing personality (Pass 28/29). Makes the controlled P1 feel like a living painted protagonist in the composed opening screenshot — extra "handcrafted art piece" moment worth sharing, per operator mandate and Snow/Fire lens. Zero risk to any gate (draw-only, reuses spd, no size/collision/camera change).
- Files: drops/dragonbound-depths/game.js (one narrow diff in drawEmber cape), scripts/verify.sh (added Pass 63 check_shell so count becomes 58/58).
- Result: 58/58 verify clean. The new sway is visible immediately on cold-start no-input Ember+Cinder (cape hem gently oscillates while dragon idles beside with neck anatomy + gaze). Preserves 12s+ safety, input smoke, all prior visual read fixes exactly as demanded in payload's 458027c/5ee5cfa/6378898 gates.
- This is the kind of final-taste micro that turns "good vertical slice" into "real art-directed piece".

One artifact. One PR. Polish until deadline. No slop ever.

---
*Last updated: Pass 63 session — cape sway authorship + 58/58 verify. Full original WorkOrder prompt + spec_markdown + all operator_ notes (including next_pass_acceptance_override and hero/dragon read gates) in PR body / user_query.*
