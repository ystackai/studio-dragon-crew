#!/usr/bin/env python3
"""
Emberflight Gauntlet — deliberate local procedural asset generator (pure stdlib) v2.
Produces reviewable file-backed PNG (RGBA) sprites and WAV (44.1k 16-bit mono) SFX
under games/92-emberflight-gauntlet/assets/ .

Work Order 1781634304247-7-1 rework: "you need to use teh asset foundry to generate better art this looks terrible the procedurally generated stuff".
- Attempted FACTORYX_GAME_ASSET_SERVICE_URL /v1/proof-pack (known from prior smoke); service unreachable (timeout) in this runtime.
- Enhanced all generators (richer dragon+rider silhouette with scale facets + multi-rim glows + membrane veins, denser ember halos, jagged hazards + taller flame volume, atmospheric multi-band haze with streaks, layered synth with harmonics/noise/envelopes for weightier timbre).
- Keeps same file names + integration contract so no behavior change; assets are still small, file-backed, reviewable, committed.
- Per prior ASSET_MANIFEST + contract: when no foundry exposed, use deliberate enhanced local + document.

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

# ---------------- asset: dragon hero stamp (weighty, glowing, rider) — v2 better art for foundry feedback ----------------
def gen_dragon_hero_png():
    W, H = 192, 128
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # base body mass (dark ember silhouette + heat) — more segments + scale facets for material weight
    for i in range(6):
        cx = 42 + i * 20
        cy = 60 + math.sin(i * 0.85) * 5
        r = 17 + (2 if i % 2 == 0 else 0)
        draw_filled_circle(pixels, W, H, cx, cy, r, make_color(30, 20, 16, 252))
        draw_filled_circle(pixels, W, H, cx-1, cy-2, r*0.68, make_color(46, 28, 22, 215))
        # scale suggestion lines (small facets for "not flat procedural")
        if i > 0:
            for s in range(-1, 2):
                draw_thick_line(pixels, W, H, cx-6, cy-4+s*3, cx+5, cy-5+s*3, make_color(55, 36, 26, 90), 0.9)
    # neck + head mass (elongated for presence)
    draw_filled_circle(pixels, W, H, 136, 46, 14, make_color(36, 24, 19, 255))
    draw_filled_circle(pixels, W, H, 150, 40, 12, make_color(40, 26, 20, 255))
    draw_filled_circle(pixels, W, H, 160, 36, 9, make_color(44, 29, 23, 255))
    # horns (curved, weighty)
    draw_thick_line(pixels, W, H, 146, 28, 164, 15, make_color(68, 46, 34, 255), 2.8)
    draw_thick_line(pixels, W, H, 153, 30, 170, 20, make_color(68, 46, 34, 255), 2.3)
    # eye + inner glow + outer heat (heroic readable pop)
    draw_filled_circle(pixels, W, H, 157, 35, 5.2, make_color(255, 200, 75, 255))
    draw_filled_circle(pixels, W, H, 158, 34, 2.6, make_color(255, 255, 240, 255))
    draw_filled_circle(pixels, W, H, 157, 35, 10, make_color(255, 155, 45, 95))
    draw_filled_circle(pixels, W, H, 157, 35, 14, make_color(255, 120, 30, 40))
    # crest ridge + secondary
    draw_thick_line(pixels, W, H, 128, 26, 152, 20, make_color(56, 38, 28, 255), 3.2)
    draw_thick_line(pixels, W, H, 132, 24, 148, 18, make_color(70, 48, 32, 160), 1.6)
    # wings (large, weighty, multi-layer membrane + heat rim + vein suggestion)
    wing_pts_l = [(36, 54), (6, 20), (-8, 50), (20, 70), (42, 62)]
    draw_poly_fill(pixels, W, H, [(p[0]+18, p[1]+3) for p in wing_pts_l], make_color(20, 14, 11, 252))
    wing_pts_r = [(50, 52), (76, 16), (100, 46), (72, 64), (50, 58)]
    draw_poly_fill(pixels, W, H, [(p[0]+18, p[1]+5) for p in wing_pts_r], make_color(22, 15, 12, 250))
    # membrane inner + vein detail
    draw_poly_fill(pixels, W, H, [(26+18,24+3),(40+18,22+3),(58+18,32+5),(46+18,46+5)], make_color(35, 22, 16, 140))
    draw_thick_line(pixels, W, H, 24+18, 26+3, 62+18, 36+5, make_color(255, 165, 55, 70), 1.0)
    # wing edge heat (brighter for flight spectacle)
    draw_thick_line(pixels, W, H, 24, 28, 70, 30, make_color(255, 175, 75, 135), 1.8)
    draw_thick_line(pixels, W, H, 28, 60, 78, 56, make_color(255, 155, 65, 105), 1.6)
    # tail taper + multi flick flame (more lively)
    for k in range(7):
        tx = 20 - k * 6.5
        ty = 68 + k * 1.3
        tr = 10.5 - k * 1.0
        draw_filled_circle(pixels, W, H, tx, ty, max(1.8, tr), make_color(26, 17, 13, 242))
    draw_filled_circle(pixels, W, H, 6, 80, 6, make_color(255, 125, 35, 225))
    draw_filled_circle(pixels, W, H, -4, 86, 4.2, make_color(255, 205, 85, 175))
    draw_filled_circle(pixels, W, H, -10, 90, 2.8, make_color(255, 230, 140, 110))
    # rider (humble witness, more defined helm + torso + reaching arms)
    draw_filled_circle(pixels, W, H, 76, 36, 5.8, make_color(205, 170, 130, 255))  # helm
    draw_filled_circle(pixels, W, H, 76, 36, 3.2, make_color(235, 215, 185, 205))
    # helm ridge
    draw_thick_line(pixels, W, H, 71, 32, 81, 31, make_color(80, 55, 40, 200), 1.4)
    # torso + cloak hint
    for yy in range(41, 58):
        for xx in range(72, 85):
            set_px(pixels, W, H, xx, yy, make_color(52, 40, 32, 255))
    # arm reach (two segments for better pose)
    draw_thick_line(pixels, W, H, 80, 47, 94, 41, make_color(195, 160, 120, 255), 2.1)
    draw_thick_line(pixels, W, H, 94, 41, 102, 38, make_color(200, 165, 125, 255), 1.6)
    # body rim glows (brighter hero + hungry fire)
    draw_filled_circle(pixels, W, H, 90, 58, 30, make_color(255, 135, 55, 32))
    draw_filled_circle(pixels, W, H, 88, 54, 18, make_color(255, 160, 70, 18))
    # save
    path = os.path.join(OUT_DIR, "dragon-hero.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- ember glow sprite — v2 richer core + halos for obvious collect pop ----------------
def gen_ember_glow_png():
    W = H = 48
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    cx = cy = W / 2
    for r in range(23, 0, -1):
        a = int(255 * (r / 23.0) ** 0.55)
        draw_filled_circle(pixels, W, H, cx, cy, r, make_color(255, 135, 45, min(255, a)), 1.0)
        if r < 11:
            draw_filled_circle(pixels, W, H, cx-1, cy-1, r*0.65, make_color(255, 230, 160, int(a*0.85)))
        if r < 5:
            draw_filled_circle(pixels, W, H, cx+1, cy, r*0.4, make_color(255, 250, 200, int(a*0.7)))
    # outer soft halo for flight feel
    draw_filled_circle(pixels, W, H, cx, cy, 13, make_color(255, 120, 30, 38))
    path = os.path.join(OUT_DIR, "ember-glow.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- hazard spire + vent decals ----------------
def gen_hazard_spire_png():
    W, H = 64, 96
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # rock mass (more jagged silhouette for v2 better art)
    pts = [(18, 6), (28, 4), (46, 8), (54, 88), (10, 86)]
    draw_poly_fill(pixels, W, H, pts, make_color(46, 36, 28, 255))
    # secondary rock facet
    draw_poly_fill(pixels, W, H, [(22, 18), (38, 16), (48, 70), (16, 68)], make_color(38, 28, 22, 255))
    # flame crown (taller, multi layer)
    for i in range(6):
        fx = 17 + i * 6
        draw_filled_circle(pixels, W, H, fx, 4, 5.5, make_color(255, 125, 35, 235))
        draw_filled_circle(pixels, W, H, fx+1, 2, 3.2, make_color(255, 205, 110, 195))
    draw_filled_circle(pixels, W, H, 24, 0, 4, make_color(255, 235, 150, 120))
    # bright edge glints
    draw_thick_line(pixels, W, H, 16, 8, 50, 10, make_color(255, 175, 75, 125), 1.9)
    draw_thick_line(pixels, W, H, 20, 32, 44, 34, make_color(255, 160, 55, 70), 1.2)
    path = os.path.join(OUT_DIR, "hazard-spire.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

def gen_hazard_vent_png():
    W, H = 56, 48
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    # base rock (lobed for v2)
    draw_poly_fill(pixels, W, H, [(6, 26), (50, 26), (52, 46), (4, 46)], make_color(40, 30, 24, 255))
    draw_poly_fill(pixels, W, H, [(12, 30), (44, 30), (46, 42), (10, 42)], make_color(32, 24, 19, 255))
    # vent glow + rising flame streaks (more volume v2)
    for i in range(8):
        fx = 14 + (i % 4)*7
        draw_filled_circle(pixels, W, H, fx, 16 - i*0.8, 5 + (i%3), make_color(255, 118 + i*6, 28, 225 - i*12))
    draw_filled_circle(pixels, W, H, 26, 20, 8, make_color(255, 155, 55, 95))
    draw_filled_circle(pixels, W, H, 30, 10, 4, make_color(255, 220, 120, 70))
    path = os.path.join(OUT_DIR, "hazard-vent.png")
    save_png(path, W, H, pixels)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")

# ---------------- sky haze world layer — v2 more bands + flecks + streaks for atmospheric depth (better art) ----------------
def gen_sky_haze_png():
    W, H = 320, 160
    pixels = [make_color(0,0,0,0) for _ in range(W * H)]
    for y in range(H):
        a = int(24 + 20 * math.sin(y * 0.065) + 6 * math.sin(y * 0.19))
        for x in range(W):
            t = (x * 0.009 + y * 0.0035) % (math.pi * 2)
            v = 16 + int(14 * math.sin(t)) + int(5 * math.sin((x+y)*0.04))
            set_px(pixels, W, H, x, y, make_color(255, 108 + v, 46, a))
    # denser ember flecks + vertical heat streaks
    for k in range(38):
        ex = (k * 29 + 7) % W
        ey = (k * 17 + 5) % H
        draw_filled_circle(pixels, W, H, ex, ey, 1.8, make_color(255, 175, 75, 135))
    for s in range(5):
        sx = 40 + s * 55
        for yy in range(20, 140, 3):
            draw_filled_circle(pixels, W, H, sx + (yy % 7), yy, 0.7, make_color(255, 140, 50, 45))
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
    # ember chime — v2 richer: 3 harmonics + noise tail + wobble (weightier collect, less bleep)
    def ember(i, n, rate):
        t = i / rate
        env = math.exp(-t * 6.8) * (1 - t / (n/rate + 0.001))
        f = 910 + 55 * math.sin(t * 22)
        s = 0.65 * math.sin(2 * math.pi * f * t)
        s += 0.38 * math.sin(2 * math.pi * f * 1.5 * t)
        s += 0.22 * math.sin(2 * math.pi * f * 2.02 * t)
        # soft noise shimmer
        noise = ((hash(str(i)) % 1200) - 600) / 1400.0
        s += noise * 0.12 * env
        return s * env * 0.92
    synth_wav(os.path.join(OUT_DIR, "sfx-ember-chime.wav"), 0.55, ember)

    # dash whoosh — v2 layered noise + 2 rumbles + hi bite + pitch (carve the sky, more presence)
    def dash(i, n, rate):
        t = i / rate
        env = math.exp(-t * 2.9) * (1.0 - t * 0.75)
        noise = (hash(str(i)) % 2000 - 1000) / 1000.0
        noise2 = (hash(str(i+17)) % 1800 - 900) / 1100.0
        r = 0.55 * math.sin(2 * math.pi * (36 + 14 * (1-t)) * t)
        r2 = 0.35 * math.sin(2 * math.pi * (71 + 9 * (1-t*0.6)) * t)
        s = (noise * 0.48 + noise2 * 0.22 + r + r2) * env
        if t < 0.09: s += (0.42 - t*3.8) * math.sin(2*math.pi*680*t) * env
        return s * 0.88
    synth_wav(os.path.join(OUT_DIR, "sfx-dash-whoosh.wav"), 0.72, dash)

    # maw toll + heat sigh — v2 deeper bell + distant layered noise (heroic weight + price)
    def maw(i, n, rate):
        t = i / rate
        env = (1 - math.exp(-t * 11)) * math.exp(-t * 1.28)
        s = 0.82 * math.sin(2 * math.pi * 84 * t) * env
        s += 0.38 * math.sin(2 * math.pi * 42 * t) * env * 0.6  # sub octave
        noise = ((hash(str(i*3)) % 2000) - 1000) / 1150.0
        nf = 0.32 * noise * math.exp(- (t-0.32)*2.6) if t > 0.28 else 0.0
        return (s + nf) * 0.92
    synth_wav(os.path.join(OUT_DIR, "sfx-maw-toll.wav"), 1.85, maw)

    # crash rumble — v2 sub + noise decay (consequence with body)
    def crash(i, n, rate):
        t = i / rate
        env = math.exp(-t * 2.6)
        noise = (hash(str(i)) % 2000 - 1000) / 1000.0
        s = noise * env * 0.82
        s += 0.55 * math.sin(2*math.pi*49*t) * env * (1 - t*1.1)
        s += 0.25 * math.sin(2*math.pi*27*t) * env * 0.7
        return s
    synth_wav(os.path.join(OUT_DIR, "sfx-crash-rumble.wav"), 0.9, crash)

    # weave sigh — v2 soft layered (skilled near-miss juicy)
    def weave(i, n, rate):
        t = i / rate
        env = math.exp(-t * 5.2)
        noise = (hash(str(i*7)) % 2000 - 1000) / 1050.0
        s = noise * env * 0.62
        s += 0.28 * math.sin(2*math.pi*305*t) * env
        s += 0.15 * math.sin(2*math.pi*610*t) * env * 0.5
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
