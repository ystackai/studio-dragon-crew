# Emberflight Gauntlet Rework — Goal Execution Strategy (Asset Foundry Pass)

**Work Order:** work-order-1781634304247-7-1
**Factory:** factory-dragon-crew
**Selected ref / current deliverable:** work-order-1781501302523-7-9 (games/92-emberflight-gauntlet/)
**Branch:** factoryx/factory-dragon-crew/work-order-1781634304247-7-1
**Focus:** Operator feedback — "you need to use the asset foundry to generate better art this looks terrible the procedurally generated stuff". Address directly; keep existing deliverable goal (playable Emberflight Gauntlet slice) intact.

## Scope for this follow-up
- Do NOT redesign mechanics, add levels, or change core "weave & dash" verb / burning sky gauntlet space / side-view inertia flight model.
- Primary change: replace or augment the current local-procedural file-backed assets (dragon-hero.png, ember-glow, hazard-*, sky-haze, sfx-*.wav) with outputs from the asset foundry (Flux images + MMAudio or equivalent generative service) for higher-quality, less "terrible" art.
- Preserve all prior verified paths, 60fps, <2MB, Game Feel, browser runtime verification, house style (mythic weight, heat, consequence, small human witness, elemental fire).
- If foundry service unreachable in runtime, record the attempt + fall back to deliberately enhanced local generator (v2) producing visibly improved, reviewable file-backed PNG/WAV that better match Dragon Crew visual language; commit generator + outputs + manifest.
- Rebase/merge main + prior deliverable state first (done).
- Direct preview root to the gauntlet; update WO memory + PR body.

## Execution Order (per rules + review context)
1. Merge main + selected ref branch to address github-mergeability "changes_requested" (merge conflicts) before any art work.
2. Inspect current assets + generator + integration in games/92-emberflight-gauntlet/.
3. Attempt asset foundry call (FACTORYX_GAME_ASSET_SERVICE_URL /v1/proof-pack or equivalent) for Emberflight-specific prompts (dragon+rider hero sprite, ember collectible, spire/vent hazards, atmospheric haze, short flight sfx stingers).
4. If successful: download smallest useful files, place under assets/, update manifest + index.html load paths with graceful fallback to prior.
5. If unreachable (as in prior inspection): enhance generate.py for richer silhouettes (more layered scales, membrane detail, multi-rim glows per house "fire hungry + weight"), better particle-friendly shapes, richer synth (layered noise+harmonics+envelopes), re-gen all assets, update ASSET_MANIFEST + comments.
6. Verify: real browser (chromium) load + post-gesture interact (steer/dash/collect to maw + crash/restart); no pageerror, console clean, assets 200 or graceful, first 10s reads as "active flight" with improved hero/hazards/embers.
7. Update all durable WO files under this context dir, preview-entrypoint, screenshots/evidence.
8. Commit, push canonical only, update PR (include full original prompt in body section).
9. Only after art/asset gate addressed: any peripheral polish.

## Acceptance (tied to feedback + Game Feel + prior)
- [ ] Asset foundry (or documented enhanced equiv) used; new assets visibly less "procedural/terrible" (richer dragon silhouette + rider presence, more material embers/hazards, atmospheric depth in haze, weighty sfx).
- [ ] All prior verification gates re-hold (early paint, no uncaught, 60fps, gesture audio, <2MB total incl assets, responsive kb/pointer/touch).
- [ ] Preview opens the gauntlet directly; first screen = playable improved-art gauntlet.
- [ ] PR updated with context, evidence (screenshots of new assets in play), WORKLOG etc.
- [ ] Changes requested (merge conflict) resolved before this pass.

## Risk / Sizing
- Service reachability: low risk mitigation by documenting + enhanced local (previous contract).
- Visual pop without breaking verified draw paths: keep draw order (file sprite base + vector overlays), same nominal sizes or compatible.
- Size: keep assets small (target < previous ~444kB combined).

## Notes
- Existing deliverable goal (heroic gauntlet flight slice) unchanged.
- This is rework attached to same node; produce normal reviewable output (github_pr expected).
- Follow "Latest review requested changes. Address this feedback before unrelated polish."
