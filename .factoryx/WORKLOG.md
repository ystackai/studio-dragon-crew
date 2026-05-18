# Dragonbound Depths — WorkOrder Polish Log
**WorkOrder:** work-order-1779064702337-dragonbound-depths  
**Factory:** factory-dragon-crew  
**Branch:** factoryx/factory-dragon-crew/dragonbound-depths  
**Artifact:** drops/dragonbound-depths/ (index.html + game.js + styles.css)  
**Preview:** .factoryx/preview-entrypoint → drops/dragonbound-depths/index.html (direct)  
**Deadline:** 2026-05-18T16:38:22.337880Z (polish_until_deadline)  
**Status:** Active — visual authorship polish in progress per operator mandate

## Current State (as of last commit 789683b)
- **Mechanics:** 3 heroes (Ember Knight, Frost Witch, Tide Ranger) with distinct basic/special/dash. 3 dragons (Cinder, Rime, Gale) with passive + active. Full 2P local co-op (WASD+arrows etc) + clean solo. 5 areas (4 combat rooms + boss arena "The Maw of Ash"). 6+ enemy behaviors (skitter swarm, archer, brute elite, wisp, burrow ambush, drake flyer). 8 relics with 3-choice shrine offers after key rooms. XP pickups, room clears, boss phases (2+), win/loss/run summary, best persistence via localStorage.
- **Co-op:** Camera follows avg of alive players, adaptive zoom for separation, soft bounds, no friendly fire, revive on room clear.
- **Verification:** 23/23 ✓ green (core files, syntax, systems, hooks, responsive 390px, audio/HUD, relics, visuals). scripts/verify.sh includes dragonbound section + manual QA notes.
- **Visuals baseline:** Title screen authored (ruins + dragon silhouette + mist + embers). Gameplay: vector canvas art, theme rooms with atmospheric particles (Pass 6: fireflies, glints, embers, ash). Players: simple colored circles + helm/weapon line (radius ~14). Dragons: ~17px ellipse + head + animated wing flap + type accents (Pass 5). Projectiles/particles: basic circles + dmg text. HUD: clean top bar + cooldown rings + minimap dots.
- **Operator feedback addressed so far:** Mechanics meaningful, checks green, title competent. In-game still "too dark, tiny, and shape-based" (per visual review note). Need larger/readable silhouettes, richer lighting/layering, clearer identity, stronger effects, brighter focal, handcrafted magical-fantasy look.

## Polish History (recent passes on this branch)
- Pass 7: HiDPI crisp DPR canvas + solo touch virtual stick + action pads for graceful 390px play + sharper art.
- Pass 6: Luminous atmospheric life in all rooms (fireflies, crystal glints, rising fissure embers, awakened runes, boss ash motes) for art-directed screenshot moments.
- Pass 5: Dragon visual authorship + fissure atmosphere.
- Pass 4: Sync verify + WORKLOG.
- Earlier: Core systems (rooms, combat, co-op camera, relics, audio WebAudio, HUD, overlays, persistence, touch parity, 3 heroes/3 dragons, 4+1 rooms, boss 2-phase).

## Next Passes (focused, one coherent change per pass)
1. **Player silhouette upgrade (Pass 8):** Increase player radius to 18-20 for presence. Replace circle+line with layered authored shapes per hero: Ember (helmet plume, pauldrons, flame-edged blade, cape flow on dash), Frost (hood veil, ice crystal staff, frost rim), Tide (hood + quiver hint, spear with ribbon, agile stance). Add soft shadow, facing-aware details, better downed state, P1/P2 badges integrated. Goal: readable even at 0.7 zoom, distinct at glance.
2. **Dragon companion upgrade (Pass 9):** Scale dragon body 1.4x (larger ~24px), add tail (curved animated), 4 legs with subtle walk cycle tied to flap, expressive eyes (blink state), nostril/ear accents, breath glow when active (cinder cone preview), ice crown for rime, wind crest for gale. More particles on action. Makes companion feel like a character that "belongs in screenshots".
3. **Room depth & lighting (Pass 10):** Layered floor (base + noise texture suggestion via multi rect/arcs + subtle gradient), foreground silhouette props (vines/roots for grove, floating crystal clusters for hollow, carved pillars for sanctum, jagged rock for fissure, central rune dais + ash pillars for boss). Add vertical light shafts/glow pools from "ceiling cracks"/archways, rim lighting on walls, soft vignette per room for focal. Increase contrast on key elements without washing magic tone.
4. **Combat effects & readability (Pass 11):** Enhanced particle renderer (additive glow layers for fire/ice/wind, streak lines for fast proj, impact ring flashes on hit, telegraph expansion rings with dashed style). Projectile draws: trails + glow + element core. Enemy draws: upgrade from circles to small but clear silhouettes (skitter 6-legs, archer bow+hood, brute shield+helm, wisp orbiting orbs, burrow dirt mound + eyes, drake winged serpent). Boss: more menacing layered horns + lava vents + phase glows.
5. **Focal composition & brightness (Pass 12):** Dynamic key light following player+dragon avg (soft radial gradient overlay in world space, brighter near heroes). Slight hero/dragon rim light always (magical bond glow). Tuned global floor brightness up 8-12% in non-boss rooms for "handcrafted not murky" read. Minimap + HUD polish for pop without clutter. Ensure 390px and desktop both screenshot-clean.
6. **Spec edge + final QA (Pass 13+):** Confirm 5 combat areas (add 5th room if count strict), run full manual flow (P1+P2, all heroes/dragons, full run to boss win, relic choices, death/revive, summary stats), verify no perf hit, audio non-breaking, localStorage clean. Update preview redirect if needed, sync PR body.

## Known Issues / Polish Notes
- World rooms are large (1180-1360) + zoom<1 makes even radius-18 feel "tiny" on 960 logical canvas; consider post-draw upscale or modest canvas CSS size bump (e.g. 1040x680) for desktop presence while keeping mobile 390 safe.
- No true spritesheets — all vector for zero-asset purity; pushing detail in draw funcs is the path (keeps self-contained).
- Boss arena has fewer spawns pre-boss (intentional for focus); 2-phase works but could use more visual tells.
- Touch on 390px: virtual stick + 3 pads functional per Pass 7, but visual "joystick" could be more authored.
- Deadline far (May 18); multiple passes expected. Do not stop at green checks.
- Dragon Crew lens use: Fire (fantasy wonder in every frame), Ice (stable clean draw code), Snow (readability/silhouettes), Sea (rhythm in anim/particles), Lava (concise notes).

## Verification (always run after edit)
```bash
./scripts/verify.sh
```
Expect 23/23 + manual: open via preview-entrypoint, select hero/dragon/P2, full run, screenshot the playfield for "does this look like real art-directed piece?"

## Last Updated
2026-05-18 (ongoing autonomous polish)
