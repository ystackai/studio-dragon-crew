Push to canonical branch attempted but remote auth rejected (token valid for fetch but not push in this worker env; prior fetches succeeded as public).

Local branch HEAD: cd7d94716eccd0cded0c776f1841a13d2345420a
This is the commit that should be the new head of factoryx/factory-dragon-crew/work-order-1779032436881-sanctuary-six-lights .

To complete in real runner:
  git push origin HEAD:factoryx/factory-dragon-crew/work-order-1779032436881-sanctuary-six-lights

Then update the existing PR (likely https://github.com/ystackai/studio-dragon-crew/pull/<num> for this branch) body with the content from .factoryx/PR_UPDATE.md + full WorkOrder context.

All review feedback addressed in this commit:
- Water keyboard Enter/Space rotate now reliable.
- Ice prism: player can create winning ray path from the provided start.
- Added more sound.
- Polished (targets, focus, hints, instructions, active states).

Verification in WORKLOG + VERIFICATION files.
