# Emberflight Gauntlet — Verification Notes

**WorkOrder:** work-order-1781497406944-7-1  
**Required Preview Entrypoint:** games/88-emberflight-gauntlet/index.html  
**Verification Required:** browser_runtime_verification (true)  
**Phase:** Strategy gate (planning only)

---

## Verification Mandate (from Payload + Protocol)

Verification is part of the deliverable. Before asking for review:

- Run the repo checks.
- Open the preview locally.
- Interact with the game (bank, burst fire, hazards, rings/targets, fail/retry).
- Capture screenshots/evidence.
- Fix console errors, blank canvases, missing assets, broken controls, or verifier failures.

**Browser runtime verification must exercise the real browser runtime**, not only static string/syntax checks. Capture `pageerror`, `console.error`, request failures, and at least one in-game state after character/start interaction.

Treat uncaught JavaScript errors, missing assets, blank screenshots, or audio/game-loop runtime failures as **blockers** to fix before pushing another polish pass.

Game Feel Checklist must be actively verified (see GOAL_EXECUTION_STRATEGY.md for full list and retirement rules).

---

## Strategy Gate Verification (Current)

- [x] Read and internalized full Work Order payload, planning protocol, taste-gate rules, game feel checklist, house style, prior drops, and asset generation precedent.
- [x] Confirmed no production implementation performed at strategy gate (only WO memory files under `.factoryx/work-orders/work-order-1781497406944-7-1/`).
- [x] GOAL_EXECUTION_STRATEGY.md written with explicit verification implications section (canvas 2D primary, resilient asset decode checks, 60s play evidence, real dragon + audio in screenshots, autoreview + manual playtest).
- [x] `.factoryx/preview-entrypoint` path noted for later write (exact: `games/88-emberflight-gauntlet/index.html`).
- [x] `gh pr view` executed — no open PR for this branch yet (expected at strategy gate; will not create one from this gate).
- [x] Remote branch does not yet exist; will be established via `git push origin HEAD:factoryx/factory-dragon-crew/work-order-1781497406944-7-1` (no force-push of stale history).

**No browser runtime, no screenshots, no console output, no asset decode checks yet** — those are implementation-phase artifacts.

---

## Planned Verification Steps (Implementation / Taste-Gate Slice)

1. **Repo checks:** `node --check` (or any studio verify script) on the game entrypoint and any split modules. Fix all syntax/runtime-static issues before commit.
2. **Local serve + open:** Serve the games/ tree (or root redirect) and load in real browser (desktop + devtools device emulation for mobile). Confirm first paint is the playable game, not a landing or gallery.
3. **Gesture + core loop exercise:**
   - First pointer/keyboard gesture inits AudioContext (no autoplay).
   - Fly, bank left/right (visible tilt + weight + ember/smoke trail), pitch up/down.
   - Short tactical fire burst (visible cone/jet + particles + chest vent glow + audio punch; heat cost visible and limiting).
   - Thread at least one ring and/or flame a target for score feedback (flash, pop, combo).
   - Hit a hazard → immediate readable crash (tumble + heavy smoke + sizzle), score recap, large retry affordance.
   - Retry and repeat for a second run (total play < 2 minutes).
4. **Evidence capture (attach to this file + PR body when opened):**
   - Screenshots: desktop (first flight, banking, burst, chain, crash+retry), mobile viewport (no overlap, readable HUD, large touch surface).
   - Console: clean (no pageerror, no uncaught, no 404 after load, no decode failures).
   - Network: only local/self-contained assets after initial load; no external calls.
   - Audio: mute toggle works; sound only after gesture; real generated cue audible on burst/crash (not just oscillators).
   - FPS: stable 60 during normal play on mid laptop (note any dips and fixes).
   - Asset decode proof: dragon image(s) have naturalWidth/Height > 0 and are visibly the hero (not placeholder); audio buffers decode and play.
