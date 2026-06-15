# Emberflight Gauntlet — Preview Notes

**Work Order:** work-order-1781501302523-7-9  
**Preview Root:** games/92-emberflight-gauntlet/index.html (direct; opens the playable game)

## How to Preview
- Local: `python -m http.server 8080` (or equiv) from repo root; navigate to `/games/92-emberflight-gauntlet/`
- FactoryX deployed: `https://www.ystackai.com/factoryx/dragon-crew/previews/<factory>/<wo>/` will surface the entrypoint tree. The index.html at the entrypoint must be the game itself (or minimal valid redirect that immediately surfaces the game surface).
- Do not append review links, badges, or text after the `</html>` of the game document.
- Do not mutate the studio root homepage or preview/index.html unless this WO explicitly scopes to it (it does not).

## Current Preview State
- (Updated after each pass with observations from live deployed preview + local.)
- Pass 0 (slice): First load (file:// + headless Chromium) renders burning sky + dragon silhouette + idle hazards/embers + HUD + prompt. 41kB self-contained. No runtime fatal errors in 5-8s rAF execution. Screenshots: firstframe.png (ready), play-sim.png (simulated play time). See VERIFICATION.md for full browser evidence.
- Pass 1 (TDZ fix + Maw): Re-verified headless clean (no Uncaught/ReferenceError during full render loop + sim). Added Sky Maw serpent as the escalation/boss beat (distance ~780m trigger, undulating weave challenge with clear visual + consequence + reward on clean thread). Screenshots refreshed: firstframe.png, play-maw.png (Maw in motion). ~46.7kB. See VERIFICATION.md.
- Pass 2 (runtime blocker fix): Re-exercised full browser runtime on real index + temp auto-gesture copy (synthetic pointerdown to force startRun + 12 rAF pumps exercising ember update+drawEmber+radial gradients in playing mode). Zero game errors (no non-finite, no TypeError, no pageerror); VERIFY_STATE showed mode=playing post-gesture + "embers path exercised". Size 47.5kB. Restart now reseeds idle embers/hazards for consistent first-screen feel on retry. See VERIFICATION.md Pass 2.
- Real live preview (post push/deploy): will exercise actual gesture (tap/click/space) to start flight, collect embers, dash, crash + restart (now with living sky), and reach/beat the Sky Maw. Will update with live console + state observations + cache-busted screenshots.
- Entrypoint direct: games/92-emberflight-gauntlet/index.html opens the game surface immediately.

## Evidence Artifacts
- Screenshots will be captured from live preview (cache-bust with ?t= or hard refresh) showing:
  - First frame / idle atmosphere.
  - 10-15s in: dragon in motion, at least one hazard weaved, one ember collected or near-miss.
  - Crash state with score/combo visible + restart affordance.
- Browser devtools: Network tab clean (only the index.html + inline), Console clean during play path + interaction.
- If tooling available: automated page load + gesture simulation recording pageerror + last in-game state.

## Known Preview Issues
- (None at start; will list + resolve before marking pass complete.)

## PR Body Requirements
PR body must reference this preview path and contain a "FactoryX Work Order Context" section quoting the full user prompt so reviewers can judge diff against goal.
