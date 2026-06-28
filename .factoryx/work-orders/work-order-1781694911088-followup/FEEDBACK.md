# Operator Feedback (Primary Acceptance Criteria)

**Feedback id:** review:dragon-crew:review-1781653599640-7-26  
**Source/action:** human_review/rework  
**Parent:** work-order-1779032436881-sanctuary-six-lights  
**Deliverable:** build-sanctuary-of-the-six-lights-16a381fa

## Exact Feedback Text
"please polish more, the labyrinth path thing doesn't seem to let you rotate the pieces using enter/space, and for the prism experience the pieces doesnt' seem to let you create a winning path for the rays. Polish everything. Add more sound."

## Interpretation for this pass (address before any unrelated polish)
1. **Labyrinth (Water trial)**: Rotating pipe pieces with Enter/Space must work reliably and obviously from the first interaction. No complex capture logic that fails in browser. Clear selection + immediate rotate response + large targets.
2. **Prism (Ice trial)**: The rotatable pieces (mirrors/prisms) must allow the player to steer/create a path that actually wins (ray hits the gate). Starting configuration + controls + simulation must make a winning path discoverable and achievable within a few intuitive actions. Live feedback must confirm when you are on a winning path.
3. **More sound**: Add material new audio (real files + manifest, not only procedural). Wire to interactions.
4. **Polish everything**: After fixing 1+2+3, apply supporting polish (instructions, hit areas, focus, hints, responsive, game feel).

Keep useful prior work (6 trials, state, finale, sanctuary scene, blessing visuals, persistence). Materially redesign Water and Ice interactions + audio as required by feedback.

## Non-goals for this pass
- New trials or major new mechanics beyond fixing the reported ones.
- Broad refactors unrelated to the feedback.
