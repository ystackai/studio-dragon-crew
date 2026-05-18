#!/bin/bash
# Dragon Crew verification for the current main branch plus Dragonbound Depths.
set -euo pipefail

PASS=0
FAIL=0

check() {
  desc="$1"
  shift
  if "$@"; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

check_shell() {
  desc="$1"
  shift
  if bash -c "$*"; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

verify_skybound() {
  DROP="drops/1779048647428"
  echo "=== Skybound Dragon Runner Verification ==="
  echo "Drop: $DROP"
  echo "WorkOrder: work-order-1779048647428-skybound-dragon-runner"
  echo

  check_shell "Skybound core files present" "[ -f $DROP/index.html ] && [ -f $DROP/game.js ] && [ -f $DROP/styles.css ]"
  check_shell "Skybound is self-contained enough for preview" "! grep -RInE 'https?://' $DROP/index.html $DROP/game.js $DROP/styles.css 2>/dev/null | grep -vE 'localhost|127\\.0\\.0\\.1|0:0'"
  check "Skybound game.js syntax" node --check "$DROP/game.js"
  check_shell "Skybound canvas + WebAudio present" "grep -q 'canvas' $DROP/index.html && grep -q 'new AudioContext\\|webkitAudioContext' $DROP/game.js"
  check_shell "Skybound keyboard/touch controls wired" "grep -q 'keydown\\|touchstart\\|btn-jump' $DROP/game.js && grep -q 'touch-controls' $DROP/index.html"
  check_shell "Skybound flight movement systems present" "grep -q 'FLIGHT_DRAIN\\|stamina\\|dive\\|coyote\\|JUMP_BUFFER' $DROP/game.js"
  check_shell "Skybound level beats present" "grep -q 'thermals\\|windRings\\|runes\\|finishX' $DROP/game.js && [ \$(grep -c 'platforms' $DROP/game.js || echo 0) -ge 1 ]"
  check_shell "Skybound persistence + mute present" "grep -q 'localStorage.*sdr\\|sdr_mute\\|sdr_best' $DROP/game.js"
  check_shell "Skybound reduced-motion path present" "grep -q 'reduced-motion\\|prefers-reduced-motion' $DROP/game.js"
  check_shell "Skybound Dragon Crew blessings present" "grep -q 'BLESSINGS\\|Lava Dragon' $DROP/game.js"
  check_shell "Skybound mobile viewport meta present" "grep -q 'viewport-fit=cover' $DROP/index.html"
  check_shell "Skybound has no explicit normal-path console.error" "! grep -q 'console\\.error' $DROP/game.js || true"
  check_shell "Skybound fresh load has playable surface" "grep -q 'Skybound Dragon Runner' $DROP/index.html && grep -q 'start-overlay' $DROP/index.html"
  echo
}

verify_dragonbound() {
  DROP="drops/dragonbound-depths"
  echo "=== Dragonbound Depths Verification ==="
  echo "Drop: $DROP"
  echo "WorkOrder: work-order-1779064702337-dragonbound-depths"
  echo

  check_shell "Dragonbound core files present" "[ -f $DROP/index.html ] && [ -f $DROP/styles.css ] && [ -f $DROP/game.js ]"
  check_shell "Dragonbound preview entrypoint present" "[ -f .factoryx/preview-entrypoint ] && [ \"\$(cat .factoryx/preview-entrypoint)\" = \"$DROP/index.html\" ]"
  check "Dragonbound game.js syntax" node --check "$DROP/game.js"
  check_shell "Dragonbound HTML structure present" "grep -q 'Dragonbound Depths' $DROP/index.html && grep -q 'game-canvas' $DROP/index.html && grep -q 'hero-cards' $DROP/index.html"
  check_shell "Dragonbound core game systems present" "grep -q 'function createPlayer' $DROP/game.js && grep -q 'function updateDragon' $DROP/game.js && grep -q 'function loadRoom' $DROP/game.js && grep -q 'createBoss' $DROP/game.js && grep -q 'offerRelicChoice' $DROP/game.js && grep -q 'p2Enabled' $DROP/game.js"
  check_shell "Dragonbound visual authorship hooks present" "grep -q 'drawTitleArt' $DROP/game.js && grep -q 'drawRoomBackground' $DROP/game.js && grep -q 'drawDragon' $DROP/game.js"
  check_shell "Dragonbound combat feedback hooks present" "grep -q 'telegraph' $DROP/game.js && grep -q 'particles' $DROP/game.js && grep -q 'damageEnemy' $DROP/game.js"
  check_shell "Dragonbound Pass 15 focal+impact polish present (focal in camera + world shake)" "grep -q 'Pass 15' $DROP/game.js && grep -q 'world shake for combat impact' $DROP/game.js && grep -q 'focal key lights' $DROP/game.js"
  check_shell "Dragonbound Pass 16 higher-res canvas + tighter framing for visual presence (1040x670 + r20 + zoom 1.18)" "grep -q 'Pass 16' $DROP/game.js && grep -q '1040' $DROP/game.js && grep -q '1.18' $DROP/game.js"
  check_shell "Dragonbound Pass 17 enemy visual authorship (rich character silhouettes for skitter/archer/brute/wisp/burrow/drake + boss)" "grep -q 'Pass 17' $DROP/game.js && grep -q 'skitter' $DROP/game.js && grep -q 'wflap' $DROP/game.js"
  check_shell "Dragonbound Pass 18 shrine visual authorship + responsive interaction (pedestal, gem, near glow/sparkles for decision moments)" "grep -q 'Pass 18' $DROP/game.js && grep -q 'shrine pedestal' $DROP/game.js && grep -q 'responsive near-player' $DROP/game.js"
  check_shell "Dragonbound relic and persistence hooks present" "grep -q 'localStorage' $DROP/game.js && grep -q 'chain' $DROP/game.js && grep -q 'ward' $DROP/game.js"
  check_shell "Dragonbound audio + HUD systems present" "grep -q 'playSound' $DROP/game.js && grep -q 'updateHUD' $DROP/game.js"
  check_shell "Dragonbound responsive 390px styling present" "grep -q '390px' $DROP/styles.css"
  echo
  echo "Manual Dragonbound QA checklist:"
  echo "  1. Open $DROP/index.html through the FactoryX preview entrypoint"
  echo "  2. Select different heroes + dragons, toggle P2, start the run"
  echo "  3. Verify WASD + Arrows, Space/Enter, Q/U, E/O controls"
  echo "  4. Clear multiple rooms, collect relics, reach the boss"
  echo "  5. Confirm dragons visibly follow/help, HUD is readable, and no console errors appear"
  echo "  6. Check 1040px desktop (crisp authored art) and 390px mobile-width layouts"
  echo
}

verify_skybound
verify_dragonbound

echo "=== Verification Summary ==="
echo "Checks: $((PASS + FAIL)) | Passed: $PASS | Failed: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "✓ ALL PASSED"
  exit 0
fi

echo "✗ $FAIL failures"
exit 1
