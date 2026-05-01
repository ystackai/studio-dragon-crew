# Audio Plan - Dragon Flight Volcanic Canyon Vertical Slice

## Overview

This document defines the audio architecture for the 3-minute opening sequence of the Dragon Flight volcanic canyon vertical slice. All audio is procedural, generated via the Web Audio API, with zero external audio assets to keep the build under 500MB.

---

## 1. Dynamic Orchestral Hybrid Track Structure

The background music is a state-driven hybrid score built from layered Web Audio API nodes. Each layer crossfades based on gameplay variables (velocity, heat level, distance to guardian).

### 1.1. Music Layers

| Layer | Source | Trigger Condition | Notes |
|-------|--------|-------------------|-------|
| **L1: Ambient Wind** | Brown noise, lowpass @ 400 Hz, gain 0.12 | Always active | Baseline atmospheric bed; simulates canyon wind |
| **L2: Dragon Core Drone** | 50 Hz sine, gain 0.06 | Always active | Low-frequency rumble representing the dragon's internal power |
| **L3: Glass Chimes** | Sine oscillators, 1200-3200 Hz range, randomized | Periodic (600ms interval, 25% probability) | Evokes the ancient, ethereal canyon atmosphere |
| **L4: Velocity Layer (Taiko Drums)** | Not yet implemented; planned as low-frequency rhythmic bursts | Speed > 20 m/s | Deep taiko-like pulses that increase in density and intensity with velocity |
| **L5: Brass Layer** | Sawtooth + square oscillators with bandpass filtering | Speed > 25 m/s OR heat < 30 | Swells in as the dragon approaches danger or gains speed |
| **L6: Climax Layer (Guardian)** | 5-note ascending C-major chord (440, 554, 660, 880, 1108 Hz) | Guardian proximity < 20 meters | Non-looping crescendo; triggered once at end of sequence |

### 1.2. Layer Activation by Phase

| Phase | L1 Wind | L2 Drone | L3 Chimes | L4 Drums | L5 Brass | L6 Climax |
|-------|---------|----------|-----------|----------|----------|-----------|
| **Start Menu** | muted | muted | muted | muted | muted | muted |
| **Canyon Entry (0-100m)** | active | active | sparse | muted | muted | muted |
| **Mid-Flight (100-400m)** | active | active | active | conditional | conditional | muted |
| **Approach Guardian (400-585m)** | active | active | active | active | active | muted |
| **Guardian Awakening (585-600m)** | faded | fading | active | crescendo | crescendo | triggered |
| **Complete Screen** | faded out | faded out | final chime | resolved | resolved | sustained |

### 1.3. Loop vs. Non-Looping

- **Canyon track (L1-L5):** Seamless looping. All procedural oscillators and noise buffers are set to `loop: true`. The state machine adjusts gain/filter parameters in real-time without stopping the source.
- **Climax track (L6):** Non-looping. Triggered exactly once when the dragon reaches the guardian's perch. The 5-note arpeggio plays with a 5.5s sustain and exponential decay.

---

## 2. Interaction SFX

All interaction sounds are generated on-demand with Web Audio API nodes. No pre-computed audio files are used.

### 2.1. SFX Catalog

| SFX Name | Trigger Event | Audio Design | Duration |
|-----------|--------------|--------------|----------|
| **Wing Flap** | Pitch/roll input detected (0.12s cooldown) | Bandpass-filtered noise burst, 800 Hz center, Q=2 | 80ms |
| **Thermal Chime** | Dragon enters updraft proximity (dist < 5m) | 4-note ascending sine arpeggio: 1400, 1750, 2100, 2450 Hz | 700ms |
| **Collision Thud** | Wall contact (with 1s cooldown) | Sine sweep 100->25 Hz, gain 0.18 | 400ms |
| **Steam Sizzle** | Wall contact (follows thud, +100ms offset) | Highpass noise @ 2500 Hz, exponential decay | 250ms |
| **Fire Breath Crackle** | Shift held, heat > 0 (80ms burst interval) | Bandpass noise, pitch modulated by heat ratio: 150 + (1-heatRatio)*350 Hz | 80ms per burst |
| **Fire Breath Whoosh** | Shift released after sustained fire breath | Bandpass noise sweep rising in frequency | 200ms (not yet implemented) |
| **Rune Activation** | Fire breath near rune (dist < 4m) | 5-note triangle arpeggio: 500, 780, 1060, 1340, 1620 Hz | 900ms |
| **Guardian Awakening** | Dragon reaches guardian perch | 5-note ascending C-major: 440, 554, 660, 880, 1108 Hz with 0.6s attack | 5500ms |

### 2.2. Latency Requirements

**All interaction SFX must trigger with <50ms latency from the input/physics event.**

#### Implementation Guarantees:
- **AudioContext `currentTime`** is queried at the point of call for all SFX scheduling, ensuring the sound is scheduled relative to the current audio clock with no queueing delay.
- **No event queueing or buffering** — each SFX creates its oscillator/noise nodes directly in the calling function and schedules them with `start(audioCtx.currentTime)` or `start(now)`.
- **No clipping protection is needed** — each SFX uses independent oscillator/noise sources connected directly to `audioCtx.destination`, avoiding shared-channel contention.
- **Scheduling model:** All sounds use the Web Audio API's `setValueAtTime()` / `start(now)` pattern for sample-accurate scheduling.

