# Suggested PR body update / comment for Sanctuary of the Six Lights

## FactoryX Work Order Context
- Work Order: work-order-1779032436881-sanctuary-six-lights
- Factory: factory-dragon-crew
- Project: studio-dragon-crew
- Branch: factoryx/factory-dragon-crew/work-order-1779032436881-sanctuary-six-lights
- Deliverable: drops/1779032436881/ (playable Sanctuary of the Six Lights)
- See attached_spec_markdown in the original Work Order payload for full requirements, six trials, QA, and creative guardrails.
- Latest human review (changes_requested): "please polish more, the labyrinth path thing doesn't seem to let you rotate the pieces using enter/space, and for the prism experience the pieces doesnt' seem to let you create a winning path for the rays. Polish everything. Add more sound."

This commit (and follow-up) addresses the *latest* human review directly and first (before unrelated polish):
- Water keyboard: Enter/Space now reliably rotate via *contained* grid-capture + per-tile handlers, arrows move custom sel, default L focused on open, no leaks. (Larger 44-48px tiles, strong focus rings.)
- Ice win path: start [15,30,45] is near-miss; one small left-arrow/drag on middle creates clear gold winning ray (gp<10, hits within 42 tolerance). Proximity "Close" guide + updated live hints make the path discoverable without instructions dominating.
- More sound: richer 2-osc ambient that grows (base + pad) with #blessings; new playWaterFlow + playMirrorTone + extra sea success pads + fire release tails + ice mirror clicks; all audio has visuals and respects mute.
- Polish: targets >=44px, active states, stronger focus-visible, clarified hints/instructions across trials, fire kb hold noted, sea notes enlarged, drop README kb section refreshed.

No new branches; updated existing work-order branch + drop 1779032436881 only.
Preview: preview/index.html small valid redirect → drops/1779032436881/ (first screen is the playable sanctuary).
Verification: node --check clean on all modules; logic sims confirm Ice steer-to-win + Water 1-turn solve; chromium headless load clean (no game errors).

Full WorkOrder context (attached_spec_markdown) belongs in the PR description for FactoryX linkage. Local HEAD will be post-push.

(Continuing on factoryx/factory-dragon-crew/work-order-1779032436881-sanctuary-six-lights per guard.)
