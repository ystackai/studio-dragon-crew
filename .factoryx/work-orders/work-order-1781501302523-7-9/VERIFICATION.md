# Emberflight Gauntlet — Verification Notes

**Work Order:** work-order-1781501302523-7-9

## Required Verification (per Payload + WORKFLOW + Game Feel)
- Browser runtime verification (NOT static only): must exercise real browser (headless or manual), capture:
  - `pageerror` events (none in play path).
  - `console.error` / warnings during load + 30s play + interaction.
  - Network/request failures (expect 0; all self-contained).
  - At least one in-game state change after character/start interaction (e.g. `firstEmber` or `boostUsed` or `score > 0` or `mode === 'playing'` post-gesture).
- Live preview must open without runtime errors.
- Game Feel Checklist explicitly called out and confirmed per pass.
- Total payload size check.
- 60fps observation on representative hardware.
- Touch + kb + pointer exercised.
- Audio gate: confirm no sound before gesture; sound only after.

## Verification Method
- Local: open in Chrome/Firefox + devtools; also simple node http-server + manual or scripted puppeteer-like if available in env.
- Deployed: after push + preview deploy, use cache-busting URL, perform interactions, inspect console (or use injected verification hook), take screenshots.
- Tooling note: if `FACTORYX_BROWSER_VERIFY` or similar endpoint/scripts exist in runtime, invoke them and record output here. Otherwise manual + evidence in PR.
- On failure: treat as blocker; fix before next polish push.

## Current Verification Record
- (Populated after slice implementation and each push.)

### Pass 0 — Taste Gate Slice (2026-06-15)
- Browser runtime: Chromium headless (file:// load) executed full JS + rAF loop for 5-8s virtual time. No fatal pageerror surfaced in driver output; canvas rendered (screenshots written: 268kB + 247kB PNGs).
- Load: firstframe.png shows ready-state burning sky with dragon silhouette, idle ember particles, two hazards visible, HUD present, prompt visible. Console/runtime clean (only container dbus/gpu noise, no JS exceptions logged).
- In-game state observable: `window.__emberflightGauntlet.getState()` hook present; sim advances distance/embers in render even pre-gesture (idle world).
- Size: 41kB single self-contained HTML (<<2MB). No external requests by design.
- Audio gate: initAudio + rampMaster only called on first pointer/keydown (code path verified by inspection + no autoplay).
- Easing/feedback: all dragon motion, particle life, boost lerp, shake use Ease.* + dt-scaled; collects spawn floats + particles + flash; crash triggers particles + playCrash + UI.
- Controls: pointer drag/click + keyboard arrows + space + touch wired to unified steerTarget + dashRequested. Large canvas surface.
- Restart: from crash overlay button or R key calls restart() which resets world + returns to ready (no reload).
- Game Feel (initial): core verb (steer + dash weave) present on first gesture; dragon has weight (segment lag + wing response); hazards have heat flicker; embers/grazes give immediate pop + combo + boost; no linear teleports.
- Screenshots: firstframe.png (idle/ready), play-sim.png (after longer headless sim showing more world elements).
- Remaining for full checklist: real live preview gesture capture (post-deploy), 60fps manual profile, mobile sim test, console on actual interaction. Will re-verify on every push.

### Pass 0 Target Evidence (updated)
- [x] Load index.html → no pageerror, console clean on idle (headless run succeeded).
- [~] First user gesture → (code path + hook ready; live preview will confirm; headless can't easily inject gesture without extra tooling).
- [~] Within 20s collect/dodge → sim seeds hazards/embers; real interaction path exercised in code.
- [x] Crash path wired (particles, audio, UI, state).
- [x] Restart wired cleanly.
- [x] Network: zero external (pure file:// + inline).
- [x] Audio gate followed.
- [ ] FPS explicit counter (subtle; can add if needed in polish).
- [x] Size 41kB.
- [ ] Responsive full test (resize listener present, band clamping; will confirm in preview).
- [x] Screenshots in work order context + will link in PR.

## Blockers / Residual
- List any that must be addressed before review handoff or next push.

## Sign-off
- After verification passes, update PR body with summary + links to evidence. Do not present as healthy until live preview opens cleanly and verification exercised the runtime.
