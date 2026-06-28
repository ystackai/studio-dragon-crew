# Sanctuary of the Six Lights — Assets & Notes

Self-contained browser experience. All visuals procedural (Canvas 2D) or reused from:

- `../../team/avatars/generated/*.png` — the six dragon portraits (Fire, Ice, Water, Snow, Sea, Lava).

No external images, fonts, or paid services.

## Audio assets (follow-up pass)
Real file-backed WAVs under `assets/generated/` (rotate-pipe, mirror-turn, beam-lock, water-flow, shrine-open, success-tail) + ASSET_MANIFEST.md.
Used for core interactions (rotate, steer, open, win, success). See generated/ASSET_MANIFEST.md for provenance.
All playback is gesture-gated; mute respected; visuals always provided.

## Running locally
Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). Works offline.

## Keyboard controls
- 1–6 : open the corresponding dragon shrine
- M : toggle mute
- R : reset progress
- Inside trials: arrows, Space/Enter supported (Water labyrinth: arrows move selection highlight on grid, Space/Enter or big "Rotate Selected" button rotates the glowing pipe — one turn on top-right L solves; Ice prism: left/right on middle mirror or drag steers to gold winning ray path from start)
- ESC : close trial or finale

## Progress
Saved in localStorage under `sanctuary-six-lights-v1`. Reset button clears it.

## Reduced motion
Respects `prefers-reduced-motion: reduce` — fewer particles, static sky.

## Mute
Persists across reloads. All audio has strong visual equivalents.

## FactoryX WorkOrder
work-order-1779032436881-sanctuary-six-lights
Branch: factoryx/factory-dragon-crew/sanctuary-of-six-lights

This is the canonical artifact for the "Sanctuary of the Six Lights" release.