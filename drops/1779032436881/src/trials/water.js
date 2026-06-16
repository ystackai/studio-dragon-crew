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
        <p style="margin:2px 0 8px;color:#9aa8b8;font-size:13px;">Tap or select tiles to rotate pipes. Turn the L (top-right) to connect spring to basin. Blue = flowing.</p>
        <div id="flow-grid" tabindex="0" aria-label="Pipe grid 5 by 5. Use arrows to move, Space or Enter to rotate focused pipe."></div>
        <div style="margin-top:8px;font-size:11px;color:#4fb3d8;opacity:0.75;">Keyboard: Tab/arrows select, Space/Enter rotates focused tile. One turn solves the L corner.</div>
      </div>
    `;

    renderGrid(container);

    const gridEl = container.querySelector('#flow-grid');

    // Robust scoped + global keyboard: arrows always move selection; Space/Enter rotates the selected (or focused tile)
    const key = (e) => {
      const isSpaceEnter = (e.key === ' ' || e.key === 'Enter');
      // If a flow-tile is focused, let its own key handler also fire (it will call rotate); we still allow global as safety
      if (isSpaceEnter && selected) {
        e.preventDefault();
        const c = getContainer();
        rotate(selected.x, selected.y, c);
        return;
      }
      if (e.key === 'ArrowLeft') { moveSel(-1, 0); e.preventDefault(); }
      if (e.key === 'ArrowRight') { moveSel(1, 0); e.preventDefault(); }
      if (e.key === 'ArrowUp') { moveSel(0, -1); e.preventDefault(); }
      if (e.key === 'ArrowDown') { moveSel(0, 1); e.preventDefault(); }
    };
    // attach to both document (for when focus is on body) and gridEl for better scoping
    document.addEventListener('keydown', key, true);
    if (gridEl) gridEl.addEventListener('keydown', key);
    container._waterKey = key;
    container._waterGridKey = key;

    // ensure a useful default selection on the L tile that needs the one rotate
    if (!selected) {
      selected = { x: 4, y: 0 };
      renderGrid(container);
    }
    // focus the grid for immediate keyboard use
    setTimeout(() => { if (gridEl) gridEl.focus(); }, 30);

    return () => {
      document.removeEventListener('keydown', key, true);
      if (gridEl && container._waterGridKey) gridEl.removeEventListener('keydown', container._waterGridKey);
    };
  }

  function renderGrid(container) {
    const gridEl = container.querySelector('#flow-grid');
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 42px)`;

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = grid[y][x];
        const div = document.createElement('div');
        div.className = 'flow-tile';
        div.dataset.x = x;
        div.dataset.y = y;
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Pipe at ${x},${y}, rot ${tile.rot}`);
        div.textContent = tileSymbol(tile);
        // visible rotation via CSS (styles already have transition)
        div.style.transform = `rotate(${((tile.rot % 4) * 90)}deg)`;
        if (selected && selected.x === x && selected.y === y) {
          div.style.outline = '2px solid #f4d9a8';
          div.style.boxShadow = '0 0 0 1px rgba(244,217,168,0.3)';
        }

        const isFlowing = isConnected(x, y);
        if (isFlowing) {
          div.classList.add('valid');
          div.style.background = '#0a2533';
        }

        div.addEventListener('click', () => {
          select(x, y, container);
          rotate(x, y, container);
        });
        div.addEventListener('keydown', (ev) => {
          if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            ev.stopPropagation();
            select(x, y, container);
            rotate(x, y, container);
          } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
            // allow arrow nav to bubble to global handler for selection move
          }
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
    if (isConnected(SIZE-1, SIZE-1) && onCompleteRef) {
      setTimeout(() => {
        if (onCompleteRef) onCompleteRef();
      }, 420);
    }
    if (container) renderGrid(container);
  }

  function cleanup(container) {
    if (container && container._waterKey) document.removeEventListener('keydown', container._waterKey);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.water = { init, cleanup };
})(window);

