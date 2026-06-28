/**
 * Fire Dragon - Ember Oath (onboarding trial)
 * Hold and release near golden band 3 times. Warm particles + soft success.
 * Easy after one mistake. Director + Ice ownership for first slice.
 */
(function (global) {
  let meter = null;
  let ctx = null;
  let target = 0.5;
  let releases = 0;
  let lastRelease = 0;
  let holding = false;
  let breathPhase = 0;
  let completeCb = null;

  function init(container, onComplete, dragon) {
    releases = 0;
    completeCb = onComplete;
    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:4px 0 12px;color:#9aa8b8;font-size:13px;">Breathe with the ember. Hold anywhere on the circle (or Space), release when the ring glows gold. Three good releases to awaken the braziers.</p>
        <div id="ember-meter"><canvas id="ember-canvas" width="220" height="220"></canvas></div>
        <div style="margin-top:8px;font-size:12px;color:#ffcc7a;">Releases: <span id="ember-count">0</span> / 3</div>
      </div>
    `;
    const canvas = container.querySelector('#ember-canvas');
    ctx = canvas.getContext('2d', { alpha: true });
    meter = canvas;

    // pointer events on canvas
    const onDown = (e) => { holding = true; updateBreath(e); };
    const onMove = (e) => { if (holding) updateBreath(e); };
    const onUp = (e) => { if (holding) { holding = false; tryRelease(); } };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', () => { if (holding) { holding = false; tryRelease(); } });

    // keyboard support: Space/Enter to hold
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!holding) { holding = true; breathPhase = 0.6; }
        else { holding = false; tryRelease(); }
      }
    };
    document.addEventListener('keydown', onKey, { once: false });
    container._keyHandler = onKey;

    startLoop();
    return () => { stopLoop(); document.removeEventListener('keydown', onKey); };
  }

  let anim = null;
  function startLoop() {
    stopLoop();
    function loop() {
      draw();
      breathPhase = (breathPhase + 0.022) % 1;
      anim = requestAnimationFrame(loop);
    }
    anim = requestAnimationFrame(loop);
  }
  function stopLoop() { if (anim) cancelAnimationFrame(anim); anim = null; }

  function updateBreath(e) {
    const rect = meter.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    const dist = Math.min(1, Math.sqrt(x*x + y*y));
    target = 0.35 + (1 - dist) * 0.55; // closer to center = hotter
  }

  function tryRelease() {
    const warmth = Math.abs(breathPhase - 0.5) < 0.18 ? 1 : (1 - Math.abs(breathPhase - 0.5) / 0.5);
    const good = warmth > 0.72;
    if (good) {
      releases++;
      document.getElementById('ember-count').textContent = releases;
      lastRelease = Date.now();
      if (window.SanctuaryAudio) {
        if (window.SanctuaryAudio.playSoftTone) window.SanctuaryAudio.playSoftTone(480 + releases * 28, 0.16);
        // extra warm tail on each good release (more sound)
        setTimeout(() => { if (window.SanctuaryAudio && window.SanctuaryAudio.playChime) window.SanctuaryAudio.playChime(92 + releases*4, 0.5, 'sine'); }, 80);
      }
      if (releases >= 3) {
        stopLoop();
        if (completeCb) completeCb();
      } else {
        // small success flash
        if (window.SanctuaryEffects) window.SanctuaryEffects.emberBurst(meter);
      }
    } else {
      // gentle fail: just breathe again, no punish
      if (window.SanctuaryEffects) window.SanctuaryEffects.emberMiss(meter);
    }
  }

  function draw() {
    if (!ctx || !meter) return;
    const w = 220, h = 220, cx = w/2, cy = h/2, r = 82;
    ctx.clearRect(0,0,w,h);

    // outer soft glow
    const grad = ctx.createRadialGradient(cx, cy, r*0.6, cx, cy, r*1.35);
    grad.addColorStop(0, 'rgba(255,140,66,0.12)');
    grad.addColorStop(1, 'rgba(255,140,66,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx,cy,r*1.35,0,Math.PI*2); ctx.fill();

    // breathing ring
    const breath = 0.5 + Math.sin(breathPhase * Math.PI * 2) * 0.5;
    const ringR = r + breath * 7;
    ctx.strokeStyle = 'rgba(255,204,122,0.35)';
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(cx,cy,ringR,0,Math.PI*2); ctx.stroke();

    // inner ember core
    ctx.fillStyle = holding ? '#ffcc7a' : '#ff8c42';
    ctx.beginPath(); ctx.arc(cx,cy,r*0.58,0,Math.PI*2); ctx.fill();

    // golden target band
    ctx.strokeStyle = '#f4d9a8';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(cx,cy,r*0.82,0,Math.PI*2); ctx.stroke();

    // warmth indicator
    const warmth = 1 - Math.abs(breathPhase - 0.5) / 0.5;
    ctx.fillStyle = warmth > 0.72 ? '#f4d9a8' : 'rgba(244,217,168,0.3)';
    ctx.beginPath(); ctx.arc(cx,cy,r*0.34,0,Math.PI*2); ctx.fill();

    ctx.fillStyle = '#0a121f';
    ctx.font = '500 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(holding ? 'HOLDING' : 'BREATHE', cx, cy + 4);
  }

  function cleanup(container) {
    stopLoop();
    const key = container._keyHandler;
    if (key) document.removeEventListener('keydown', key);
  }

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.fire = { init, cleanup };
})(window);
