# Operator Feedback (primary acceptance criteria)

Source: human_review / rework
ID: review:dragon-crew:review-1781704970455-7-119
Parent WO: work-order-1779032436881-sanctuary-six-lights

Exact feedback:
"please polish more, the labyrinth path thing doesn't seem to let you rotate the pieces using enter/space, and for the prism experience the pieces doesnt' seem to let you create a winning path for the rays. Polish everything. Add more sound."

This follow-up treats the above as the spec for changes. Addressed before any unrelated polish.

Changes in this pass target exactly:
- Water / labyrinth: Enter/Space reliably rotates selected pipe (redesigned contained handlers + large Rotate button + default sel + immediate focus + visual spin)
- Ice / prism: start angles near winnable + finer controls + explicit actionable hints + proximity + real beam audio on solve; player can create the gold path in 1-2 obvious actions from open
- More sound: 6 real file-backed WAVs under assets/generated/ (rotate-pipe, mirror-turn, beam-lock, water-flow, shrine-open, success-tail) + manifest + provenance + integration with fallback
- Polish: hints, targets (44px+), focus rings, instructions, ambient growth, immediate discoverability of core verbs