5. **Fix loop:** Any failure above is a blocker. Fix, re-verify locally, re-capture evidence, update WORKLOG/PREVIEW/VERIFICATION + PR body before further polish or review request.
6. **Autoreview / crew review:** Run `.factoryx/skills/autoreview` (or equivalent) as closeout check on the slice before final push if the skill is present and helpful. Treat output as advisory; verify findings in real code/play.
7. **Live preview retest:** After push + deploy, re-open the FactoryX preview URL, bust cache if needed, repeat core 60s interaction, post observations/screenshots to PR and this file.

---

## Game Feel Checklist (Active Verification Targets)

See full checklist in Work Order and GOAL_EXECUTION_STRATEGY.md. Key items that will be explicitly tested and evidenced:

- [ ] Core verb demonstrated in first 30 seconds (new player finds and performs primary action without explanation).
- [ ] Input response < 100ms with visible/audible feedback.
- [ ] Easing on all motion (dragon position, bank angle, particles, score pops, heat gauge, etc.).
- [ ] Hit/score feedback at moment of impact/score (particle, flash, sound).
- [ ] Audio only after user gesture; mute control present and functional.
- [ ] Touch targets ≥ 44px effective + full keyboard support in parallel.
- [ ] 60fps on mid laptop (profile/fix before ship).
- [ ] Total payload < 2 MB (compressed assets, no giant unoptimized files).
- [ ] No external network dependencies after load (works offline).

**Placeholder retirement** will be re-checked at verification time: central dragon hero and musical identity must be driven by real (generated/authored) assets, not throwaway vector/procedural stand-ins.

---

## Known Limitations at Strategy Gate

- No game code or assets exist yet for this Work Order.
- Verification numbers, screenshots, and live URLs will be added only after taste-gate slice implementation and local browser runtime exercise.
- Any "verification" at this gate is process and planning verification only.

**Last updated:** 2026-06-15 — Technical design gate closure: TECHNICAL_SYSTEM_DESIGN.md created with full verification implications, planned runtime steps, Game Feel Checklist targets, asset decode proof requirements, and placeholder retirement re-check. No runtime verification performed (none possible yet); design-time process verification complete. Actual browser runtime + screenshots + evidence pending taste-gate impl.

**Technical design gate verification (process + planning):**
- [x] Re-read full strategy (verification implications section), payload (browser_runtime_verification: true), game feel checklist, and prior drop patterns (sanctuary single-file + procedural audio; rhythm resilient load).
- [x] Confirmed `.factoryx/preview-entrypoint` already present with exact `games/88-emberflight-gauntlet/index.html` (resolves prior skip; no mutation needed at this gate).
- [x] gh pr list/view: no PR on branch (correct; no blocking comments or reviews to address).
- [x] Branch HEAD (0e3acb2) in sync with remote tip for this Work Order after fetch; no force-push of stale history.
- [x] Design doc explicitly specifies: repo checks (node --check), local serve + real browser open, 60s core loop exercise (gesture → bank → burst → ring/target → crash/retry), evidence capture (screenshots desktop+mobile, console clean, network local-only, FPS ~60, decode proof for dragon + real audio buffers), autoreview + crew passes, live preview retest, and explicit "failure = blocker" rule.
- [x] Game Feel Checklist and placeholder retirement (dragon hero + ≥1 real audio cue) called out as active verification targets that must be evidenced before review.
- [x] No production game code, assets, or changes outside WO memory at this gate.

**Known limitations (post-design gate):** No game code or assets exist yet. Full numbers, console output, screenshots, decode logs, and live URLs will be added only after taste-gate slice + local browser runtime exercise. Any "verification" at this gate remains process/planning verification.

**Execution note (this agent run):** Inspected git + gh (no PR). Re-read strategy + all WO files + skills + drops + fire-dragon asset as inputs to the design. Created TECHNICAL_SYSTEM_DESIGN.md with concrete verification plan aligned to protocol, game feel, and "polish until deadline" intent. All durable notes under `.factoryx/work-orders/work-order-1781497406944-7-1/`. No prod changes. Ready for taste-gate implementation verification on same branch.
