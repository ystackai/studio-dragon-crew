# Audio Plan — Dragon's Breath

## Overview

Every interaction state in Dragon's Breath has paired sonic feedback: bundled WAV assets layered with procedural Web Audio API synthesis. The system degrades gracefully to silent fallback if Web Audio is unavailable or the user mutes.

## Audio Architecture

| Layer | Source | Purpose |
|-------|--------|---------|
| Bunded WAVs | `audio/*.wav` (5 files) | Crisp, low-latency one-shot sounds for input, transition, success, failure, reset |
| Procedural Web Audio | `app.js` (AudioContext + Oscillator/Noise nodes) | Dynamic, intensity-scaled layered sound for charging growl and fire breath |
| Mute Gate | MasterGain node | Single-volume control; `gain = 0` when muted, `0.6` when unmuted |
| Graceful Fallback | `audioEngineBroken` flag | If Web Audio throws, all audio becomes silent; no user-visible errors |

## State-to-Sound Mapping

### IDLE
- **Hover / Focus** → bundled `spark.wav` (fallback: ascending 500→700 Hz chirp)
- **Idle animation** → silent (ambient only)

### CHARGING
- **Hold start** → dual-oscillator growl begins:
  - `chargeOsc1`: sawtooth, 55 Hz base (rises to 140 Hz at full charge)
  - `chargeOsc2`: sine, 110 Hz base (rises to 280 Hz at full charge)
  - Both gain nodes increase proportionally to charge level
- **Charge tick (8ms)** → growl pitch + volume update

### BREATHING (charge ≥ 10%)
- **Release trigger** → bundled `whoosh.wav` + procedural fire breath in parallel:
  - **Roar**: white noise through low-pass filter (300-900 Hz, decays to 80 Hz)
  - **Whoosh**: white noise through bandpass filter (1200→400 Hz)
  - **Crackle**: 3-8 percussive high-pass hits at 2500 Hz
  - **Impact**: rising sine (80→200 Hz)
  - All parameters scaled by `intensity = chargeLevel / 100`
- **Full charge (100%)** → bundled `chime.wav` + C-E-G-C ascending triad (523, 659, 784, 1047 Hz)

### WIFF (charge < 10%)
- **Release trigger** → bundled `thud.wav` + procedural "sneeze":
  - **Nasal tone**: triangle oscillator 350→200 Hz
  - **Weak puff**: white noise through 200 Hz low-pass filter

### COOLDOWN
- **Enter cooldown** → bundled `exhale.wav` + 220 Hz sine tick (0.2s, fade out)
- **Recovery period** → silent

### RESET (back to IDLE)
- **Cooldown complete** → bundled `exhale.wav` + soft reset tone

## Failure Modes

| Scenario | Behavior |
|----------|----------|
| Web Audio not supported | `ensureAudioCtx()` returns false; all sounds silent |
| Audio context locked (iOS) | `audioCtx.resume()` on first gesture; silent until unlocked |
| WAV file 404 | Promise resolves false; procedural audio becomes the primary layer |
| User mutes | `masterGain.gain = 0`; oscillators still run but are inaudible |
| Audio API throws during playback | `audioEngineBroken = true`; all further attempts silently skipped |

## Audio Asset Files

```
audio/
  spark.wav    — 6 KB, hover input click
  whoosh.wav   — 11 KB, transition whoosh
  chime.wav    — 22 KB, success chime
  thud.wav     — 9 KB, failure thud
  exhale.wav   — 13 KB, cooldown/reset exhale
```

## Performance Notes

- Audio buffers loaded lazily on first interaction
- 3-second timeout: if loading doesn't complete in 3s, falls back to procedural audio
- All procedural sounds use short-lived oscillator/gain nodes; stop()+disconnect() on cleanup
- Particle rendering respects `prefers-reduced-motion`; audio is unaffected by that preference
- No continuous audio loop; all sounds are triggered per-interaction and self-terminate
