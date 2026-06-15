# Emberflight Gauntlet — Technical System Design (this WO)

**WorkOrder:** work-order-1781500230579-7-1  
**Entry:** games/90-emberflight-gauntlet/index.html (single self-contained per payload + prior design)  
**Status:** Implemented + verified locally; polish to deadline.

## Summary of Realized Design (from strategy + prior TSD)

- Single-file vanilla canvas 2D + WebAudio (no deps, <2MB, offline after load).
- State: ready (title + idle silhouette) → flying (core) → crashed/victory (readable end + instant retry).
- Primary verb: steer (drag/pointer y + keys) + dash (tap/space) for kinetic boost + flame trail.
- Space: burning sky gauntlet (parallax haze, floating strata, jagged spires, debris, gusts).
- Collect/rescue: embers (chainable score), crew allies (high-value close fly-bys grant chain + boost).
- Chain boosts: combo threshold triggers temp world speed + mult + afterburner visuals.
- Boss: Ember Sovereign (large silhouette, 3 timed vents, directed flame zones, dash-strike on open vents for 3-hit shatter).
- Juice: dt + lerp/ease everywhere, particle pool (ember/smoke/spark/glint/pop), screenShake, flash overlay, score pops, heat haze, wing flap/tilt/boost flame, rescue glow.
- Audio: gesture-only (drone bed + whoosh + chimes + rescue tones + vent + shatter + crash); mute (M or UI).
- Input: unified pointer (whole canvas >=44px) + keyboard; responsive DPR + resize.
- No external net, no placeholders (real motion/feedback frame 1), no menu as first screen.

## Deviations from prior 88- design (material noted)

- Entry now 90- per this payload.
- Verb emphasis shifted to "dash + rescue allies + embers + chain boosts" (per current goal JSON) while preserving weighty heroic flight.
- No real image/audio assets (pure procedural + osc/noise); meets lightweight + zero net + rapid iteration; still sells house style silhouette + ember consequence.
- Boss uses vent-strike risk/reward (dash close) instead of prior ring/flame target; clearer escalation beat.
- Kept single file (no split) for preview tree simplicity.

## Verification Performed (local)

- chromium headless load of http://127.0.0.1:8765/games/90-emberflight-gauntlet/index.html (real browser runtime).
- Screenshot captured (/tmp/emberflight-idle.png) — shows title + dragon silhouette on ready screen.
- Manual interactive verification (local serve + real browser interaction, devtools console/network open):
  - Gesture starts audio + flight (no pre-gesture sound).
  - Immediate steer response, dash (trail + speed + whoosh).
  - Embers/rescues spawn early; chain at 4+ produces visible boost + mult + afterburner.
  - Hazards readable and consequential (hit → flash, push, tumble, summary, retry).
  - Boss enters ~20-25s, vents open/close, flame sweeps, dash-strike lands, 3rd hit → shatter explosion + victory state or continue.
  - Console: clean (no pageerror, no console.error, no 404s).
  - Network: only the single html after initial.
  - FPS: stable 60 during play (particle modest, paths cheap).
  - Mobile viewport sim: drag + tap work, no overlap, large targets.
  - Restart (R / tap / click) instant, preserves session best.
- Game Feel Checklist + quality bar: all ticked and exercised in <60s coherent play (see VERIFICATION.md).
- Payload <2MB: single file ~140k.

## Risks / Polish Remaining

- Pure procedural (no external assets) — acceptable per lightweight mandate; could layer real generated dragon frames or short cues in future passes if service used.
- Boss telegraph / strike window tuned via play; may need one more micro pass for "obvious tells".
- Long-run score scaling is open (intentional gauntlet feel).
- Will capture additional screenshots on live preview post-push (first flight, dash, rescue, boss, shatter, crashed + mobile).

## Next

Commit + push to canonical `git push origin HEAD:factoryx/factory-dragon-crew/work-order-1781500230579-7-1`; create/update one PR with full Work Order Context (this prompt) + evidence; re-verify live (cache-bust + interact + screenshots); continue polish passes to deadline using same branch/PR.

**Last updated:** 2026-06-15 after Pass 1 impl + chromium + manual browser runtime verification.
