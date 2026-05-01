# Director's Integration Checklist
## Dragon Flight - Volcanic Canyon Opening Sequence

This checklist verifies the 3-minute vertical slice meets all delivery acceptance criteria before sign-off.

---

## 1. Performance Targets

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 1.1 | **60 FPS target** | Sustained 60fps on mid-tier hardware (8-core CPU, 8GB RAM, integrated GPU) with Three.js r128 WebGL renderer | [ ] |
| 1.2 | **Build size < 500MB** | Total package of all project files under 500MB (currently ~200KB for core files) | [ ] |
| 1.3 | **Zero loading screens** | Single continuous 600m canyon track with no scene transitions, no loading bars, no intermediate screens | [ ] |
| 1.4 | **No clipping or soft-locks** | Player cannot phase through canyon walls, cannot get stuck on geometry, camera does not tunnel into walls | [ ] |

### 1.1.1. FPS Verification Procedure
1. Launch the game via `npm run start` in the drop/ directory
2. Open Chrome DevTools → Performance panel
3. Record 30 seconds of gameplay covering: canyon entry, thermal collection, fire breath use, wall collision, and guardian approach
4. Verify FPS frame times stay below 16.67ms with no spikes >33ms

### 1.2.1. Build Size Verification
1. Run `du -sh /path/to/project` and confirm total is <500MB
2. Verify no node_modules or build artifacts are included in the deliverable

---

## 2. Flight Mechanics Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 2.1 | **WASD/Arrow responsiveness** | Pitch (W/S, Up/Down), Roll (A/D, Left/Right), Yaw (auto-bank + A/D direct input) all respond with zero input lag and zero drift | [ ] |
| 2.2 | **Momentum-based physics** | Drag coefficient (0.97) and inertia factor (0.92) produce smooth, weighty flight with gentle deceleration | [ ] |
| 2.3 | **Boost (Space)** | Increases speed from 15 to 35 m/s, drains 2 heat/s, lasts 1.5s per press | [ ] |
| 2.4 | **Fire Breath (Shift)** | Sustained drain of 8 heat/s, particle emitter active while held, pitch modulation on heat level | [ ] |
| 2.5 | **Stall prevention** | Minimum forward speed of 5 m/s maintained; dragon never stalls or falls uncontrollably | [ ] |
| 2.6 | **Wall collision** | 15 heat loss, 0.4x velocity penalty, 1-second cooldown between collision triggers | [ ] |

---

## 3. Thermal System Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 3.1 | **Updraft collection** | 20 thermal updrafts placed across 600m track; each restores 25 heat and adds +5 Y velocity | [ ] |
| 3.2 | **Heat gauge HUD** | Circular canvas gauge in bottom-left corner accurately reflects current heat / 100 max | [ ] |
| 3.3 | **Heat regeneration** | Passive regen of 2 heat/s when not using abilities and below max | [ ] |
| 3.4 | **Heat drain balance** | Boost (2/s) and fire breath (8/s) provide meaningful resource management without making the sequence unwinnable | [ ] |

---

## 4. Audio-Visual Sync Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 4.1 | **SFX latency < 50ms** | All interaction SFX (wing flap, thermal chime, collision, fire breath, rune activation) trigger within 50ms of the triggering event | [ ] |
| 4.2 | **Background music state machine** | Music layers crossfade smoothly based on velocity: ambient wind (always), drums (speed>20), brass (speed>25 or heat<30) | [ ] |
| 4.3 | **Guardian climax audio** | `playGuardianAwakening()` triggers exactly once at guardian perch with correct 5-note chord, no double-trigger or stutter | [ ] |
| 4.4 | **Crossfade smoothness** | All audio transitions use `linearRampToValueAtTime` or `exponentialRampToValueAtTime`; no audible clicks or pops at crossfade boundaries | [ ] |
| 4.5 | **Wing flap SFX** | Bandpass noise burst at 800 Hz with 0.12s cooldown, triggered only during pitch/roll input | [ ] |
| 4.6 | **Fire breath pitch modulation** | Crackle pitch rises from 150 Hz (full heat) to 500 Hz (empty heat) proportionally | [ ] |

