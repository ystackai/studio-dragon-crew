/**
 * Water Dragon - River of Memory (reworked for reliable rotate)
 * 5x5 rotatable channel tiles. 
 * PRIMARY: Click any tile to rotate it. 
 * KEYBOARD (reliable): focus the grid, Arrow keys move bright selection ring, Space or Enter rotates the SELECTED tile.
 * Also supports native Tab to a tile + Space/Enter on it.
 * Clear seeded near-solved layout: the top-right L is the obvious key; one rotate connects spring -> basin.
 * Live blue flow on valid segments. Success blooms water in sanctuary.
 */
(function (global) {
  const SIZE = 5;
  let grid = [];
  let onCompleteRef = null;
  let selected = { x: 4, y: 0 };

  // Tile types for rotation: 0=EW, 1=NS, 2=L, 3=T, 4=Cross. 5 unused.
  function init(container, onComplete) {
    onCompleteRef = onComplete;
    selected = { x: 4, y: 0 };

    // Clear, near-solved labyrinth: straight along top, one L at (4,0) that needs +1 rot to turn down right column.
    // All other tiles are decorative but some may join once main path is made.
    grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        row.push({ type: (x + y) % 4, rot: (x + y * 3) % 4 });
      }
      grid.push(row);
    }
    // Main path (almost complete)
    grid[0][0] = { type: 0, rot: 0 }; // ─
    grid[0][1] = { type: 0, rot: 0 };
    grid[0][2] = { type: 0, rot: 0 };
    grid[0][3] = { type: 0, rot: 0 };
    grid[0][4] = { type: 2, rot: 0 }; // L needs +1 -> opens south+west for the corner
    grid[1][4] = { type: 1, rot: 1 }; // │
    grid[2][4] = { type: 1, rot: 1 };
    grid[3][4] = { type: 1, rot: 1 };
    grid[4][4] = { type: 1, rot: 1 }; // into basin

    // Decorative but non-blocking variety (player can explore)
    grid[1][0] = { type: 4, rot: 0 };
    grid[2][0] = { type: 3, rot: 1 };
    grid[3][0] = { type: 2, rot: 2 };
    grid[4][0] = { type: 0, rot: 1 };
    grid[1][1] = { type: 2, rot: 3 };
    grid[2][1] = { type: 4, rot: 2 };
    grid[3][1] = { type: 1, rot: 0 };
    grid[4][1] = { type: 2, rot: 1 };
    grid[1][2] = { type: 0, rot: 0 };
    grid[2][2] = { type: 3, rot: 0 };
    grid[3][2] = { type: 2, rot: 0 };
    grid[4][2] = { type: 1, rot: 1 };
    grid[1][3] = { type: 1, rot: 1 };
    grid[2][3] = { type: 0, rot: 1 };
    grid[3][3] = { type: 4, rot: 0 };
    grid[4][3] = { type: 2, rot: 3 };

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:4px 0 10px;color:#9aa8b8;font-size:13px;line-height:1.35;">
          <strong>Connect the spring (top-left) to the basin (bottom-right).</strong><br>
          Click any pipe to rotate. Or: focus the grid, use arrows to highlight, then press <strong>Space or Enter</strong> to rotate the highlighted piece.
        </p>
        <div id="flow-grid" tabindex="0" role="grid" aria-label="5 by 5 pipe labyrinth. Arrow keys choose a pipe. Space or Enter rotates it."></div>
        <div id="water-hint" style="margin-top:10px;font-size:12px;color:#7fd3f0;opacity:0.85;">
          The L at top-right corner is one rotate from completing the path. Rotate it with Space/Enter or click.
        </div>
        <button id="water-rotate-btn" class="ctrl" style="margin-top:8px;">Rotate Highlighted (Space)</button>
      </div>
    `;

    renderGrid(container);

    const gridEl = container.querySelector('#flow-grid');
    const rotateBtn = container.querySelector('#water-rotate-btn');

    // === ROBUST KEYBOARD (the main fix per feedback) ===
    // Single handler attached to grid. Always acts on `selected`.
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { moveSel(-1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { moveSel(1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { moveSel(0, -1); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { moveSel(0, 1); e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (selected) {
          rotate(selected.x, selected.y, container);
        }
      }
    };
    if (gridEl) {
      gridEl.addEventListener('keydown', onKey);
      container._waterKey = onKey;
      // immediate focus so arrows+space work the moment trial opens
      setTimeout(() => { try { gridEl.focus(); } catch(_) {} }, 30);
    }

    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        if (selected) rotate(selected.x, selected.y, container);
      });
    }

    // Default highlight the critical L
    selected = { x: 4, y: 0 };
    renderGrid(container);

    // Pointer: click rotates (and selects)
    // (handlers attached fresh in renderGrid)

    return () => {
      if (gridEl && container._waterKey) {
        gridEl.removeEventListener('keydown', container._waterKey);
      }
    };
  }

  function renderGrid(container) {
    const gridEl = container.querySelector('#flow-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 52px)`;
    gridEl.style.gap = '4px';
    gridEl.style.justifyContent = 'center';
    gridEl.style.padding = '6px';
    gridEl.style.background = 'rgba(10,20,30,0.6)';
    gridEl.style.borderRadius = '8px';

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = grid[y][x];
        const div = document.createElement('div');
        div.className = 'flow-tile';
        div.dataset.x = x;
        div.dataset.y = y;
        div.setAttribute('tabindex', '0');
        div.setAttribute('role', 'gridcell');
        div.setAttribute('aria-label', `Pipe ${x},${y} rotation ${tile.rot}`);

        // nicer glyphs
        div.textContent = tileSymbol(tile);
        div.style.width = '52px';
        div.style.height = '52px';
        div.style.fontSize = '26px';
        div.style.lineHeight = '52px';
        div.style.textAlign = 'center';
        div.style.border = '2px solid #2a3f55';
        div.style.borderRadius = '6px';
        div.style.background = '#0f1f2e';
        div.style.color = '#c8d6e5';
        div.style.userSelect = 'none';
        div.style.transition = 'transform 120ms ease, box-shadow 80ms ease, border-color 80ms ease';
        div.style.transform = `rotate(${ (tile.rot % 4) * 90 }deg)`;

        const isSel = selected && selected.x === x && selected.y === y;
        if (isSel) {
          div.style.borderColor = '#f4d9a8';
          div.style.boxShadow = '0 0 0 4px rgba(244,217,168,0.28)';
          div.style.background = '#162a3a';
        }

        const flowing = isConnected(x, y);
        if (flowing) {
          div.classList.add('valid');
          div.style.background = '#0c2b3a';
          div.style.borderColor = '#5fb8d9';
          div.style.color = '#9ad4ee';
        }

        // primary action: click rotates (and selects)
        div.addEventListener('click', (ev) => {
          ev.preventDefault();
          select(x, y, container);
          rotate(x, y, container);
        });

        // native keyboard on the cell itself (Tab path)
        div.addEventListener('keydown', (ev) => {
          if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            ev.stopPropagation();
            select(x, y, container);
            rotate(x, y, container);
          }
        });

        gridEl.appendChild(div);
      }
    }

    // Override labels for source and sink (keep upright)
    const tiles = gridEl.children;
    if (tiles[0]) { tiles[0].textContent = '◉'; tiles[0].style.transform = 'none'; tiles[0].style.fontSize = '20px'; }
    const lastIdx = SIZE*SIZE - 1;
    if (tiles[lastIdx]) { tiles[lastIdx].textContent = '◈'; tiles[lastIdx].style.transform = 'none'; tiles[lastIdx].style.fontSize = '20px'; }
  }

  function tileSymbol(t) {
    return ['─','│','└','┬','┼'][t.type] || '·';
  }

  function getContainer() {
    return document.querySelector('#flow-grid') || document.querySelector('#trial-content');
  }

  function rotate(x, y, container) {
    grid[y][x].rot = (grid[y][x].rot + 1) % 4;
    // play generated or procedural asset
    if (window.SanctuaryAudio && window.SanctuaryAudio.playRotate) {
      window.SanctuaryAudio.playRotate();
    }
    if (container) renderGrid(container);
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

  function getOpenings(type, rot) {
    const r = ((rot % 4) + 4) % 4;
    if (type === 0 || type === 1) {
      return (r % 2 === 0) ? ['E','W'] : ['N','S'];
    }
    if (type === 2) { // L
      return [ ['S','E'], ['S','W'], ['N','W'], ['N','E'] ][r];
    }
    if (type === 3) { // T
      return [ ['N','E','W'], ['E','S','W'], ['S','W','N'], ['W','N','E'] ][r];
    }
    if (type === 4) {
      return ['N','S','E','W'];
    }
    return [];
  }

  const DXY = { N:[0,-1], S:[0,1], E:[1,0], W:[-1,0] };
  const OPP = { N:'S', S:'N', E:'W', W:'E' };

  function isConnected(tx, ty) {
    const visited = Array.from({length:SIZE}, () => Array(SIZE).fill(false));
    const q = [[0,0]];
    visited[0][0] = true;
    while (q.length) {
      const [x,y] = q.shift();
      if (x === tx && y === ty) return true;
      const opens = getOpenings(grid[y][x].type, grid[y][x].rot);
      for (const dir of opens) {
        const [dx,dy] = DXY[dir];
        const nx = x + dx, ny = y + dy;
        if (nx<0 || nx>=SIZE || ny<0 || ny>=SIZE || visited[ny][nx]) continue;
        const nops = getOpenings(grid[ny][nx].type, grid[ny][nx].rot);
        if (nops.includes(OPP[dir])) {
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
      if (window.SanctuaryAudio && window.SanctuaryAudio.playWaterFlow) {
        window.SanctuaryAudio.playWaterFlow(true);
      }
      setTimeout(() => { if (onCompleteRef) onCompleteRef(); }, 380);
    } else if (container) {
      // light progress tick
      if (isConnected(2,0) && window.SanctuaryAudio && window.SanctuaryAudio.playWaterFlow) {
        window.SanctuaryAudio.playWaterFlow(false);
      }
      renderGrid(container);
    }
  }

  function cleanup(container) {
    const g = container && container.querySelector && container.querySelector('#flow-grid');
    if (g && container._waterKey) g.removeEventListener('keydown', container._waterKey);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.water = { init, cleanup };
})(window);
