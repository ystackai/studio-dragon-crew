/**
 * Sanctuary of the Six Lights - Main Engine + Sanctuary Scene
 * Ice Dragon (core) + Fire (director) + Snow (visual) ownership.
 * Canvas 2D sanctuary, input normalization (pointer/touch/keyboard), trial router,
 * progress sync, finale trigger.
 */
(function () {
  const canvas = document.getElementById('sanctuary');
  const ctx = canvas.getContext('2d', { alpha: true });
  const overlay = document.getElementById('trial-overlay');
  const trialContent = document.getElementById('trial-content');
  const trialTitle = document.getElementById('trial-title');
  const trialSubtitle = document.getElementById('trial-subtitle');
  const trialPortrait = document.getElementById('trial-portrait');
  const trialInstruction = document.getElementById('trial-instruction');
  const trialSkip = document.getElementById('trial-skip');
  const trialCompleteBtn = document.getElementById('trial-complete');
  const progressEl = document.getElementById('progress');
  const muteBtn = document.getElementById('mute-btn');
  const resetBtn = document.getElementById('reset-btn');
  const toastEl = document.getElementById('toast');
  const finaleOverlay = document.getElementById('finale-overlay');
  const finaleCanvas = document.getElementById('finale-canvas');
  const blessingTitle = document.getElementById('blessing-title');
  const blessingText = document.getElementById('blessing-text');
  const shareBtn = document.getElementById('share-btn');
  const replayBtn = document.getElementById('replay-btn');

  let W = canvas.width, H = canvas.height;
  let currentTrial = null;
  let trialCleanup = null;
  let currentDragon = null;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = null;
  let time = 0;

  // Shrine layout: 6 around central loom (hex-ish, slightly floating)
  const SHRINE_RADIUS = 54;
  const LOOM_RADIUS = 68;
  const SHRINE_POS = [
    { id: 'fire',  x: 0.50, y: 0.22 }, // top
    { id: 'ice',   x: 0.78, y: 0.30 },
    { id: 'water', x: 0.85, y: 0.58 },
    { id: 'snow',  x: 0.50, y: 0.82 },
    { id: 'sea',   x: 0.15, y: 0.58 },
    { id: 'lava',  x: 0.22, y: 0.30 }
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    // keep aspect but scale internal res for crisp
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(rect.width * dpr);
    H = Math.floor(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  function worldToScreen(p) {
    const cx = W * 0.5, cy = H * 0.48;
    const scale = Math.min(W, H) * 0.38;
    return {
      x: cx + (p.x - 0.5) * scale * 1.6,
      y: cy + (p.y - 0.5) * scale * 1.35
    };
  }

  function drawSanctuary() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.48;
    const scale = Math.min(W, H) * 0.38;

    // deep sky gradient + faint stars
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b1626');
    sky.addColorStop(0.45, '#0f1f35');
    sky.addColorStop(1, '#0a121f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // subtle nebula glows (cinematic, not overwhelming)
    ctx.fillStyle = 'rgba(120, 80, 140, 0.06)';
    ctx.beginPath(); ctx.ellipse(cx - 180, cy - 90, 260, 140, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200, 120, 70, 0.05)';
    ctx.beginPath(); ctx.ellipse(cx + 210, cy + 70, 200, 110, 0.4, 0, Math.PI * 2); ctx.fill();

    // soft stars
    ctx.fillStyle = 'rgba(244,217,168,0.55)';
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 67 + 13) % (W - 40)) + 20;
      const sy = ((i * 41 + 7) % (H * 0.72)) + 30;
      const tw = 0.6 + Math.sin(time * 0.8 + i) * 0.4;
      ctx.globalAlpha = 0.4 + tw * 0.35;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    // floating sanctuary platform (soft stone + glow)
    ctx.fillStyle = 'rgba(30, 38, 52, 0.95)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 38, scale * 0.92, scale * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244,217,168,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // central Sky Loom (dormant until blessings)
    const state = window.SanctuaryState.get();
    const loomGlow = 0.3 + (state.completed.length / 6) * 0.55;
    const lg = ctx.createRadialGradient(cx, cy, LOOM_RADIUS * 0.3, cx, cy, LOOM_RADIUS * 1.6);
    lg.addColorStop(0, `rgba(244,217,168,${0.12 + loomGlow * 0.18})`);
    lg.addColorStop(1, 'rgba(244,217,168,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(cx, cy, LOOM_RADIUS * 1.6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1a2535';
    ctx.beginPath(); ctx.arc(cx, cy, LOOM_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f4d9a8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, LOOM_RADIUS, 0, Math.PI * 2); ctx.stroke();

    // inner loom detail
    ctx.strokeStyle = 'rgba(244,217,168,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
      ctx.lineTo(cx + Math.cos(a) * 48, cy + Math.sin(a) * 48);
      ctx.stroke();
    }

    // Draw runes on loom (filled when complete)
    const runes = window.SanctuaryDragons.list;
    runes.forEach((d, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const rx = cx + Math.cos(a) * (LOOM_RADIUS - 14);
      const ry = cy + Math.sin(a) * (LOOM_RADIUS - 14);
      const filled = window.SanctuaryState.isComplete(d.id);
      ctx.fillStyle = filled ? d.color : 'rgba(120,130,150,0.2)';
      ctx.strokeStyle = filled ? '#f4d9a8' : 'rgba(244,217,168,0.2)';
      ctx.lineWidth = filled ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(rx, ry, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = filled ? '#0a121f' : '#9aa8b8';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(d.rune || '•', rx, ry + 3.5);
    });

    // Six shrines
    SHRINE_POS.forEach((pos, idx) => {
      const dragon = window.SanctuaryDragons.byId[pos.id];
      if (!dragon) return;
      const sp = worldToScreen(pos);
      const completed = window.SanctuaryState.isComplete(dragon.id);
      const hover = (window._hoverShrine === dragon.id);

      // shrine base glow
      const g = ctx.createRadialGradient(sp.x, sp.y, 18, sp.x, sp.y, SHRINE_RADIUS * 1.35);
      g.addColorStop(0, completed ? `${dragon.color}22` : 'rgba(80,90,110,0.12)');
      g.addColorStop(1, 'rgba(10,18,31,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, SHRINE_RADIUS * 1.35, 0, Math.PI * 2); ctx.fill();

      // shrine stone
      ctx.fillStyle = completed ? '#1f2a3a' : '#141e2d';
      ctx.beginPath(); ctx.arc(sp.x, sp.y, SHRINE_RADIUS, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hover ? dragon.color : (completed ? dragon.color : 'rgba(244,217,168,0.25)');
      ctx.lineWidth = hover ? 2.5 : (completed ? 1.8 : 1);
      ctx.stroke();

      // small portrait circle (reuse real dragon images when available)
      const img = window._dragonImages && window._dragonImages[dragon.id];
      if (img && img.complete) {
        ctx.save();
        ctx.beginPath(); ctx.arc(sp.x, sp.y - 6, 21, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, sp.x - 21, sp.y - 27, 42, 42);
        ctx.restore();
      } else {
        // fallback colored circle
        ctx.fillStyle = dragon.color;
        ctx.beginPath(); ctx.arc(sp.x, sp.y - 6, 18, 0, Math.PI * 2); ctx.fill();
      }

      // label
      ctx.fillStyle = completed ? '#f0e6d8' : '#9aa8b8';
      ctx.font = '600 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(dragon.name.replace(' Dragon', ''), sp.x, sp.y + 32);

      // check mark if done
      if (completed) {
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText('✓', sp.x + 32, sp.y - 14);
      }
    });

    // subtle floating motes (if not reduced)
    if (!reducedMotion) {
      ctx.fillStyle = 'rgba(244,217,168,0.25)';
      for (let i = 0; i < 9; i++) {
        const mx = cx + Math.sin(time * 0.3 + i * 1.7) * (scale * 0.6 + i * 3);
        const my = cy + Math.cos(time * 0.4 + i) * (scale * 0.22);
        ctx.fillRect(mx, my, 1.5, 1.5);
      }
    }

    ctx.restore();
  }

  function updateRunes() {
    progressEl.innerHTML = '';
    const count = window.SanctuaryState.getProgressCount();
    const total = 6;
    for (let i = 0; i < total; i++) {
      const r = document.createElement('span');
      r.className = 'rune' + (i < count ? ' filled' : '');
      r.textContent = i < count ? '✧' : '·';
      progressEl.appendChild(r);
    }
    // also update mute icon state
    const isMuted = window.SanctuaryState.getMute();
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', isMuted);
  }

  function showToast(msg, ms = 1600) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  function openTrial(dragonId) {
    const dragon = window.SanctuaryDragons.byId[dragonId];
    if (!dragon) return;
    if (window.SanctuaryState.isComplete(dragonId)) {
      showToast(`${dragon.name} already blessed the sanctuary.`);
      return;
    }
    currentDragon = dragon;
    trialTitle.textContent = dragon.title;
    trialSubtitle.textContent = dragon.short;
    trialPortrait.src = dragon.portrait;
    trialPortrait.alt = dragon.name;
    trialInstruction.textContent = dragon.invite;
    trialContent.innerHTML = '';
    trialCompleteBtn.style.display = 'none';
    overlay.classList.add('visible');

    // load trial module
    const trial = window.SanctuaryTrials && window.SanctuaryTrials[dragonId];
    if (trial && trial.init) {
      currentTrial = dragonId;
      trialCleanup = trial.init(trialContent, () => {
        // called by trial when ready to claim
        trialCompleteBtn.style.display = 'inline-block';
        trialCompleteBtn.onclick = () => claimBlessing();
      }, dragon);
    } else {
      // fallback
      trialContent.innerHTML = `<p style="color:#9aa8b8">Trial for ${dragon.name} not yet implemented in this slice.</p>`;
      trialCompleteBtn.style.display = 'inline-block';
      trialCompleteBtn.onclick = () => claimBlessing();
    }
  }

  function closeTrial(success = false) {
    overlay.classList.remove('visible');
    if (trialCleanup) { try { trialCleanup(trialContent); } catch (e) {} }
    trialCleanup = null;
    currentTrial = null;
    if (success && currentDragon) {
      window.SanctuaryState.complete(currentDragon.id);
      updateRunes();
      drawSanctuary();
      showToast(`${currentDragon.name} blesses the sanctuary.`);
      window.SanctuaryAudio && window.SanctuaryAudio.playSuccess(currentDragon.element);
      // check for finale
      if (window.SanctuaryState.allDone()) {
        setTimeout(() => openFinale(), 650);
      }
    }
    currentDragon = null;
  }

  function claimBlessing() {
    closeTrial(true);
  }

  // Pointer / touch / mouse input for sanctuary
  function getShrineAt(px, py) {
    for (const pos of SHRINE_POS) {
      const sp = worldToScreen(pos);
      const dx = px - sp.x, dy = py - sp.y;
      if (dx * dx + dy * dy < (SHRINE_RADIUS + 12) ** 2) {
        return pos.id;
      }
    }
    return null;
  }

  function handlePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const hit = getShrineAt(x, y);
    if (hit) {
      openTrial(hit);
    }
  }

  function setupInput() {
    let isDown = false;
    canvas.addEventListener('pointerdown', (e) => { isDown = true; });
    canvas.addEventListener('pointerup', (e) => {
      if (isDown) { handlePointer(e); isDown = false; }
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      const hit = getShrineAt(x, y);
      window._hoverShrine = hit;
      canvas.style.cursor = hit ? 'pointer' : 'default';
      if (!raf) drawSanctuary(); // cheap hover update
    });
    canvas.addEventListener('pointerleave', () => {
      window._hoverShrine = null;
      canvas.style.cursor = 'default';
    });

    // Keyboard: numbers 1-6 for shrines (nice for desktop)
    document.addEventListener('keydown', (e) => {
      if (overlay.classList.contains('visible') || finaleOverlay.classList.contains('visible')) {
        if (e.key.toLowerCase() === 'escape') {
          if (overlay.classList.contains('visible')) closeTrial(false);
          else if (finaleOverlay.classList.contains('visible')) closeFinale();
        }
        return;
      }
      if (e.key === 'r' || e.key === 'R') { resetAll(); return; }
      if (e.key.toLowerCase() === 'm') { toggleMute(); return; }
      const map = { '1':'fire','2':'ice','3':'water','4':'snow','5':'sea','6':'lava' };
      if (map[e.key]) openTrial(map[e.key]);
    });

    // Touch tap on canvas
    canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const x = (t.clientX - rect.left) * (W / rect.width);
      const y = (t.clientY - rect.top) * (H / rect.height);
      const hit = getShrineAt(x, y);
      if (hit) {
        e.preventDefault();
        openTrial(hit);
      }
    }, { passive: false });

    // Mute + reset buttons
    muteBtn.addEventListener('click', toggleMute);
    resetBtn.addEventListener('click', resetAll);

    // Trial close
    trialSkip.addEventListener('click', () => closeTrial(false));
    // ESC already handled in keydown above

    // Finale buttons
    shareBtn.addEventListener('click', copyBlessing);
    replayBtn.addEventListener('click', closeFinale);
  }

  function toggleMute() {
    const nowMuted = !window.SanctuaryState.getMute();
    window.SanctuaryState.setMute(nowMuted);
    window.SanctuaryAudio && window.SanctuaryAudio.setMuted(nowMuted);
    muteBtn.textContent = nowMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', nowMuted);
    showToast(nowMuted ? 'Sound muted' : 'Sound enabled');
  }

  function resetAll() {
    if (!confirm('Reset all progress and blessings?')) return;
    window.SanctuaryState.reset();
    updateRunes();
    drawSanctuary();
    showToast('Sanctuary reset. The dragons wait again.');
    if (overlay.classList.contains('visible')) closeTrial(false);
    if (finaleOverlay.classList.contains('visible')) finaleOverlay.classList.remove('visible');
  }

  function preloadPortraits() {
    window._dragonImages = {};
    const list = window.SanctuaryDragons.list;
    list.forEach(d => {
      const img = new Image();
      img.src = d.portrait;
      img.onload = () => { drawSanctuary(); }; // refresh when ready
      window._dragonImages[d.id] = img;
    });
  }

  // Render loop
  function loop() {
    time += 0.016;
    drawSanctuary();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    window.addEventListener('resize', () => { resize(); drawSanctuary(); });

    // initial state
    window.SanctuaryState.load();
    const isMuted = window.SanctuaryState.getMute();
    window.SanctuaryAudio && window.SanctuaryAudio.setMuted(isMuted);
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', isMuted);

    updateRunes();
    preloadPortraits();

    setupInput();

    // first draw + loop
    drawSanctuary();
    if (!reducedMotion) {
      raf = requestAnimationFrame(loop);
    } else {
      // static but still nice
      setTimeout(drawSanctuary, 40);
    }

    // welcome hint on first visit
    const st = window.SanctuaryState.get();
    if (st.completed.length === 0) {
      setTimeout(() => {
        showToast('Click any shrine to meet a dragon. Keyboard: 1–6 or M/R.');
      }, 1200);
    }

    // expose for debugging (remove in prod if wanted)
    window.SANCTUARY_DEBUG = { draw: drawSanctuary, openTrial, reset: resetAll };
    console.log('%c[Sanctuary] The Dragon Crew: Sanctuary of the Six Lights ready. Slice 1 skeleton active.', 'color:#9aa8b8');
  }

  // ===== FINALE (stub for Slice 3) =====
  function openFinale() {
    const state = window.SanctuaryState.get();
    if (!state.blessing) {
      // create a default one if Lava not yet played
      const words = { adj: 'Luminous', place: 'Sanctuary', vow: 'Remembers' };
      const b = window.SanctuaryDragons.makeBlessing(words);
      window.SanctuaryState.setBlessing(b);
    }
    const b = window.SanctuaryState.get().blessing;
    blessingTitle.textContent = b.title;
    blessingText.textContent = b.text;

    finaleOverlay.classList.add('visible');
    drawFinale();
  }

  function drawFinale() {
    const fctx = finaleCanvas.getContext('2d');
    const fw = finaleCanvas.width, fh = finaleCanvas.height;
    fctx.fillStyle = '#050b14';
    fctx.fillRect(0, 0, fw, fh);
    // simple constellation lift (will be rich later)
    fctx.strokeStyle = 'rgba(244,217,168,0.6)';
    fctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const x = 60 + (i % 6) * 120 + Math.sin(i) * 10;
      const y = 80 + Math.floor(i / 6) * 90;
      fctx.beginPath(); fctx.arc(x, y, 2.5, 0, Math.PI * 2); fctx.stroke();
    }
    // dragons silhouettes as small circles
    const colors = ['#ff8c42','#a8d5ff','#4fb3d8','#e0e8f2','#3aa8a8','#d46a3a'];
    colors.forEach((col, i) => {
      const x = 140 + i * 95;
      fctx.fillStyle = col;
      fctx.beginPath(); fctx.arc(x, 260, 11, 0, Math.PI * 2); fctx.fill();
    });
    fctx.fillStyle = '#f4d9a8';
    fctx.font = '13px system-ui';
    fctx.fillText('All six dragons lift the sanctuary into the living constellation.', 60, 320);
  }

  function closeFinale() {
    finaleOverlay.classList.remove('visible');
    // return to sanctuary (progress already complete)
    drawSanctuary();
  }

  function copyBlessing() {
    const b = window.SanctuaryState.get().blessing;
    if (!b) return;
    const txt = `${b.title}\n\n${b.text}\n\n— The Dragon Crew: Sanctuary of the Six Lights`;
    navigator.clipboard.writeText(txt).then(() => {
      showToast('Blessing copied. Share the light.');
    }).catch(() => {
      prompt('Copy this blessing:', txt);
    });
  }

  // Boot
  function boot() {
    // ensure state module loaded
    if (!window.SanctuaryState || !window.SanctuaryDragons) {
      console.error('Core modules missing. Check script order.');
      return;
    }
    start();
  }

  // Wait for all scripts (simple timeout safeguard)
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
