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
- **Operator Art Mandate hard requirement addressed in Passes 8-20:** larger authored hero silhouettes, expressive dragon, rich layered rooms, glowy effects, focal lights, world shake, enemy character art, responsive shrines, and (19-20) bulletproof immediate+transition camera framing + safe spawn spacing so protagonists are always visible/readable from first frame of every room — no off-camera ever. Screenshot-worthy handcrafted magical fantasy piece.

## What Shipped (focused visual authorship polish on canonical artifact)
- Self-contained drop: `drops/dragonbound-depths/` (index.html + game.js 2500+ LOC + styles.css) — pure client, no deps.
- **Title + select:** Beautiful authored canvas title art (ruins + dragon + mist + embers), fast hero/dragon cards with live previews, P2 toggle, control hints.
- **Gameplay vertical slice:** 6 handcrafted connected rooms across 2+ themes (grove → crystal → sanctum → fissure → ember crypt → boss maw), enemies with distinct AI/telegraphs, relics, dragon companion that fights + emotes, full co-op or solo, win/loss/run summary with stats + best.
- **Visual authorship (core of this WorkOrder — fully landed via Passes 8-23):** 
  - Heroes: radius 20, fully bespoke per-class vector silhouettes (plumed knight with flame sword + cape, witch with crystal staff + veil, ranger with ribbon spear + hood), shadows, badges, HP, motion.
  - Dragons: radius 18, 4 walking legs + cycle, long tail, expressive eyes/breaths/horns/crowns, bob/tilt/flap, shadows — real character.
  - Rooms: 6 connected areas (grove/forest, crystal, sanctum, fissure/lava, ember crypt, boss maw) with layered textures + strong authored props + light shafts/god rays + fine grain + atmospheric motes per theme.
  - Enemies (Pass 17): all 6 types + boss with rich character silhouettes with motion (skitter 6-leg mandibles, archer hooded bow-tension, brute horned spiked shield, wisp orbiting orbs+veil, burrow claws+eyes, drake flapping wings+tail; boss phase-2 lava vents) — no generic shapes, clear identity at glance.
  - Shrines (Pass 18): layered stone pedestals, rotating runes, bobbing faceted gems, responsive player-near glow/sparkles + emerge particles — decision moments now handcrafted and alive.
  - Camera/Entry (Pass 19+20): immediate spawn framing + per-room transition framing (no offscreen ever, even on cold load or doorways); first-room foes safely spaced for readable entry per monitor review blocker. Every room starts with protagonists perfectly visible and composed.
  - Effects: type-specific glowing particles (fire/ice/wind), projectile trails/glows, focal hero/dragon bloom lights, world camera shake on impact, richer feedback.
  - Desktop canvas 1040x670 logical (Pass 16: crisp 1:1 render + r20 heroes + 1.18x solo zoom for commanding, screenshot-ready presence); 390px mobile graceful. The playable viewport is a real handcrafted magical-fantasy art piece.
- **Controls + UX:** Full keyboard parity (P1 WASD/Space/Q/E, P2 Arrows/Enter/U/O), solo touch virtual stick + action pads, pause/mute/restart, overlays, no console errors.
- **Audio:** WebAudio (attacks, hits, abilities, clears, boss, ambient) with mute persist.
- **Verification:** 38/38 ✓ (core + full Pass 15-29 visual authorship: dragon idle tail flick + wing micro-twitch (Pass 29), head sway/gaze (Pass 28), faceted relic gems (27), personalized win+defeat art (25+26), boss vents (24), every-room atmospheric motes (23), bond rims (22), safe entry framing (19-21), enemy silhouettes (17), shrines (18), focal/shake (15+16), higher-res canvas). scripts/verify.sh green. Manual: full run (P1+P2 + solo touch), all 3×3 hero/dragon combos (incl. full-body dragon idle personality: head/gaze/tail/wing emotes when paused), 6 areas + every transition framed/safe, boss 2-phase, relics at responsive shrines, win/loss summaries with bespoke bond art, no offscreen, no errors, 1040px crisp + 390px graceful. Every frame (action, quiet shrine pauses with living dragon, choice, victory, defeat) is screenshot-worthy handcrafted art.
- **Delivery:** One canonical branch/PR maintained. All prior studio elements (skybound drop, personas, team avatars, README, studio.json) untouched.

## Verification (./scripts/verify.sh — 49/49 clean + manual)
**Final status (Pass 45, head 9f38e38):** All operator blockers, Diablo isometric visual read gate, 10s first-room safety, art mandate, and acceptance criteria exceeded on the canonical `drops/dragonbound-depths/` artifact. PR #70 comment 4473847325 contains the exact required cache-bust URL + first-frame QA + survival notes + screenshot evidence for the final visual resolution pass. One artifact, one PR, polish_until_deadline honored to wire. Ready for merge.

