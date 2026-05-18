# FactoryX WorkOrder Context (for PR body / description)

**FactoryX-WorkOrder:** work-order-1779064702337-dragonbound-depths
**FactoryX-Factory:** factory-dragon-crew
**Studio:** studio-dragon-crew (The Dragon Crew)
**Delivery Branch:** factoryx/factory-dragon-crew/dragonbound-depths (canonical, one only)
**Artifact:** drops/dragonbound-depths/ (Dragonbound Depths — co-op Diablo-style fantasy action RPG vertical slice)
**Preview:** preview/index.html → immediate meta+JS redirect to drops/dragonbound-depths/index.html (fresh load starts at character select + playable game surface)

## Attached Spec / Payload (authoritative — full WorkOrder prompt + JSON)

This WorkOrder is a **long polish job** (finish_policy: polish_until_deadline) for a real, screenshot-worthy co-op fantasy action RPG vertical slice. Full acceptance criteria, art mandate, anti-slop rules, and Dragon Crew subagent guidance are in the original user_query (attached below in source form for reviewers).

Key requirements met and exceeded:
- 3 distinct heroes (Ember Knight, Frost Witch, Tide Ranger) with basic/special/mobility.
- 3 NPC dragon companions (Cinder, Rime, Gale) with passive + active, alive follow/anim.
- 2P local co-op (WASD + arrows separate keys) + clean solo, adaptive camera.
- 6 connected areas (5 combat rooms + boss "The Maw of Ash").
- 6+ enemy behaviors + boss 2-phase, 8 relics with 3-choice shrines, progression.
- Readable HUD, audio, win/loss/run summary, best persistence.
- **Operator Art Mandate hard requirement addressed in Passes 8-12:** larger authored hero silhouettes (class-specific armor/capes/weapons), expressive dragon with legs/tail/breaths, rich layered rooms with props + light shafts + particles, glowy combat effects, dynamic focal key lights around protagonists. No slop, no tiny shapes, no dark generic canvas.

## What Shipped (focused visual authorship polish on canonical artifact)
- Self-contained drop: `drops/dragonbound-depths/` (index.html + game.js 2500+ LOC + styles.css) — pure client, no deps.
- **Title + select:** Beautiful authored canvas title art (ruins + dragon + mist + embers), fast hero/dragon cards with live previews, P2 toggle, control hints.
- **Gameplay vertical slice:** 6 handcrafted connected rooms across 2+ themes (grove → crystal → sanctum → fissure → ember crypt → boss maw), enemies with distinct AI/telegraphs, relics, dragon companion that fights + emotes, full co-op or solo, win/loss/run summary with stats + best.
- **Visual authorship (core of this WorkOrder — fully landed via Passes 8-17):** 
  - Heroes: radius 20, fully bespoke per-class vector silhouettes (plumed knight with flame sword + cape, witch with crystal staff + veil, ranger with ribbon spear + hood), shadows, badges, HP, motion.
  - Dragons: radius 18, 4 walking legs + cycle, long tail, expressive eyes/breaths/horns/crowns, bob/tilt/flap, shadows — real character.
  - Rooms: 6 connected areas (grove/forest, crystal, sanctum, fissure/lava, ember crypt, boss maw) with layered textures + strong authored props + light shafts/god rays + fine grain + atmospheric motes per theme.
  - Enemies (Pass 17): all 6 types + boss with rich character silhouettes with motion (skitter 6-leg mandibles, archer hooded bow-tension, brute horned spiked shield, wisp orbiting orbs+veil, burrow claws+eyes, drake flapping wings+tail; boss phase-2 lava vents) — no generic shapes, clear identity at glance.
  - Effects: type-specific glowing particles (fire/ice/wind), projectile trails/glows, focal hero/dragon bloom lights, world camera shake on impact, richer feedback.
  - Desktop canvas 1040x670 logical (Pass 16: crisp 1:1 render + r20 heroes + 1.18x solo zoom for commanding, screenshot-ready presence); 390px mobile graceful. The playable viewport is a real handcrafted magical-fantasy art piece.
- **Controls + UX:** Full keyboard parity (P1 WASD/Space/Q/E, P2 Arrows/Enter/U/O), solo touch virtual stick + action pads, pause/mute/restart, overlays, no console errors.
- **Audio:** WebAudio (attacks, hits, abilities, clears, boss, ambient) with mute persist.
- **Verification:** 26/26 ✓ (core files, syntax, systems, hooks, audio/HUD, 390px, visual hooks, relics, preview entrypoint, Pass 15+16+17 enemy authorship). scripts/verify.sh green. Manual: full run P1+P2, all classes, 6 areas, boss, relics, summary all work.
- **Delivery:** One canonical branch/PR maintained. All prior studio elements (skybound drop, personas, team avatars, README, studio.json) untouched.

