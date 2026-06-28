#!/usr/bin/env python3
"""
Generate lightweight magical fantasy SFX for Sanctuary of the Six Lights.
Pure stdlib (wave + math + struct). 44.1kHz, 16-bit mono, short duration.
Provenance: synthesized algorithmically for tactile game feedback (no samples).
"""

import wave
import struct
import math
import os

SR = 44100
OUT_DIR = os.path.dirname(__file__)

def write_wav(name, samples):
    path = os.path.join(OUT_DIR, name)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        # clamp + pack
        frames = b''.join(struct.pack('<h', max(-32767, min(32767, int(s * 32767)))) for s in samples)
        w.writeframes(frames)
    print(f"wrote {path} ({len(samples)/SR:.3f}s)")
    return path

def env_attack_release(n, atk=0.02, rel=0.15):
    out = []
    for i in range(n):
        t = i / SR
        a = min(1.0, t / max(0.001, atk))
        r = min(1.0, (n - i) / max(1, rel * SR))
        out.append(a * r)
    return out

def sine(freq, dur, amp=0.7):
    n = int(SR * dur)
    e = env_attack_release(n, 0.008, max(0.08, dur*0.6))
    return [amp * e[i] * math.sin(2*math.pi*freq*i/SR) for i in range(n)]

def sweep(start_f, end_f, dur, amp=0.65, kind='up'):
    n = int(SR * dur)
    e = env_attack_release(n, 0.01, 0.22)
    out = []
    for i in range(n):
        t = i / n
        f = start_f + (end_f - start_f) * (t if kind == 'up' else (1-t))
        out.append(amp * e[i] * math.sin(2*math.pi*f*i/SR))
    return out

def noise_burst(dur, amp=0.5, lp=0.6):
    n = int(SR * dur)
    e = env_attack_release(n, 0.005, 0.12)
    out = []
    phase = 0.0
    for i in range(n):
        # simple lowpassed noise via leaky integrator
        phase = phase * lp + (1-lp) * ( (hash(i) % 20001)/10000.0 - 1.0 )
        out.append(amp * e[i] * phase)
    return out

def chord_tone(freqs, dur, amp=0.55):
    n = int(SR * dur)
    e = env_attack_release(n, 0.012, 0.28)
    out = [0.0] * n
    for f in freqs:
        for i in range(n):
            out[i] += amp * e[i] * 0.5 * math.sin(2*math.pi*f*i/SR)
    return out

def make_rotate_click():
    # crisp high click + short tail
    a = sine(920, 0.045, 0.85)
    b = sweep(780, 420, 0.07, 0.35)
    n = max(len(a), len(b))
    return [ (a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n) ]

def make_beam_success():
    # bright ascending + shimmer tail
    a = sweep(380, 920, 0.38, 0.7)
    b = sine(1240, 0.52, 0.22)
    c = sine(620, 0.6, 0.18)
    n = max(len(a), len(b), len(c))
    return [ (a[i] if i<len(a) else 0)*0.9 + (b[i] if i<len(b) else 0)*0.6 + (c[i] if i<len(c) else 0)*0.5 for i in range(n) ]

def make_water_flow():
    # soft low whoosh + bubbly noise
    a = sweep(110, 190, 0.9, 0.38)
    b = noise_burst(0.95, 0.22, 0.72)
    n = max(len(a), len(b))
    return [ (a[i] if i<len(a) else 0) + (b[i] if i<len(b) else 0)*0.8 for i in range(n) ]

def make_mirror_tone():
    # crystalline high ping with light decay
    return sine(1180, 0.32, 0.78) 

def make_shrine_open():
    # warm open swell
    a = chord_tone([262, 330, 392, 523], 0.7, 0.48)
    b = sweep(190, 280, 0.65, 0.25)
    n = max(len(a), len(b))
    return [ (a[i] if i<len(a) else 0) + (b[i] if i<len(b) else 0) for i in range(n) ]

def make_loom_awaken():
    # low ancient pad + rising light
    a = chord_tone([58, 87, 116], 1.6, 0.6)
    b = sweep(220, 880, 1.4, 0.18)
    n = max(len(a), len(b))
    return [ (a[i] if i<len(a) else 0)*0.95 + (b[i] if i<len(b) else 0) for i in range(n) ]

if __name__ == '__main__':
    write_wav('rotate_click.wav', make_rotate_click())
    write_wav('beam_success.wav', make_beam_success())
    write_wav('water_flow.wav', make_water_flow())
    write_wav('mirror_tone.wav', make_mirror_tone())
    write_wav('shrine_open.wav', make_shrine_open())
    write_wav('loom_awaken.wav', make_loom_awaken())
    print("All SFX generated.")