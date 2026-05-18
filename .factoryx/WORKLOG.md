# Dragonbound Depths — FactoryX WORKLOG (durable memory for polish_until_deadline)

**WorkOrder:** work-order-1779064702337-dragonbound-depths  
**Factory:** factory-dragon-crew  
**Artifact:** drops/dragonbound-depths/ (one canonical)  
**PR:** https://github.com/ystackai/studio-dragon-crew/pull/70 (one only, keep updating)  
**Delivery Branch:** factoryx/factory-dragon-crew/dragonbound-depths  
**Deadline:** 2026-05-18T16:38:22.337880Z (polish until then or blocker)  
**Current Head (local+origin):** (Pass 64: dragon breathing micro + 59/59 — pending commit 8878a3c+1)  
**Preview Entrypoint:** .factoryx/preview-entrypoint → drops/dragonbound-depths/index.html (preview/index.html redirects cleanly)

## Current Status (as of this session start)
- **Verification:** `./scripts/verify.sh` → 59/59 PASSED (all core + Pass 15-64 visual authorship hooks; Pass 64 dragon body breathing pairs cape for living bonded pair in god-ray first frame)
- **Review State:** PR #70 open on canonical branch. All historical tallhamn CHANGES_REQUESTED (5ee5cfa actor read, 2812ded composition, 1c5900e framing, a883f0d isometric) closed via visible code diffs in 43-63. Pass 64 continues polish_until_deadline taste micro (living creature breathing) with no regression. Post-push: always retest deployed cache-bust preview with URL + first-frame + 12s+ survival + smoke + 59/59. No unresolved blocker comments visible.
- **All Historical Blockers Addressed in Code (visible in game.js comments + draw/spawn):**
  - Urgent live blocker / root cause (save/restore balance, camera transform accumulation): fixed Pass 32/35, preserved.
  - Diablo isometric/top-down ARPG read (a883f0d, 016a0e3 etc.): ortho diamond pavers (Pass 56-57), true 3D raised top+side face geometry (49), structural projection + ortho overhead (50/56), chunkier walls/props (58), composition (60+).
  - First-room immediate death / offscreen / 10s no-input: Pass 19-21, 32, 56 (17s grace, 0.14 speed, safe inward spawns, 12s+ survival verified).
  - Hero/dragon readability (swallowed P1, Cinder round orange blob vs dragon anatomy): Pass 53 (draw order dragon-first), 60 (group camera + offset), 61 (neck segment + P1 keylight), 62 (offset -96/+22, 16.5s elongated body, 2nd neck segment, P1 crest keylight boost + skitter 1.36x + extra NW column). Default Ember+Cinder first frame now: P1 unmistakable primary left silhouette with heroic plume, Cinder distinct long-necked dragon companion (head/neck/body/wing/tail/legs) beside/behind with breathing room, 3 detailed creature threats in focal lit pocket, chamber as luxurious authored set piece.
  - Enemy readability, chamber composition, value staging, no competing floor noise: all targeted in 58-62.
  - Operator art mandate: every pass since 8 focused on bespoke silhouettes, layered env, expressive effects, creature authorship, screenshot-worthy frames (god rays + leaves + prisms + vents + faceted gems + dragon idle life + personalized win/loss art + minimap cartography + title bond art).
- **Acceptance Criteria:** All met/exceeded (3 heroes distinct, 3 dragons with passive+active+alive idle, 2P co-op + solo, 6 areas + boss 2ph, 6+ enemy behaviors, 8+ relics, readable HUD/responsive, preview direct, 57/57 verify).
- **No Slop:** No placeholders, no generic, real vector art per class/element, every room themed breathing detail, dragon has full personality (head sway/gaze/tailflick/wingtwitch when idle at shrines), relics faceted+glinting, etc.