### 4.1.1. SFX Latency Test Procedure
1. Use Chrome DevTools Performance panel with "User Timing" enabled
2. Press each input key and measure time from `keydown` event to audio node `start()` call
3. Measure must be <50ms for all SFX: wing flap, thermal chime, collision, fire breath, rune activation

---

## 5. Visual Direction Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 5.1 | **Stylized low-poly aesthetic** | Dragon model, canyon walls, basalt columns, and guardian all use clean, low-poly geometry with warm saturated palette | [ ] |
| 5.2 | **Color palette** | Crimson (#8B1A1A), amber (#FF8C00), gold (#DAA520), obsidian (#1A1A2E) are the primary colors throughout | [ ] |
| 5.3 | **Dynamic lighting** | 12 magma pool point lights, 30 magma veins with pulsing emissive, guardian gold/amber lights | [ ] |
| 5.4 | **Camera behavior** | Third-person over-the-shoulder with smooth damping; FOV scales 55 base down to ~18 at max boost speed | [ ] |
| 5.5 | **Volumetric atmosphere** | 35 fog planes, 200 floating embers with drift animation, all contributing to depth and atmosphere | [ ] |
| 5.6 | **Minimal HUD** | Only circular heat gauge (bottom-left) and pulsing waypoint marker (top-center); no damage numbers, no health bars | [ ] |

---

## 6. Narrative and Flow Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 6.1 | **Start menu** | Title "DRAGON FLIGHT", subtitle "Volcanic Canyon Sequence", control instructions with kbd tags, "Take Flight" button | [ ] |
| 6.2 | **Sequence length** | 600m canyon track designed for ~3 minutes of playtime at base speed with thermal collection and fire breath use | [ ] |
| 6.3 | **Rune activation chain** | 8 runes placed along track; each activates near fire breath with visual glow and audio arpeggio | [ ] |
| 6.4 | **Guardian end event** | Crystalline icosahedron with orbiting shards, point lights, bob animation; triggers awakening chord and complete screen | [ ] |
| 6.5 | **Complete screen** | Title "The Guardian Awakens", lore message, "Fly Again" button, smooth fade-in transition | [ ] |

---

## 7. Build and Delivery Verification

| # | Criterion | Pass Criteria | Tested |
|---|-----------|---------------|--------|
| 7.1 | **Standalone executable** | Game runs as a browser-based standalone with `npm run start` serving `index.html` + `main.js` | [ ] |
| 7.2 | **No save system** | No localStorage, no cookies, no persistence between sessions | [ ] |
| 7.3 | **No multiplayer** | Pure single-player experience, no networking | [ ] |
| 7.4 | **No extra menus** | Only start menu and complete screen; no settings, no options, no credits beyond the complete screen | [ ] |
| 7.5 | **Restart flow** | "Fly Again" button resets all state: position, heat, velocity, sequence flags, and audio context | [ ] |
| 7.6 | **Three.js dependency** | Loaded via CDN (cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) to minimize local footprint | [ ] |

---

## 8. Sign-Off

| Field | Value |
|-------|-------|
| **Director** | [ ] |
| **Date** | [ ] |
| **All items checked** | [ ] |
| **Build hash** | `808f752488d24377142081679744f2695d9e178a` |
| **AudioPlan.md verified against code** | [ ] |

### Quick Reference: Key Code Locations
- Flight controller: `drop/main.js:122-166`
- Thermal system: `drop/main.js:168-270`
- Audio system: `drop/main.js:1248-1479`
- Camera system: `drop/main.js:84-118`
- Dragon model: `drop/main.js:506-740`
- Canyon environment: `drop/main.js:780-1090`
- Guardian: `drop/main.js:1197-1245`
