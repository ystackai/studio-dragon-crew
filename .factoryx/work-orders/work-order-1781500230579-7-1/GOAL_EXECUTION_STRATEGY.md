# Emberflight Gauntlet — Goal Execution Strategy

**WorkOrder:** work-order-1781500230579-7-1  
**Factory:** factory-dragon-crew  
**Project:** dragon-crew  
**Role:** coder-default (direct-build)  
**Branch:** factoryx/factory-dragon-crew/work-order-1781500230579-7-1  
**Title:** Emberflight Gauntlet  
**Archetype:** creative_game  
**Payload:** browser-game-2d, polish_until_deadline, preview: games/90-emberflight-gauntlet/index.html  
**Status:** Implementation active — taste-gate slice + full heroic gauntlet to deadline.

---

## Player Fantasy (adapted from prior + payload)

Fly or dash as dragon/crew through a burning sky gauntlet. Weave hazards with weighty, kinetic motion. Rescue allies and collect embers to chain boosts. Face a clear boss escalation with vents and strikes. The dragon feels ancient, heavy, powerful — every dash has cost and consequence, every chain feels like riding fire.

Primary verb in first 30s: **weave + dash to thread, collect, rescue**.

One space: the open burning sky over jagged ember canyons and floating basalt at twilight/golden bleed.

---

## Scope for this WO (polish_until_deadline)

- First screen = the game. No menu-only, no placeholder static.
- Self-contained `games/90-emberflight-gauntlet/index.html`.
- Core loop: constant forward flight, y-control (drag/keys), dash input (tap/space) for burst speed + flame trail that interacts.
- Hazards: spires, debris, gusts — immediate readable, consequence on hit (push, flash, combo break, optional hp).
- Collect: embers (small, frequent, chainable), allies (high-value rescue silhouettes — small crew figures that reward close fly-by with big pop + chain boost).
- Chain boosts: x4+ triggers temporary afterburner (speed+, score mult, stronger visuals).
- Escalation boss: Ember Sovereign — large silhouette, 3 vent attacks, player strikes vents by dashing close when open (3 hits = shatter with massive payoff).
- Juice per Game Feel: easing, particles on every impact/collect/rescue, screen shake on hits/boss, flash, responsive <100ms, audio on gesture only.
- Responsive: canvas full, touch+kb, large targets.
- Restart: instant from crashed/victory, R key or tap.
- Polish: keep iterating to deadline (screenshots, verification, PR updates, micro juice, balance, readability).
- Non-goals: no multi levels, no save, no external net, keep <2MB, pure vanilla canvas 2D + WebAudio.

House style adherence: weight/temperature/consequence, fire hungry flickering ember trails/heat haze, dragon presence larger/ancient, light/atmosphere character, never cartoon, small human/crew as witness/rescue scale.

---

## Taste-Gate First (executed in first pass)

Build 30-60s playable slice of **dash/weave + collect/rescue** in burning sky before full systems.

- Get browser-playable (local serve + manual interact + console clean) evidence.
- If not compelling after honest play — adjust before heavy polish.
- Evidence: first flight immediate, first ember/ally within 15s, first dash response, first hazard consequence, boss reachable in <45s run.

Then expand to full boss + chains + juice.

---

## Evidence & Acceptance (from payload + checklist)

- github_pr (canonical on the WO branch)
- browser_runtime_verification (real load + interact + state, pageerror/console, no 404s, in-game after gesture)
- screenshots (desktop + mobile)
- live preview at games/90-emberflight-gauntlet/index.html
- Game Feel Checklist ticked in VERIFICATION
- PR body with full Work Order context + FactoryX section

Continue polish passes until deadline or blocker.

**Last updated:** 2026-06-15 initial for this WO id (adapted from prior emberflight strategy; direction shift noted: emphasis on dash/rescue-allies/chain-boosts + boss vents over ring-flame focus).
