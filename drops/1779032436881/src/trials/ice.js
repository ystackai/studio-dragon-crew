/**
 * Ice Dragon - Crystal Refraction
 * Rotate 3 crystal mirrors so the moonbeam reaches the frozen gate.
 * Live beam preview, snap to readable angles, arrow key support.
 * Success: crystalline bridges + sharper stars in sanctuary.
 */
(function (global) {
  let angles = [35, 90, 145]; // degrees, solution tuned for nice path
  const TARGETS = [42, 95, 150]; // forgiving solution window
  let canvas, ctx, onCompleteRef = null;
  let dragging = -1;
  let keyHandler = null;

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    angles = [35, 90, 145];
    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:0 0 10px;color:#9aa8b8;font-size:13px;">Drag the mirrors or use ← → on focused slider. Get the blue beam to touch the gate.</p>
        <canvas id="ice-canvas" width="420" height="220" style="border:1px solid #2a3f55;border-radius:8px;background:#0b1626;cursor:grab;display:block;margin:0 auto;"></canvas>
        <div class="mirror-controls" style="margin-top:14px;">
          ${[0,1,2].map(i => `
            <div class="mirror">
              <label>Mirror ${i+1}</label>
              <input type="range" min="0" max="180" step="1" value="${angles[i]}" id="ice-m${i}">
            </div>
          `).join('')}
        </div>
        <div id="ice-hint" style="margin-top:8px;font-size:11px;color:#a8d5ff;opacity:0.7;">Beam path updates live. Snap near 30° steps for clarity.</div>
      </div>
    `;

    canvas = container.querySelector('#ice-canvas');
    ctx = canvas.getContext('2d');

    // sliders
    [0,1,2].forEach(i => {
      const r = container.querySelector(`#ice-m${i}`);
      r.addEventListener('input', () => {
        angles[i] = parseFloat(r.value);
        draw();
        checkWin();
      });
    });

    // pointer drag on canvas
    const getMirrorFromX = (x) => {
      const w = canvas.width;
      if (x < w * 0.22) return 0;
      if (x < w * 0.5) return 1;
      return 2;
    };
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      dragging = getMirrorFromX(x);
      canvas.style.cursor = 'grabbing';
      updateFromPointer(e);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (dragging >= 0) updateFromPointer(e);
    });
    window.addEventListener('pointerup', () => { dragging = -1; canvas.style.cursor = 'grab'; });

    // keyboard: focus on sliders + arrows
    const sliders = [0,1,2].map(i => container.querySelector(`#ice-m${i}`));
    sliders.forEach((s, i) => {
      s.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft') { angles[i] = Math.max(0, angles[i] - 6); s.value = angles[i]; draw(); checkWin(); ev.preventDefault(); }
        if (ev.key === 'ArrowRight') { angles[i] = Math.min(180, angles[i] + 6); s.value = angles[i]; draw(); checkWin(); ev.preventDefault(); }
      });
    });

    // global arrows when no focus (nice for game feel)
    keyHandler = (ev) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      if (ev.key === 'ArrowLeft') { angles[1] = Math.max(0, angles[1]-8); syncSliders(container); draw(); checkWin(); }
      if (ev.key === 'ArrowRight') { angles[1] = Math.min(180, angles[1]+8); syncSliders(container); draw(); checkWin(); }
    };
    document.addEventListener('keydown', keyHandler);

    draw();
    // gentle auto-hint after 12s if not solved
    setTimeout(() => {
      const hint = container.querySelector('#ice-hint');
      if (hint && !isSolved()) hint.textContent = 'Tip: Try 42°, 95°, 150° — or experiment; the beam turns gold near the gate.';
    }, 12000);

    return () => { document.removeEventListener('keydown', keyHandler); };
  }

  function syncSliders(container) {
    [0,1,2].forEach(i => {
      const r = container.querySelector(`#ice-m${i}`);
      if (r) r.value = Math.round(angles[i]);
    });
  }

  function updateFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    // map vertical drag or horizontal pos to angle
    const mirror = dragging;
    if (mirror < 0) return;
    const norm = Math.max(0, Math.min(1, (x - 40) / (canvas.width - 80)));
    angles[mirror] = Math.round(norm * 180);
    // sync slider
    const r = document.querySelector(`#ice-m${mirror}`);
    if (r) r.value = angles[mirror];
    draw();
    checkWin();
  }

  function isSolved() {
    return angles.every((a, i) => Math.abs(a - TARGETS[i]) < 14);
  }

  function checkWin() {
    if (isSolved() && onCompleteRef) {
      setTimeout(() => onCompleteRef(), 280);
    }
  }

  function draw() {
    if (!ctx) return;
    const w = 420, h = 220;
    ctx.clearRect(0, 0, w, h);

    // background frost
    ctx.fillStyle = '#0b1626';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(168,213,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = -2; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(20 + i*78, 20); ctx.lineTo(30 + i*68, h-20); ctx.stroke();
    }

    // source moon
    const srcX = 48, srcY = 58;
    ctx.fillStyle = '#d4e9ff';
    ctx.beginPath(); ctx.arc(srcX, srcY, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(212,233,255,0.3)';
    ctx.beginPath(); ctx.arc(srcX, srcY, 19, 0, Math.PI*2); ctx.fill();

    // gate (right)
    const gateX = w - 52, gateY = h - 58;
    ctx.fillStyle = '#1f2f45';
    ctx.fillRect(gateX - 14, gateY - 22, 28, 44);
    ctx.strokeStyle = '#a8d5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(gateX - 14, gateY - 22, 28, 44);
    ctx.fillStyle = '#a8d5ff';
    ctx.fillText('GATE', gateX - 14, gateY + 36);

    // mirrors positions
    const mirrors = [
      { x: 118, y: 110 },
      { x: 210, y: 92 },
      { x: 302, y: 118 }
    ];

    // compute beam path
    let beamPoints = [{ x: srcX + 14, y: srcY + 4 }];
    let dir = { x: 1, y: 0.15 }; // initial shallow angle

    mirrors.forEach((m, i) => {
      // incoming
      const hit = intersectRay(beamPoints[beamPoints.length-1], dir, m.x - 22, m.y - 26, m.x + 22, m.y + 26);
      if (hit) {
        beamPoints.push({ x: hit.x, y: hit.y });
        // reflect using angle
        const a = (angles[i] - 90) * Math.PI / 180; // 0=flat, positive tilts
        const nx = Math.cos(a), ny = Math.sin(a);
        const dot = dir.x * nx + dir.y * ny;
        dir = { x: dir.x - 2 * dot * nx, y: dir.y - 2 * dot * ny };
        // normalize a bit
        const len = Math.hypot(dir.x, dir.y) || 1;
        dir.x /= len; dir.y /= len;
      }
      // always push mirror center for viz
      beamPoints.push({ x: m.x, y: m.y });
    });

    // final leg to gate area
    const last = beamPoints[beamPoints.length-1];
    const toGate = { x: gateX - 18 - last.x, y: gateY - last.y };
    const dlen = Math.hypot(toGate.x, toGate.y) || 1;
    beamPoints.push({ x: last.x + toGate.x / dlen * 68, y: last.y + toGate.y / dlen * 68 });

    // draw beam (faint preview + bright if close)
    const solved = isSolved();
    ctx.strokeStyle = solved ? '#f4d9a8' : '#7fb8e6';
    ctx.lineWidth = solved ? 2.5 : 1.8;
    ctx.shadowColor = solved ? '#f4d9a8' : '#7fb8e6';
    ctx.shadowBlur = solved ? 6 : 2;
    ctx.beginPath();
    ctx.moveTo(beamPoints[0].x, beamPoints[0].y);
    for (let p = 1; p < beamPoints.length; p++) {
      ctx.lineTo(beamPoints[p].x, beamPoints[p].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // draw mirrors as rotating diamonds
    mirrors.forEach((m, i) => {
      const a = (angles[i] - 90) * Math.PI / 180;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(a);
      ctx.fillStyle = '#e0f0ff';
      ctx.strokeStyle = solved && Math.abs(angles[i]-TARGETS[i])<14 ? '#f4d9a8' : '#a8d5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(8, 0); ctx.lineTo(0, 18); ctx.lineTo(-8, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // label
      ctx.fillStyle = '#9aa8b8';
      ctx.font = '10px system-ui';
      ctx.fillText((angles[i] | 0) + '°', m.x - 12, m.y + 32);
    });

    // success indicator
    if (solved) {
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '600 12px system-ui';
      ctx.fillText('PATH CLEAR — Gate reachable', 128, 28);
    }
  }

  function intersectRay(p, dir, x1, y1, x2, y2) {
    // simple box hit for viz
    const t = ((x1 + x2) / 2 - p.x) / (dir.x || 0.0001);
    if (t > 2 && t < 180) return { x: p.x + dir.x * t * 0.6, y: p.y + dir.y * t * 0.6 };
    return null;
  }

  function cleanup() {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.ice = { init, cleanup };
})(window);

