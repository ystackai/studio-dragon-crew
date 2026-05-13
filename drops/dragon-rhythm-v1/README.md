# Dragon Rhythm v1

A Web Audio API browser-based music game for The Dragon Crew.

**Play it live**: open `index.html` in any modern browser. No build step required.

## Controls

| Key | Note |
|-----|------|
| `A` | C4 |
| `S` | D4 |
| `D` | E4 |
| `F` | F4 |
| `J` | G4 |
| `K` | A4 |
| `L` | B4 |
| `;` | C5 |

- Touch controls appear automatically on mobile/tablet.
- Press **Enter** or click **Start** to begin.
- Hits register within the golden hit zone at the bottom of the lane.
- Timing: **Perfect** (<20px), **Good** (<50px), **OK** (>50px).
- Combos multiply scoring. Misses reset the combo.
- Session lasts 30 seconds, then shows accuracy results.

## Audio Engine

Uses Web Audio API oscillators with multiple waveforms (sine, triangle, sawtooth, square). No audio files required — all sound is synthesized in real time.

## Visual

- 8-lane responsive layout
- Particle burst on hit
- Lane glow with timing color feedback
- Dark dragon-themed palette (`#62b6cb` accent, `#ff9f5a` perfect)
- Responsive down to 320px width

## File

Single-file HTML (~23 KB) — everything in `index.html`.
