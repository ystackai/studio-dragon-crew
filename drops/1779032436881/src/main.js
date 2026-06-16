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

    // Environmental blessings (visual transformation)
    const comp = (id) => window.SanctuaryState.isComplete(id);
    // Water: gentle wave lines
    if (comp('water')) {
      ctx.strokeStyle = 'rgba(79,179,216,0.35)';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const wy = cy + 52 + k * 7;
        ctx.moveTo(cx - scale * 0.7, wy);
        for (let j = 0; j < 5; j++) {
          ctx.quadraticCurveTo(cx - scale * 0.4 + j * 48, wy + Math.sin(time * 2 + j) * 2.5, cx - scale * 0.7 + (j + 1) * 48, wy);
        }
        ctx.stroke();
      }
    }
    // Snow: soft falling dots
    if (comp('snow') && !reducedMotion) {
      ctx.fillStyle = 'rgba(224,232,242,0.4)';
      for (let s = 0; s < 14; s++) {
        const sx = ((s * 53 + time * 18) % (scale * 1.6)) + cx - scale * 0.8;
        const sy = cy + 20 + ((s * 31 + time * 11) % (scale * 0.5));
        ctx.fillRect(sx, sy, 1.6, 1.6);
      }
    }
    // Fire: extra warm glow on loom
    if (comp('fire')) {
      const fg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 92);
      fg.addColorStop(0, 'rgba(255,140,66,0.08)');
      fg.addColorStop(1, 'rgba(255,140,66,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2); ctx.fill();
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
    // more ambient as the sanctuary wakes (sound + visual)
    if (window.SanctuaryAudio && window.SanctuaryAudio.updateAmbientForBlessings) {
      window.SanctuaryAudio.updateAmbientForBlessings(count);
    }
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

    if (window.SanctuaryAudio && window.SanctuaryAudio.playShrineOpen) {
      window.SanctuaryAudio.playShrineOpen(dragon.element || dragonId);
    }

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
      if (currentDragon.id === 'lava' && !window.SanctuaryState.get().blessing) {
        // ensure a blessing exists even if user clicked Claim without preview tap; prefer latest ring choice
        const words = (window._lavaChosen && window._lavaChosen.adj) ? window._lavaChosen : { adj: 'Luminous', place: 'Sanctuary', vow: 'Remembers' };
        window.SanctuaryState.setBlessing(window.SanctuaryDragons.makeBlessing(words));
      }
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
    // prime ambient layer (grows with blessings)
    const st = window.SanctuaryState.get();
    if (window.SanctuaryAudio && window.SanctuaryAudio.updateAmbientForBlessings) {
      window.SanctuaryAudio.updateAmbientForBlessings(st.completed ? st.completed.length : 0);
    }
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
    console.log('%c[Sanctuary] The Dragon Crew: Sanctuary of the Six Lights ready — all six trials complete.', 'color:#9aa8b8');
  }

  // ===== FINALE (rich with Lava blessing + 6 dragons) =====
  function openFinale() {
    const state = window.SanctuaryState.get();
    if (!state.blessing) {
      const words = (window._lavaChosen && window._lavaChosen.adj) ? window._lavaChosen : { adj: 'Luminous', place: 'Sanctuary', vow: 'Remembers' };
      const b = window.SanctuaryDragons.makeBlessing(words);
      window.SanctuaryState.setBlessing(b);
    }
    const b = window.SanctuaryState.get().blessing;
    blessingTitle.textContent = b.title;
    blessingText.textContent = b.text || 'The six lights now travel together.';

    finaleOverlay.classList.add('visible');
    drawFinale(b);
  }

  function drawFinale(blessing) {
    const fctx = finaleCanvas.getContext('2d');
    const fw = finaleCanvas.width, fh = finaleCanvas.height;
    let t = 0;
    const colors = ['#ff8c42','#a8d5ff','#4fb3d8','#e0e8f2','#3aa8a8','#d46a3a'];
    const names = ['Fire','Ice','Water','Snow','Sea','Lava'];

    function frame() {
      t += 0.016;
      fctx.fillStyle = '#050b14';
      fctx.fillRect(0, 0, fw, fh);

      // rising constellation
      fctx.strokeStyle = 'rgba(244,217,168,0.45)';
      fctx.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        const x = 48 + (i % 7) * 110 + Math.sin(t * 0.6 + i) * 4;
        const y = 52 + Math.floor(i / 7) * 68 + (t * 6 + i * 3) % 18;
        fctx.beginPath(); fctx.arc(x, y % (fh * 0.72), 2.2, 0, Math.PI * 2); fctx.stroke();
      }

      // six dragons lifting (glowing orbs rising)
      colors.forEach((col, i) => {
        const x = 118 + i * 98;
        const y = 198 + Math.sin(t * 1.1 + i) * 18 - t * 4;
        const r = 13 + Math.sin(t * 2 + i) * 1.5;
        const g = fctx.createRadialGradient(x, y - 8, 4, x, y, r * 1.8);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(5,11,20,0)');
        fctx.fillStyle = g;
        fctx.beginPath(); fctx.arc(x, Math.max(60, y), r, 0, Math.PI * 2); fctx.fill();

        fctx.fillStyle = '#f0e6d8';
        fctx.font = '10px system-ui';
        fctx.fillText(names[i], x - 14, Math.max(60, y) + 26);
      });

      // sanctuary platform rising
      fctx.fillStyle = 'rgba(30,38,52,0.9)';
      fctx.beginPath();
      fctx.ellipse(fw / 2, 268 + Math.sin(t) * 3 - t * 1.5, 138, 28, 0, 0, Math.PI * 2);
      fctx.fill();
      fctx.strokeStyle = 'rgba(244,217,168,0.5)';
      fctx.lineWidth = 1.5;
      fctx.stroke();

      // blessing echo
      fctx.fillStyle = 'rgba(244,217,168,0.7)';
      fctx.font = '13px system-ui';
      fctx.fillText((blessing && blessing.title) || 'Luminous Sanctuary Remembers', 60, fh - 28);

      if (finaleOverlay.classList.contains('visible')) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
