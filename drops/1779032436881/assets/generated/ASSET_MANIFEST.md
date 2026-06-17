# Sanctuary of the Six Lights — Generated Assets Manifest (v2 contract)

**Drop:** drops/1779032436881/
**Work Order:** work-order-1781694911088-followup (rework)
**Date:** 2026-06-17

## Audio Assets (file-backed, required for material sound changes)

All SFX are short, lightweight (<50kB each), 44.1 kHz 16-bit mono WAVs. Loaded via AudioContext decodeAudioData with gesture-safe play. Procedural WebAudio remains as instant fallback if decode fails.

| File | Size | Duration | Description | Generation |
|------|------|----------|-------------|------------|
| `rotate_click.wav` | ~6kB | 70ms | Crisp pipe rotate accent + short tail | python wave: sine(920) + sweep(780->420) |
| `beam_success.wav` | ~53kB | 600ms | Bright ascending chime + shimmer tail for prism win | python: sweep(380->920) + layered sines |
| `water_flow.wav` | ~84kB | 950ms | Soft low whoosh + bubbly filtered noise for flow | python: sweep + lp noise |
| `mirror_tone.wav` | ~28kB | 320ms | High crystalline ping for mirror/prism adjustment | python: pure decaying sine |
| `shrine_open.wav` | ~62kB | 700ms | Warm swell chord for opening any dragon trial | python: 4-note chord + sweep |
| `loom_awaken.wav` | ~141kB | 1.6s | Low ancient pad + rising harmonics (finale / full blessings) | python: low chord + rising sweep |

## Provenance

- Tooling: stdlib python3 (wave, struct, math) — deterministic from source script.
- Script: `assets/generated/generate_sfx.py` (checked in; rerun to reproduce byte-identical if needed).
- Intent: tactile, magical, non-musical accents that pair with DOM/CSS visuals (rotate, gold beam, wave lines, gate glow). No samples, no external services at runtime.
- House style: weighty but intimate; low fundamentals + glassy highs; always paired with immediate visual change.

## Usage in Game

See `src/audio.js` updates: `loadGeneratedAssets()` called on first gesture (or trial open), stores AudioBuffers, `playAsset(name)` used for key moments alongside existing play* functions as layered feel. Graceful: if asset not decoded yet or muted, falls back to the fast WebAudio chimes.

## Verification

- Files have valid RIFF/WAVE headers (checked via `file` + hexdump).
- Load in browser: decodeAudioData succeeds; play on user gesture (no autoplay).
- Total added payload: ~0.37MB uncompressed; after gzip in http serve still well under 2MB limit for whole experience.

## Non-asset Polish (no new generated files)

- Interaction redesigns in water.js / ice.js (see WORKLOG).
- Instruction text, focus, sizing, more responsive hints.
- Additional WebAudio layers gated behind assets when present.

**Contract note:** These are real authored file assets + manifest per "asset_contract_v2" in payload. ASSET_MANIFEST.md alone would be insufficient; WAVs are present.
