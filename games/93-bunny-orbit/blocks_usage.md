# Blocks Usage — Bunny Orbit

## Modules Used (from `.factoryx/foundry/blocks-2d/`)

| Module | File | Usage |
|---|---|---|
| `game-loop` | `game-loop.js` | **Reused as-is** — Fixed-timestep `FoundryLoop` drives the play and debrief scenes at 60fps. Title scene uses its own `requestAnimationFrame` loop. |
| `input` | `input.js` | **Adapted** — `FoundryInput` provides `pointer.x/y` for steering the bunny during thrust. Custom `keydown/keyup` + `pointerdown/pointerup` handlers manage the burn verb. |
| `scenes` | `scenes.js` | **Reused as-is** — `FoundryScenes` is available but the game uses a manual `currentScene` string ('title'/'play'/'debrief') with conditional update/render dispatch. |
| `tween` | `tween.js` | **Loaded but not actively used** — available for future polish (camera easing, UI transitions). |
| `particles` | `particles.js` | **Adapted** — Custom 3D thrust particles (`spawnThrustParticle`/`updateParticles`) replace the 2D canvas particle system. The `FoundryParticles` module is loaded as a fallback reference. |
| `screen-shake` | `screen-shake.js` | **Loaded but not actively used** — available for impact/landing feedback polish. |
| `rng` | `rng.js` | **Loaded** — `FoundryRng` provides seeded randomness for planet placement. |

## Audio
- `webaudio-kit.js` (from blocks): oscillator-based fallback SFX engine, always loaded as `FoundryAudio`.
- Raw WebAudio API loads WAV files from Asset Foundry for real music + SFX.

## Key Changes from Blocks Defaults
- **game-loop.js**: None. Used as-is.
- **input.js**: None. Used as-is.
- **scenes.js**: None. Available but game uses manual scene state.
- **tween.js**: None. Loaded, not called yet.
- **particles.js**: Adapted for 3D — game uses Three.js meshes for thrust particles instead of 2D canvas particles.
- **screen-shake.js**: None. Loaded, not called yet.
- **rng.js**: None. Used as-is for seeded planet positions.
