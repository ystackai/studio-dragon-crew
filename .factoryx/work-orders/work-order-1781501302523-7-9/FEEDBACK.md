# Emberflight Gauntlet — Playtest / Feedback Notes

**Work Order:** work-order-1781501302523-7-9

Record honest play observations, operator notes, review comments here. Update after each significant push + live preview session.

## Pass 0 Observations
- (To be filled post first playable.)

## Later Passes
- ...

## Pass 3 (polish)
- Session bests on crash: strong "try again" hook observed in manual local runs (see the number, immediately want the higher chain).
- Weave sparks: satisfying when you thread a tight gap between hazards; the gold pop + tiny combo tick makes positioning feel skilled rather than just "not hit".
- Maw particles: helps first-time players read that the serpent has moving safe lanes (the vents "breathe" visibly).
- Decay tune: allowed one clean 5-6x combo through Maw section on practice; still punishes hesitation.
- No new issues; core loop still the star. Would ship this slice.

## Pass 5 (final deadline polish)
- Wind shear on boost: immediately makes the dash feel like you're carving the sky; the angled streaks + intensified wake sell speed without clutter.
- Dragon crest on Maw clear: the brief horn/eye gold + toll audio gives a real "the dragon noticed you survived that" moment — weighty, not triumphant. Fits house: you paid the cost, carry the warmth.
- Second Maw tighter/faster: the escalation now has teeth; threading both passes feels like a complete heroic mini-story in 40s.
- Status "THE MAW YIELDS • CARRY THE FIRE": lands with the right mythic register (small human carrying something ancient forward).
- Still no issues; the slice feels complete and juicy. Ready for review.

## Pass 7 (carry legibility)
- Crash bank note "+N CARRIED • THE FIRE REACHES THE CREW" (with gold burst) makes the two-pass Maw payoff tangible even on defeat — "you still delivered some warmth". Satisfying "one more try" without removing consequence.
- Dragon carry aura (subtle gold halo during the ~8s afterglow) gives visual weight to "carrying the fire" while flying; pairs with gold wake/motes. Feels mythic, not flashy.
- No new issues observed in instrumented + idle runs; core loop + escalation still the star. The first screen remains the playable gauntlet. Would ship.


## Pass 8 (verification harden + re-verify)
- The p8 instrument (real chromium) correctly found two latent non-finite paths under synthetic fast-forward + carry window pumps that normal play + earlier instruments missed. Fixing with guards (audio + canvas gradients) is the right "make verification actually pass" step — no player-facing change, but now the ambitious slice can be presented with clean live preview evidence.
- Carry + second Maw + crash bank still feel as juicy as p7 described; the first 30-60s delivers the heroic weave/dash through burning sky + clear escalation beat + "carry the fire" afterglow payoff.
- No new issues. Would ship the slice as-is for review. The PR artifact (77) carries the full context.

## Pass 9 (final verification + PR report, this execution)
- Fresh p9 instrument under real Chromium: confirmed clean SUCCESS on full path (start → carry set → crash-while-carry bank exercised; "no uncaught" logged; zero game errors). The carry bank + bests on crash remain satisfying "one more try" even after heroic escalation payoff. First screen still the living playable gauntlet.
- No issues. PR#77 https://github.com/ystackai/studio-dragon-crew/pull/77 is the reviewable artifact with full context + fresh evidence. Would ship for human review.


