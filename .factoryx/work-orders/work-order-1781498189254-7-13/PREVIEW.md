# Emberflight Gauntlet — PREVIEW

**Entrypoint:** games/88-emberflight-gauntlet/index.html

This is the *first screen*. Open it directly:

- Desktop: file://.../games/88-emberflight-gauntlet/index.html or via local server root.
- Mobile viewport: responsive full-bleed canvas, touch zones for bank + fire.

## What reviewers will see in first 10 seconds
1. Dark ember heat gradient + winding canyon walls with glowing lava seams.
2. Powerful ember dragon silhouette (horns, vents, banked wings with rim light) centered, already moving forward with weight.
3. Ember rings glowing ahead; rock hazards to bank around or blast.
4. Minimal HUD: SCORE, CHAIN (grows on quick hits), FIRE [🔥🔥🔥] charges, DEPTH.
5. Any gesture (tap/click/space) launches full flight + audio (wind + tones).

## Core loop (judge in <60s)
- Bank left/right (A/D, arrows, drag left side) to steer through canyon and around rocks.
- Short fire bursts (Space, F, upper-right tap) — tactical 3-charge window that destroys hazards for bonus + emits sparks/flame.
- Chain rings by flying through in quick succession for xN multiplier + score + recharge help.
- Feel weight: inertia, lift/drag, wing smoke trails, heavy tail wag on banks, powerful forward kick on breath.
- Crash on wall clip / hazard / exhaustion → dramatic particle burst + shake + clear "CRASHED" + score + "TAP OR SPACE TO RISE AGAIN".
- Retry is instant; high-score chase is the progression.

## Assets
- All procedural canvas (no external images/sounds).
- Reuses + evolves prior Skywake dragon flight physics/input/projection (studio prior work).
- Small coherent set: ember palette, dragon form language (horn/vent/wing-rim), particle language (sparks=hot short, smoke=heavy rise, embers=drift).

## Screenshots / Evidence
See .factoryx/work-orders/work-order-1781498189254-7-13/evidence/ (post-capture from local serve + chromium headless).

## Known Preview Notes
- No giant text or option cards — canvas is the experience.
- Mute is tiny top-right; audio never auto-starts.
- Works on desktop kb + mobile touch (tested via zones + pointer).
- First-frame is immediately "in the world" (subtle prelaunch prompt only).

**Status:** playable slice committed; polish passes will add visual density + tuning while keeping loop intact.