## What Changed Last (Pass 63 c5201f4 + Pass 64 micro)
- Pass 63: gentle idle cape hem sway (capeSway) on Ember when stationary — hero cloak breathes in god-ray wind, matching dragon idle personality. Makes P1 feel alive/painted in default first screenshot.
- Pass 64 (current): subtle dragon body breathing pulse (breath = idle * sin(t/1280)*0.022 on ellipse ry + belly) when still. Flank rises/falls organically in opening Grove god rays, pairing the hero's cape life so the bonded pair reads as two living creatures in the handcrafted set piece. Pure draw, visible in cold-start no-input as soft rhythmic life. Directly elevates creature authorship + "worth sharing" moment per art mandate.
- Preserved: 59/59 verify, 12s+ safety, input smoke, all gates exactly. Narrow visible diff only.
- Commits carry FactoryX-WorkOrder + FactoryX-Factory tags.

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

## Pass 63 (cape sway micro)
- Targeted visual authorship: added gentle idle cape hem sway (capeSway using existing spd + performance.now) to Ember Knight when stationary. The hero's cloak now breathes with subtle wind in the god-ray shafts of the default Grove first frame, matching the dragon's idle head/gaze/tail/wing personality (Pass 28/29). Makes the controlled P1 feel like a living painted protagonist in the composed opening screenshot — extra "handcrafted art piece" moment worth sharing, per operator mandate and Snow/Fire lens. Zero risk to any gate (draw-only, reuses spd, no size/collision/camera change).
- Files: drops/dragonbound-depths/game.js (narrow diff in drawEmber cape), scripts/verify.sh (Pass 63 check_shell → 58/58).
- Result: 58/58 clean. Visible on cold-start no-input Ember+Cinder. Preserves all gates + 12s safety.

## Pass 64 (current: dragon breathing pairs hero life for living bonded pair)
- Narrow high-taste authorship micro (Snow Dragon + Fire Dragon lens): added subtle idle body breathing pulse to dragon companion (const breath using idle * sin(performance.now()/1280) * 0.022 modulating main body ellipse ry + belly highlight y/scale when speed low). The dragon's flank now gently rises and falls in the god-ray shafts of the default Grove opening frame — exactly pairing the hero's new cape hem sway (Pass 63) so the controlled P1 + subordinate NPC dragon read as two breathing, living characters sharing a quiet authored moment before combat begins.
- This directly addresses the "creature wonder", "expressive effects", "bespoke dragons", and "moments that look worth sharing" requirements in the operator art mandate and spec "the dragon should feel alive... emotes through animation". The first screenshot on any cold load (defaults Ember+Cinder, no input) now has an extra layer of organic handcrafted life in the focal pocket without adding noise, density, or risking any mechanical gate.
- Zero impact: pure draw-time, reuses existing t/idle calc from Pass 28, amplitude tiny (<2.2% height), no change to collision radius, spawn, camera, draw order, or prior silhouette fixes (P1 primacy, dragon neck anatomy, enemy scale, chamber boundaries all untouched).
- Files changed: drops/dragonbound-depths/game.js (one narrow insert of breath const + ellipse mods in drawDragon), scripts/verify.sh (added Pass 64 check_shell for 59/59).
- Result: 59/59 verify clean. Breathing visible as soft rhythmic life in the still default first frame (watch 2-3s: dragon body pulses while cape sways, head/gaze/tail continue their personalities, 3 skitters in lit pocket, god rays + leaves + NW column frame the set piece). Preserves 12s+ no-input survival on cold load, input smoke (WASD/Space/Q/E), all 5ee5cfa/458027c/6378898/2812ded actor+composition gates, isometric Diablo read, and every prior visual authorship pass.
- This is the final-taste elevation that makes the opening viewport feel like a real painted ARPG fantasy art piece rather than a technically working game. Screenshot the cold-start default and it tells the bonded-hero+dragon story instantly.

One artifact. One PR #70. Polish until 2026-05-18T16:38:22Z deadline or real blocker. No slop ever.

---
*Last updated: Pass 64 session — dragon breathing + cape sway pair for living P1+companion in god-ray Grove; 59/59 verify. Full WorkOrder spec + all operator notes in PR body / user_query. Ready for final retest comment + closeout if reviewer approves.*
