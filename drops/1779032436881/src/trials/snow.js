/**
 * Snow Dragon - Quiet Constellation
 * Move a soft focus circle to catch slow drifting snow glyphs.
 * Calm, graceful, no speed pressure. Gather 7+ to complete.
 * Keyboard: WASD / arrows to steer the focus.
 */
(function (global) {
  let canvas, ctx, glyphs = [], focus = { x: 210, y: 130 }, caught = 0, onCompleteRef = null;
  let anim = null, keyHandler = null;
  const GOAL = 7;

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    caught = 0;
    glyphs = [];
    focus = { x: 210, y: 130 };
    for (let i = 0; i < 11; i++) {
      glyphs.push({
        x: 30 + Math.random() * 360,
        y: 20 + Math.random() * 200,
        vx: 0.2 + Math.random() * 0.6,
        vy: 0.15 + Math.random() * 0.4,
        s: 8 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2
      });
    }

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:0 0 6px;color:#9aa8b8;font-size:13px;">Gently steer the glowing focus (mouse, touch, or WASD/arrows). Catch drifting glyphs. Stillness is the way.</p>
        <div id="snow-area"><canvas id="snow-canvas" width="420" height="260" style="display:block;"></canvas></div>
        <div style="margin-top:6px;font-size:12px;color:#e0e8f2;">Glyphs gathered: <span id="snow-count">0</span> / ${GOAL}</div>
      </div>
    `;

    canvas = container.querySelector('#snow-canvas');
    ctx = canvas.getContext('2d');

    // pointer steer
    const moveFocus = (e) => {
      const rect = canvas.getBoundingClientRect();
      focus.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      focus.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    };
    canvas.addEventListener('pointermove', moveFocus);
    canvas.addEventListener('pointerdown', moveFocus);

    // keyboard steer
    keyHandler = (e) => {
      const speed = 4.2;
      if (['ArrowLeft','a','A'].includes(e.key)) focus.x -= speed;
      if (['ArrowRight','d','D'].includes(e.key)) focus.x += speed;
      if (['ArrowUp','w','W'].includes(e.key)) focus.y -= speed;
      if (['ArrowDown','s','S'].includes(e.key)) focus.y += speed;
      focus.x = Math.max(20, Math.min(canvas.width-20, focus.x));
      focus.y = Math.max(20, Math.min(canvas.height-20, focus.y));
    };
    document.addEventListener('keydown', keyHandler);

    startLoop(container);
    return () => { stopLoop(); document.removeEventListener('keydown', keyHandler); };
  }

  function startLoop(container) {
    stopLoop();
    function step() {
      update(container);
      draw();
      anim = requestAnimationFrame(step);
    }
    anim = requestAnimationFrame(step);
  }
  function stopLoop() { if (anim) cancelAnimationFrame(anim); anim = null; }

  function update(container) {
    const countEl = container.querySelector('#snow-count');
    // drift glyphs
    glyphs.forEach(g => {
      g.x += g.vx;
      g.y += g.vy;
      g.phase += 0.03;
      if (g.x > canvas.width + 10) g.x = -10;
      if (g.y > canvas.height + 10) g.y = -10;
      // catch?
      const dx = g.x - focus.x, dy = g.y - focus.y;
      if (dx*dx + dy*dy < (g.s * 1.8) ** 2) {
        // caught
        g.caught = true;
        caught++;
        if (countEl) countEl.textContent = caught;
        if (window.SanctuaryAudio && window.SanctuaryAudio.playSnowCatch) window.SanctuaryAudio.playSnowCatch(caught);
        else if (window.SanctuaryAudio && window.SanctuaryAudio.playSoftTone) window.SanctuaryAudio.playSoftTone(810 + (caught%3)*20, 0.12);
        if (caught >= GOAL && onCompleteRef) {
          setTimeout(() => onCompleteRef(), 260);
        }
      }
    });
    // respawn some
    glyphs = glyphs.filter(g => !g.caught);
    while (glyphs.length < 8) {
      glyphs.push({
        x: Math.random() * canvas.width * 0.6,
        y: -10,
        vx: 0.3 + Math.random() * 0.5,
        vy: 0.25 + Math.random() * 0.35,
        s: 7 + Math.random() * 7,
        phase: Math.random() * 6
      });
    }
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // soft bg
    ctx.fillStyle = 'rgba(14,20,32,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // glyphs
    ctx.fillStyle = '#e0e8f2';
    glyphs.forEach(g => {
      const a = Math.sin(g.phase) * 0.3 + 0.7;
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.phase * 0.5);
      ctx.fillRect(-g.s/2, -1, g.s, 2);
      ctx.fillRect(-1, -g.s/2, 2, g.s);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // focus circle (soft, calm)
    const fg = ctx.createRadialGradient(focus.x, focus.y, 12, focus.x, focus.y, 48);
    fg.addColorStop(0, 'rgba(224,232,242,0.35)');
    fg.addColorStop(1, 'rgba(224,232,242,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(focus.x, focus.y, 48, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = 'rgba(224,232,242,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(focus.x, focus.y, 26, 0, Math.PI*2); ctx.stroke();
  }

  function cleanup() {
    stopLoop();
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.snow = { init, cleanup };
})(window);

