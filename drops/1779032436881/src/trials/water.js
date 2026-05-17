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
    // force a connectable path with some straights
    grid[0][0] = { type: 0, rot: 0 }; // horz out of spring
    grid[0][1] = { type: 2, rot: 3 };
    grid[1][1] = { type: 1, rot: 0 };
    grid[2][1] = { type: 3, rot: 0 };
    grid[2][2] = { type: 0, rot: 0 };
    grid[3][2] = { type: 2, rot: 1 };
    grid[4][2] = { type: 1, rot: 0 };
    grid[4][3] = { type: 0, rot: 0 };
    grid[4][4] = { type: 1, rot: 0 }; // into basin

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:2px 0 8px;color:#9aa8b8;font-size:13px;">Tap tiles to rotate pipes. Connect the spring (top-left) to the basin (bottom-right). Blue = flowing.</p>
        <div id="flow-grid"></div>
        <div style="margin-top:8px;font-size:11px;color:#4fb3d8;opacity:0.75;">Keyboard: Tab to grid, arrows move, Space/Enter rotates selected.</div>
      </div>
    `;

    renderGrid(container);

    // global keyboard for accessibility
    const key = (e) => {
      if (!selected) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        rotate(selected.x, selected.y);
      }
      if (e.key === 'ArrowLeft') { moveSel(-1, 0); e.preventDefault(); }
      if (e.key === 'ArrowRight') { moveSel(1, 0); e.preventDefault(); }
      if (e.key === 'ArrowUp') { moveSel(0, -1); e.preventDefault(); }
      if (e.key === 'ArrowDown') { moveSel(0, 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', key);
    container._waterKey = key;

    return () => { document.removeEventListener('keydown', key); };
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
        div.setAttribute('aria-label', `Pipe at ${x},${y}`);
        div.textContent = tileSymbol(tile);
        if (selected && selected.x === x && selected.y === y) div.style.outline = '2px solid #f4d9a8';

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
            select(x, y, container);
            rotate(x, y, container);
          }
        });
        gridEl.appendChild(div);
      }
    }

    // spring + basin labels
    const first = gridEl.children[0];
    if (first) first.textContent = '◉';
    const last = gridEl.children[SIZE*SIZE-1];
    if (last) last.textContent = '◈';
  }

  function tileSymbol(t) {
    const s = ['─','│','└','┬','┼'][t.type] || '·';
    const rot = t.rot % 4;
    return ['─','│','└','┬','┼'][t.type] || '·'; // simple, rotation visual via class later if wanted
  }

  function rotate(x, y, container) {
    grid[y][x].rot = (grid[y][x].rot + 1) % 4;
    // re-render
    if (container) renderGrid(container);
    checkWin(container);
  }

  function select(x, y, container) {
    selected = { x, y };
    renderGrid(container);
  }

  function moveSel(dx, dy) {
    if (!selected) selected = { x: 0, y: 0 };
    selected.x = Math.max(0, Math.min(SIZE-1, selected.x + dx));
    selected.y = Math.max(0, Math.min(SIZE-1, selected.y + dy));
    // find container and re-render (hacky but works in trial)
    const g = document.querySelector('#flow-grid');
    if (g) {
      // re-render from parent trial
      const c = g.closest('#trial-content');
      if (c) renderGrid({ querySelector: (s) => c.querySelector(s) });
    }
  }

  // Simple connectivity check: flood from (0,0) using current rotations (very forgiving)
  function isConnected(tx, ty) {
    const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const q = [[0, 0]];
    visited[0][0] = true;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) return true;

      const t = grid[y][x];
      // crude: any pipe can send to neighbors if not blocker
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || visited[ny][nx]) continue;
        // accept most connections
        if (grid[ny][nx].type !== 5) {
          visited[ny][nx] = true;
          q.push([nx, ny]);
        }
      }
    }
    return false;
  }

  function checkWin(container) {
    // win when bottom-right is reached in flood
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

