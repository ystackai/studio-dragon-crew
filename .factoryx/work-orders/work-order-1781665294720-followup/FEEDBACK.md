# Operator Feedback for deliverable-decision-1781629628070-2 (rework)

**Source:** feedback-followup-dispatcher  
**Decision action:** rework  
**Feedback (verbatim):**  
bug, preview is showing factory home

**Context from payload:**
- Parent Work Order: work-order-asset-skill-smoke-dragon-20260522
- Selected refs: work-order-asset-skill-smoke-dragon-20260522
- Deliverable: smoke-dragon-crew-asset-generation-skill-proof-pack-b70f9926
- Kind: code
- Expected artifacts: github_pr, preview_url_if_available, review_summary, screenshots, generated_assets
- "Implement the requested changes as a reviewable code follow-up attached to the same deliverable. Address this feedback before unrelated polish. Keep useful existing work, but materially redesign the interaction, explanation, visual assets, or audio when the feedback calls for it."
- "Real file-backed generated/authored assets under assets/generated, games/**/assets, or drops/**/assets plus manifest/provenance are required..."
- "Run browser/runtime verification, include screenshot or evidence notes, update the preview entrypoint if needed, and create or update a GitHub PR."

**Root cause analysis (this pass):**
The preview root (likely served via .factoryx/preview-entrypoint or defaulting to preview/index.html or studio root) was resolving to the Dragon Crew factory home / team avatar gallery (portraits of the six dragons under team/avatars/generated/). This is the "factory home" — a static grid of generated dragon portraits used for persona preview, not a playable demonstration of the *game asset generation skill*.

The original smoke integrated generated assets (icon + sfx from proof-pack) into the Rhythm Drift drop (drops/1777047133184832800) with a redirect, but the canonical preview for the deliverable was not wired to open that game first. Reviewers therefore landed on the portraits page instead of the interactive proof (game canvas + visible badge + gesture sfx).

**Corrective action (address before polish):**
- Ensure .factoryx/preview-entrypoint points directly at the game artifact demonstrating the assets (drops/1777047133184832800/index.html).
- Re-confirm (or recreate) real file-backed generated assets under the allowed drops/**/assets path + full manifest/provenance.
- Integrate visibly and audibly in the running game so the first 30s of play exercises the proof-pack assets.
- Re-verify with real browser runtime (chromium headless load + evidence screenshots) + update all WO memory + PR body.
- Do not mutate the factory preview/index.html (portraits) — that is intentional team content.

**Status:** Feedback addressed in this follow-up pass on branch factoryx/factory-dragon-crew/work-order-1781665294720-followup. All other gates (Game Feel, <2MB, gesture audio, self-contained, 60fps, etc.) re-checked.

**Last updated:** 2026-06-17
