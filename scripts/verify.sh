#!/bin/sh
# Dragonbound Depths — FactoryX verification
# Run from repo root. Exits non-zero on hard failure.

set -e

echo "=== Dragonbound Depths Verification ==="
echo "WorkOrder: work-order-1779064702337-dragonbound-depths"
echo "Artifact: drops/dragonbound-depths/"
echo

# 1. Files exist
test -f drops/dragonbound-depths/index.html || { echo "FAIL: index.html missing"; exit 1; }
test -f drops/dragonbound-depths/styles.css || { echo "FAIL: styles.css missing"; exit 1; }
test -f drops/dragonbound-depths/game.js || { echo "FAIL: game.js missing"; exit 1; }
echo "✓ Core files present"

# 2. Preview entrypoint
test -f .factoryx/preview-entrypoint || { echo "FAIL: .factoryx/preview-entrypoint missing"; exit 1; }
ENTRY=$(cat .factoryx/preview-entrypoint)
echo "✓ Preview entrypoint: $ENTRY"
if [ "$ENTRY" != "drops/dragonbound-depths/index.html" ]; then
  echo "WARN: preview-entrypoint does not point to expected path"
fi

# 3. JS syntax (node --check)
node --check drops/dragonbound-depths/game.js
echo "✓ game.js syntax valid"

# 4. HTML structure sanity
grep -q 'Dragonbound Depths' drops/dragonbound-depths/index.html || { echo "FAIL: title not in HTML"; exit 1; }
grep -q 'game-canvas' drops/dragonbound-depths/index.html || { echo "FAIL: canvas missing"; exit 1; }
grep -q 'hero-cards' drops/dragonbound-depths/index.html || { echo "FAIL: hero select missing"; exit 1; }
echo "✓ HTML structure looks good"

# 5. Key acceptance markers in JS (no fake systems)
grep -q 'function createPlayer' drops/dragonbound-depths/game.js || { echo "FAIL: player factory missing"; exit 1; }
grep -q 'function updateDragon' drops/dragonbound-depths/game.js || { echo "FAIL: dragon AI missing"; exit 1; }
grep -q 'function loadRoom' drops/dragonbound-depths/game.js || { echo "FAIL: room loader missing"; exit 1; }
grep -q 'createBoss' drops/dragonbound-depths/game.js || { echo "FAIL: boss missing"; exit 1; }
grep -q 'offerRelicChoice' drops/dragonbound-depths/game.js || { echo "FAIL: relic progression missing"; exit 1; }
grep -q 'p2Enabled' drops/dragonbound-depths/game.js || { echo "FAIL: co-op flag missing"; exit 1; }
echo "✓ Core systems present (heroes, dragons, rooms, boss, relics, co-op)"

# 6. Art / no slop markers
grep -q 'drawTitleArt' drops/dragonbound-depths/game.js || { echo "FAIL: title art missing"; exit 1; }
grep -q 'drawRoomBackground' drops/dragonbound-depths/game.js || { echo "FAIL: themed rooms missing"; exit 1; }
grep -q 'drawDragon' drops/dragonbound-depths/game.js || { echo "FAIL: dragon rendering missing"; exit 1; }
echo "✓ Visual authorship hooks present"

# 7. Audio + HUD + responsive notes
grep -q 'playSound' drops/dragonbound-depths/game.js || { echo "FAIL: audio missing"; exit 1; }
grep -q 'updateHUD' drops/dragonbound-depths/game.js || { echo "FAIL: HUD update missing"; exit 1; }
grep -q '390px' drops/dragonbound-depths/styles.css || echo "NOTE: consider explicit 390px media query in future pass"
echo "✓ Feedback systems present"

echo
echo "=== Verification Summary ==="
echo "PASS: 14+ structural checks (manual browser QA still required)"
echo "Manual QA checklist for reviewer:"
echo "  1. Open drops/dragonbound-depths/index.html directly"
echo "  2. Select different heroes + dragons, toggle P2, hit Start"
echo "  3. WASD + Arrows control two characters (or solo)"
echo "  4. Attack (Space/Enter), specials (Q/U), dash (E/O) respond"
echo "  5. Move through 3+ connected rooms, collect relics at shrines"
echo "  6. Dragon follows, uses breath/pulse, contributes visibly"
echo "  7. Boss fight triggers, multiple patterns"
echo "  8. HUD readable, minimap updates, no overlap at 960px and 390px viewport"
echo "  9. Pause (Esc), mute, victory/defeat summaries work"
echo " 10. No console errors, 60fps feel, art reads as authored (not placeholder)"
echo
echo "If all manual items pass and this script is green → ready for PR update."
echo "Next pass: deeper enemy variety, more relic effects, camera edge polish, mobile touch for solo."