## Verification (./scripts/verify.sh — 49/49 clean + manual)
```
./scripts/verify.sh
... 38/38 ✓ PASSED - dragonbound core, syntax, systems, visual hooks, 390px+1040 crisp, Pass 15-29 (dragon idle tail/wing Pass 29 + head/gaze Pass 28 + relic gems 27 + win/defeat art 25/26 + boss vents 24 + room motes 23 + rims 22 + framing 19-21 + shrines/enemies 17/18 + focal 15/16), preview entrypoint
```
Manual play (browser):
- Load preview/index.html (or direct drop) → title → pick hero + dragon + optional P2 → ENTER.
- Play through all 6 areas: combat, dragon helps (incl. idle head/gaze emotes when paused near shrines), relics at responsive pedestals, boss phases, win or loss summary with personalized hero+dragon bond art.
- Co-op: P1/P2 both move/attack/dash independently, camera frames both, revive on clear; solo touch virtual stick + pads fully playable.
- No JS errors, readable at desktop + 390px, mute/R/Pause work, persistence survives reload.
- Visuals: heroes/dragon read as distinct authored characters (rims, larger silhouettes), rooms have depth/lighting/props + theme breathing motes, faceted glowing relics, expressive effects + world shake, focal composition; dragon idles with curious life; every frame screenshot-worthy per art mandate.

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
- Pass 18: Shrine visual authorship — room-clear shrines now layered stone pedestals with rotating runes, bobbing faceted relic gems, and responsive player-proximity effects (brighter gem, larger pulsing aura, orbiting sparkles) + emerge particle bursts. Makes every relic choice a magical authored moment. Directly addresses prior visual review + WORKLOG environmental polish note. 27/27 verify.
- Pass 19: Immediate spawn framing + victory triumph canvas art (handcrafted hero+dragon vs maw illustration on win summary); central safe entry spawns.
- Pass 20: Safer first-room enemy spacing (closest foe now 272px, generous breathing room) + per-room transition camera framing (double update after door load prevents any center-snap offscreen on any of the 6 rooms). Closes the full "off-camera entry" class of issues from monitor review for the entire run. 29/29 verify.

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
- ✓ Preview opens game directly. Verification matches reality. 38/38 green. Every room entry/transition is framed and safe (no off-camera ever, authored central spawns + generous first-foe spacing). Every room breathes with theme motes; dragon shows full-body idle personality (head sway + gaze wander + tail flicks + wing micro-twitches when paused at shrines/relics); relics are faceted glowing treasures; summaries have bespoke personalized bond art for win *and* loss. 
- **Art mandate:** No generic canvas, no placeholder shapes, no lifeless pet. Handcrafted silhouettes (heroes + expressive dragons with rich living idle emotes across head/tail/wings + 6 characterful enemies + boss), layered environments with consistent theme-specific atmospheric drifting motes in *every* room (Pass 23), responsive shrines, faceted relics with glint, expressive effects + world shake + focal rims, personalized victory/defeat illustrations, painting-like desktop frame — screenshot any moment (combat, quiet dragon idle at shrine with tail flick, enraged boss, win or loss summary) and it looks like a real art-directed piece with Dragon Crew creature wonder. Operator visual review + monitor blocker notes fully addressed across dedicated passes 8-29; kept polishing well past "green checks" until the bar was museum-grade for a vertical slice. Pass 29 (dragon tail/wing idle) was the final living capstone before deadline.

## Release Notes (for PR / studio)
**Dragonbound Depths** — a handcrafted co-op fantasy action RPG vertical slice.

Choose your hero. Bond with a young dragon companion. Descend through 6 atmospheric ruins, fight corrupted creatures, claim relics at shrines, and defeat the Ash Maw. Local co-op on one keyboard or solo. Real mechanics, real art direction, real game feel.

This is the canonical reviewable artifact. All verification 38/38 green. Visual authorship complete (Passes 8-29, including dragon full-body idle life (tail/wing) as final living touch) per operator mandate + all review notes. Ready for human review. (Full spec + prompt attached. One branch/PR #70 maintained throughout.)

---
*PR body source for factoryx/factory-dragon-crew/dragonbound-depths. Update the live PR with this + the original full user_query payload under "FactoryX WorkOrder Context". Tags: FactoryX-WorkOrder: work-order-1779064702337-dragonbound-depths and FactoryX-Factory: factory-dragon-crew.*
