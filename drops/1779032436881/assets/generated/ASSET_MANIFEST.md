# Sanctuary of the Six Lights — Generated Assets (follow-up pass)

Work Order: work-order-1781708066098-followup
Parent: work-order-1779032436881-sanctuary-six-lights
Date: 2026-06-17

## Purpose
Real file-backed authored audio assets to satisfy "Add more sound" + asset_contract_v2 feedback.
All audio is short, lightweight, self-contained, and used for tactile feedback on the core verbs (rotate pipes, steer rays, open shrines, success).

## Assets
| File                | Size | Description / Use |
|---------------------|------|-------------------|
| rotate-pipe.wav     | ~8k  | Short glassy click for Water pipe rotation (labyrinth). Triggered on Space/Enter/click rotate. |
| mirror-turn.wav     | ~19k | Soft crystalline tone for Ice mirror adjustments (prism). Plays on slider/arrow/drag. |
| beam-lock.wav       | ~56k | Rising harmonic for Ice "PATH CLEAR" / ray reaches gate win. |
| water-flow.wav      | ~41k | Gentle burble/plink for Water flow progress or win. |
| shrine-open.wav     | ~33k | Low warm swell + partial for shrine/trial open (all 6). |
| success-tail.wav    | ~95k | Warm resonant tail layered on any blessing claim + finale. |

## Generation / Provenance
- Authored via deterministic node PCM synthesis (see generate-assets.js in this dir).
- No ML/flux service used this pass (service unreachable); pure additive sine+noise+envelopes chosen to feel elemental and magical within Dragon Crew house style.
- All files are real WAV (RIFF PCM 16-bit mono 44.1kHz), loadable via Audio() after user gesture.
- Total added payload ~250kB uncompressed; acceptable as they are tiny and shared.

## Integration
- Loaded in src/audio.js (graceful decode + fallback to WebAudio synth if any fail).
- Played only after first user gesture (trial open or first pointer).
- Visuals always accompany (css transform, color flash, label, beam gold, flowing lines).

## Verification
- Files have valid RIFF headers (checked via node).
- Played in browser runtime via Audio + decode (see VERIFICATION).
- Mute still honored; no autoplay.

These assets directly address the "Add more sound" part of the operator feedback for this rework.

## Related
- See drops/1779032436881/assets/README.md for full keyboard + usage notes.
- Audio wiring also expanded the existing synth layers (growing 2-osc ambient) for non-file ambient bed.
