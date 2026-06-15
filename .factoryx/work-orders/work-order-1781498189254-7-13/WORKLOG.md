# Emberflight Gauntlet — Work Order Log

**WorkOrder:** work-order-1781498189254-7-13  
**Factory:** factory-dragon-crew  
**Project:** studio-dragon-crew  
**Role:** coder-default (Grok)  
**Branch:** factoryx/factory-dragon-crew/work-order-1781498189254-7-13  
**Artifact:** games/88-emberflight-gauntlet/index.html (and supporting .js)  
**Preview entrypoint:** games/88-emberflight-gauntlet/index.html

**Current head (local):** $(git rev-parse HEAD)  
**Delivery:** factoryx/factory-dragon-crew/work-order-1781498189254-7-13  
**Verify target:** ./scripts/verify.sh (must be 0 fails)  
**Status:** Implementation + verification in progress (polish_until_deadline)

## Protocol Followed
- Real playable browser game as *first screen* (no landing, no hero panel, no option gallery).
- Core loop (bank/steer, short fire bursts, chain rings, hazards, crash/retry) understandable <10s, judgeable <60s.
- Reused prior Skywake dragon flight (drops/1777513678582253462) physics + input + projection as "existing assets/prior work".
- Procedural coherent art (canyon walls with lava seams, ember dragon with horns/chest vents/wing glow, particles for sparks/smoke/embers) — no geometric placeholder blobs as hero.
- Keyboard + pointer/touch; synth audio (wind + tones) starts only on gesture; compact mute control.
- Responsive (full canvas, DPR, touch zones, large text, no overlap).
- Clean: no node_modules, no external deps, single coherent game dir under required path.
- Verification part of deliverable: checks run, local preview served+interacted, evidence captured, fixes applied before PR review request.
- .factoryx/preview-entrypoint written exact; PR body will contain full Work Order context + verification + screenshots.

## Changes Requested Addressed (from github-mergeability on 709fc567)
- Rebased work branch onto origin/main before further changes/push (pre-push hook guard + merge conflict feedback).
- No parallel branches; only canonical factoryx/.../work-order-1781498189254-7-13 used for push + PR.

## Implementation Notes (Pass 1)
- Bootstrap: cp prior dragon flight drop → games/88-emberflight-gauntlet/ (reuse proven flight model, controls, audio pattern, projection).
- Overhaul to Emberflight:
  - Theme: ember canyon (jagged glowing rock walls with lava seams, winding for bank pressure, heat haze sky).
  - Dragon: powerful ember variant (weighty body, horns, chest vents, ember-rim wings that bank visibly, flame breath from mouth, glowing eyes).
  - Mechanics: constant forward + inertia (weight), A/D or drag to bank/steer (roll affects turn + visual), W/S pitch, short tactical fire bursts (3 charges, 0.72s active window, cone blast destroys hazards for score, recharge on time or chain bonus).
  - Rings: ember rings chained for multiplier (xN visible, bonus score + sfx); close timing extends chain.
  - Hazards: rock spires (dodge or blast); near-wall scrapes emit sparks.
  - Particles: first-class — continuous wingtip smoke, breath sparks/flame, ambient embers, crash explosions, wall near-miss sparks. Smoke rises, sparks have weight/gravity.
  - Fail/retry: instant on wall/hazard/clip/exhaust; dramatic shake + ember burst + impact tones; large readable "CRASHED" + score + chain + "TAP OR SPACE TO RISE AGAIN" (no menus).
  - Audio: lazy gesture-init wind bed + distinct chimes/bursts/crash; mute button top-right (compact, persists state).
  - HUD: minimal floating (SCORE, CHAIN xN, FIRE 🔥🔥🔥, DEPTH, early control hint fades); no card panels, no overlap.
- Controls work on kb (A D roll/bank primary, Space/F fire, W S pitch) + pointer drag + touch (left drag bank/pitch, upper-right tap fire).
- Direct launch: prelaunch is subtle prompt + any gesture starts flight immediately.
- No external URLs; all synth + canvas paths.

## Verification Steps Performed
- Rebase to main (resolved merge conflict feedback).
- node --check on game.js.
- Manual local serve + interaction (keyboard flight, fire blasts, ring chains, hazard clears, crash/retry loop multiple times).
- ./scripts/verify.sh (updated minimally for new active entrypoint + added emberflight checks).
- Chromium headless screenshots planned for evidence (idle flight, breath, chain, crash).
- Console clean, no blank, assets (procedural) present, controls responsive on simulated mobile/desktop sizes.

## Known / Residual (pre-polish)
- Dragon physics inherited; canyon bounds tuned for survival pressure without instant death on first 10s.
- Visuals are 2.5D projected canvas (consistent with prior dragon flight work); strong silhouettes + glows for "powerful dragon" not mascot.
- Difficulty ramps with score (more hazards); may need further tuning in polish passes.
- Audio is synth only (per clean deps); feels weighty with low whooshes + impacts.
- Evidence png from prior attempt (connection refused) replaced by real captures post-serve.

## Next (polish passes while budget)
- Iterate visuals: richer dragon (tail flick on bank, more vent pulses), denser canyon detail, better particle variety.
- Tune: breath feel more "tactical powerful", ring placement for satisfying chains, crash readability.
- Add tiny best-score persistence (local) if fits without clutter.
- Re-run full verify + live serve + chromium captures after each meaningful diff.
- Push + update PR body with new verification output + new screenshots + work order context.
- Stop only at deadline or hard blocker; keep same branch/PR.

**Last updated:** initial implementation + rebase + entrypoint + verify support + first playable slice
