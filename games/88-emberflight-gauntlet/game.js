// Emberflight Gauntlet — FactoryX dragon-crew
// Bold arcade survival: ember canyon flight, banking, short tactical fire bursts,
// ring chaining for score, sparks/smoke/weighty feel, instant readable fail/retry.
// Reuses Skywake flight physics (dragon.js + input.js) as prior work foundation.
// All visuals/audio procedural; no external assets. Single strong core loop.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

let lastTime = 0;
let gameTime = 0;
let gamePhase = 'prelaunch'; // prelaunch | flying | crashed
let score = 0;
let chain = 0;
let maxChain = 0;
let ringsCleared = 0;
let hazardsBlasted = 0;
let breathCharges = 3;
let breathActive = 0;
let breathCooldown = 0;
let lastChainTime = 0;
let crashTimer = 0;
let restartReady = 0;
let mute = false;
let audioCtx = null;
let windNode = null;
let windGain = null;

// World elements (procedural gauntlet)
let emberRings = [];
let rockHazards = [];
let wallPhase = 0; // for winding canyon

// Particles for sparks, smoke, embers — core "weight, sparks, smoke" mandate
let particles = [];

// Camera + dragon (from prior)
let camX = 0, camY = 0, camZ = 0;

// HUD / feedback
let shake = 0;
let flash = 0; // red crash flash

// Background embers (ambient)
const ambientEmbers = [];

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Audio (lazy, gesture only; synth SFX + wind bed) ---
function initAudio() {
  if (audioCtx || mute) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Low wind/ember bed
    const bufSize = audioCtx.sampleRate * 3;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.6 + Math.sin(i / 400) * 0.2);
    }
    windNode = audioCtx.createBufferSource();
    windNode.buffer = buf;
    windNode.loop = true;
    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    windGain = audioCtx.createGain();
    windGain.gain.value = 0.035;
    const windComp = audioCtx.createDynamicsCompressor();
    windNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(windComp);
    windComp.connect(audioCtx.destination);
    windNode.start();
  } catch (e) { /* no audio */ }
}

function setMute(m) {
  mute = m;
  const el = document.getElementById('mute');
  if (el) el.textContent = mute ? '🔇' : '🔊';
  if (mute && audioCtx) {
    try { audioCtx.suspend(); } catch (_) {}
    if (windGain) windGain.gain.value = 0;
  } else if (!mute && audioCtx) {
    try { audioCtx.resume(); } catch (_) {}
  }
}

document.getElementById('mute').addEventListener('click', (e) => {
  e.stopPropagation();
  initAudio();
  setMute(!mute);
  if (!mute && windGain) windGain.gain.value = 0.035;
}, { passive: true });

function playTone(freq, dur, vol, type, pan = 0) {
  if (!audioCtx || mute) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const p = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    if (p) { p.pan.value = pan; osc.connect(p); p.connect(g); } else { osc.connect(g); }
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur + 0.02);
  } catch (_) {}
}

function playRing() {
  playTone(920, 0.18, 0.13, 'sine', -0.2);
  playTone(1320, 0.22, 0.09, 'triangle', 0.1);
  playTone(1880, 0.14, 0.06, 'sine', 0.3);
}
function playChainBonus(multi) {
  playTone(620 + multi * 80, 0.12, 0.1, 'sawtooth', 0);
  setTimeout(() => playTone(920 + multi * 60, 0.18, 0.08, 'sine', 0), 60);
}
function playFireBurst() {
  playTone(110, 0.7, 0.22, 'sawtooth', 0);
  playTone(180, 0.45, 0.14, 'square', -0.1);
  playTone(290, 0.35, 0.1, 'sawtooth', 0.15);
}
function playHazardBlast() {
  playTone(70, 0.5, 0.18, 'square', 0);
  playTone(140, 0.3, 0.11, 'sawtooth', 0.2);
}
function playWallScrape() {
  playTone(55, 0.4, 0.16, 'sawtooth', -0.3);
}
function playCrash() {
  playTone(48, 1.1, 0.28, 'sawtooth', 0);
  playTone(38, 0.9, 0.2, 'square', 0.1);
  setTimeout(() => playTone(95, 0.6, 0.15, 'sine', 0), 180);
}

