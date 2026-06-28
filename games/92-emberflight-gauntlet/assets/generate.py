#!/usr/bin/env python3
"""
Emberflight Gauntlet — deliberate local procedural asset generator (pure stdlib).
Produces reviewable file-backed PNG (RGBA) sprites and WAV (44.1k 16-bit mono) SFX
under games/92-emberflight-gauntlet/assets/ to satisfy operator asset contract v2
(2026-06-15T17:45Z): no foundry/asset pipeline exposed in this runtime; inspected
drops/ (some prior WAVs) and .factoryx/ (no hero sprite pipeline); therefore
authored this generator + committed outputs + ASSET_MANIFEST.md .

Central hero (dragon), enemies (hazards), world accents, and music-led moments
(Maw clear, dash, ember) now have explicit file artifacts instead of only
canvas vector blobs or oscillator bleeps.

Run: python3 generate.py   (outputs next to this script)
"""

import os
import math
import random
import struct
import wave
import zlib

OUT_DIR = os.path.dirname(__file__) or "."

# ---------------- PNG (RGBA8, filter0, zlib) ----------------
def _png_chunk(typ: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(typ + data) & 0xffffffff
    return struct.pack(">I", len(data)) + typ + data + struct.pack(">I", crc)

def make_png_rgba(width: int, height: int, pixels):
    """pixels: flat list or sequence of (r,g,b,a) tuples, row-major, len=w*h"""
    assert len(pixels) == width * height
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)  # RGBA
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter: none
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw.extend((r & 0xff, g & 0xff, b & 0xff, a & 0xff))
    idat = zlib.compress(bytes(raw), 9)
    sig = b"\x89PNG\r\n\x1a\n"
    return sig + _png_chunk(b"IHDR", ihdr) + _png_chunk(b"IDAT", idat) + _png_chunk(b"IEND", b"")

def save_png(path: str, width: int, height: int, pixels):
    with open(path, "wb") as f:
        f.write(make_png_rgba(width, height, pixels))

def make_color(r, g, b, a=255):
    return (int(r), int(g), int(b), int(a))

# ---------------- simple raster helpers (no PIL) ----------------
def set_px(pixels, w, h, x, y, col):
    if 0 <= x < w and 0 <= y < h:
        pixels[y * w + x] = col

def draw_filled_circle(pixels, w, h, cx, cy, rad, col, alpha_scale=1.0):
    r2 = rad * rad
    for yy in range(int(cy - rad - 1), int(cy + rad + 2)):
        for xx in range(int(cx - rad - 1), int(cx + rad + 2)):
            dx = xx - cx
            dy = yy - cy
            d2 = dx*dx + dy*dy
            if d2 <= r2:
                # soft edge
                a = col[3]
                if rad > 0:
                    edge = max(0.0, 1.0 - (math.sqrt(d2) / (rad + 0.0001)))
                    a = int(a * (0.2 + 0.8 * edge * edge) * alpha_scale)
                set_px(pixels, w, h, xx, yy, (col[0], col[1], col[2], a))

def draw_thick_line(pixels, w, h, x0, y0, x1, y1, col, thickness=2.0):
    # naive sampled thick line
    steps = int(max(abs(x1-x0), abs(y1-y0)) * 1.5 + 3)
    if steps < 2: steps = 2
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        draw_filled_circle(pixels, w, h, x, y, thickness * 0.5, col)

def draw_poly_fill(pixels, w, h, pts, col):
    # simple even-odd horizontal scan (small sprites only)
    if not pts: return
    miny = max(0, int(min(p[1] for p in pts)) - 1)
    maxy = min(h-1, int(max(p[1] for p in pts)) + 2)
    for y in range(miny, maxy + 1):
        xs = []
        n = len(pts)
        for i in range(n):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % n]
            if (y0 <= y < y1) or (y1 <= y < y0):
                if y1 != y0:
                    x = x0 + (x1 - x0) * (y - y0) / (y1 - y0)
                    xs.append(x)
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            xL = max(0, int(xs[i]))
            xR = min(w-1, int(xs[i + 1]) + 1)
            for x in range(xL, xR):
                set_px(pixels, w, h, x, y, col)

