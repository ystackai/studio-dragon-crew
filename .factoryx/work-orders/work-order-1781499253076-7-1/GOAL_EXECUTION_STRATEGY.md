# Emberflight Gauntlet — Goal Execution Strategy (work-order-1781499253076-7-1)

**WorkOrder:** work-order-1781499253076-7-1  
**Related/prior:** work-order-1781497406944-7-1 (strategy + Pass 1 implementation)  
**Factory:** factory-dragon-crew | Project: dragon-crew | Role: coder-default (grok-build)  
**Branch (canonical):** factoryx/factory-dragon-crew/work-order (PR #75)  
**Deadline:** 2026-06-15T14:28:32Z (polish_until_deadline mode)  
**Preview:** games/88-emberflight-gauntlet/index.html (via .factoryx/preview-entrypoint)  
**Completion:** Implement immediately then polish until budget; real browser verification required; one canonical PR updated live.

## Core Interpretation of Goal
Build ambitious polished Dragon Crew action game "Emberflight Gauntlet". Start from studio (house style in FACTORY_CONTEXT.md + prior game state). First screen = playable game. Core heroic/kinetic: fly/dash dragon/crew through burning sky (or ember-vein canyon) gauntlet; weave hazards; rescue allies or collect embers; chain boosts; fight clear boss/escalation beat. Juicy controls, scoring/combo feedback, restart, sfx/vfx if feasible, responsive, <2MB self-contained, no placeholders/static/menu-only. Evidence via browser runtime (pageerror/console/request, in-game state post interaction), screenshots, GitHub PR with FactoryX preview.

## Taste-Gate Slice (already met by prior passes)
- One primary verb: **weighty aerial/planar flight + tactical breath** (steer heavy ancient being with inertia + bank personality; short powerful breath bursts that illuminate, clear threats, claim value).
- One space: ember canyon "vein" (strata walls with heat seams, drifting embers, choking pressure, glowing rings/orbs as "embers"/rescue points).
- Strong camera: fixed 16:9 logical playfield, side-scrolling forward with player at fixed x (DRAGON_X), looking into the dragon's path — player feels small, negotiating the dragon's presence.
- 30-60s slice playable in browser before systems expansion: achieved in Pass 1 (prior WO); idle shows living dragon, first gesture = full run with audio+physics+scoring+death/retry.
- Pivot rule followed: if not interesting after honest play, would pivot; multiple timed play sessions confirmed weight, timing, chaining, breath-tactics, death-clarity, and "want one more run" loop.

## Scope Priorities (ranked by risk/impact for remaining budget)
1. **Core loop already solid** — preserve weighty spring-damp flight (recent polish: lower stiffness, head leads on bank for personality), breath cone as presence, canyon pressure, rings/orbs/hazards, combo chaining, gesture audio, instant retry.
2. **Add clear boss/escalation beat** (ambition gate from payload) — at depth threshold (~7200-8000), trigger "Ember Sovereign" or "Ashwraith" phase: large looming silhouette boss with vents/cracks; periodic directed attacks (fireballs/lunges); player must weave + use breath tactically on 3 weak points to break it for massive chain/score + visual payoff (shatter + ember storm). Post-boss: brief calm or intensified gauntlet. This gives 30-60s run a memorable mid-run "heroic beat" without lengthening to multi-level.
3. **Rescue allies + embers** — occasional small "crew" silhouettes or bright ember clusters that act as high-value chain targets. Flying close or flaming near "rescues" (visual pull-in or flare) for combo+score. Ties to "Dragon Crew" mythos (you are in relationship, not alone).
4. **Juice + feedback polish** (per Game Feel Checklist):
   - Screen shake / impact flash on crash + heavy breath.
   - Stronger score pop + combo visual pop on chain.
   - Hit confirmation (spark burst + audio distinct for ring vs orb vs breath-pop vs boss hit).
   - Easing already pervasive; ensure no linear teleports in new boss motion.
   - Touch targets: whole canvas is target (large); HUD elements 28px+.
   - Audio: already gesture-only; enhance layers if small (e.g. low distant rumble under wind, distinct boss-hit tone) without bloat.
5. **Responsive + perf + payload** — already DPR/full-bleed, 60fps cap particles, <45kB HTML (gz even smaller). Keep additions tiny (no external, no large data URIs).
6. **Verification + artifacts** — real browser (chromium headless for load/screenshots + manual http.server interact for state); capture pageerror/console, first-interaction in-game (score>0, particles, breath active); update PR body + durable VERIFICATION.md with evidence; screenshots to PR or preview/ subdir; keep .factoryx/preview-entrypoint exact.
7. **Docs/PR hygiene** — create/update current WO memory (this dir) from prior; append top WORKLOG; PR body always current with implemented scope, preview path, verification output, known issues, remaining polish, full WO context + prompt summary.

## What We Do NOT Do (per rules + taste-gate + house style)
- No save/load, inventory, multiple discrete levels, proc-gen broad, achievements, settings menus (unless asked).
- No placeholder animation or static scenes as hero (dragon is hand-authored layered procedural with real mass/personality).
- No menu-only or "select dragon" front; first screen = flight.
- No external network after load; no giant unopt assets.
- Do not treat dragon as mascot/pet/tool; keep "vast, opinionated, weight/temperature/consequence" per house style (player negotiates presence).
- Avoid over-scope: keep single-file, one continuous gauntlet with one escalation peak.

## Execution Approach
- **Larger product-shaped changes** when adding boss (new entity, draw, update, spawn, collision, fx, score path) because risk understood from prior slice + house style fit.
- **Smaller diffs** for tuning (flight constants, spawn rates, fx intensity, audio params) and verification fixes.
- Read game-designer-2d skill + autoreview skill before major closeout passes.
- Use crew agents (via .codex if present, or direct in thinking) for direction: fire-dragon for coherence, snow-dragon for polish, sea-dragon for audio/rhythm, lava-dragon for text.
- After each meaningful code change: local serve + interact + chromium screenshot + structure check; update WORKLOG/VERIFICATION live; push only after fetch/rebase guard; update PR once per pass or on evidence.
- Timebox: use remaining ~9h budget for 2-4 polish iterations (boss + juice + 1-2 verification loops + final docs). Stop on real blocker or deadline; leave code in place; report PR URL.
- Git model: only canonical branch; rebase/merge forward if needed; one PR (#75); body includes FactoryX Work Order Context with full prompt text for reviewers.

## Success Criteria (concrete, before marking pass complete)
- 0-8s: new player performs primary action (bank + breath) without explanation; dragon reads as ancient presence.
- 20-50s: first boss trigger visible, player can engage (weave + 1+ breath hits on vents), feels escalation (narrower, hotter, directed threats).
- Chain/rescue: 4x+ combos achievable; ally/ember rescues contribute visibly to score + chain.
- Feedback: every action <100ms visible/audible (bank tilt immediate, breath cone spawns on gesture, score/chime on collect, shake on crash).
- Death/retry: <1s from crash to new run; state clean.
- Verification: chromium load produces non-blank screenshot with dragon+canyon visible; manual run reaches boss + scores; no uncaught errors, no 404s, console clean on path; 60fps observed.
- House: dragon head leads bank (already), breath changes light + clears path (already + boss), weight felt, canyon has temperature (seams, embers, smoke).
- Artifacts: PR #75 updated with evidence + screenshots + current WO context; .factoryx/ WO files current; preview opens game directly.

## Risk / Pivot Triggers
- If boss feels tacked-on or unfair in 60s window: simplify to 1-phase, fewer projectiles, clearer vent targets (larger or glowing).
- If perf drops (particles or draw): cap harder or skip low-alpha.
- If audio bloat or gesture issues: keep minimal synth, no new buffers.
- If time runs low before boss lands: ship with stronger ramp + "final vein" text at depth, treat as escalation beat; note in PR as known residual.

**Last updated:** 2026-06-15 05:0x UTC (initial for this WO ID; game state from prior polish commits + this pass plan)  
**Next immediate:** Create sibling memory files (WORKLOG/PREVIEW/VERIFICATION), implement boss + allies + juice in small-to-medium targeted edits, run verification, commit/push/update PR.