// --- Particles (sparks, smoke, embers — the priority feel) ---
function emitParticle(x, y, z, vx, vy, vz, life, color, size, type) {
  particles.push({ x, y, z, vx, vy, vz, life, maxLife: life, color, size, type });
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.life -= dt;
    // drag + gravity for weight
    p.vx *= 0.985;
    p.vy *= 0.982;
    p.vy += (p.type === 'smoke' ? -2 : 9) * dt; // smoke rises, sparks/embers fall with weight
    p.vz *= 0.985;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles(camX, camY, camZ, camYaw) {
  for (const p of particles) {
    const pr = project(p.x, p.y, p.z, camX, camY, camZ, camYaw);
    if (!pr || pr.depth < 8 || pr.scale < 0.002) continue;
    const a = Math.max(0.04, (p.life / p.maxLife) * 0.95);
    const r = Math.max(0.6, p.size * pr.scale * 110);
    if (p.type === 'smoke') {
      ctx.fillStyle = `rgba(70,52,42,${a * 0.65})`;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, r * 1.3, 0, Math.PI * 2);
      ctx.fill();
      // soft core
      ctx.fillStyle = `rgba(110,78,58,${a * 0.35})`;
      ctx.beginPath();
      ctx.arc(pr.x - r * 0.2, pr.y - r * 0.3, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // spark / ember
      const hot = p.type === 'spark';
      ctx.fillStyle = hot ? `rgba(255,200,90,${a})` : `rgba(255,130,50,${a})`;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (hot && r > 1.2) {
        ctx.fillStyle = `rgba(255,240,200,${a * 0.7})`;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// --- Projection (kept from prior for consistent flight depth) ---
function project(x, y, z, camX, camY, camZ, camYaw) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  let dx = x - camX;
  let dy = y - camY;
  let dz = z - camZ;
  const cosY = Math.cos(-camYaw);
  const sinY = Math.sin(-camYaw);
  const rx = dx * cosY - dz * sinY;
  const rz = dx * sinY + dz * cosY;
  dx = rx; dz = rz;
  const focal = 520;
  const depth = dz + focal * 1.6;
  if (depth < 8) return null;
  const scale = focal / depth;
  const sx = W / 2 + dx * scale * 92;
  const sy = H / 2 - dy * scale * 92;
  return { x: sx, y: sy, scale, depth };
}

// --- Canyon walls (ember rock, winding, lava seams) ---
function getCanyonHalfWidth(z) {
  // Winding canyon, tighter in places for bank pressure
  const w = 280 + Math.sin(z * 0.0017 + wallPhase) * 68 + Math.sin(z * 0.0041) * 32;
  return Math.max(160, w);
}
function drawCanyonWalls(camX, camY, camZ, camYaw, W, H) {
  const steps = 9;
  const stepZ = 420;
  const baseZ = Math.floor(camZ / stepZ) * stepZ;

  ctx.strokeStyle = '#3a2118';
  ctx.lineWidth = 2;

  for (let i = -1; i <= steps; i++) {
    const z = baseZ + i * stepZ;
    const hw = getCanyonHalfWidth(z);
    const hwFar = getCanyonHalfWidth(z + stepZ * 0.6);

    // left wall
    const p0 = project(-hw, 120, z, camX, camY, camZ, camYaw);
    const p1 = project(-hw * 0.6, -180, z, camX, camY, camZ, camYaw);
    const p2 = project(-hwFar * 0.55, -190, z + stepZ * 0.6, camX, camY, camZ, camYaw);
    const p3 = project(-hwFar, 140, z + stepZ * 0.6, camX, camY, camZ, camYaw);
    if (p0 && p1 && p2 && p3) {
      // rock face
      ctx.fillStyle = '#22140f';
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      // lava seams
      ctx.strokeStyle = 'rgba(255,110,40,0.35)';
      ctx.beginPath();
      ctx.moveTo((p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      ctx.lineTo((p2.x + p3.x) * 0.5, (p2.y + p3.y) * 0.5);
      ctx.stroke();
    }

    // right wall (sym)
    const q0 = project(hw, 120, z, camX, camY, camZ, camYaw);
    const q1 = project(hw * 0.6, -180, z, camX, camY, camZ, camYaw);
    const q2 = project(hwFar * 0.55, -190, z + stepZ * 0.6, camX, camY, camZ, camYaw);
    const q3 = project(hwFar, 140, z + stepZ * 0.6, camX, camY, camZ, camYaw);
    if (q0 && q1 && q2 && q3) {
      ctx.fillStyle = '#22140f';
      ctx.beginPath();
      ctx.moveTo(q0.x, q0.y);
      ctx.lineTo(q1.x, q1.y);
      ctx.lineTo(q2.x, q2.y);
      ctx.lineTo(q3.x, q3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,110,40,0.35)';
      ctx.beginPath();
      ctx.moveTo((q0.x + q1.x) * 0.5, (q0.y + q1.y) * 0.5);
      ctx.lineTo((q2.x + q3.x) * 0.5, (q2.y + q3.y) * 0.5);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
}

// --- Route: ember rings + rock hazards (gauntlet pressure) ---
function spawnAhead(baseZ) {
  // Ember rings — chain targets
  for (let k = 0; k < 2; k++) {
    const z = baseZ + 520 + k * 720 + (Math.random() - 0.5) * 180;
    const hw = getCanyonHalfWidth(z) * 0.72;
    emberRings.push({
      x: (Math.random() - 0.5) * hw * 1.6,
      y: 180 + Math.random() * 220,
      z,
      radius: 38,
      cleared: false,
      glow: Math.random() * Math.PI * 2
    });
  }
  // Rock hazards — dodge or blast
  for (let k = 0; k < 1 + (score > 180 ? 1 : 0); k++) {
    const z = baseZ + 380 + k * 610 + Math.random() * 220;
    const hw = getCanyonHalfWidth(z) * 0.78;
    rockHazards.push({
      x: (Math.random() - 0.5) * hw * 1.5,
      y: 140 + Math.random() * 260,
      z,
      radius: 26 + Math.random() * 11,
      hp: 1,
      phase: Math.random() * 6
    });
  }
}

function initGauntlet() {
  emberRings = [];
  rockHazards = [];
  particles = [];
  wallPhase = Math.random() * 8;
  const startZ = 120;
  for (let i = 0; i < 5; i++) spawnAhead(startZ + i * 820);
  // ambient embers
  ambientEmbers.length = 0;
  for (let i = 0; i < 28; i++) {
    ambientEmbers.push({
      x: (Math.random() - 0.5) * 620,
      y: 80 + Math.random() * 420,
      z: 80 + Math.random() * 1400,
      drift: 0.6 + Math.random() * 1.4
    });
  }
}

function resetGame() {
  gamePhase = 'prelaunch';
  gameTime = 0;
  score = 0;
  chain = 0;
  maxChain = 0;
  ringsCleared = 0;
  hazardsBlasted = 0;
  breathCharges = 3;
  breathActive = 0;
  breathCooldown = 0;
  lastChainTime = 0;
  crashTimer = 0;
  restartReady = 0;
  shake = 0;
  flash = 0;
  dragon.reset();
  initGauntlet();
  if (windGain && !mute) windGain.gain.value = 0.035;
}

// Dragon instance from prior work (physics + weight)
const dragon = new Dragon();
// Start a bit forward
dragon.z = 40;
dragon.vx = 4.5;
dragon.vz = 7.5;

// Input
const input = new InputManager(canvas);

// --- Breath (short tactical bursts — the "act") ---
function tryFireBurst() {
  if (gamePhase !== 'flying') return;
  if (breathCharges <= 0 || breathActive > 0) return;
  breathCharges--;
  breathActive = 0.72;
  breathCooldown = 0.18;
  playFireBurst();
  // Initial powerful kick + smoke
  const fwd = Math.cos(dragon.pitch || 0);
  dragon.vx += Math.cos(dragon.yaw) * 11 * fwd;
  dragon.vz += Math.sin(dragon.yaw) * 11 * fwd;
  dragon.vy -= Math.sin(dragon.pitch || 0) * 5;
  // Big ember burst from head
  const hx = dragon.x + Math.cos(dragon.yaw) * 32;
  const hy = dragon.y - 6 + Math.sin(dragon.pitch || 0) * -10;
  const hz = dragon.z + Math.sin(dragon.yaw) * 32;
  for (let i = 0; i < 14; i++) {
    const spread = (Math.random() - 0.5) * 1.8;
    emitParticle(hx, hy, hz,
      Math.cos(dragon.yaw) * (28 + Math.random() * 18) + spread * 6,
      -6 + Math.random() * -14,
      Math.sin(dragon.yaw) * (28 + Math.random() * 18) + spread * 6,
      0.36 + Math.random() * 0.28, '#ffaa55', 2.2 + Math.random(), 'spark');
  }
  // smoke backblast
  for (let i = 0; i < 6; i++) {
    emitParticle(hx - Math.cos(dragon.yaw) * 18, hy + 4, hz - Math.sin(dragon.yaw) * 18,
      -Math.cos(dragon.yaw) * (6 + Math.random() * 4), -1 + Math.random() * -3,
      -Math.sin(dragon.yaw) * (6 + Math.random() * 4), 0.8 + Math.random() * 0.6, '#554433', 3.5, 'smoke');
  }
}

function updateBreath(dt) {
  if (breathActive > 0) {
    breathActive -= dt;
    // Continuous forward flame + sparks while active
    if (breathActive > 0.1 && Math.random() < 0.8) {
      const hx = dragon.x + Math.cos(dragon.yaw) * 30;
      const hy = dragon.y - 4;
      const hz = dragon.z + Math.sin(dragon.yaw) * 30;
      emitParticle(hx + (Math.random() - 0.5) * 6, hy + (Math.random() - 0.5) * 5, hz,
        Math.cos(dragon.yaw) * (32 + Math.random() * 14),
        -4 + Math.random() * -11,
        Math.sin(dragon.yaw) * (32 + Math.random() * 14),
        0.22 + Math.random() * 0.18, '#ffcc66', 1.6, 'spark');
    }
    // Blast hazards in cone
    blastHazardsInBreath();
  } else if (breathCooldown > 0) {
    breathCooldown -= dt;
  }
  // Slow recharge + bonus on good chain
  if (breathCharges < 3 && gamePhase === 'flying') {
    breathCooldown += dt;
    if (breathCooldown > 4.2 || (chain >= 3 && breathCooldown > 2.6)) {
      breathCharges = Math.min(3, breathCharges + 1);
      breathCooldown = 0;
    }
  }
}

function blastHazardsInBreath() {
  const bx = dragon.x + Math.cos(dragon.yaw) * 90;
  const by = dragon.y;
  const bz = dragon.z + Math.sin(dragon.yaw) * 90;
  for (const h of rockHazards) {
    if (h.hp <= 0) continue;
    const dx = h.x - bx;
    const dy = h.y - by;
    const dz = h.z - bz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 210 && dz > 10 && Math.abs(Math.atan2(dx, dz) - dragon.yaw) < 0.9) {
      h.hp = 0;
      hazardsBlasted++;
      score += 28 + chain * 4;
      playHazardBlast();
      // explosion
      for (let i = 0; i < 18; i++) {
        emitParticle(h.x, h.y, h.z,
          (Math.random() - 0.5) * 48, (Math.random() - 0.5) * 38 - 6, (Math.random() - 0.5) * 48,
          0.5 + Math.random() * 0.4, '#ff8833', 2.4, 'spark');
      }
      for (let i = 0; i < 5; i++) {
        emitParticle(h.x, h.y - 10, h.z, (Math.random() - 0.5) * 12, -8 - Math.random() * 10, (Math.random() - 0.5) * 12,
          1.1, '#664433', 4.5, 'smoke');
      }
    }
  }
}

// --- Collisions ---
function checkRingChain() {
  const now = gameTime;
  for (const r of emberRings) {
    if (r.cleared) continue;
    const dx = dragon.x - r.x;
    const dy = dragon.y - r.y;
    const dz = dragon.z - r.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < r.radius + 8) {
      r.cleared = true;
      ringsCleared++;
      const dt = now - lastChainTime;
      if (dt < 2.8 && chain > 0) {
        chain++;
      } else {
        chain = 1;
      }
      lastChainTime = now;
      maxChain = Math.max(maxChain, chain);
      score += 18 * chain;
      playRing();
      if (chain >= 2) playChainBonus(chain);
      // ring hit sparks + smoke
      for (let i = 0; i < 7; i++) {
        emitParticle(r.x, r.y, r.z, (Math.random() - 0.5) * 22, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 22,
          0.4, '#ffdd99', 1.8, 'spark');
      }
    }
  }
}

function checkHazardHits() {
  for (const h of rockHazards) {
    if (h.hp <= 0) continue;
    const dx = dragon.x - h.x;
    const dy = dragon.y - h.y;
    const dz = dragon.z - h.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < h.radius + 11) {
      h.hp = 0;
      triggerCrash('hazard');
      return true;
    }
  }
  return false;
}

function checkCanyonWalls() {
  const hw = getCanyonHalfWidth(dragon.z);
  const margin = 11;
  if (Math.abs(dragon.x) > hw - margin || dragon.y < 60 || dragon.y > 520) {
    // near wall scrape or floor/ceiling
    if (Math.abs(dragon.x) > hw - margin * 1.6) {
      // wall hit
      triggerCrash('wall');
    } else {
      triggerCrash('clip');
    }
    return true;
  }
  // near miss sparks on walls
  if (Math.abs(dragon.x) > hw - 38 && Math.random() < 0.6) {
    const side = Math.sign(dragon.x);
    emitParticle(dragon.x - side * 14, dragon.y + (Math.random() - 0.5) * 10, dragon.z,
      -side * (14 + Math.random() * 8), (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3,
      0.28, '#ffaa66', 1.4, 'spark');
  }
  return false;
}

function triggerCrash(reason) {
  if (gamePhase === 'crashed') return;
  gamePhase = 'crashed';
  crashTimer = 0;
  restartReady = 0;
  playCrash();
  flash = 1.0;
  shake = 18;
  // big impact burst
  for (let i = 0; i < 26; i++) {
    emitParticle(dragon.x, dragon.y, dragon.z,
      (Math.random() - 0.5) * 62, (Math.random() - 0.5) * 42 - 4, (Math.random() - 0.5) * 52,
      0.7 + Math.random() * 0.5, '#ff7722', 2.8, 'spark');
  }
  for (let i = 0; i < 11; i++) {
    emitParticle(dragon.x, dragon.y - 8, dragon.z, (Math.random() - 0.5) * 18, -12 - Math.random() * 8, (Math.random() - 0.5) * 18,
      1.4 + Math.random(), '#3a2a22', 5.5, 'smoke');
  }
}

// --- Draw dragon (powerful ember variant, banking visible) ---
function drawDragonEmber(W, H, d, breathing) {
  const cx = W / 2;
  const cy = H / 2 - 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-d.roll * 0.92);

  const wingY = Math.sin(d.wingPhase) * 17;
  const bank = Math.abs(d.roll);
  const glow = breathing ? 0.9 : 0.35 + Math.sin(gameTime * 4) * 0.1;

  // Body — weighty
  ctx.fillStyle = '#2a120b';
  ctx.beginPath();
  ctx.ellipse(0, 2, 21, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // belly plates
  ctx.fillStyle = '#3f1f14';
  ctx.beginPath();
  ctx.ellipse(2, 4, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head (powerful)
  ctx.fillStyle = '#2a120b';
  ctx.beginPath();
  ctx.ellipse(24, -3, 11, 7, d.pitch * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.strokeStyle = '#1a0a05';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(30, -7);
  ctx.lineTo(38, -15 - bank * 3);
  ctx.moveTo(29, -8);
  ctx.lineTo(36, -17 + bank * 2);
  ctx.stroke();

  // Head glow vents
  ctx.fillStyle = `rgba(255,120,40,${0.5 + glow * 0.4})`;
  ctx.beginPath();
  ctx.arc(31, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes — fierce
  ctx.fillStyle = breathing ? '#ffdd66' : '#ffbb55';
  ctx.beginPath();
  ctx.arc(33, -5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#331100';
  ctx.beginPath();
  ctx.arc(34, -5, 1.0, 0, Math.PI * 2);
  ctx.fill();

  // Flame from mouth when breathing
  if (breathing) {
    const fm = 0.6 + Math.sin(gameTime * 22) * 0.2;
    ctx.fillStyle = `rgba(255,180,60,${fm})`;
    ctx.beginPath();
    ctx.moveTo(38, -2);
    ctx.quadraticCurveTo(52, -6, 68 + Math.random() * 4, -1 + Math.random() * 2);
    ctx.quadraticCurveTo(52, 4, 38, 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,90,20,${fm * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(40, -1);
    ctx.quadraticCurveTo(56, -2, 62, 0);
    ctx.fill();
  }

  // Tail (heavy, slight wag)
  ctx.strokeStyle = '#2a120b';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(-20, 1);
  const tw = Math.sin(d.wingPhase * 0.65) * (5 + bank * 4);
  ctx.quadraticCurveTo(-46, tw * 0.6, -64, tw + 4);
  ctx.stroke();
  // tail ember ridge
  ctx.strokeStyle = `rgba(255,110,30,${0.4 + glow * 0.3})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-48, tw * 0.4, -66, tw + 3);
  ctx.stroke();

  // Wings — banked, ember edges
  const wA = 0.82 + bank * 0.3;
  ctx.fillStyle = '#1f0e09';
  ctx.beginPath();
  ctx.moveTo(4, -4);
  ctx.quadraticCurveTo(-12, -32 * wA + wingY * 0.9, -56, -38 + wingY);
  ctx.lineTo(-28, -7);
  ctx.closePath();
  ctx.fill();
  // ember rim
  ctx.strokeStyle = `rgba(255,140,50,${0.55 + glow * 0.25})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(3, -5);
  ctx.quadraticCurveTo(-14, -30 * wA + wingY * 0.9, -55, -37 + wingY);
  ctx.stroke();

  // lower wing
  ctx.fillStyle = '#1f0e09';
  ctx.beginPath();
  ctx.moveTo(4, 5);
  ctx.quadraticCurveTo(-11, 29 * wA - wingY * 0.6, -50, 27 - wingY * 0.6);
  ctx.lineTo(-24, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(255,120,40,${0.45 + glow * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.quadraticCurveTo(-13, 27 * wA - wingY * 0.6, -49, 26 - wingY * 0.6);
  ctx.stroke();

  // chest vents (power)
  ctx.fillStyle = `rgba(255,90,30,${0.6 + glow * 0.35})`;
  ctx.beginPath();
  ctx.arc(-2, 1, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- HUD (compact, readable, no overlap) ---
function drawHUD(W, H) {
  ctx.save();
  ctx.textAlign = 'left';
  // Score + chain
  ctx.fillStyle = '#ffcc88';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`SCORE ${Math.floor(score)}`, 16, 28);
  if (chain > 1) {
    const cCol = chain >= 4 ? '#ffdd66' : '#ffaa55';
    ctx.fillStyle = cCol;
    ctx.font = `bold ${14 + Math.min(chain, 5)}px monospace`;
    ctx.fillText(`CHAIN x${chain}`, 16, 46);
  }

  // Depth / progress feel
  ctx.fillStyle = '#aa6644';
  ctx.font = '12px monospace';
  ctx.fillText(`DEPTH ${Math.floor(dragon.z / 10)}`, 16, H - 18);

  // Breath charges (tactical, prominent)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffaa55';
  ctx.font = 'bold 13px monospace';
  let ch = '';
  for (let i = 0; i < 3; i++) ch += (i < breathCharges ? '🔥' : '·');
  ctx.fillText(`FIRE ${ch}`, W - 16, 28);

  // Tiny controls reminder (fades after launch)
  if (gamePhase === 'flying' && gameTime < 7.5) {
    ctx.fillStyle = 'rgba(200,140,80,0.55)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A D  BANK   SPACE/F  FIRE   W S  PITCH', W / 2, H - 22);
  }

  // Mute hint very subtle (only early)
  if (gameTime < 4 && gamePhase === 'flying') {
    ctx.fillStyle = 'rgba(180,110,60,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('MUTE TOP-RIGHT', W - 16, 46);
  }
  ctx.restore();
}

function drawPrelaunch(W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, H * 0.38, W, H * 0.32);
  ctx.fillStyle = '#ffcc88';
  ctx.font = `bold ${Math.min(28, W * 0.065)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('EMBERFLIGHT GAUNTLET', W / 2, H * 0.46);
  ctx.fillStyle = '#ddaa77';
  ctx.font = `${Math.min(15, W * 0.034)}px monospace`;
  ctx.fillText('TAP / CLICK / SPACE  —  BANK WITH A D OR DRAG', W / 2, H * 0.52);
  ctx.fillText('SHORT FIRE BURSTS — CHAIN THE RINGS', W / 2, H * 0.56);
}

function drawCrashScreen(W, H) {
  const a = Math.min(1, crashTimer / 0.6);
  ctx.fillStyle = `rgba(12,4,2,${0.82 * a})`;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = a;
  ctx.fillStyle = '#ff6644';
  ctx.font = `bold ${Math.min(42, W * 0.09)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('CRASHED', W / 2, H * 0.32);

  ctx.fillStyle = '#ffcc88';
  ctx.font = `bold ${Math.min(22, W * 0.048)}px monospace`;
  ctx.fillText(`SCORE  ${Math.floor(score)}`, W / 2, H * 0.42);

  ctx.fillStyle = '#ddaa77';
  ctx.font = `${Math.min(15, W * 0.033)}px monospace`;
  const lines = [
    `RINGS  ${ringsCleared}   BEST CHAIN x${maxChain}`,
    `BLASTED  ${hazardsBlasted}`,
    `DEPTH  ${Math.floor(dragon.z / 10)}`
  ];
  let ly = H * 0.50;
  for (const l of lines) {
    ctx.fillText(l, W / 2, ly);
    ly += 22;
  }

  const pulse = 0.55 + Math.sin(gameTime * 5) * 0.35;
  ctx.fillStyle = `rgba(255,180,90,${pulse})`;
  ctx.font = `bold ${Math.min(16, W * 0.036)}px monospace`;
  ctx.fillText('TAP OR SPACE TO RISE AGAIN', W / 2, H * 0.72);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// --- Main loop ---
function gameLoop(ts) {
  const raw = (ts - lastTime) / 1000;
  const dt = Math.min(raw || 0.016, 0.055);
  lastTime = ts;
  gameTime += dt;
  if (shake > 0) shake *= 0.82;
  if (flash > 0) flash -= dt * 1.6;

  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);

  const inputState = input.update();

  // Launch gesture starts audio + flight (protocol)
  if (gamePhase === 'prelaunch') {
    if (inputState.launch || (inputState.thrust || inputState.rollLeft || inputState.rollRight)) {
      initAudio();
      gamePhase = 'flying';
      dragon.vx = 5.2;
      dragon.vz = 8.5;
      dragon.vy = 1.5;
      if (windGain && !mute) windGain.gain.value = 0.055;
    }
  }

  if (gamePhase === 'flying') {
    // physics (prior work, tuned for canyon weight)
    dragon.update(dt, inputState);

    // fire
    if (inputState && (inputState.fire || (window._fireTap && window._fireTap > 0))) {
      tryFireBurst();
      if (window._fireTap) window._fireTap = 0;
    }
    // keyboard F / space as fire (space also for launch handled above)
    // handled via window key in addEvent

    updateBreath(dt);
    checkRingChain();
    checkHazardHits();
    checkCanyonWalls();

    // forward pressure + slow difficulty ramp
    const speed = Math.sqrt(dragon.vx * dragon.vx + dragon.vz * dragon.vz);
    if (speed < 7.5) {
      const boost = (7.5 - speed) * 0.6 * dt;
      dragon.vx += Math.cos(dragon.yaw) * boost;
      dragon.vz += Math.sin(dragon.yaw) * boost;
    }
    // ambient canyon speed feel
    if (Math.random() < 0.7) {
      dragon.vz += 0.6 * dt;
    }

    // spawn more content
    if (emberRings.length < 3 || (emberRings[emberRings.length - 1].z - dragon.z) < 920) {
      spawnAhead(dragon.z + 1100);
    }
    // cull behind
    emberRings = emberRings.filter(r => r.z > dragon.z - 120);
    rockHazards = rockHazards.filter(h => h.z > dragon.z - 80 && h.hp > 0);

    // wingtip smoke + embers for weight/speed feel
    if (dragon.speed > 4.5 && Math.random() < 0.75) {
      const wx = dragon.x - Math.cos(dragon.yaw) * 12 + (Math.random() - 0.5) * 4;
      const wy = dragon.y + (Math.random() - 0.5) * 3;
      const wz = dragon.z - Math.sin(dragon.yaw) * 12;
      emitParticle(wx, wy, wz, -dragon.vx * 0.3 + (Math.random() - 0.5) * 3, -1, -dragon.vz * 0.3 + (Math.random() - 0.5) * 3,
        0.7 + Math.random() * 0.5, '#554433', 3.2, 'smoke');
    }
    if (Math.random() < 0.5) {
      emitParticle(dragon.x + (Math.random() - 0.5) * 8, dragon.y - 2, dragon.z - 8,
        (Math.random() - 0.5) * 4, -3 - Math.random() * 3, (Math.random() - 0.5) * 4,
        0.9, '#ffaa44', 1.1, 'ember');
    }

    // ambient world embers drift
    for (const e of ambientEmbers) {
      e.z -= 18 * dt;
      if (e.z < dragon.z - 200) {
        e.z = dragon.z + 1100 + Math.random() * 400;
        e.x = (Math.random() - 0.5) * 520;
        e.y = 70 + Math.random() * 440;
      }
    }

    // crash safety
    if (dragon.y > 560 || dragon.y < 40) triggerCrash('bounds');
    if (dragon.stamina <= 0 && dragon.vy < -6) triggerCrash('exhaust');

    updateParticles(dt);

    // wind volume
    if (windGain && !mute) {
      windGain.gain.value = Math.min(0.09, 0.028 + dragon.speed * 0.006);
    }
  }

  if (gamePhase === 'crashed') {
    crashTimer += dt;
    restartReady = Math.max(restartReady, crashTimer - 0.9);
    updateParticles(dt * 0.7);
    if (windGain) windGain.gain.value *= 0.94;
  }

  // Camera chase (slightly bank-aware)
  camX = dragon.x - Math.sin(dragon.yaw) * 52 - dragon.roll * 6;
  camY = dragon.y - 18 - Math.sin(dragon.pitch || 0) * 12;
  camZ = dragon.z - Math.cos(dragon.yaw) * 58;

  // Draw
  // base ember sky / heat
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a0c08');
  g.addColorStop(0.32, '#2a140d');
  g.addColorStop(0.7, '#120a07');
  g.addColorStop(1, '#0a0503');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // distant heat glow
  const hg = ctx.createRadialGradient(W * 0.5, H * 0.42, 30, W * 0.5, H * 0.58, Math.max(W, H) * 0.7);
  hg.addColorStop(0, 'rgba(90,30,12,0.18)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, H);

  // shake
  ctx.save();
  if (shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * (shake * 0.6));
  }

  drawCanyonWalls(camX, camY, camZ, dragon.yaw, W, H);

  // ambient floating embers (parallax layers)
  for (const e of ambientEmbers) {
    const p = project(e.x, e.y, e.z, camX, camY, camZ, dragon.yaw);
    if (!p) continue;
    const r = Math.max(0.7, 1.4 * p.scale * 80);
    ctx.fillStyle = `rgba(255,140,60,${0.18 + Math.sin(gameTime * 3 + e.drift) * 0.08})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // rings + hazards
  for (const r of emberRings) {
    if (r.cleared) continue;
    const p = project(r.x, r.y, r.z, camX, camY, camZ, dragon.yaw);
    if (!p || p.depth > 2600) continue;
    const rad = r.radius * p.scale * 95;
    r.glow += dt * 3.2;
    const pulse = 0.6 + Math.sin(r.glow) * 0.4;
    // outer
    ctx.strokeStyle = `rgba(255,160,70,${0.35 * pulse})`;
    ctx.lineWidth = Math.max(1, 3 * p.scale * 70);
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 1.08, 0, Math.PI * 2);
    ctx.stroke();
    // ring
    ctx.strokeStyle = `rgba(255,200,110,${0.85 * pulse})`;
    ctx.lineWidth = Math.max(1.5, 2.5 * p.scale * 80);
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    ctx.stroke();
    // inner heat
    ctx.fillStyle = `rgba(255,110,30,${0.18 * pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const h of rockHazards) {
    if (h.hp <= 0) continue;
    const p = project(h.x, h.y, h.z, camX, camY, camZ, dragon.yaw);
    if (!p || p.depth > 2400) continue;
    const r = h.radius * p.scale * 90;
    h.phase += dt * 2.4;
    ctx.fillStyle = '#2a1812';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // facets
    ctx.strokeStyle = '#3f2218';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(h.phase) * r * 0.3, p.y - Math.sin(h.phase * 0.7) * r * 0.2, r * 0.7, 0, Math.PI * 1.6);
    ctx.stroke();
    // glow cracks
    ctx.strokeStyle = `rgba(255,90,30,${0.3 + Math.sin(h.phase * 1.8) * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(p.x - r * 0.6, p.y);
    ctx.lineTo(p.x + r * 0.5, p.y - r * 0.2);
    ctx.stroke();
  }

  drawParticles(camX, camY, camZ, dragon.yaw);

  const breathing = breathActive > 0.05;
  drawDragonEmber(W, H, dragon, breathing);

  // crash flash
  if (flash > 0.02) {
    ctx.fillStyle = `rgba(120,18,8,${flash * 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();

  // post shake HUD (no shake on UI)
  drawHUD(W, H);

  if (gamePhase === 'prelaunch') {
    drawPrelaunch(W, H);
  }
  if (gamePhase === 'crashed' && crashTimer > 0.45) {
    drawCrashScreen(W, H);
  }

  // low charge warning (readable)
  if (gamePhase === 'flying' && breathCharges === 0 && Math.sin(gameTime * 9) > 0) {
    ctx.fillStyle = 'rgba(255,80,30,0.75)';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NO FIRE — CHAIN RINGS TO RECHARGE', W / 2, H * 0.5 + 28);
  }

  requestAnimationFrame(gameLoop);
}

// Keyboard fire + restart (after gesture audio ok)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' || e.code === 'Space') {
    if (gamePhase === 'flying') {
      tryFireBurst();
      e.preventDefault();
    }
  }
  if ((e.code === 'Space' || e.code === 'Enter') && gamePhase === 'crashed' && restartReady > 0.2) {
    resetGame();
    e.preventDefault();
  }
  if (e.code === 'KeyM') {
    const el = document.getElementById('mute');
    if (el) el.click();
  }
}, { passive: false });

// Pointer tap for fire (anywhere not on mute) + launch
canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left);
  const py = (e.clientY - rect.top);
  const W = rect.width;
  const H = rect.height;
  if (py < 38 && px > W - 70) return; // mute area
  if (gamePhase === 'flying') {
    // tap upper-rightish or anywhere for fire
    tryFireBurst();
  } else if (gamePhase === 'crashed' && restartReady > 0.2) {
    resetGame();
  } else if (gamePhase === 'prelaunch') {
    // will be picked by input loop
  }
}, { passive: true });

// Touch specific extra fire zone (upper right)
canvas.addEventListener('touchstart', (e) => {
  initAudio();
  if (gamePhase === 'flying') {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.clientX > canvas.width * 0.62 && t.clientY < canvas.height * 0.38) {
        tryFireBurst();
        break;
      }
    }
  }
}, { passive: true });

// Initial
initGauntlet();
lastTime = performance.now();
requestAnimationFrame(gameLoop);

// Expose tiny hook for touch fire if needed
window._fireTap = 0;