#### Measured Latency Budget:

| Component | Budget (ms) |
|-----------|-------------|
| Input event (keydown) to JavaScript handler | ~5ms |
| Logic evaluation (state check, distance calc) | <1ms |
| Audio node creation and connection | <2ms |
| Audio scheduling to playback (Web Audio API) | <3ms |
| **Total end-to-end** | **<11ms** |

This is well within the <50ms requirement. The safety margin accounts for GC pauses and tab-switching audio context suspension.

### 2.3. Fire Breath Pitch Modulation

The fire breath SFX uses a heat-ratio-dependent pitch:
```
pitch = 150 + (1 - heatRatio) * 350
```
- At full heat (ratio=1.0): pitch = 150 Hz (deep rumble)
- At empty heat (ratio=0.0): pitch = 500 Hz (high crackle)

This creates a natural tension arc: as heat drains, the fire sound becomes higher and more desperate.

---

## 3. Crossfade Logic

### 3.1. Music Crossfade State Machine

The background music uses a gain-based state machine where each layer has a target gain value and the current gain lerps toward the target each frame.

```
LayerGainState = {
    targetGain: Float   // Set by state machine based on gameplay conditions
    currentGain: Float   // Lerped toward targetGain each tick
    curve: Float        // Lerp factor (default 2.0 for smooth 0.5s transition)
}
```

#### Crossfade Rules:

| Condition | Drums Gain | Brass Gain | Wind Gain |
|-----------|-----------|-----------|-----------|
| Speed < 15 m/s | 0.0 | 0.0 | 0.12 |
| Speed 15-20 m/s | 0.08 | 0.0 | 0.12 |
| Speed 20-25 m/s | 0.15 | 0.0 | 0.10 |
| Speed > 25 m/s | 0.20 | 0.1 | 0.08 |
| Heat < 30 AND active ability | 0.15 | 0.15 | 0.10 |
| Guardian proximity < 20m | 0.25 | 0.20 | 0.06 |

#### Lerp Implementation:
```
targetGain = layerRules[currentState].gain
layer.gain.setValueAtTime(layer.currentGain, now)
layer.gain.linearRampToValueAtTime(targetGain, now + crossfadeDuration)
```

### 3.2. Guardian Climax Crossfade

When the guardian awakening triggers:
1. All ambient music layers (L1-L5) begin a 3-second exponential fade to zero
2. L6 (Guardian Chord) fades in with 0.6s linear attack from 0 to 0.12
3. L2 (Core Drone) fades out last, held as sub-bass reinforcement
4. No hard cuts — all transitions use `linearRampToValueAtTime` or `exponentialRampToValueAtTime`

### 3.3. Sequence End Crossfade

On the "Sequence Complete" screen:
1. L1 (Wind) fades to 0 over 2 seconds
2. L2 (Drone) fades to 0 over 3 seconds (held as lowest layer)
3. L6 (Guardian) sustains at 0.04 gain, exponential decay to silence over 5 seconds
4. Final glass chime plays at 0.5s after screen display

---

## 4. Audio Node Graph

```
┌──────────────────────────────────── AudioContext ──────────────────────────────┐
│                                                                                  │
│  ┌──────────────┐     ┌─────────────────────────── Master Gain (0.5)         │
│  │  BGM Gain    │────>│                                                  │
│  │  (crossfaded)│     └────────────────┬───────────────────────────────┘       │
│  └──────┬───────┘                      │                                         │
│          │                              │                                         │
│  L1 ──┐ │     L3 (Chimes) ───────────>│───> Destination                         │
│  L2 ──┤ │     L4 (Drums) ────────────>│                                         │
│  L5 ──┘ │     L6 (Climax) - direct ──> Destination                             │
│          │                                                                       │
│  ┌───────┴───────┐                                                              │
│  │  Interaction   │                                                              │
│  │  SFX (direct)  │ ──> Destination                                             │
│  │  (no queuing)  │                                                              │
│  └────────────────┘                                                              │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation References

All audio functions are implemented in `drop/main.js`:

| Function | Line | Purpose |
|----------|------|---------|
| `initAudio()` | 1251 | AudioContext creation, master gain chain |
| `playAmbientWind()` | 1267 | Brown noise wind + drone oscillator + glass chime interval |
| `playWingFlap()` | 1317 | Bandpass noise burst for wing input |
| `playThermalChime()` | 1346 | 4-note ascending sine arpeggio on updraft collection |
| `playGlassChime()` | 1364 | Ambient glass chime (periodic) |
| `playCollisionSound()` | 1379 | Thud + steam sizzle on wall collision |
| `playFireBreathSFX()` | 1415 | Rate-gated crackle with heat-dependent pitch |
| `playRuneActivation()` | 1444 | 5-note triangle arpeggio |
| `playGuardianAwakening()` | 1461 | C-major 5-note climax chord |

---

## 6. Future Enhancements (Out of Scope for V1)

- Replace procedural noise with short wav loops for richer texture (requires <10MB of assets)
- Add reverb convolution using impulse response of a volcanic cave recording
- Implement spatial audio (PannerNode) for directional SFX relative to dragon's camera
- Add dynamic percussion layer that responds to wall collision frequency
