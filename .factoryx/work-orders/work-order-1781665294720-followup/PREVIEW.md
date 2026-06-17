# PREVIEW — Smoke: Dragon Crew asset-generation skill proof pack (rework)

**Canonical preview root for this Work Order:**  
`drops/1777047133184832800/index.html`

This opens the Rhythm Drift game (the integration target from the parent asset-skill-smoke work) which now loads and demonstrates the real generated proof-pack assets:
- Generated dragon-icon.jpg as visible UI badge (loaded on start, visible in first frame).
- Generated dragon-breath-whoosh.wav as gesture-gated sfx triggered on input/quality cadence (audible feedback within <100ms of action).

**Why this fixes the bug:**  
Previously the preview for the deliverable resolved to the factory home (preview/index.html — the six-dragon portraits gallery). Reviewers saw static team avatars instead of the playable game + asset proof. The entrypoint + integration now makes the preview open the *game artifact* directly.

**Relative link for preview trees:**  
Under FactoryX preview copies this will be served at paths like `/factoryx/previews/factory-dragon-crew/work-order-1781665294720-followup/drops/1777047133184832800/index.html` (or via the entrypoint redirector). No absolute /public or root mutation.

**How to use for review:**
1. Open the preview root (or local equivalent: `python3 -m http.server 8765` from repo root, then visit http://localhost:8765/drops/1777047133184832800/ ).
2. Game canvas appears with existing twilight/ripple/creature shaders + HUD (Flow/Beat/State).
3. On load: dragon badge (generated icon) should be visible in corner or overlay.
4. Click/tap/drag anywhere on canvas (first user gesture unlocks AudioContext): ripples + flow score rises; on good cadence inputs you will hear the generated whoosh sfx.
5. No page errors, no failed asset requests for the two generated files, console clean.
6. 30-60s slice: primary verb is "input to sustain flow / ride the rhythm" — immediate visual (ripples + state crossfade + score) + now audible (whoosh) feedback from the proof assets.

**Evidence location:**  
- Screenshots in this dir: `screenshots/`
- Full verification + browser notes: VERIFICATION.md
- Generated assets + manifest: see ASSET_MANIFEST.md and `drops/1777047133184832800/assets/generated/`

**Entrypoint file:**  
`.factoryx/preview-entrypoint` (single line: the relative path above) — updated for this deliverable.

**PR:** https://github.com/ystackai/studio-dragon-crew/pull/80 (canonical for this work-order branch)  
**Last updated:** 2026-06-17 (rework: direct game preview root + real assets visible/audible)
