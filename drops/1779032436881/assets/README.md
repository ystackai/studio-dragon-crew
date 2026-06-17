# Sanctuary of the Six Lights — Assets & Notes

Self-contained browser experience. All visuals procedural (Canvas 2D) or reused from:

- `../../team/avatars/generated/*.png` — the six dragon portraits (Fire, Ice, Water, Snow, Sea, Lava).

Real file-backed audio assets added under `assets/generated/` (see ASSET_MANIFEST.md + generate_sfx.py) for rotate, beam, flow, mirror, shrine, loom.

No external images, fonts, or paid services.

## Running locally
Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). Works offline.

## Keyboard controls (reliable after rework)
- 1–6 : open the corresponding dragon shrine
- M : toggle mute
- R : reset progress
- Water (labyrinth): arrows move highlight ring; Space or Enter rotates the selected pipe. Direct click/tap also rotates. One intentional rotate solves the seeded path.
- Ice (prism): click or drag mirrors, or ← → on focused sliders; live gold beam shows winning path when steered correctly.
- ESC : close trial or finale

## Progress
Saved in localStorage under `sanctuary-six-lights-v1`. Reset button clears it.

## Reduced motion
Respects `prefers-reduced-motion: reduce` — fewer particles, static sky.

## Mute
Persists across reloads. All audio has strong visual equivalents. Generated WAVs enhance key moments (loaded on gesture).

## FactoryX WorkOrder
work-order-1781694911088-followup (rework of 1779032436881)
Branch: factoryx/factory-dragon-crew/work-order-1781694911088-followup

This is the canonical artifact for the "Sanctuary of the Six Lights" deliverable. Feedback (rotate, winning ray path, more sound, polish) addressed here before unrelated changes.