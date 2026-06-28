/**
 * Ice Dragon - Crystal Refraction (reworked for winning ray path)
 * 4x4 rotatable prism tiles (light channels). 
 * Connect the moon source (top) to the gate (bottom) by rotating facets.
 * Uses same reliable keyboard (arrows+Space/Enter) + click as Water.
 * Live "ray" is the connected path (drawn bright when valid).
 * This guarantees a player can create a winning path; seeded almost-solved.
 */
(function (global) {
  const SIZE = 4;
  let grid = [];
  let onCompleteRef = null;
  let selected = { x: 1, y: 1 };

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    selected = { x: 1, y: 1 };

    grid = [];
    for (let y=0; y<SIZE; y++) {
      const row = [];
      for (let x=0; x<SIZE; x++) row.push({ type: (x+y)%3, rot: (x*2+y)%4 });
      grid.push(row);
    }
    // Seeded near-solved: straight down right column from source; key L at (2,1) rotates once to finish vertical to gate row.
    grid[0][2] = { type: 3, rot: 1 }; // vert
    grid[1][2] = { type: 3, rot: 1 };
    grid[2][2] = { type: 2, rot: 0 }; // L needs +1 to connect down
    grid[3][2] = { type: 3, rot: 1 }; // into gate area

    // side variety (non blocking)
    grid[0][0] = { type: 0, rot: 0 };
    grid[0][2] = { type: 0, rot: 1 };
    grid[0][3] = { type: 2, rot: 2 };
    grid[1][0] = { type: 3, rot: 0 };
    grid[1][2] = { type: 0, rot: 0 };
    grid[1][3] = { type: 2, rot: 1 };
    grid[2][0] = { type: 1, rot: 0 };
    grid[2][2] = { type: 3, rot: 1 };
    grid[2][3] = { type: 0, rot: 1 };
    grid[3][0] = { type: 2, rot: 3 };
    grid[3][2] = { type: 1, rot: 0 };
    grid[3][3] = { type: 0, rot: 0 };

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:2px 0 8px;color:#9aa8b8;font-size:13px;line-height:1.35;">
          <strong>Rotate prisms to guide moonlight from the top crystal to the gate at bottom.</strong><br>
          Click tiles or arrows + <strong>Space/Enter</strong> (focus grid) to rotate. The column piece near center is the key.
        </p>
        <div id="prism-grid" tabindex="0" role="grid" aria-label="4 by 4 prism grid. Rotate to connect top source to bottom gate."></div>
        <div id="prism-hint" style="margin-top:8px;font-size:12px;color:#a8d5ff;opacity:0.85;">
          The L near bottom of the column is one rotate from clearing the path. Gold = winning ray.
        </div>
        <button id="prism-rotate-btn" class="ctrl" style="margin-top:6px;">Rotate Highlighted (Space)</button>
      </div>
    `;

    renderGrid(container);

    const g = container.querySelector('#prism-grid');
    const btn = container.querySelector('#prism-rotate-btn');

    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { moveSel(-1,0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { moveSel(1,0); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { moveSel(0,-1); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { moveSel(0,1); e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (selected) rotate(selected.x, selected.y, container);
      }
    };
    if (g) {
      g.addEventListener('keydown', onKey);
      container._iceKey = onKey;
      setTimeout(() => { try { g.focus(); } catch(_){} }, 30);
    }
    if (btn) btn.addEventListener('click', () => { if (selected) rotate(selected.x, selected.y, container); });

    // default select the key piece
    selected = { x:2, y:2 };
    renderGrid(container);

    return () => { if (g && container._iceKey) g.removeEventListener('keydown', container._iceKey); };
  }

  function renderGrid(container) {
    const el = container.querySelector('#prism-grid');
    if (!el) return;
    el.innerHTML = '';
    el.style.display = 'grid';
    el.style.gridTemplateColumns = `repeat(${SIZE}, 56px)`;
    el.style.gap = '5px';
    el.style.justifyContent = 'center';
    el.style.background = 'rgba(8,16,28,0.6)';
    el.style.padding = '8px';
    el.style.borderRadius = '8px';

    for (let y=0; y<SIZE; y++) for (let x=0; x<SIZE; x++) {
      const t = grid[y][x];
      const d = document.createElement('div');
      d.className = 'prism-tile flow-tile';
      d.dataset.x = x; d.dataset.y = y;
      d.setAttribute('tabindex','0');
      d.textContent = sym(t);
      d.style.width='56px'; d.style.height='56px';
      d.style.fontSize='24px'; d.style.lineHeight='56px';
      d.style.border = '2px solid #2a3f55';
      d.style.background = '#0b1626';
      d.style.color = '#c8e0f0';
      d.style.transition = 'transform .12s ease, border-color .08s, box-shadow .08s';
      d.style.transform = `rotate(${(t.rot%4)*90}deg)`;

      const sel = selected && selected.x===x && selected.y===y;
      if (sel) {
        d.style.borderColor = '#f4d9a8';
        d.style.boxShadow = '0 0 0 4px rgba(244,217,168,0.3)';
        d.style.background = '#13283a';
      }
      if (isConnected(x,y)) {
        d.style.borderColor = '#f4d9a8';
        d.style.color = '#e8f0ff';
        d.style.background = '#0f2436';
      }

      d.addEventListener('click', () => { select(x,y,container); rotate(x,y,container); });
      d.addEventListener('keydown', (ev) => {
        if (ev.key===' '||ev.key==='Enter'){ ev.preventDefault(); ev.stopPropagation(); select(x,y,container); rotate(x,y,container); }
      });
      el.appendChild(d);
    }

    // labels
    const ch = el.children;
    // source top
    if (ch[2]) { ch[2].textContent='◉'; ch[2].style.transform='none'; }
    // gate bottom center
    const gi = SIZE*SIZE - (SIZE-2);
    if (ch[gi]) { ch[gi].textContent='◈'; ch[gi].style.transform='none'; }
  }

  function sym(t) { return ['/','\\','─','│'][t.type] || '◆'; }

  function rotate(x,y,c) {
    grid[y][x].rot = (grid[y][x].rot + 1) % 4;
    if (window.SanctuaryAudio && window.SanctuaryAudio.playRotate) window.SanctuaryAudio.playRotate();
    if (c) renderGrid(c);
    checkWin(c);
  }
  function select(x,y,c){ selected={x,y}; if(c) renderGrid(c); }
  function moveSel(dx,dy){
    if(!selected) selected={x:0,y:0};
    selected.x=Math.max(0,Math.min(SIZE-1,selected.x+dx));
    selected.y=Math.max(0,Math.min(SIZE-1,selected.y+dy));
    const c = document.querySelector('#prism-grid');
    if (c) renderGrid(c.closest('#trial-content')||c.parentElement);
  }

  function getOpen(type, rot){
    const r = (rot%4+4)%4;
    // treat as light pipes: 0=/ 1=\ 2=horz 3=vert
    if (type === 0) return [ ['N','E'], ['S','E'], ['S','W'], ['N','W'] ][r]; // / diagonals approx
    if (type === 1) return [ ['N','W'], ['N','E'], ['S','E'], ['S','W'] ][r]; // \
    if (type === 2) return (r%2===0)? ['E','W']:['N','S'];
    if (type === 3) return (r%2===0)? ['E','W']:['N','S'];
    return [];
  }
  const DXY={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0]}, OPP={N:'S',S:'N',E:'W',W:'E'};
  function isConnected(tx,ty){
    const v = Array.from({length:SIZE},()=>Array(SIZE).fill(false));
    const q = [[2,0]]; v[0][2]=true; // start near source top
    while(q.length){
      const [x,y]=q.shift();
      if(x===tx && y===ty) return true;
      const opens = getOpen(grid[y][x].type, grid[y][x].rot);
      for(const d of opens){
        const [dx,dy]=DXY[d], nx=x+dx, ny=y+dy;
        if(nx<0||nx>=SIZE||ny<0||ny>=SIZE||v[ny][nx]) continue;
        if (getOpen(grid[ny][nx].type,grid[ny][nx].rot).includes(OPP[d])) {
          v[ny][nx]=true; q.push([nx,ny]);
        }
      }
    }
    return false;
  }

  function checkWin(c){
    const won = isConnected(2, SIZE-1); // gate area bottom center
    if (won && onCompleteRef) {
      if (window.SanctuaryAudio && window.SanctuaryAudio.playBeam) window.SanctuaryAudio.playBeam(true);
      setTimeout(()=> onCompleteRef && onCompleteRef(), 300);
    } else if (c) {
      renderGrid(c);
    }
  }

  function cleanup(c){
    const g = c && c.querySelector && c.querySelector('#prism-grid');
    if (g && c._iceKey) g.removeEventListener('keydown', c._iceKey);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.ice = { init, cleanup };
})(window);
