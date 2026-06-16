# Sanctuary of the Six Lights — Preview Notes

**Preview root:** `preview/index.html` (now a minimal valid redirect to the playable experience)
**Direct link:** `drops/1779032436881/index.html`
**Relative under factoryx preview tree:** works when copied as `/factoryx/previews/.../drops/1779032436881/`

## How to open
- From repo root: open `preview/index.html` (auto-forwards) or directly `drops/1779032436881/index.html`
- Live deployed preview (after push + CI): the preview URL for the branch should land on the sanctuary (no extra marketing page first).

## First screen
The dim floating sanctuary with 6 shrines around the Sky Loom. Click/tap a shrine or press 1-6. No "landing" interstitial beyond the browser load.

## Key paths exercised in preview
- Pointer/touch open + complete any trial
- Keyboard: 1-6, arrows+Space/Enter inside Water/Ice/Lava/Sea, M mute, R reset, ESC close
- Mute before/during (persists)
- Collect 6 → finale with Lava title + 6 dragons lift + shareable text
- Reload restores partial progress

## Self-contained
- All JS/CSS in the drop dir (plus relative portraits under ../../team/avatars/generated/* which resolve when served from a tree containing both team/ and drops/).
- Fallback colored circles if portraits 404.
- No external paid services or net calls after load.
- < ~150kB total.

## Notes for reviewers
- The experience is the first thing you see (after tiny redirect).
- Complete path ~8-12 min; taste slice (Fire + Ice + Water) is first 2-3 min.
- All 6 dragons distinct: hold/release, rotate mirrors to gold path, rotate pipes to connect, catch glyphs calmly, echo 3-note shells, click word rings for mythic name.
- Visual env transforms on each blessing (waves, snow, braziers, etc).
- Sound optional + visual everywhere (new ambient grows with progress, per-interaction tones).

**Status:** Ready for browser runtime verification + human play on live preview.
