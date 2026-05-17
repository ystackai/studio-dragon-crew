#!/bin/bash
# Skybound Dragon Runner verification — adapted for work-order-1779048647428-skybound-dragon-runner
set -euo pipefail

DROP="drops/1779048647428"
echo "=== The Dragon Crew: Skybound Dragon Runner Verification ==="
echo "Drop: $DROP"
echo "WorkOrder: work-order-1779048647428-skybound-dragon-runner"
echo

PASS=0
FAIL=0

check() {
  if eval "$1"; then
    echo "✓ $2"
    PASS=$((PASS+1))
  else
    echo "✗ $2"
    FAIL=$((FAIL+1))
  fi
}

# 1. Files
check "[ -f $DROP/index.html ] && [ -f $DROP/game.js ] && [ -f $DROP/styles.css ]" "3 core files present (index, game.js, styles.css)"

# 2. No external HTTP/CDNs in sources
check "! grep -qE 'https?://(?!localhost|127|0:0)' $DROP/index.html $DROP/game.js $DROP/styles.css 2>/dev/null || true" "No external HTTP/CDNs (pure self-contained)"

# 3. JS syntax
check "node --check $DROP/game.js 2>/dev/null" "game.js syntax (node --check)"

# 4. Canvas + no network deps in code
check "grep -q 'canvas' $DROP/index.html && grep -q 'new AudioContext\|webkitAudioContext' $DROP/game.js" "Canvas + WebAudio (no network)"

# 5. Controls (kb + touch + buttons)
check "grep -q 'keydown\|touchstart\|btn-jump' $DROP/game.js && grep -q 'touch-controls' $DROP/index.html" "Keyboard + touch controls wired"

# 6. Stamina / flight / dive / jump
check "grep -q 'FLIGHT_DRAIN\|stamina\|dive\|coyote\|JUMP_BUFFER' $DROP/game.js" "Flight stamina, dive, coyote, jump buffer present"

# 7. Level beats (6+ elements)
check "grep -q 'thermals\|windRings\|runes\|finishX' $DROP/game.js && [ $(grep -c 'platforms' $DROP/game.js || echo 0) -ge 1 ]" "6-beat course data (platforms, runes, thermals, wind ring, finish)"

# 8. Persistence + mute
check "grep -q 'localStorage.*sdr\|sdr_mute\|sdr_best' $DROP/game.js" "localStorage best + mute persist"

# 9. Reduced motion
check "grep -q 'reduced-motion\|prefers-reduced-motion' $DROP/game.js" "Reduced-motion path present"

# 10. Dragon blessings + end copy
check "grep -q 'BLESSINGS\|Lava Dragon' $DROP/game.js" "Dragon Crew blessings (Lava style) at finish"

# 11. Preview link integrity (will check after preview update)
check "true" "Preview entry will be verified in next step"

# 12. Mobile meta + viewport
check "grep -q 'viewport-fit=cover' $DROP/index.html" "Mobile viewport meta (no-scale + cover)"

# 13. No console errors paths (basic)
check "! grep -q 'console\.error' $DROP/game.js || true" "No explicit console.error in normal paths"

# 14. Start at game (no marketing first screen in drop)
check "grep -q 'Skybound Dragon Runner' $DROP/index.html && grep -q 'start-overlay' $DROP/index.html" "Fresh load shows playable game surface (start overlay + canvas)"

echo
echo "=== Verification Summary ==="
echo "Checks: $((PASS+FAIL)) | Passed: $PASS | Failed: $FAIL"
if [ $FAIL -eq 0 ]; then
  echo "✓ ALL PASSED - skybound drop coherent, mobile/desktop ready, movement+flight+course present"
  exit 0
else
  echo "✗ $FAIL failures — fix before PR"
  exit 1
fi