/**
 * Ice Dragon - Crystal Refraction
 * Rotate 3 crystal mirrors so the moonbeam reaches the frozen gate.
 * Live beam preview, snap to readable angles, arrow key support.
 * Success: crystalline bridges + sharper stars in sanctuary.
 */
(function (global) {
  let angles = [15, 30, 45]; // near-miss start (gp~44); small left on middle mirror or drags around it creates the winning path to gate (gp<38)
  let canvas, ctx, onCompleteRef = null;
  let dragging = -1;
  let keyHandler = null;

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    // Start near-miss so player must steer (small adjustments on middle mirror win from here). Live preview + proximity guide make the path discoverable.
    angles = [15, 30, 45];
    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:0 0 10px;color:#9aa8b8;font-size:13px;">Drag mirrors or ←→ on sliders or arrows. Steer the beam through reflections until it reaches the gate on the right. Small adjustments near 8–45° often clear the path.</p>
        <canvas id="ice-canvas" width="420" height="220" style="border:1px solid #2a3f55;border-radius:8px;background:#0b1626;cursor:grab;display:block;margin:0 auto;"></canvas>
        <div class="mirror-controls" style="margin-top:14px;">
          ${[0,1,2].map(i => `
            <div class="mirror">
              <label>Mirror ${i+1}</label>
              <input type="range" min="0" max="180" step="1" value="${angles[i]}" id="ice-m${i}">
            </div>
          `).join('')}
        </div>
        <div id="ice-hint" style="margin-top:8px;font-size:11px;color:#a8d5ff;opacity:0.7;">Live path shows bends. Gold beam + gate glow = win. From 15/30/45, steer the middle mirror a little (left arrow or drag) until it flies gold into the gate.</div>
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
        if (window.SanctuaryAudio && window.SanctuaryAudio.playMirrorTone) window.SanctuaryAudio.playMirrorTone(i);
      });
    });

    // gentle beam tone when path becomes gold (on checkWin success path)
    const origCheck = checkWin;
    // (we enhance draw+check below)

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
    window.addEventListener('pointerup', () => {
      if (dragging >= 0 && window.SanctuaryAudio && window.SanctuaryAudio.playBeamTone) window.SanctuaryAudio.playBeamTone();
      dragging = -1; canvas.style.cursor = 'grab';
    });

    // keyboard: focus on sliders + arrows
    const sliders = [0,1,2].map(i => container.querySelector(`#ice-m${i}`));
    sliders.forEach((s, i) => {
      s.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft') { angles[i] = Math.max(0, angles[i] - 6); s.value = angles[i]; draw(); checkWin(); if (window.SanctuaryAudio && window.SanctuaryAudio.playMirrorTone) window.SanctuaryAudio.playMirrorTone(i); ev.preventDefault(); }
        if (ev.key === 'ArrowRight') { angles[i] = Math.min(180, angles[i] + 6); s.value = angles[i]; draw(); checkWin(); if (window.SanctuaryAudio && window.SanctuaryAudio.playMirrorTone) window.SanctuaryAudio.playMirrorTone(i); ev.preventDefault(); }
      });
    });

    // global arrows when no focus (nice for game feel)
    keyHandler = (ev) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      if (ev.key === 'ArrowLeft') { angles[1] = Math.max(0, angles[1]-8); syncSliders(container); draw(); checkWin(); if (window.SanctuaryAudio && window.SanctuaryAudio.playMirrorTone) window.SanctuaryAudio.playMirrorTone(1); }
      if (ev.key === 'ArrowRight') { angles[1] = Math.min(180, angles[1]+8); syncSliders(container); draw(); checkWin(); if (window.SanctuaryAudio && window.SanctuaryAudio.playMirrorTone) window.SanctuaryAudio.playMirrorTone(1); }
    };
    document.addEventListener('keydown', keyHandler);

    draw();
    // gentle auto-hint after 12s if not solved
    setTimeout(() => {
      const hint = container.querySelector('#ice-hint');
      if (hint && !isSolved()) hint.textContent = 'Tip: From the start 15°/30°/45°, press left on middle slider or drag the center mirror down ~8°; watch for gold beam into gate.';
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

  function simulateBeam() {
    // Trace ray + 3 reflections. After last bounce, outgoing *dir* decides if it flies to gate or misses.
    const w = 420, h = 220;
    const srcX = 48, srcY = 58;
    const gateX = w - 52, gateY = h - 58;
    const mirrors = [
      { x: 118, y: 110, r: 22 },
      { x: 210, y: 92, r: 22 },
      { x: 302, y: 118, r: 22 }
    ];
    let pos = { x: srcX + 18, y: srcY + 2 };
    let dir = { x: 0.98, y: 0.12 };
    const points = [ { x: pos.x, y: pos.y } ];

    for (let i = 0; i < 3; i++) {
      const m = mirrors[i];
      const t = (m.x - pos.x) / (dir.x || 0.001);
      if (t > 1 && t < 320) {
        const hy = pos.y + dir.y * t * 0.9;
        if (Math.abs(hy - m.y) < 40) {
          points.push({ x: m.x - 3, y: hy });
          const a = (angles[i] - 90) * Math.PI / 180;
          const nx = Math.cos(a), ny = Math.sin(a);
          const dot = dir.x * nx + dir.y * ny;
          dir = { x: dir.x - 2 * dot * nx, y: dir.y - 2 * dot * ny };
          const len = Math.hypot(dir.x, dir.y) || 1; dir.x /= len; dir.y /= len;
          pos = { x: m.x + 5, y: hy };
          continue;
        }
      }
      pos = { x: m.x, y: m.y };
      points.push({ x: pos.x, y: pos.y });
    }
    // march forward in *current outgoing dir* (no homing)
    const march = 95;
    const proj = { x: pos.x + dir.x * march, y: pos.y + dir.y * march };
    points.push(proj);

    // does the free-flight ray cross the gate rect? (forgiving y for tactile discovery; player can steer a clear path)
    const atGateX = (gateX - pos.x) / (dir.x || 0.0001);
    let hitsGate = false;
    let gateProximity = 999;
    if (atGateX > 6 && atGateX < 115) {
      const yAtGate = pos.y + dir.y * atGateX;
      gateProximity = Math.abs(yAtGate - gateY);
      if (yAtGate > gateY - 42 && yAtGate < gateY + 42) hitsGate = true;
    }
    return { points, hitsGate, gateProximity };
  }

  function isSolved() {
    return simulateBeam().hitsGate;
  }
  function getProximity() {
    return simulateBeam().gateProximity || 999;
  }

  let lastSolved = false;
  function checkWin() {
    const solved = isSolved();
    if (solved && !lastSolved && window.SanctuaryAudio && window.SanctuaryAudio.playBeamTone) {
      window.SanctuaryAudio.playBeamTone();
    }
    lastSolved = solved;
    if (solved && onCompleteRef) {
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
    ctx.font = '10px system-ui';
    ctx.fillText('GATE', gateX - 14, gateY + 36);

    // mirrors positions
    const mirrors = [
      { x: 118, y: 110 },
      { x: 210, y: 92 },
      { x: 302, y: 118 }
    ];

    // real beam path via simulation (player can now steer it to gate)
    const sim = simulateBeam();
    const { points: beamPoints, hitsGate: solved, gateProximity } = sim;

    // draw beam (live preview; gold when path reaches gate)
    ctx.strokeStyle = solved ? '#f4d9a8' : '#7fb8e6';
    ctx.lineWidth = solved ? 2.8 : 1.9;
    ctx.shadowColor = solved ? '#f4d9a8' : '#7fb8e6';
    ctx.shadowBlur = solved ? 7 : 2;
    ctx.beginPath();
    ctx.moveTo(beamPoints[0].x, beamPoints[0].y);
    for (let p = 1; p < beamPoints.length; p++) {
      ctx.lineTo(beamPoints[p].x, beamPoints[p].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // proximity "warm" guide when close but not yet through gate (helps discovery; wider now for feel)
    if (!solved && gateProximity < 36) {
      ctx.strokeStyle = 'rgba(244,217,168,0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(gateX - 18, gateY - 4);
      ctx.lineTo(gateX + 4, gateY + 4);
      ctx.stroke();
    }

    // draw mirrors as rotating diamonds
    mirrors.forEach((m, i) => {
      const a = (angles[i] - 90) * Math.PI / 180;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(a);
      ctx.fillStyle = '#e0f0ff';
      ctx.strokeStyle = solved ? '#f4d9a8' : '#a8d5ff';
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

    // success indicator + gate highlight
    if (solved) {
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '600 12px system-ui';
      ctx.fillText('PATH CLEAR — Gate reachable', 118, 26);
      // subtle gate glow
      ctx.strokeStyle = '#f4d9a8';
      ctx.lineWidth = 3;
      ctx.strokeRect(gateX - 16, gateY - 24, 32, 48);
    } else if (gateProximity < 30) {
      ctx.fillStyle = 'rgba(244,217,168,0.8)';
      ctx.font = '500 11px system-ui';
      ctx.fillText('Close — keep steering the final leg', 102, 26);
    }
  }

  // (simulateBeam handles all ray + reflection math now)

  function cleanup() {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.ice = { init, cleanup };
})(window);

