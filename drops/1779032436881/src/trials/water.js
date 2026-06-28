/**
 * Water Dragon - River of Memory
 * 5x5 rotatable channel tiles. Tap/click/keyboard to rotate. Connect spring (top-left) to basin (bottom-right).
 * Valid flow animates; success adds moving water to sanctuary.
 */
(function (global) {
  const SIZE = 5;
  let grid = [];
  let onCompleteRef = null;
  let selected = null;

  // tile types: 0=straight horz, 1=straight vert, 2=L, 3=T, 4=cross, 5=empty blocker
  // rotation 0-3
  function randomTile() {
    return { type: Math.floor(Math.random() * 4), rot: Math.floor(Math.random() * 4) };
  }

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    // seeded nice starting layout (solvable, not too hard)
    grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        row.push({ type: (x + y) % 4, rot: (x * 2 + y) % 4 });
      }
      grid.push(row);
    }
    // simple clear path: horz across top row, L-turn at top-right, then vert down right column to basin.
    // Player rotates the L once to connect flow. Other tiles provide visual variety + extra paths once unlocked.
    grid[0][0] = { type: 0, rot: 0 }; // EW
    grid[0][1] = { type: 0, rot: 0 }; // EW
    grid[0][2] = { type: 0, rot: 0 }; // EW
    grid[0][3] = { type: 0, rot: 0 }; // EW
    grid[0][4] = { type: 2, rot: 0 }; // L (needs +1 rot to open S+W for turn)
    grid[1][4] = { type: 1, rot: 1 }; // NS
    grid[2][4] = { type: 1, rot: 1 }; // NS
    grid[3][4] = { type: 1, rot: 1 }; // NS
    grid[4][4] = { type: 1, rot: 1 }; // NS into basin
    // decorative side tiles (cross or T for interest, do not block)
    grid[1][0] = { type: 4, rot: 0 };
    grid[2][0] = { type: 3, rot: 0 };
    grid[1][1] = { type: 2, rot: 2 };
    grid[3][1] = { type: 0, rot: 1 };
    grid[4][0] = { type: 2, rot: 1 };
    grid[1][2] = { type: 1, rot: 0 };
    grid[2][1] = { type: 4, rot: 0 };
    grid[3][2] = { type: 2, rot: 3 };
    grid[4][1] = { type: 0, rot: 0 };
    grid[2][3] = { type: 3, rot: 2 };
    grid[3][3] = { type: 0, rot: 1 };
    grid[4][2] = { type: 1, rot: 1 };
    grid[4][3] = { type: 2, rot: 2 };

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:2px 0 8px;color:#9aa8b8;font-size:13px;">Tap a pipe or use arrows + <strong>Space/Enter</strong> to rotate. Turn the top-right L once to connect spring → basin. Blue = flowing.</p>
        <div id="flow-grid" tabindex="0" aria-label="River of Memory pipe grid. Arrow keys move selection. Space or Enter rotates the selected pipe."></div>
        <div id="water-rotate-hint" style="margin:6px 0 2px;font-size:12px;color:#f4d9a8;opacity:0.9;">Selected pipe glows. Press Space or Enter (or click) to rotate it.</div>
        <button id="water-rotate-btn" class="ctrl" style="margin-top:4px;min-width:120px;min-height:44px;">Rotate Selected</button>
      </div>
    `;

    renderGrid(container);

    const gridEl = container.querySelector('#flow-grid');
    const rotateBtn = container.querySelector('#water-rotate-btn');

    // === Material redesign for reliable rotate with Enter/Space (addresses feedback directly) ===
    // Single source: selection is authoritative. Space/Enter (from grid or global-in-overlay) rotates selected.
    // Click/tap tile always selects + rotates (primary verb). Large 48px targets.
    // Arrows always move sel when grid focused or overlay open for this trial. No doc-global pollution.
    const onGridKey = (e) => {
      if (e.key === 'ArrowLeft') { moveSel(-1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { moveSel(1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { moveSel(0, -1); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { moveSel(0, 1); e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (selected) rotate(selected.x, selected.y, container);
      }
    };
    if (gridEl) {
      gridEl.addEventListener('keydown', onGridKey, false);
      container._waterGridKey = onGridKey;
    }

    // Dedicated large button for discoverability (touch + mouse)
    if (rotateBtn) {
      rotateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (selected) rotate(selected.x, selected.y, container);
        // keep focus on grid for continued kb
        if (gridEl) gridEl.focus();
      });
    }

    // Default selection on the solvable L piece; focus grid immediately so arrows+space work out of the box
    if (!selected) {
      selected = { x: 4, y: 0 };
    }
    renderGrid(container);
    setTimeout(() => { if (gridEl) gridEl.focus(); }, 30);

    // Also allow Space/Enter from the panel container as fallback (some focus edge cases)
    const panelKey = (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && document.activeElement && document.activeElement.closest('#trial-content')) {
        // only if not already handled by grid or button
        if (e.target === gridEl || (rotateBtn && e.target === rotateBtn)) return;
        if (selected) {
          e.preventDefault();
          rotate(selected.x, selected.y, container);
        }
      }
    };
    container.addEventListener('keydown', panelKey, true);
    container._waterPanelKey = panelKey;

    return () => {
      if (gridEl && container._waterGridKey) gridEl.removeEventListener('keydown', container._waterGridKey, false);
      if (container._waterPanelKey) container.removeEventListener('keydown', container._waterPanelKey, true);
    };
  }

  function renderGrid(container) {
    const gridEl = container.querySelector('#flow-grid');
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 48px)`;
    gridEl.style.gap = '4px';
    gridEl.style.justifyContent = 'center';

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = grid[y][x];
        const div = document.createElement('div');
        div.className = 'flow-tile';
        div.dataset.x = x;
        div.dataset.y = y;
        // No per-tile tabindex to keep focus model simple: grid owns arrows+space; click always works.
        div.setAttribute('aria-label', `Pipe ${x},${y} rot ${tile.rot}`);
        div.textContent = tileSymbol(tile);
        div.style.transform = `rotate(${((tile.rot % 4) * 90)}deg)`;
        if (selected && selected.x === x && selected.y === y) {
          div.style.outline = '3px solid #f4d9a8';
          div.style.boxShadow = '0 0 0 5px rgba(244,217,168,0.22)';
          div.style.borderColor = '#f4d9a8';
          div.style.zIndex = '2';
        }

        const isFlowing = isConnected(x, y);
        if (isFlowing) {
          div.classList.add('valid');
          div.style.background = '#0a2533';
        }

        // Primary: click/tap always selects + rotates (core verb)
        div.addEventListener('click', (ev) => {
          ev.preventDefault();
          select(x, y, container);
          rotate(x, y, container);
        });
        // Pointer down for immediate visual press feel
        div.addEventListener('pointerdown', () => {
          div.style.transform = `rotate(${((tile.rot % 4) * 90)}deg) scale(0.92)`;
        });
        div.addEventListener('pointerup', () => {
          if (container) renderGrid(container);
        });

        gridEl.appendChild(div);
      }
    }

    // spring + basin labels (override, keep upright)
    const first = gridEl.children[0];
    if (first) { first.textContent = '◉'; first.style.transform = 'none'; }
    const last = gridEl.children[SIZE*SIZE-1];
    if (last) { last.textContent = '◈'; last.style.transform = 'none'; }
  }

  function getContainer() {
    const g = document.querySelector('#flow-grid');
    if (!g) return null;
    return g.closest('#trial-content') || g.parentElement || g;
  }

  function tileSymbol(t) {
    // base glyph for rot=0 of each type; actual facing shown via CSS rotate on the tile
    return ['─','│','└','┬','┼'][t.type] || '·';
  }

  function rotate(x, y, container) {
    grid[y][x].rot = (grid[y][x].rot + 1) % 4;
    if (window.SanctuaryAudio && window.SanctuaryAudio.playRotateClick) window.SanctuaryAudio.playRotateClick();
    if (container) {
      // visual spin feedback for the rotated tile
      const g = container.querySelector('#flow-grid');
      if (g) {
        const tiles = g.children;
        for (let i = 0; i < tiles.length; i++) {
          const t = tiles[i];
          if (t.dataset && +t.dataset.x === x && +t.dataset.y === y) {
            t.classList.add('spin');
            // force reflow then apply the new rotation in next frame
            void t.offsetWidth;
            setTimeout(() => {
              if (t && t.parentNode) {
                t.style.transform = `rotate(${((grid[y][x].rot % 4) * 90)}deg)`;
                t.classList.remove('spin');
                renderGrid(container);
              }
            }, 140);
            break;
          }
        }
      } else {
        renderGrid(container);
      }
    }
    checkWin(container);
  }

  function select(x, y, container) {
    selected = { x, y };
    if (container) renderGrid(container);
  }

  function moveSel(dx, dy) {
    if (!selected) selected = { x: 0, y: 0 };
    selected.x = Math.max(0, Math.min(SIZE-1, selected.x + dx));
    selected.y = Math.max(0, Math.min(SIZE-1, selected.y + dy));
    const c = getContainer();
    if (c) renderGrid(c);
  }

  // Real pipe connectivity: each tile has openings based on type+rot; flood only through matching adjacent openings.
  function getOpenings(type, rot) {
    const r = ((rot % 4) + 4) % 4;
    switch (type) {
      case 0: // straight (horz base)
      case 1: // straight (vert base) - both are straights, rot decides axis
        return (r % 2 === 0) ? ['E','W'] : ['N','S'];
      case 2: // L corner
        return [ ['S','E'], ['S','W'], ['N','W'], ['N','E'] ][r];
      case 3: // T junction
        return [ ['N','E','W'], ['E','S','W'], ['S','W','N'], ['W','N','E'] ][r];
      case 4: // cross
        return ['N','S','E','W'];
      default:
        return [];
    }
  }

  const DXY = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
  const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

  function isConnected(tx, ty) {
    const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const q = [[0, 0]];
    visited[0][0] = true;

    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) return true;

      const opens = getOpenings(grid[y][x].type, grid[y][x].rot);
      for (const dir of opens) {
        const [dx, dy] = DXY[dir];
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || visited[ny][nx]) continue;
        // neighbor must have the opposite opening
        const nOpens = getOpenings(grid[ny][nx].type, grid[ny][nx].rot);
        if (nOpens.includes(OPP[dir])) {
          visited[ny][nx] = true;
          q.push([nx, ny]);
        }
      }
    }
    return false;
  }

  function checkWin(container) {
    const won = isConnected(SIZE-1, SIZE-1);
    if (won && onCompleteRef) {
      if (window.SanctuaryAudio && window.SanctuaryAudio.playWaterFlow) window.SanctuaryAudio.playWaterFlow(true);
      setTimeout(() => {
        if (onCompleteRef) onCompleteRef();
      }, 420);
    } else if (container && window.SanctuaryAudio && window.SanctuaryAudio.playWaterFlow) {
      // light tick when a rotate makes new pipes valid (gentle progress feel)
      // only if at least the first few are flowing
      if (isConnected(1,0) || isConnected(2,0)) window.SanctuaryAudio.playWaterFlow(false);
    }
    if (container) renderGrid(container);
  }

  function cleanup(container) {
    if (container && container._waterKey) document.removeEventListener('keydown', container._waterKey);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.water = { init, cleanup };
})(window);

