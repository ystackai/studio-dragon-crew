// Skybound Dragon Runner — The Dragon Crew
// Self-contained 2D browser platform runner with limited expressive flight.
// Fixed timestep, canvas 2D, keyboard + touch, localStorage persist, WebAudio, reduced-motion safe.

(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  // Logical size (scaled to fit)
  const LOG_W = 960;
  const LOG_H = 540;
  let scale = 1;
  let viewW = LOG_W;
  let viewH = LOG_H;
  let offsetX = 0;
  let offsetY = 0;

  // Game constants (tuned for feel)
  const RUN_SPEED = 172;
  const ACCEL = 620;
  const FRICTION = 480;
  const GRAVITY = 980;
  const JUMP_VEL = -410;
  const COYOTE_TIME = 0.085;
  const JUMP_BUFFER = 0.095;
  const FLIGHT_DRAIN = 26;        // stamina per second while holding
  const FLIGHT_LIFT = 310;        // upward force when flying
  const FLIGHT_FORWARD = 52;      // extra forward when flapping
  const DIVE_ACCEL = 680;
  const MAX_VY = 640;
  const MAX_VX = 268;
  const STAMINA_MAX = 100;
  const STAMINA_REGEN = 24;       // per second on ground or in thermal
  const THERMAL_LIFT = 195;
  const THERMAL_REGEN = 40;

  // Level (handcrafted golden path, 6 beats)
  const LEVEL = {
    length: 2480,
    startX: 120,
    finishX: 2380,
    platforms: [
      { x: 0, y: 380, w: 380, h: 24 },      // intro flat
      { x: 420, y: 362, w: 210, h: 22 },    // small rise
      { x: 680, y: 395, w: 160, h: 20 },    // gap 1 — teaches jump
      { x: 900, y: 310, w: 240, h: 18 },    // first flight platform (wide gap before)
      { x: 1190, y: 378, w: 155, h: 18 },
      { x: 1400, y: 295, w: 175, h: 16 },   // rhythm 1
      { x: 1610, y: 352, w: 140, h: 16 },   // rhythm 2
      { x: 1790, y: 268, w: 165, h: 16 },   // rhythm 3 + dive setup
      { x: 2020, y: 335, w: 195, h: 18 },   // post wind ring
      { x: 2250, y: 248, w: 260, h: 20 }    // finale climb to gate
    ],
    runes: [
      { x: 280, y: 340, id: 0 },   // intro
      { x: 610, y: 310, id: 1 },   // pre gap
      { x: 980, y: 255, id: 2 },   // thermal reward
      { x: 1280, y: 330, id: 3 },  // rhythm
      { x: 1520, y: 240, id: 4 },
      { x: 1880, y: 210, id: 5 },  // high optional
      { x: 2120, y: 280, id: 6 },  // post dive
      { x: 2320, y: 185, id: 7 }   // finale
    ],
    thermals: [
      { x: 860, y: 280, r: 58 },   // first flight thermal
      { x: 1980, y: 245, r: 46 },  // post dive lift
      { x: 2190, y: 165, r: 52 }   // finale climb
    ],
    windRings: [
      { x: 1710, y: 305, w: 92, h: 68 } // dive then lift reward zone
    ],
    checkpoints: [120, 680, 1190, 1790, 2020] // safe respawn x
  };

  // Dragon blessings (Lava style — warm, uplifting, short)
  const BLESSINGS = [
    "The Fire Dragon’s courage lit your path.",
    "Ice Dragon’s clarity guided every landing.",
    "Water Dragon’s wind carried your wings.",
    "Snow Dragon softened every fall into flight.",
    "Sea Dragon sang the rhythm of your arc.",
    "Lava Dragon named this run: Skyfriend."
  ];

  // State
  let player = {
    x: LEVEL.startX, y: 354, vx: 0, vy: 0,
    w: 18, h: 26,
    onGround: false, lastGroundY: 0,
    stamina: STAMINA_MAX,
    facing: 1,
    flap: 0, // animation timer
    diveTime: 0
  };
  let camera = { x: 0, y: 0, shake: 0 };
  let gameState = 'start'; // start | running | ended
  let t = 0; // run time
  let runesCollected = 0;
  let score = 0;
  let best = { score: 0, time: 999, runes: 0 };
  let lastSafeX = LEVEL.startX;
  let mute = false;
  let debug = false;
  let reducedMotion = false;

  let keys = {};
  let touchState = { jump: false, fly: false, dive: false };
  let jumpBuffered = 0;
  let coyote = 0;
  let wasFlying = false;
  let inWindRing = false;
  let didDiveLift = false;
  let performanceNote = ''; // set on finish for magical end feedback (Lava)

  let particles = [];
  let ribbons = []; // flight trail points
  let runePop = []; // collected fx

  let audioCtx = null;
  let masterGain = null;

  let lastTime = 0;
  let accum = 0;
  const FIXED_DT = 1 / 90;

  // Persistence
  function loadPersist() {
    try {
      const b = localStorage.getItem('sdr_best');
      if (b) best = JSON.parse(b);
      const m = localStorage.getItem('sdr_mute');
      if (m !== null) mute = m === '1';
    } catch (e) {}
  }
  function saveBest(ns, nt, nr) {
    if (ns > best.score || (ns === best.score && nt < best.time)) {
      best.score = ns;
      best.time = nt;
      best.runes = nr;
      try { localStorage.setItem('sdr_best', JSON.stringify(best)); } catch (e) {}
    }
  }
  function saveMute() {
    try { localStorage.setItem('sdr_mute', mute ? '1' : '0'); } catch (e) {}
  }

  // Audio (lazy init on gesture)
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = mute ? 0 : 0.85;
      masterGain.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
  }
  function setMute(m) {
    mute = !!m;
    saveMute();
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = mute ? '🔇' : '🔊';
    if (masterGain) masterGain.gain.value = mute ? 0 : 0.85;
  }
  function playTone(freq, dur, type = 'sine', vol = 0.6, pan = 0) {
    if (!audioCtx || mute) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const p = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      const t0 = audioCtx.currentTime;
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      if (p) { p.pan.value = pan; o.connect(p); p.connect(g); } else { o.connect(g); }
      g.connect(masterGain);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  function playWhoosh(vol = 0.35) {
    if (!audioCtx || mute) return;
    try {
      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 820;
      const g = audioCtx.createGain();
      g.gain.value = vol;
      const t0 = audioCtx.currentTime;
      g.gain.linearRampToValueAtTime(0.0001, t0 + 0.55);
      noise.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      noise.start(t0);
    } catch (e) {}
  }
  function playRune() { playTone(880, 0.18, 'triangle', 0.5, 0.1); playTone(1320, 0.26, 'sine', 0.3, -0.1); }
  function playFlap() { playTone(520 + Math.random() * 40, 0.09, 'sawtooth', 0.35, 0.05); }
  function playLand() { playTone(180, 0.12, 'sine', 0.4, 0); }
  function playThermal() { playTone(720, 0.22, 'sine', 0.25, 0.2); }

  // Resize + reduced motion
  function resize() {
    const rect = canvas.getBoundingClientRect();
    viewW = Math.max(320, Math.floor(rect.width));
    viewH = Math.max(200, Math.floor(rect.height));
    canvas.width = viewW;
    canvas.height = viewH;
    scale = Math.min(viewW / LOG_W, viewH / LOG_H);
    offsetX = (viewW - LOG_W * scale) / 2;
    offsetY = (viewH - LOG_H * scale) / 2;
  }
  function checkReducedMotion() {
    const m = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = !!(m && m.matches);
    if (m) m.onchange = (e) => { reducedMotion = e.matches; };
  }

  // Input
  function setupInput() {
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (e.key.toLowerCase() === 'r' && gameState !== 'start') { resetRun(); e.preventDefault(); }
      if (e.key.toLowerCase() === 'm') { setMute(!mute); e.preventDefault(); }
      if ((e.key === ' ' || e.key === 'Enter') && gameState === 'start') { startRun(); e.preventDefault(); }
      if (e.key.toLowerCase() === 'd' && e.shiftKey) { debug = !debug; e.preventDefault(); }
      if ((e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') && gameState === 'running') {
        if (player.onGround || coyote > 0) doJump(); else jumpBuffered = JUMP_BUFFER;
      }
      if ((e.key.toLowerCase() === 'f' || e.key === 'Shift' || (e.key === ' ' && !player.onGround)) && gameState === 'running') {
        // flight handled in update via keys
      }
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    // Touch buttons
    const btnJump = document.getElementById('btn-jump');
    const btnFly = document.getElementById('btn-fly');
    const btnDive = document.getElementById('btn-dive');

    function bindTouch(el, name, isHold = false) {
      const press = (e) => { e.preventDefault(); touchState[name] = true; if (name === 'jump' && gameState === 'running') tryJump(); };
      const release = (e) => { e.preventDefault(); touchState[name] = false; };
      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
      if (isHold) {
        el.addEventListener('touchmove', (e) => { e.preventDefault(); touchState[name] = true; }, { passive: false });
      }
    }
    bindTouch(btnJump, 'jump');
    bindTouch(btnFly, 'fly', true);
    bindTouch(btnDive, 'dive');

    // Canvas tap fallback for jump (main area)
    canvas.addEventListener('touchstart', (e) => {
      if (gameState === 'start') { startRun(); return; }
      if (gameState === 'running') {
        const rect = canvas.getBoundingClientRect();
        const screenX = (e.touches[0].clientX - rect.left) - offsetX;
        const tx = screenX / scale;
        if (tx < LOG_W * 0.38) { touchState.jump = true; tryJump(); }
        else if (tx > LOG_W * 0.62) { touchState.dive = true; }
        else { touchState.fly = true; }
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { touchState.fly = false; touchState.dive = false; }, { passive: true });

    // Mouse click on canvas for desktop start/jump
    canvas.addEventListener('mousedown', (e) => {
      if (gameState === 'start') startRun();
      else if (gameState === 'running' && e.button === 0) {
        const rect = canvas.getBoundingClientRect();
        const screenX = (e.clientX - rect.left) - offsetX;
        const mx = screenX / scale;
        if (mx < LOG_W * 0.38) tryJump();
        else if (mx > LOG_W * 0.62) touchState.dive = true;
        else touchState.fly = true;
      }
    });
    window.addEventListener('mouseup', () => { touchState.fly = false; touchState.dive = false; });

    // Mute / restart buttons
    document.getElementById('mute-btn').addEventListener('click', () => { initAudio(); setMute(!mute); });
    document.getElementById('restart-btn').addEventListener('click', () => { if (gameState !== 'start') resetRun(); });
    document.getElementById('start-btn').addEventListener('click', startRun);
    document.getElementById('replay-btn').addEventListener('click', () => { hideEnd(); resetRun(); startRun(); });
    document.getElementById('menu-btn').addEventListener('click', () => { hideEnd(); showStart(); });
  }

  function tryJump() {
    if (player.onGround || coyote > 0) doJump();
    else jumpBuffered = JUMP_BUFFER;
  }
  function doJump() {
    player.vy = JUMP_VEL;
    player.onGround = false;
    coyote = 0;
    player.flap = 0.18;
    playFlap();
    spawnDust(player.x + player.w * 0.5, player.y + player.h, 5);
  }

  // Game flow
  function showStart() {
    gameState = 'start';
    document.getElementById('start-overlay').classList.add('active');
    document.getElementById('end-overlay').classList.remove('active');
  }
  function hideStart() { document.getElementById('start-overlay').classList.remove('active'); }
  function showEnd(finalTime, finalRunes, finalScore) {
    gameState = 'ended';
    saveBest(finalScore, finalTime, finalRunes);
    document.getElementById('end-time').textContent = finalTime.toFixed(1) + 's';
    document.getElementById('end-runes').textContent = `${finalRunes}/${LEVEL.runes.length}`;
    document.getElementById('end-score').textContent = String(finalScore).padStart(4, '0');
    document.getElementById('end-best').textContent = best.score > 0 ? String(best.score).padStart(4, '0') : '—';
    const bless = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
    const note = performanceNote || 'The sky remembers your wings.';
    document.getElementById('end-blessing').textContent = bless + ' ' + note;
    document.getElementById('end-overlay').classList.add('active');
  }
  function hideEnd() { document.getElementById('end-overlay').classList.remove('active'); }

  function startRun() {
    initAudio();
    hideStart();
    resetRun(true);
    gameState = 'running';
    t = 0;
    score = 0;
    runesCollected = 0;
    lastSafeX = LEVEL.startX;
    didDiveLift = false;
    performanceNote = '';
    updateHUD();
  }
  function resetRun(keepPos = false) {
    player.x = keepPos ? player.x : LEVEL.startX;
    player.y = keepPos ? Math.min(player.y, 360) : 354;
    player.vx = 60;
    player.vy = 0;
    player.onGround = true;
    player.stamina = STAMINA_MAX;
    player.flap = 0;
    player.diveTime = 0;
    camera.x = Math.max(0, player.x - 180);
    camera.y = 0;
    camera.shake = 0;
    t = 0;
    runesCollected = 0;
    score = 0;
    particles.length = 0;
    ribbons.length = 0;
    runePop.length = 0;
    jumpBuffered = 0;
    coyote = 0;
    wasFlying = false;
    inWindRing = false;
    didDiveLift = false;
    performanceNote = '';
    for (const r of LEVEL.runes) r.collected = false;
    if (!keepPos) lastSafeX = LEVEL.startX;
    updateHUD();
  }

  function finishRun() {
    const finalTime = t;
    const finalRunes = runesCollected;
    // Rewarding score: base (distance+style) + runes + time + dive-lift skill
    const runeBonus = finalRunes * 48;
    const timeBonus = Math.max(0, 380 - finalTime * 15);
    const skillBonus = didDiveLift ? 70 : 0;
    const finalScore = Math.floor(Math.max(0, score + runeBonus + timeBonus + skillBonus));
    // Magical performance note for one-more-run loop (Lava Dragon flavor)
    performanceNote = didDiveLift ? 'Dive-lift under the wind ring — the sky answered.' :
      (finalRunes >= 6 ? 'Every rune caught. The dragons flew with you.' :
      (finalTime < 22 ? 'Swift and clean. The thermals remember.' : 'A good line through the ruins.'));
    playTone(1240, 0.6, 'sine', 0.5, 0.1);
    playTone(780, 0.9, 'triangle', 0.35, -0.05);
    showEnd(finalTime, finalRunes, finalScore);
  }

  // Update (fixed dt)
  function update(dt) {
    if (gameState !== 'running') return;
    t += dt;

    const flyHeld = keys[' '] || keys['Spacebar'] || keys['Shift'] || keys['f'] || keys['F'] || touchState.fly;
    const diveHeld = keys['ArrowDown'] || keys['s'] || keys['S'] || touchState.dive;
    const wantJump = keys[' '] || keys['w'] || keys['W'] || keys['ArrowUp'] || jumpBuffered > 0;

    // Horizontal run
    const targetVx = RUN_SPEED;
    if (player.onGround) {
      player.vx = player.vx * 0.6 + targetVx * 0.4;
    } else {
      player.vx = Math.min(MAX_VX, player.vx + 18 * dt);
    }

    // Flight state
    let isFlying = false;
    if (flyHeld && player.stamina > 2 && !player.onGround) {
      isFlying = true;
      player.stamina = Math.max(0, player.stamina - FLIGHT_DRAIN * dt);
      const lift = FLIGHT_LIFT * (0.7 + 0.3 * (player.stamina / STAMINA_MAX));
      player.vy = Math.max(-MAX_VY * 0.6, player.vy - lift * dt);
      player.vx = Math.min(MAX_VX, player.vx + FLIGHT_FORWARD * dt);
      player.flap = Math.min(0.6, player.flap + dt * 4.2);
      if (!wasFlying && Math.random() < 0.6) playFlap();
      if (!reducedMotion && Math.random() < 0.8) {
        ribbons.push({ x: player.x - 6, y: player.y + 4, life: 0.28, vy: player.vy * 0.1 });
      }
    }

    // Dive / fast fall (skill expression + recovery)
    const diving = diveHeld && !player.onGround;
    if (diving) {
      player.vy = Math.min(MAX_VY, player.vy + DIVE_ACCEL * dt);
      player.diveTime = Math.min(0.9, player.diveTime + dt);
    } else {
      player.diveTime = Math.max(0, player.diveTime - dt * 3);
    }

    // Gravity only when not flying. Graceful release from flight (no hard drop).
    if (!isFlying && !player.onGround) {
      let gFactor = 1.0;
      if (wasFlying && !diving) {
        gFactor = 0.58;
        if (player.vy > 30) player.vy *= 0.76; // soften on release for graceful glide/fall
      }
      player.vy = Math.min(MAX_VY, player.vy + GRAVITY * gFactor * dt);
    }

    // Apply velocity
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Platform collision (top only, generous)
    player.onGround = false;
    let landed = false;
    let impactVy = 0;
    for (const p of LEVEL.platforms) {
      const px2 = p.x + p.w;
      const py2 = p.y + p.h;
      if (player.x + player.w > p.x && player.x < px2) {
        // forgiving landing: crossed or slightly overlapping top while descending
        const prevBottom = player.y + player.h - player.vy * dt;
        if ((player.y + player.h >= p.y && prevBottom <= p.y + 3) || (player.y + player.h > p.y && player.y + player.h < py2 && player.vy >= 0)) {
          if (player.vy >= 0) {
            impactVy = player.vy;
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
            landed = true;
            coyote = COYOTE_TIME;
            if (player.diveTime > 0.08) spawnDust(player.x + player.w * 0.5, player.y + player.h, 4);
          }
        }
      }
    }

    if (landed) {
      if (!reducedMotion) spawnDust(player.x + player.w * 0.5, player.y + player.h, 3 + (impactVy > 140 ? 2 : 0));
      if (Math.abs(impactVy) > 70) playLand();
      player.flap *= 0.4;
    }

    // Coyote / buffer
    if (player.onGround) {
      coyote = COYOTE_TIME;
      lastSafeX = Math.max(lastSafeX, player.x - 40);
      if (player.stamina < STAMINA_MAX) player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REGEN * dt * 1.6);
    } else {
      coyote = Math.max(0, coyote - dt);
    }
    if (jumpBuffered > 0) {
      jumpBuffered -= dt;
      if ((player.onGround || coyote > 0) && wantJump) {
        doJump();
        jumpBuffered = 0;
      }
    }

    // Collect runes
    for (const r of LEVEL.runes) {
      if (r.collected) continue;
      const dx = r.x - (player.x + player.w * 0.5);
      const dy = r.y - (player.y + player.h * 0.5);
      if (dx * dx + dy * dy < 28 * 28) {
        r.collected = true;
        runesCollected++;
        score += 85;
        player.stamina = Math.min(STAMINA_MAX, player.stamina + 18);
        playRune();
        if (!reducedMotion) {
          for (let i = 0; i < 7; i++) runePop.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 70, vy: -40 - Math.random() * 50, life: 0.6 + Math.random() * 0.3 });
        }
      }
    }

    // Thermals + wind ring (dive then lift skill)
    let inThermal = false;
    for (const th of LEVEL.thermals) {
      const dx = (player.x + player.w * 0.5) - th.x;
      const dy = (player.y + player.h * 0.5) - th.y;
      if (dx * dx + dy * dy < th.r * th.r) {
        inThermal = true;
        player.vy = Math.max(-MAX_VY * 0.55, player.vy - THERMAL_LIFT * dt * (1.0 - (Math.sqrt(dx * dx + dy * dy) / th.r) * 0.4));
        player.stamina = Math.min(STAMINA_MAX, player.stamina + THERMAL_REGEN * dt);
        if (Math.random() < 0.35) playThermal();
        if (!reducedMotion && Math.random() < 0.7) {
          particles.push({ x: th.x + (Math.random() - 0.5) * th.r * 0.9, y: th.y + (Math.random() - 0.5) * th.r * 0.6, vx: (Math.random() - 0.5) * 12, vy: -38 - Math.random() * 18, life: 0.35, type: 'wind' });
        }
      }
    }

    // Wind ring: if you dive into it and then fly, big lift + bonus (skill)
    let wasIn = inWindRing;
    inWindRing = false;
    for (const wr of LEVEL.windRings) {
      if (player.x + player.w > wr.x && player.x < wr.x + wr.w && player.y + player.h > wr.y && player.y < wr.y + wr.h) {
        inWindRing = true;
        if (player.diveTime > 0.06 && flyHeld && !wasIn) {
          player.vy = -460;
          player.stamina = Math.min(STAMINA_MAX, player.stamina + 22);
          score += 55;
          didDiveLift = true;
          if (!reducedMotion) {
            for (let i = 0; i < 11; i++) particles.push({ x: player.x + 10, y: player.y + 8, vx: (Math.random() - 0.5) * 90, vy: -90 - Math.random() * 70, life: 0.5, type: 'lift' });
          }
          playFlap();
          playTone(1050, 0.3, 'sine', 0.4);
        }
      }
    }

    // Bounds / fall recovery (gentle)
    if (player.y > 520) {
      // gentle recovery to last safe
      const cp = LEVEL.checkpoints.reduce((a, b) => Math.abs(b - player.x) < Math.abs(a - player.x) ? b : a);
      player.x = Math.max(cp - 30, lastSafeX);
      player.y = 280;
      player.vy = -60;
      player.vx = 40;
      player.stamina = Math.max(22, player.stamina - 12);
      if (!reducedMotion) camera.shake = 4;
      spawnDust(player.x + 8, 380, 6);
      camera.y *= 0.5; // damp vertical bias cleanly after recovery
    }
    if (player.x < 40) player.x = 40;

    // Finish gate (must thread the visible arch, not fly over or clip under)
    if (player.x + player.w * 0.5 > LEVEL.finishX && player.y > 175 && player.y < 305) {
      finishRun();
      return;
    }

    // Score tick (distance + style)
    score += (player.vx * 0.012) * dt;

    // Stamina regen on ground
    if (player.onGround && player.stamina < STAMINA_MAX) {
      player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REGEN * dt * 0.9);
    }

    // Camera (smooth but responsive follow + gentle vertical bias for high flight moments)
    const targetX = Math.max(0, Math.min(LEVEL.length - 280, player.x - 205));
    camera.x = camera.x * 0.76 + targetX * 0.24;
    // Subtle y follow: when runner climbs high (low y) on thermals/wind ring, ease camY up slowly so gate + upper platforms readable. No nausea, reduced-motion safe (still follows x fully).
    let targetY = 0;
    if (player.y < 235) {
      targetY = (player.y - 235) * 0.65;
    } else if (player.y > 410) {
      targetY = (player.y - 410) * 0.25;
    }
    targetY = Math.max(-95, Math.min(45, targetY));
    camera.y = camera.y * 0.82 + targetY * 0.18;
    if (camera.shake > 0) camera.shake *= 0.78;

    // Particles & ribbons
    if (!reducedMotion) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 28 * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = ribbons.length - 1; i >= 0; i--) {
        const r = ribbons[i];
        r.x += r.vx || -32 * dt;
        r.y += (r.vy || 0) + 18 * dt;
        r.life -= dt * 1.8;
        if (r.life <= 0) ribbons.splice(i, 1);
      }
      for (let i = runePop.length - 1; i >= 0; i--) {
        const rp = runePop[i];
        rp.x += rp.vx * dt;
        rp.y += rp.vy * dt;
        rp.vy += 60 * dt;
        rp.life -= dt;
        if (rp.life <= 0) runePop.splice(i, 1);
      }
    }

    wasFlying = isFlying;
    updateHUD();
  }

  function spawnDust(x, y, n = 4) {
    if (reducedMotion) return;
    for (let i = 0; i < n; i++) {
      particles.push({ x, y: y + 1, vx: (Math.random() - 0.5) * 48, vy: -18 - Math.random() * 22, life: 0.32 + Math.random() * 0.18, type: 'dust' });
    }
  }

  // Render
  function render() {
    ctx.save();
    ctx.clearRect(0, 0, viewW, viewH);

    // Scale + letterbox (use precomputed for input parity too)
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const camX = camera.x + (Math.random() - 0.5) * camera.shake * 0.6;
    const camY = camera.y + (Math.random() - 0.5) * camera.shake * 0.3;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, LOG_H);
    skyGrad.addColorStop(0, '#1a2744');
    skyGrad.addColorStop(0.38, '#243a5f');
    skyGrad.addColorStop(1, '#0f1f33');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, LOG_W, LOG_H);

    // Parallax clouds (subtle)
    ctx.fillStyle = 'rgba(230,240,255,0.08)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 187 + camX * (0.2 + i % 2 * 0.06)) % (LOG_W + 220)) - 110;
      const cy = 58 + i * 19;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 68 + i * 4, 19, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wind ribbons (background teaching lines) — more arcs to teach golden flight paths (Water flavor)
    ctx.strokeStyle = 'rgba(160,210,235,0.11)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const rx = 620 + i * 340 - camX * 0.3;
      ctx.beginPath();
      ctx.moveTo(rx, 210 + Math.sin(t * 1.2 + i) * 8);
      ctx.quadraticCurveTo(rx + 70, 195, rx + 160, 225 + Math.cos(t * 0.9) * 6);
      ctx.stroke();
    }
    // Extra expressive arcs near key flight beats (first thermal, rhythm, wind ring, finale)
    const extraArcs = [
      { bx: 780, by: 265, qx: 60, qy: -22, ex: 130, ey: 18 },   // pre-thermal lift hint
      { bx: 1350, by: 295, qx: 55, qy: -28, ex: 115, ey: 12 },  // rhythm arc
      { bx: 1680, by: 318, qx: 48, qy: -18, ex: 95, ey: -8 },   // into wind ring
      { bx: 2080, by: 240, qx: 52, qy: -32, ex: 108, ey: 22 }    // finale climb
    ];
    ctx.strokeStyle = 'rgba(140,200,230,0.09)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < extraArcs.length; k++) {
      const a = extraArcs[k];
      const bx = a.bx - camX * 0.28;
      const by = a.by + Math.sin(t * 1.6 + k) * 3;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + a.qx, by + a.qy, bx + a.ex, by + a.ey);
      ctx.stroke();
    }

    // Platforms (Ice crystalline + readable)
    ctx.fillStyle = '#4e5f7a';
    ctx.strokeStyle = '#7e96b3';
    ctx.lineWidth = 1.5;
    for (const p of LEVEL.platforms) {
      const x = p.x - camX;
      const y = p.y - camY;
      ctx.fillRect(x, y, p.w, p.h);
      ctx.strokeRect(x + 0.5, y + 0.5, p.w - 1, p.h - 1);
      // subtle top highlight
      ctx.fillStyle = 'rgba(180,205,235,0.25)';
      ctx.fillRect(x, y, p.w, 3);
      ctx.fillStyle = '#4e5f7a';
    }

    // Thermals (glowing)
    for (const th of LEVEL.thermals) {
      const x = th.x - camX;
      const y = th.y - camY;
      const r = th.r;
      const g = ctx.createRadialGradient(x, y, 6, x, y - 12, r);
      g.addColorStop(0, 'rgba(110,198,255,0.55)');
      g.addColorStop(0.6, 'rgba(110,198,255,0.18)');
      g.addColorStop(1, 'rgba(110,198,255,0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // up arrows
      ctx.fillStyle = 'rgba(200,235,255,0.7)';
      for (let k = 0; k < 3; k++) {
        const ay = y - 12 + k * 13;
        ctx.fillRect(x - 2, ay, 4, 7);
        ctx.fillRect(x - 7, ay + 3, 4, 4);
        ctx.fillRect(x + 3, ay + 3, 4, 4);
      }
    }

    // Wind ring (dive lift moment)
    for (const wr of LEVEL.windRings) {
      const x = wr.x - camX;
      const y = wr.y - camY;
      ctx.strokeStyle = 'rgba(255,200,120,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x, y, wr.w, wr.h);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,140,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, wr.w - 6, wr.h - 6);
    }

    // Runes (collectibles)
    for (const r of LEVEL.runes) {
      if (r.collected) continue;
      const x = r.x - camX;
      const y = r.y - camY;
      const pulse = Math.sin(t * 4.4 + r.id) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(244,211,94,${0.65 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, 7 + pulse * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 1.5, y - 4, 3, 8);
      ctx.fillRect(x - 4, y - 1.5, 8, 3);
    }

    // Particles (dust, wind, lift, rune pop)
    for (const p of particles) {
      const a = Math.max(0.1, p.life / 0.6);
      if (p.type === 'dust') ctx.fillStyle = `rgba(200,215,230,${a * 0.7})`;
      else if (p.type === 'wind') ctx.fillStyle = `rgba(130,210,255,${a})`;
      else ctx.fillStyle = `rgba(255,220,140,${a})`;
      ctx.fillRect(p.x - camX, p.y - camY, 2.5, 2.5);
    }
    for (const rp of runePop) {
      const a = rp.life / 0.7;
      ctx.fillStyle = `rgba(244,211,94,${a})`;
      ctx.fillRect(rp.x - camX - 1, rp.y - camY - 1, 2, 2);
    }
    // Flight ribbons
    if (ribbons.length) {
      ctx.strokeStyle = 'rgba(200,230,255,0.55)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let first = true;
      for (const r of ribbons) {
        const px = r.x - camX;
        const py = r.y - camY;
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Subtle Fire Dragon speed streaks (ground run only, readable momentum)
    if (player.onGround && player.vx > 140) {
      ctx.strokeStyle = 'rgba(255,140,66,0.22)';
      ctx.lineWidth = 2;
      const sbase = px - 14;
      for (let s = 0; s < 3; s++) {
        const sy = py + 6 + s * 2.5;
        const sl = 12 + (player.vx - 140) * 0.06 + Math.sin(t * 12 + s) * 2;
        ctx.beginPath();
        ctx.moveTo(sbase, sy);
        ctx.lineTo(sbase - sl, sy);
        ctx.stroke();
      }
    }

    // Player — small dragon-bonded runner (readable silhouette)
    const px = player.x - camX;
    const py = player.y - camY;
    const runCycle = (player.x * 0.028) % (Math.PI * 2);
    const legSwing = Math.sin(runCycle) * 0.6;
    const wingAngle = player.onGround ? 0.3 + Math.sin(runCycle * 1.7) * 0.15 : (player.flap * 1.6 - 0.4);

    // Body tilt for dive / flight readability (dive nose-down pose makes skill moment clear)
    let bodyTilt = 0;
    if (!player.onGround) {
      if (player.diveTime > 0.08) bodyTilt = Math.min(0.65, 0.22 + player.diveTime * 1.1);
      else if (player.vy > 95) bodyTilt = 0.14;
      else if (player.vy < -55) bodyTilt = -0.16;
    }

    ctx.save();
    ctx.translate(px + player.w * 0.5, py + player.h * 0.5);
    ctx.rotate(bodyTilt);

    // Tail
    ctx.strokeStyle = '#3f2a1f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-7, 3);
    ctx.quadraticCurveTo(-15 - player.vx * 0.012, 6 + Math.sin(t * 7) * 1.5, -18 - player.vx * 0.018, 2);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#c46a3a';
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f1f14';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head + snout
    ctx.fillStyle = '#d67d4a';
    ctx.beginPath();
    ctx.arc(7, -2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f2a1f';
    ctx.fillRect(11, -3, 4, 2.5); // snout

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(9, -3, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2a3a';
    ctx.beginPath();
    ctx.arc(9.6, -3, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Wing (expressive on flight)
    ctx.strokeStyle = '#2f2a3f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.quadraticCurveTo(-6 - wingAngle * 5, -11 - wingAngle * 7, -13 - wingAngle * 3, -4 + wingAngle * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,110,160,0.35)';
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(-6 - wingAngle * 5, -11 - wingAngle * 7);
    ctx.lineTo(-9 - wingAngle * 2, -2);
    ctx.fill();

    // Legs (run animation)
    ctx.strokeStyle = '#2f1f14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 6);
    ctx.lineTo(-3 + legSwing * 2.5, 13 + (player.onGround ? 0 : 1));
    ctx.moveTo(3, 6);
    ctx.lineTo(3 - legSwing * 2.2, 13 + (player.onGround ? 0 : 1));
    ctx.stroke();

    ctx.restore();

    // Small companion dragon silhouette (high, following) — reacts to player flight for presence
    const compX = px + 38 + Math.sin(t * 0.7) * 6;
    const compY = py - 38 - Math.cos(t * 0.5) * 4;
    const compFlap = (player.flap > 0.1 || !player.onGround) ? Math.sin(t * 9) * 0.6 + 0.3 : 0.15;
    ctx.fillStyle = 'rgba(160,130,90,0.32)';
    ctx.beginPath();
    ctx.ellipse(compX + 4, compY, 5, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // tiny wing on companion
    ctx.strokeStyle = 'rgba(120,100,80,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(compX + 1, compY - 1);
    ctx.lineTo(compX - 3 - compFlap * 4, compY - 4 - compFlap * 5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,130,90,0.55)';
    ctx.beginPath();
    ctx.arc(compX + 9, compY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Finish gate (bright, obvious)
    const gateX = LEVEL.finishX - camX;
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gateX, 185);
    ctx.lineTo(gateX, 295);
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,211,94,0.3)';
    ctx.fillRect(gateX - 4, 185, 9, 110);
    ctx.fillStyle = '#f4d35e';
    ctx.fillRect(gateX - 2, 180, 5, 8);
    ctx.fillRect(gateX - 2, 300, 5, 8);

    // Subtle vignette
    const vig = ctx.createRadialGradient(LOG_W * 0.5, LOG_H * 0.5, 280, LOG_W * 0.5, LOG_H * 0.5, 520);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LOG_W, LOG_H);

    ctx.restore();

    // Debug overlay
    if (debug) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8, 180, 58);
      ctx.fillStyle = '#0f0';
      ctx.font = '11px monospace';
      ctx.fillText(`x:${player.x.toFixed(0)} y:${player.y.toFixed(0)}`, 14, 22);
      ctx.fillText(`vx:${player.vx.toFixed(0)} vy:${player.vy.toFixed(0)}`, 14, 34);
      ctx.fillText(`stamina:${player.stamina.toFixed(0)} onG:${player.onGround}`, 14, 46);
      ctx.fillText(`fps ~${(1 / FIXED_DT).toFixed(0)}`, 14, 58);
    }
  }

  function updateHUD() {
    const timeEl = document.getElementById('time-val');
    const runesEl = document.getElementById('runes-val');
    const scoreEl = document.getElementById('score-val');
    const fill = document.getElementById('stamina-fill');
    if (timeEl) timeEl.textContent = t.toFixed(1);
    if (runesEl) runesEl.textContent = `${runesCollected}/${LEVEL.runes.length}`;
    if (scoreEl) scoreEl.textContent = String(Math.floor(score)).padStart(4, '0');
    if (fill) {
      const pct = Math.max(0, Math.min(100, Math.round(player.stamina)));
      const staminaBar = fill.parentElement;
      fill.style.width = pct + '%';
      fill.style.background = pct < 22 ? 'linear-gradient(90deg,#ff6b6b,#f4d35e)' : 'linear-gradient(90deg,#ffd166,#fff7d1)';
      if (staminaBar) {
        if (pct < 22) staminaBar.classList.add('low'); else staminaBar.classList.remove('low');
      }
    }
  }

  // Main loop
  function frame(now = 0) {
    if (!lastTime) lastTime = now;
    const realDt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    accum += realDt;
    while (accum >= FIXED_DT) {
      update(FIXED_DT);
      accum -= FIXED_DT;
    }

    render();

    // gentle progress hint on start
    if (gameState === 'start') {
      ctx.fillStyle = 'rgba(244,211,94,0.25)';
      ctx.font = '600 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Tap anywhere or press Space to begin', viewW / 2, viewH - 42);
    }

    requestAnimationFrame(frame);
  }

  // Boot
  function boot() {
    loadPersist();
    checkReducedMotion();
    resize();
    window.addEventListener('resize', resize);

    // ?debug=1 enables collision/FPS overlay (per spec, keyboard D+Shift also works)
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('debug') === '1') debug = true;
    } catch (e) {}

    setupInput();

    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.textContent = mute ? '🔇' : '🔊';

    // Initial player position
    player.x = LEVEL.startX;
    player.y = 354;
    player.vx = 52;
    player.onGround = true;
    camera.x = 40;
    camera.y = 0;

    // Seed a couple of background particles
    for (let i = 0; i < 9; i++) {
      particles.push({ x: 200 + Math.random() * 400, y: 120 + Math.random() * 160, vx: -18, vy: -12, life: 1.2 + Math.random(), type: 'wind' });
    }

    updateHUD();
    showStart();

    // Gentle auto-hint for first load (no tutorial)
    setTimeout(() => {
      if (gameState === 'start' && !reducedMotion) {
        const c = document.getElementById('game');
        if (c) c.style.boxShadow = '0 0 0 1px rgba(244,211,94,0.2) inset';
      }
    }, 1200);

    requestAnimationFrame(frame);

    // Keyboard hint once
    console.log('%c[Skybound] R=restart • M=mute • D+Shift or ?debug=1=debug • fully keyboard + touch playable', 'color:#5a7a8a');
  }

  // Expose tiny API for manual verification if needed
  window.SDR = { reset: () => resetRun(), getState: () => ({ gameState, t, runesCollected, score, playerStamina: player.stamina }) };

  boot();
})();