# ---------------- asset: dragon hero stamp (weighty, glowing, rider) ----------------
def gen_dragon_hero_png():
    W, H = 192, 128
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # base body mass (dark ember silhouette + heat)
    for i in range(5):
        cx = 48 + i * 22
        cy = 58 + math.sin(i * 0.9) * 6
        r = 18 + (1 if i % 2 else 0) * 3
        draw_filled_circle(pixels, W, H, cx, cy, r, make_color(32, 22, 18, 248))
        draw_filled_circle(pixels, W, H, cx-1, cy-2, r*0.72, make_color(48, 30, 24, 210))
    # neck + head mass
    draw_filled_circle(pixels, W, H, 138, 44, 15, make_color(38, 26, 21, 255))
    draw_filled_circle(pixels, W, H, 152, 38, 11, make_color(42, 28, 22, 255))
    # horns
    draw_thick_line(pixels, W, H, 148, 30, 162, 18, make_color(70, 48, 36, 255), 2.6)
    draw_thick_line(pixels, W, H, 155, 32, 168, 24, make_color(70, 48, 36, 255), 2.2)
    # eye + glow (bright hero read)
    draw_filled_circle(pixels, W, H, 158, 36, 4.5, make_color(255, 195, 70, 255))
    draw_filled_circle(pixels, W, H, 159, 35, 2.2, make_color(255, 255, 235, 255))
    draw_filled_circle(pixels, W, H, 158, 36, 9, make_color(255, 160, 50, 90))
    # crest ridge
    draw_thick_line(pixels, W, H, 130, 28, 150, 22, make_color(58, 40, 30, 255), 3.0)
    # wings (large, weighty, membrane)
    wing_pts_l = [(38, 52), (8, 22), (-6, 48), (22, 68), (44, 60)]
    draw_poly_fill(pixels, W, H, [(p[0]+18, p[1]+4) for p in wing_pts_l], make_color(22, 15, 12, 250))
    wing_pts_r = [(52, 50), (78, 18), (102, 44), (74, 62), (52, 56)]
    draw_poly_fill(pixels, W, H, [(p[0]+18, p[1]+6) for p in wing_pts_r], make_color(24, 16, 13, 248))
    # wing edge heat
    draw_thick_line(pixels, W, H, 26, 30, 72, 32, make_color(255, 170, 70, 120), 1.6)
    draw_thick_line(pixels, W, H, 30, 62, 80, 58, make_color(255, 150, 60, 90), 1.4)
    # tail taper + flame
    for k in range(6):
        tx = 22 - k * 7
        ty = 66 + k * 1.5
        tr = 11 - k * 1.1
        draw_filled_circle(pixels, W, H, tx, ty, max(2, tr), make_color(28, 18, 14, 240))
    draw_filled_circle(pixels, W, H, 8, 78, 5, make_color(255, 120, 40, 210))
    draw_filled_circle(pixels, W, H, -2, 82, 3.5, make_color(255, 200, 80, 160))
    # rider (humble witness, helm + torso, arm reach)
    draw_filled_circle(pixels, W, H, 78, 38, 5.5, make_color(210, 175, 135, 255))  # helm
    draw_filled_circle(pixels, W, H, 78, 38, 3, make_color(240, 220, 190, 200))
    # torso
    for yy in range(42, 56):
        for xx in range(74, 84):
            set_px(pixels, W, H, xx, yy, make_color(55, 42, 34, 255))
    # arm
    draw_thick_line(pixels, W, H, 82, 46, 96, 40, make_color(200, 165, 125, 255), 2.0)
    # subtle body rim glow (brighter hero)
    draw_filled_circle(pixels, W, H, 92, 56, 28, make_color(255, 140, 60, 28))
    # save
    path = os.path.join(OUT_DIR, "dragon-hero.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- ember glow sprite ----------------
def gen_ember_glow_png():
    W = H = 48
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    cx = cy = W / 2
    for r in range(22, 0, -1):
        a = int(255 * (r / 22.0) ** 0.6)
        core = 255 if r > 6 else 240
        draw_filled_circle(pixels, W, H, cx, cy, r, make_color(255, 140, 50, min(255, a)), 1.0)
        if r < 9:
            draw_filled_circle(pixels, W, H, cx-1, cy-1, r*0.6, make_color(255, 235, 170, int(a*0.9)))
    path = os.path.join(OUT_DIR, "ember-glow.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- hazard spire + vent decals ----------------
def gen_hazard_spire_png():
    W, H = 64, 96
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # rock mass
    pts = [(20, 8), (44, 8), (52, 88), (12, 88)]
    draw_poly_fill(pixels, W, H, pts, make_color(48, 38, 30, 255))
    # flame crown
    for i in range(5):
        fx = 18 + i * 7
        fh = 6 + (i % 2) * 3
        draw_filled_circle(pixels, W, H, fx, 6, 5, make_color(255, 130, 40, 230))
        draw_filled_circle(pixels, W, H, fx+1, 4, 3, make_color(255, 210, 120, 200))
    # bright edge
    draw_thick_line(pixels, W, H, 18, 10, 48, 12, make_color(255, 170, 70, 110), 1.8)
    path = os.path.join(OUT_DIR, "hazard-spire.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

def gen_hazard_vent_png():
    W, H = 56, 48
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # base rock
    draw_poly_fill(pixels, W, H, [(8, 28), (48, 28), (50, 44), (6, 44)], make_color(42, 32, 26, 255))
    # vent glow + flame
    for i in range(7):
        draw_filled_circle(pixels, W, H, 16 + (i % 3)*8, 18 - i*1.5, 4 + (i%2), make_color(255, 120 + i*8, 30, 220 - i*18))
    draw_filled_circle(pixels, W, H, 28, 22, 7, make_color(255, 160, 60, 80))
    path = os.path.join(OUT_DIR, "hazard-vent.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- sky haze world layer ----------------
def gen_sky_haze_png():
    W, H = 320, 160
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    for y in range(H):
        a = int(26 + 18 * math.sin(y * 0.07))
        for x in range(W):
            t = (x * 0.011 + y * 0.004) % (math.pi * 2)
            v = 18 + int(12 * math.sin(t))
            set_px(pixels, W, H, x, y, make_color(255, 110 + v, 48, a))
    # a few ember flecks
    for k in range(28):
        ex = (k * 37 + 11) % W
        ey = (k * 19 + 7) % H
        draw_filled_circle(pixels, W, H, ex, ey, 1.6, make_color(255, 180, 80, 120))
    path = os.path.join(OUT_DIR, "sky-haze.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- WAV synth (deliberate, not raw osc) ----------------
def synth_wav(path, duration_s, gen_sample, rate=44100):
    n = int(duration_s * rate)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        for i in range(n):
            s = max(-1.0, min(1.0, gen_sample(i, n, rate)))
            wf.writeframes(struct.pack("<h", int(s * 32767)))
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

def gen_audio_assets():
    # ember chime — bright attack + harmonic tail (file-backed "collect" instead of pure triangle blip)
    def ember(i, n, rate):
        t = i / rate
        env = math.exp(-t * 7.5) * (1 - t / (n/rate + 0.001))
        f = 920 + 40 * math.sin(t * 18)
        s = 0.7 * math.sin(2 * math.pi * f * t)
        s += 0.35 * math.sin(2 * math.pi * f * 1.5 * t)
        return s * env * 0.9
    synth_wav(os.path.join(OUT_DIR, "sfx-ember-chime.wav"), 0.55, ember)

    # dash whoosh — noise + low rumble + pitch fall (kinetic carve, not saw bleep)
    def dash(i, n, rate):
        t = i / rate
        env = math.exp(-t * 3.2) * (1.0 - t * 0.8)
        noise = (hash(str(i)) % 2000 - 1000) / 1000.0   # cheap noise
        # low rumble
        r = 0.6 * math.sin(2 * math.pi * (38 + 12 * (1-t)) * t)
        s = (noise * 0.55 + r) * env
        # slight hi bite on attack
        if t < 0.08: s += (0.4 - t*4) * math.sin(2*math.pi*620*t) * env
        return s * 0.85
    synth_wav(os.path.join(OUT_DIR, "sfx-dash-whoosh.wav"), 0.72, dash)

    # maw toll + heat sigh (music-led heroic clear moment, weight + distance)
    def maw(i, n, rate):
        t = i / rate
        env = (1 - math.exp(-t * 12)) * math.exp(-t * 1.35)
        # low bell
        s = 0.85 * math.sin(2 * math.pi * 86 * t) * env
        # noise tail (distant heat)
        noise = ((hash(str(i*3)) % 2000) - 1000) / 1200.0
        nf = 0.35 * noise * math.exp(- (t-0.35)*2.8) if t > 0.3 else 0.0
        return (s + nf) * 0.9
    synth_wav(os.path.join(OUT_DIR, "sfx-maw-toll.wav"), 1.85, maw)

    # crash rumble (consequence, not blip)
    def crash(i, n, rate):
        t = i / rate
        env = math.exp(-t * 2.8)
        noise = (hash(str(i)) % 2000 - 1000) / 1000.0
        s = noise * env * 0.8
        s += 0.5 * math.sin(2*math.pi*52*t) * env * (1 - t*1.2)
        return s
    synth_wav(os.path.join(OUT_DIR, "sfx-crash-rumble.wav"), 0.9, crash)

    # weave sigh (skilled near-miss, soft)
    def weave(i, n, rate):
        t = i / rate
        env = math.exp(-t * 5.5)
        noise = (hash(str(i*7)) % 2000 - 1000) / 1100.0
        s = noise * env * 0.65
        s += 0.3 * math.sin(2*math.pi*310*t) * env
        return s
    synth_wav(os.path.join(OUT_DIR, "sfx-weave-sigh.wav"), 0.48, weave)

def main():
    print("Generating Emberflight Gauntlet file-backed assets (PNG + WAV)...")
    gen_dragon_hero_png()
    gen_ember_glow_png()
    gen_hazard_spire_png()
    gen_hazard_vent_png()
    gen_sky_haze_png()
    gen_audio_assets()
    print("Done. All assets are reviewable files committed under the game tree.")

if __name__ == "__main__":
    main()
