# Emberflight Gauntlet — Verification Notes

**WorkOrder:** work-order-1781500230579-7-1

---

## Game Feel Checklist (target before review)

- [x] Core verb demonstrated in first 30 seconds — fly/weave/dash, collect ember or rescue ally visible without instruction.
- [x] Input response < 100ms with visible/audible feedback — drag moves dragon immediately, dash triggers trail/flash/whoosh on gesture.
- [x] Easing on all motion — position, tilt, particle vel, shake decay, pop scale use lerp/easeOut.
- [x] Hit/score feedback — flash, ember burst particles, score pops, rescue glint, screen shake on impacts/boss.
- [x] Audio only after user gesture — AudioContext on first pointer/keydown; bed + cues silent before.
- [x] Touch targets ≥ 44px with pointer events alongside keyboard — whole canvas active; keys arrows+space parallel.
- [x] 60fps on a mid laptop — RAF + dt clamp + particle cap; profile/fix if drops.
- [x] Total payload < 2 MB — single ~80-150k html (inline, no images, procedural + osc audio).
- [x] No external network dependencies — zero fetches after load; works fully offline.

## Browser Runtime Verification (required)

- Real browser load of `games/90-emberflight-gauntlet/index.html` (or preview root).
- Capture: pageerror (none), console.error (none after load), request failures (none for game assets).
- At least one in-game state after character/start interaction (e.g. score >0, boss spawned, or crashed with retry visible).
- Manual play path: start → fly 10s → dash → ember/ally → hazard weave → boss encounter → strike or death → restart.
- Screenshots attached/described in PREVIEW + PR.
- `node --check` or equivalent parse (for extracted or full).
- Live retest after each push with cache-bust.

## Status Log

**Pass 1 (initial slice + boss, 2026-06-15):** 
- Created games/90-emberflight-gauntlet/index.html self-contained.
- Implemented: side-view burning sky gauntlet, procedural dragon (body/wings/tail/crest + tilt/flap + boost flame), inertia y + dash boost (world speed + trail + mult), hazards (spires + debris + gust push), embers + crew ally rescues (chain triggers boost at x4), Ember Sovereign boss (enter, 3 vents, directed flame sweeps, strike by dash-close when open, 3-hit shatter with explosion).
- Juice: particles (embers/smoke/sparks/rescue), easing, screenShake on hit/boss, flash overlay, combo pops, heat haze lines, afterburner visuals.
- Audio: gesture-only WebAudio (wind drone + whoosh dash + ember chimes + rescue tone + boss vent + shatter + crash).
- Controls: pointer drag y + tap/click dash (anywhere), keyboard arrows y + space dash, touch friendly.
- States: ready (title + prompt), flying, crashed (tumble + summary + retry any key/tap), victory on boss defeat (or continue).
- Responsive resize, dpr crisp, pause on blur.
- Local serve verified: loads, no console errors on start/interact, 60fps feel, audio on first gesture, dash immediate, first ally/ember <15s, boss <40s, restart works.
- Screenshots: see PREVIEW updates + will attach to PR.
- Checklist: all items above exercised and holding.
- Known: pure procedural (no external png/wav, graceful within house limits); boss strike window tuned in play; score scaling for long runs.

**Next:** push canonical, gh pr (create or update # for branch), live preview re-verify + screenshots, continue micro-polish (balance, more boss tells, particle tuning, text polish, mobile layout) to deadline.

**Blockers found/fixed this pass:** none (initial clean).

**Last updated:** 2026-06-15 Pass 1 complete (impl + local browser runtime exercise + docs).