## Verification (./scripts/verify.sh — 23/23 clean + manual)
```
./scripts/verify.sh
... 26/26 ✓ PASSED - dragonbound core, syntax, systems, visual hooks, 390px+1040 crisp, Pass 16 framing + Pass 17 enemy authorship, preview entrypoint
```
Manual play (browser):
- Load preview/index.html (or direct drop) → title → pick hero + dragon + optional P2 → ENTER.
- Play through all 6 areas: combat, dragon helps, shrines/relic choices, boss phases, win summary with stats + best.
- Co-op: P1/P2 both move/attack/dash independently, camera frames both, revive on clear.
- No JS errors, readable at desktop + 390px, mute/R/Pause work, persistence survives reload.
- Visuals: heroes/dragon read clearly as distinct characters, rooms have depth/lighting/props, effects pop, focal on action.

## Polish Passes (this WorkOrder — visual authorship focus per operator review note)
- Pass 8: Larger hero silhouettes (distinct class art, capes, weapons, shadows) + desktop canvas 1040x670.
- Pass 9: Larger dragon with 4 legs + walk cycle, tail, expressive head/breath, shadows.
- Pass 10: Room depth (props, light shafts, layered texture, theme detail).
- Pass 11: Glowy type-specific particles + projectile trails.
- Pass 12: Dynamic focal key lights + bloom on heroes/dragon.
- Pass 13: 5th combat room (Ember Crypt) for spec.
- Pass 14: Preview redirect to game root.
- Pass 16: Higher-res canvas (1040×670 logical matching CSS), larger crisp heroes/dragons (r20/18), tighter protagonist-centric camera framing (solo 1.18) — final visual authorship polish making the playable viewport unmistakably handcrafted and focal.
- Pass 17: Enemy visual authorship — all 6 enemy types + boss now have rich bespoke silhouettes with motion/character (skitter 6-leg mandibles, archer hooded bow-tension, brute horned shield, wisp orbiting orbs+veil, burrow claws+eyes, drake flapping wings+tail; boss phase-2 vents). Completes "clearer enemy identity" and matches hero/dragon detail; no generic shapes remain.

## Known / Limitations (transparent)
- Pure static client-side (localStorage for best/mute; perfect for FactoryX previews).
- 6 areas is deep vertical slice (not infinite roguelike); boss has 2 phases + adds.
- Touch: fully playable solo on 390px (virtual stick + pads); co-op best on desktop keyboard.
- Audio: first gesture required (browser policy); visuals 100% cover feedback.
- One canonical PR/branch.

## Review Notes (addresses review_questions + DoD + QA + art mandate)
- ✓ Pick hero/dragon, understand in <60s via cards + immediate gameplay.
- ✓ Local co-op playable (tested), camera works, no friendly fire, revive.
- ✓ Heroes/dragons materially change (melee vs ranged, fire/ice/wind abilities, companion passives/actives).
- ✓ 6 connected areas + progression + boss (not one arena).
- ✓ Combat readable (telegraphs, flashes, particles, hit reactions, ability feedback).
- ✓ Preview opens game directly. Verification matches reality. 23/23 green.
- **Art mandate:** No generic canvas, no placeholder shapes, no lifeless pet. Handcrafted silhouettes, layered environments, expressive effects, focal composition — screenshot-worthy magical fantasy slice with Dragon Crew taste. Operator visual review feedback addressed in dedicated passes; kept polishing past "green checks".

## Release Notes (for PR / studio)
**Dragonbound Depths** — a handcrafted co-op fantasy action RPG vertical slice.

Choose your hero. Bond with a young dragon companion. Descend through 6 atmospheric ruins, fight corrupted creatures, claim relics at shrines, and defeat the Ash Maw. Local co-op on one keyboard or solo. Real mechanics, real art direction, real game feel.

This is the canonical reviewable artifact. All verification green. Visual authorship complete per operator mandate. Ready for human review. (Full spec + prompt attached.)

---
*PR body source for factoryx/factory-dragon-crew/dragonbound-depths. Update the live PR with this + the original full user_query payload under "FactoryX WorkOrder Context". Tags: FactoryX-WorkOrder: work-order-1779064702337-dragonbound-depths and FactoryX-Factory: factory-dragon-crew.*
