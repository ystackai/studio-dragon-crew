const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let gameLaunched = false;
let gameTime = 0;
let gamePhase = 'prelaunch';
let ringsCleared = 0;
let breathUsed = false;
let breathTimer = 0;
let thermalHitTimer = 0;
let landed = false;
let crashTimer = 0;
let smoothnessScore = 0;
let smoothnessCount = 0;
let restartFlash = 0;

// Route elements
let skyRings = [];
let thermalColumns = [];
let landingPerch = null;

// Background elements
const clouds = [];
const mountains = [];
const bgStars = [];

// Audio context (lazy init on first interaction)
let audioCtx = null;
let windGain = null;
let windPlaying = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

   // Wind bed
  const bufSize = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
   }
  const windNode = audioCtx.createBufferSource();
  windNode.buffer = buf;
  windNode.loop = true;
  const windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 300;
  windGain = audioCtx.createGain();
  windGain.gain.value = 0.08;
  windNode.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(audioCtx.destination);
  windNode.start();
  windPlaying = true;
}

function playTone(freq, dur, vol, type) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
   } catch (e) { /* ignore audio errors */ }
}

function playRingChime() {
  playTone(1200, 0.6, 0.12, 'sine');
  setTimeout(() => playTone(1600, 0.5, 0.1, 'sine'), 80);
  setTimeout(() => playTone(2000, 0.4, 0.08, 'sine'), 160);
}

function playThermalShimmer() {
  playTone(800, 1.0, 0.06, 'triangle');
  playTone(1100, 0.8, 0.04, 'triangle');
}

function playBreathBurst() {
  playTone(200, 1.5, 0.15, 'sawtooth');
  playTone(350, 1.0, 0.1, 'sine');
}

function playLanding() {
  playTone(600, 0.3, 0.12, 'sine');
  setTimeout(() => playTone(800, 0.3, 0.1, 'sine'), 100);
  setTimeout(() => playTone(1000, 0.5, 0.08, 'sine'), 200);
}

function playCrash() {
  playTone(150, 0.8, 0.15, 'sawtooth');
  playTone(100, 1.0, 0.1, 'square');
}

// Wing whoosh based on flap speed
let lastWingWhoosh = 0;
function wingWhoosh(dragon) {
  if (!audioCtx || dragon.flapSpeed < 6) return;
  const now = gameTime;
  if (now - lastWingWhoosh < 0.3) return;
  lastWingWhoosh = now;
  playTone(300 + dragon.flapSpeed * 10, 0.15, 0.03, 'triangle');
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initBackground() {
  for (let i = 0; i < 60; i++) {
    clouds.push({
      x: Math.random() * 3000 - 1500,
      y: Math.random() * 600 + 100,
      z: Math.random() * 3000 - 1500,
      size: Math.random() * 80 + 40,
      opacity: Math.random() * 0.3 + 0.05,
      drift: Math.random() * 0.3 + 0.1,
     });
   }

  for (let i = 0; i < 20; i++) {
    mountains.push({
      x: Math.random() * 4000 - 2000,
      z: Math.random() * 4000 - 2000,
      height: Math.random() * 200 + 80,
      width: Math.random() * 150 + 80,
      color: `hsl(${20 + Math.random() * 30}, ${20 + Math.random() * 20}%, ${10 + Math.random() * 15}%)`,
     });
   }

  for (let i = 0; i < 100; i++) {
    bgStars.push({
      x: Math.random(),
      y: Math.random() * 0.5,
      size: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
     });
   }
}

function initRoute() {
  skyRings = [];
  thermalColumns = [];

   // Route: rings along a winding path forward
  const path = [
    { dx: 0, dy: 350, dz: 300 },
    { dx: -150, dy: 400, dz: 700 },
    { dx: 200, dy: 300, dz: 1200 },
    { dx: 100, dy: 500, dz: 1700 },
    { dx: -200, dy: 350, dz: 2300 },
    { dx: 50, dy: 450, dz: 2900 },
   ];

  path.forEach((p) => {
    skyRings.push({
      x: p.dx,
      y: p.dy,
      z: p.dz,
      radius: 40,
      cleared: false,
      glowPhase: Math.random() * Math.PI * 2,
     });
   });

   // Thermals along the route
  const thermalSpots = [
    { x: -50, z: 500 },
    { x: 120, z: 950 },
    { x: -100, z: 1500 },
    { x: 80, z: 2000 },
    { x: -30, z: 2600 },
   ];

  thermalSpots.forEach((s) => {
    thermalColumns.push({
      x: s.x,
      z: s.z,
      radius: 80,
      lift: 4,
      shimmerPhase: Math.random() * Math.PI * 2,
     });
   });

   // Landing perch at the end
  landingPerch = {
    x: 50,
    y: 200,
    z: 3400,
    radius: 50,
    glowPhase: 0,
   };
}

function resetGame() {
  gameLaunched = false;
  gameTime = 0;
  gamePhase = 'prelaunch';
  ringsCleared = 0;
  breathUsed = false;
  breathTimer = 0;
  thermalHitTimer = 0;
  landed = false;
  crashTimer = 0;
  smoothnessScore = 0;
  smoothnessCount = 0;
  restartFlash = 0;
  dragon.reset();
  initRoute();
}

initBackground();
initRoute();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const input = new InputManager(canvas);
const dragon = new Dragon();

// --- Rendering helpers ---

function project(x, y, z, camX, camY, camZ, camYaw) {
  const W = canvas.width;
  const H = canvas.height;

   // Translate relative to camera
  let dx = x - camX;
  let dy = y - camY;
  let dz = z - camZ;

   // Rotate around Y axis (yaw)
  const cosY = Math.cos(-camYaw);
  const sinY = Math.sin(-camYaw);
  const rx = dx * cosY - dz * sinY;
  const rz = dx * sinY + dz * cosY;
  dx = rx;
  dz = rz;

   // Perspective projection
  const focal = 500;
  const depth = dz + focal * 2;
  if (depth < 10) return null;
  const scale = focal / depth;

  const sx = W / 2 + dx * scale * 100;
  const sy = H / 2 - dy * scale * 100;

  return { x: sx, y: sy, scale: scale, depth: depth };
}

function drawSky(W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(0.3, '#1a1040');
  grad.addColorStop(0.6, '#2a1535');
  grad.addColorStop(0.8, '#4a2040');
  grad.addColorStop(1, '#602830');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars(dt) {
  for (const s of bgStars) {
    s.twinkle += dt * 2;
    const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
    ctx.fillStyle = `rgba(220, 210, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x * canvas.width, s.y * canvas.height, s.size, 0, Math.PI * 2);
    ctx.fill();
   }
}

function drawWater(W, H, camX, camY, camZ, camYaw) {
  const waterY = -20;
  const horizonY = project(0, waterY, 200, camX, camY, camZ, camYaw);

  if (!horizonY) return;

  const yScreen = horizonY.y;
  const grad = ctx.createLinearGradient(0, yScreen, 0, H);
  grad.addColorStop(0, '#0a3040');
  grad.addColorStop(0.3, '#0a4060');
  grad.addColorStop(1, '#051520');
  ctx.fillStyle = grad;
  ctx.fillRect(0, yScreen, W, H - yScreen);

  const t = gameTime * 0.5;
  for (let i = 0; i < 15; i++) {
    const sx = ((i * 137.5 + t * 200) % W + W) % W;
    const sy = yScreen + (i * 31.7) % (H - yScreen);
    const shimmer = 0.05 + Math.sin(t * 3 + i) * 0.03;
    ctx.fillStyle = `rgba(80, 180, 200, ${shimmer})`;
    ctx.fillRect(sx, sy, 30 + Math.sin(t + i * 2) * 15, 2);
   }
}

function drawClouds(camX, camY, camZ, camYaw) {
  for (const c of clouds) {
    c.x += c.drift;
    if (c.x > 1500) c.x = -1500;
    if (c.x < -1500) c.x = 1500;

    const p = project(c.x, c.y, c.z, camX, camY, camZ, camYaw);
    if (!p || p.scale < 0.01 || p.depth > 3000) continue;

    const r = c.size * p.scale * 100;
    if (r < 1) continue;

    const frostAlpha = c.opacity * Math.min(p.scale * 5, 1);
    ctx.fillStyle = `rgba(200, 210, 230, ${frostAlpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(180, 200, 240, ${frostAlpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(p.x - r * 0.3, p.y - r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
   }
}

function drawMountains(camX, camY, camZ, camYaw) {
  for (const m of mountains) {
    const p = project(m.x, 0, m.z, camX, camY, camZ, camYaw);
    if (!p || p.scale < 0.01 || p.depth > 4000) continue;

    const baseY = p.y;
    const w = m.width * p.scale * 100;
    const h = m.height * p.scale * 100;
    if (w < 2 || h < 1) continue;

    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, baseY);
    ctx.lineTo(p.x, baseY - h);
    ctx.lineTo(p.x + w / 2, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 80, 30, ${0.15 * Math.min(p.scale * 3, 1)})`;
    ctx.beginPath();
    ctx.arc(p.x, baseY - h, Math.max(2, w * 0.15), 0, Math.PI * 2);
    ctx.fill();
   }
}

function drawThermalColumns(camX, camY, camZ, camYaw) {
  for (const tc of thermalColumns) {
    const p = project(tc.x, 300, tc.z, camX, camY, camZ, camYaw);
    if (!p || p.scale < 0.02 || p.depth > 3500) continue;

    tc.shimmerPhase += 0.02;
    const shimmer = 0.1 + Math.sin(tc.shimmerPhase) * 0.08;
    const r = tc.radius * p.scale * 100;

     // Rising shimmer column
    ctx.strokeStyle = `rgba(150, 220, 255, ${shimmer})`;
    ctx.lineWidth = Math.max(1, r * 0.3);
    const h = 300 * p.scale * 100;
    ctx.beginPath();
    ctx.moveTo(p.x - r, p.y + h * 0.5);
    ctx.lineTo(p.x + r * 0.5, p.y);
    ctx.lineTo(p.x - r * 0.3, p.y - h * 0.3);
    ctx.stroke();

     // Shimmer dots
    for (let i = 0; i < 5; i++) {
      const dy = (Math.sin(gameTime * 2 + i * 1.5) * 0.5 + 0.5) * h;
      const dx = Math.sin(gameTime * 1.5 + i * 2) * r * 0.5;
      ctx.fillStyle = `rgba(180, 230, 255, ${shimmer * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x + dx, p.y + h * 0.5 - dy, Math.max(1, 3 * p.scale * 50), 0, Math.PI * 2);
      ctx.fill();
     }
   }
}

function drawSkyRings(camX, camY, camZ, camYaw) {
  for (const ring of skyRings) {
    if (ring.cleared) continue;

    const p = project(ring.x, ring.y, ring.z, camX, camY, camZ, camYaw);
    if (!p || p.scale < 0.01 || p.depth > 3500) continue;

    ring.glowPhase += 0.03;
    const pulse = 0.5 + Math.sin(ring.glowPhase) * 0.3;
    const r = ring.radius * p.scale * 100;

     // Outer ring
    ctx.strokeStyle = `rgba(200, 170, 255, ${pulse})`;
    ctx.lineWidth = Math.max(1, 3 * p.scale * 100);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();

     // Pearl highlight
    const glowGrad = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r);
    glowGrad.addColorStop(0, `rgba(220, 210, 255, ${pulse * 0.2})`);
    glowGrad.addColorStop(1, `rgba(200, 170, 255, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

     // Inner pearl dot
    ctx.fillStyle = `rgba(255, 240, 255, ${pulse * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, 4 * p.scale * 100), 0, Math.PI * 2);
    ctx.fill();
   }
}

function drawLandingPerch(camX, camY, camZ, camYaw) {
  if (!landingPerch) return;
  const p = project(landingPerch.x, landingPerch.y, landingPerch.z, camX, camY, camZ, camYaw);
  if (!p || p.scale < 0.01 || p.depth > 3500) return;

  landingPerch.glowPhase += 0.04;
  const pulse = 0.4 + Math.sin(landingPerch.glowPhase) * 0.3;
  const r = landingPerch.radius * p.scale * 100;

   // Glowing landing circle
  const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  glowGrad.addColorStop(0, `rgba(255, 200, 120, ${pulse * 1.2})`);
  glowGrad.addColorStop(0.5, `rgba(255, 150, 80, ${pulse * 0.5})`);
  glowGrad.addColorStop(1, `rgba(255, 100, 50, 0)`);
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

   // Lava ring around edge
  ctx.strokeStyle = `rgba(255, 120, 50, ${pulse})`;
  ctx.lineWidth = Math.max(1, 4 * p.scale * 100);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDragon(W, H, d) {
  const cx = W / 2;
  const cy = H / 2 - 10;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-d.roll);

  const wingY = Math.sin(d.wingPhase) * 15;

   // Body
  ctx.fillStyle = '#1a1025';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

   // Head
  ctx.fillStyle = '#221530';
  ctx.beginPath();
  ctx.ellipse(22, -4, 10, 6, d.pitch * 0.5, 0, Math.PI * 2);
  ctx.fill();

   // Eyes
  ctx.fillStyle = '#ffddaa';
  ctx.beginPath();
  ctx.arc(28, -6, 2, 0, Math.PI * 2);
  ctx.fill();

   // Tail
  ctx.strokeStyle = '#1a1025';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  const tailWag = Math.sin(d.wingPhase * 0.7) * 5;
  ctx.quadraticCurveTo(-40, tailWag, -55, tailWag + 5);
  ctx.stroke();

   // Wings - top
  ctx.fillStyle = 'rgba(25, 15, 35, 0.9)';
  ctx.beginPath();
  ctx.moveTo(5, -5);
  ctx.quadraticCurveTo(-10, -30 + wingY, -50, -35 + wingY);
  ctx.lineTo(-25, -8);
  ctx.closePath();
  ctx.fill();

   // Wings - bottom
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.quadraticCurveTo(-10, 30 - wingY * 0.7, -45, 25 - wingY * 0.7);
  ctx.lineTo(-20, 3);
  ctx.closePath();
  ctx.fill();

   // Wing highlight
  ctx.strokeStyle = 'rgba(100, 200, 220, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -5);
  ctx.quadraticCurveTo(-10, -30 + wingY, -50, -35 + wingY);
  ctx.stroke();

   // Core glow
  const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
  glowGrad.addColorStop(0, 'rgba(180, 130, 200, 0.25)');
  glowGrad.addColorStop(1, 'rgba(180, 130, 200, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

   // Fire breath VFX
  if (breathTimer > 0 && breathMode === 'fire') {
    const breathAlpha = Math.min(breathTimer / 2, 1);
    for (let i = 0; i < 6; i++) {
      const bx = 30 + i * 12 + Math.sin(gameTime * 10 + i) * 5;
      const by = -4 + Math.cos(gameTime * 8 + i) * 4;
      const bs = 4 + Math.sin(gameTime * 6 + i * 0.7) * 3;
      ctx.fillStyle = `rgba(255, ${80 + i * 25}, ${i * 15}, ${breathAlpha * (0.5 - i * 0.07)})`;
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(1, bs), 0, Math.PI * 2);
      ctx.fill();
     }
   }

   // Ice breath VFX
  if (breathTimer > 0 && breathMode === 'ice') {
    const breathAlpha = Math.min(breathTimer / 2, 1);
    for (let i = 0; i < 5; i++) {
      const bx = 30 + i * 10;
      const by = -4 + Math.sin(gameTime * 7 + i) * 3;
      ctx.strokeStyle = `rgba(150, 220, 255, ${breathAlpha * (0.6 - i * 0.08)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 15, by + Math.sin(gameTime * 9 + i) * 8);
      ctx.stroke();
     }
   }

   // Water breath VFX
  if (breathTimer > 0 && breathMode === 'water') {
    const breathAlpha = Math.min(breathTimer / 2, 1);
    for (let i = 0; i < 5; i++) {
      const bx = 30 + i * 12;
      const by = -4 + Math.sin(gameTime * 5 + i * 1.3) * 5;
      ctx.fillStyle = `rgba(60, 180, 220, ${breathAlpha * (0.5 - i * 0.06)})`;
      ctx.beginPath();
      ctx.arc(bx, by, 4 + Math.sin(gameTime * 4 + i) * 2, 0, Math.PI * 2);
      ctx.fill();
     }
   }

   // Sea/pearl breath VFX
  if (breathTimer > 0 && breathMode === 'sea') {
    const breathAlpha = Math.min(breathTimer / 2, 1);
    for (let i = 0; i < 7; i++) {
      const angle = gameTime * 4 + i * 0.8;
      const bx = 30 + i * 8 + Math.cos(angle) * 5;
      const by = -4 + Math.sin(angle) * 8;
      ctx.fillStyle = `rgba(220, 200, 255, ${breathAlpha * (0.4 - i * 0.04)})`;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
     }
   }

  ctx.restore();
}

let breathMode = null;

function drawHUD() {
  const W = canvas.width;
  const H = canvas.height;
  const pad = 16;
  const barW = Math.min(200, W * 0.3);

   // Speed indicator
  const speedPct = Math.min(dragon.speed / 12, 1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(pad, pad, barW + 60, 24);
  ctx.fillStyle = '#aab';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SPD', pad + 8, pad + 17);
  const speedGrad = ctx.createLinearGradient(pad + 48, 0, pad + 48 + barW, 0);
  speedGrad.addColorStop(0, '#2a6050');
  speedGrad.addColorStop(1, '#50d0c0');
  ctx.fillStyle = speedGrad;
  ctx.fillRect(pad + 48, pad + 5, barW * speedPct, 14);

   // Stamina bar
  const staminaPct = dragon.stamina / dragon.maxStamina;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(pad, pad + 32, barW + 60, 24);
  ctx.fillStyle = '#aab';
  ctx.fillText('STM', pad + 8, pad + 49);
  const staminaColor = staminaPct > 0.3 ? '#c06080' : '#ff4040';
  ctx.fillStyle = staminaColor;
  ctx.fillRect(pad + 48, pad + 37, barW * staminaPct, 14);

   // Stamina warning flash
  if (dragon.stamina < 20 && gamePhase === 'flying') {
    const blink = Math.sin(gameTime * 8) > 0;
    if (blink) {
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad + 47, pad + 36, barW, 16);
     }
   }

   // Altitude
  if (gamePhase === 'flying' || gamePhase === 'landing') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(pad, pad + 64, 80, 24);
    ctx.fillStyle = '#ccd';
    ctx.font = '12px monospace';
    ctx.fillText(`ALT ${Math.round(dragon.y)}`, pad + 8, pad + 80);

     // Rings cleared
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(pad, pad + 92, 80, 24);
    ctx.fillStyle = '#e0c0ff';
    ctx.fillText(`RING ${ringsCleared}/${skyRings.length}`, pad + 8, pad + 108);

     // Breath indicator
    if (!breathUsed) {
      const breathLabel = breathMode ? breathMode.toUpperCase() : 'BREATHE';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(pad, pad + 120, 90, 24);
      ctx.fillStyle = breathTimer > 0 ? '#ffaa40' : '#808090';
      ctx.font = '11px monospace';
      ctx.fillText(`B: ${breathLabel} [F]`, pad + 8, pad + 136);
     } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(pad, pad + 120, 90, 24);
      ctx.fillStyle = '#505060';
      ctx.font = '11px monospace';
      ctx.fillText('B: USED', pad + 8, pad + 136);
     }
   }

   // Mobile touch zone indicators
  if ('ontouchstart' in window && gamePhase === 'flying') {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STEER', W * 0.25, H * 0.75);
    ctx.fillText('GLIDE', W * 0.15, H * 0.92);
    ctx.fillText('FLAP', W * 0.8, H * 0.92);

     // Breath button
    if (!breathUsed) {
      ctx.fillStyle = 'rgba(255, 170, 60, 0.15)';
      ctx.fillText('BREATH', W * 0.8, H * 0.75);
     }
    ctx.textAlign = 'left';
   }
}

function drawLaunchScreen(W, H) {
  const cx = W / 2;
  const cy = H / 2;

  ctx.fillStyle = 'rgba(5, 5, 15, 0.6)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#e0c0ff';
  ctx.font = `bold ${Math.min(48, W * 0.08)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SKY WAKE', cx, cy - 80);

  ctx.fillStyle = '#8a90b0';
  ctx.font = `${Math.min(18, W * 0.035)}px monospace`;
  ctx.fillText('First Flight of the Dragon', cx, cy - 50);

  ctx.fillStyle = '#aab0c8';
  ctx.font = `${Math.min(14, W * 0.028)}px monospace`;
  const lineH = Math.min(22, H * 0.04);
  ctx.fillText('W / SPACE    Flap & Climb   (uses stamina)', cx, cy - 5);
  ctx.fillText('S            Glide & Dive    (recovers stamina)', cx, cy + lineH);
  ctx.fillText('A/D  or  \u2190/\u2192    Steer left / right', cx, cy + lineH * 2);
  ctx.fillText('Q/E  or  [/]     Roll left / right', cx, cy + lineH * 3);
  ctx.fillText('F            Elemental breath burst (once)', cx, cy + lineH * 4);

  const pulse = 0.5 + Math.sin(gameTime * 3) * 0.4;
  ctx.fillStyle = `rgba(200, 170, 255, ${pulse})`;
  ctx.font = `bold ${Math.min(20, W * 0.04)}px monospace`;
  ctx.fillText('Press ENTER or TAP to launch', cx, cy + lineH * 6 + 15);

  ctx.textAlign = 'left';
}

function drawResultsScreen(W, H) {
  const cx = W / 2;
  const cy = H / 2;
  const alpha = Math.min(restartFlash / 2, 1);

  ctx.fillStyle = `rgba(5, 5, 15, ${alpha * 0.75})`;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = alpha;

   // Grade
  const totalRings = skyRings.length;
  const ringRate = ringsCleared / totalRings;
  const timeScore = Math.max(0, 1 - gameTime / 180);
  const smoothRate = smoothnessCount > 0 ? smoothnessScore / smoothnessCount : 0;
  const landedBonus = landed ? 0.2 : 0;
  const overallScore = (ringRate * 0.4 + timeScore * 0.2 + smoothRate * 0.2 + landedBonus).toFixed(2);

  let grade = 'D';
  if (overallScore >= 0.9) grade = 'S';
  else if (overallScore >= 0.8) grade = 'A';
  else if (overallScore >= 0.6) grade = 'B';
  else if (overallScore >= 0.4) grade = 'C';

  let gradeColor = '#ff4040';
  if (grade === 'S') gradeColor = '#ffd700';
  else if (grade === 'A') gradeColor = '#ffaa40';
  else if (grade === 'B') gradeColor = '#a0d0ff';
  else if (grade === 'C') gradeColor = '#aaaacc';

  ctx.fillStyle = '#e0c0ff';
  ctx.font = `bold ${Math.min(40, W * 0.06)}px monospace`;
  ctx.textAlign = 'center';
  const titleText = landed ? 'PERCH REACHED' : 'FLIGHT ENDED';
  ctx.fillText(titleText, cx, cy - 80);

  ctx.fillStyle = gradeColor;
  ctx.font = `bold ${Math.min(72, W * 0.1)}px monospace`;
  ctx.fillText(`Grade: ${grade}`, cx, cy - 20);

  ctx.fillStyle = '#c0c0d0';
  ctx.font = `${Math.min(16, W * 0.03)}px monospace`;
  const lineH = Math.min(24, H * 0.04);
  ctx.fillText(`Rings cleared: ${ringsCleared} / ${totalRings}`, cx, cy + 30);
  ctx.fillText(`Distance: ${Math.round(dragon.z)}m`, cx, cy + 30 + lineH);
  ctx.fillText(`Time: ${gameTime.toFixed(1)}s`, cx, cy + 30 + lineH * 2);
  ctx.fillText(`Landed: ${landed ? 'Yes' : 'No'}`, cx, cy + 30 + lineH * 3);

  const restartPulse = 0.5 + Math.sin(gameTime * 3) * 0.4;
  ctx.fillStyle = `rgba(200, 170, 255, ${restartPulse})`;
  ctx.font = `bold ${Math.min(18, W * 0.035)}px monospace`;
  ctx.fillText('Press ENTER or TAP to fly again', cx, cy + 30 + lineH * 5 + 20);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawSpeedStreaks() {
  const speed = dragon.speed;
  if (speed < 4) return;

  const intensity = Math.min((speed - 4) / 8, 1);
  const H = canvas.height;

  for (let i = 0; i < Math.floor(intensity * 8); i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * H;
    const len = 20 + speed * 5;
    const alpha = intensity * 0.08;
    ctx.strokeStyle = `rgba(180, 160, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * Math.cos(dragon.roll * 0.2), y - len * 0.3);
    ctx.stroke();
   }
}

// --- Game logic ---

function checkRingCollisions() {
  for (const ring of skyRings) {
    if (ring.cleared) continue;
    const dx = dragon.x - ring.x;
    const dy = dragon.y - ring.y;
    const dz = dragon.z - ring.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < ring.radius) {
      ring.cleared = true;
      ringsCleared++;
      playRingChime();
     }
   }
}

function checkThermalBoost(dt) {
  let inThermal = false;
  for (const tc of thermalColumns) {
    const dx = dragon.x - tc.x;
    const dz = dragon.z - tc.z;
    const hDist = Math.sqrt(dx * dx + dz * dz);
    if (hDist < tc.radius && dragon.y > 50 && dragon.y < 600) {
      inThermal = true;
      dragon.vy += tc.lift * dt;
      dragon.stamina = Math.min(dragon.maxStamina, dragon.stamina + 3 * dt);
     }
   }
  return inThermal;
}

function checkLanding() {
  if (!landingPerch || landed) return false;

  const dx = dragon.x - landingPerch.x;
  const dy = dragon.y - landingPerch.y;
  const dz = dragon.z - landingPerch.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist < landingPerch.radius * 1.5 && dragon.speed < 5 && Math.abs(dragon.vy) < 3) {
    landed = true;
    gamePhase = 'landing';
    playLanding();
    return true;
   }
  return false;
}

function activateBreath() {
  if (breathUsed) return;
  breathUsed = true;
  breathTimer = 5;

   // Cycle through breath modes
  const modes = ['fire', 'ice', 'water', 'sea'];
  breathMode = modes[Math.floor(Math.random() * modes.length)];
  playBreathBurst();

  switch (breathMode) {
    case 'fire':
       // Speed burst
      dragon.vx += 5;
      dragon.vz += 5;
      break;
    case 'ice':
       // Stabilize roll, slight slow (controlled turn)
      dragon.roll *= 0.2;
      dragon.pitch *= 0.5;
      break;
    case 'water':
       // Extended glide: big stamina recovery
      dragon.stamina = Math.min(dragon.maxStamina, dragon.stamina + 30);
      break;
    case 'sea':
       // Lift trail: upward boost
      dragon.vy += 8;
      break;
   }
}

// Breathing input
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF') {
    activateBreath();
   }
  if ((e.code === 'Enter' || e.code === 'Space') && gamePhase === 'ended') {
    resetGame();
   }
});

canvas.addEventListener('touchstart', (e) => {
  initAudio();
  if (gamePhase === 'ended' && restartFlash > 1) {
    resetGame();
   }
  if (gamePhase === 'prelaunch') {
    input._launch = true;
   }
   // Mobile breath: tap top-right zone
  if (gamePhase === 'flying' && !breathUsed) {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.clientX > canvas.width * 0.7 && t.clientY < canvas.height * 0.5) {
        activateBreath();
       }
     }
   }
}, { passive: true });

// --- Main game loop ---

let inThermal = false;

function gameLoop(timestamp) {
  const rawDt = (timestamp - lastTime) / 1000;
  const dt = Math.min(rawDt, 0.05);
  lastTime = timestamp;
  gameTime += dt;
  restartFlash += dt;

  const W = canvas.width;
  const H = canvas.height;

   // Get input
  const inputState = input.update();

   // Phase management
  if (gamePhase === 'prelaunch') {
    if (inputState.launch) {
      initAudio();
      gamePhase = 'flying';
      gameLaunched = true;
      dragon.vx = 5;
      dragon.vy = 2;
     }
   }

  if (gamePhase === 'flying') {
     // Update physics
    dragon.update(dt, inputState);

     // Check collisions
    checkRingCollisions();
    inThermal = checkThermalBoost(dt);
    checkLanding();

     // Breath timer
    if (breathTimer > 0) {
      breathTimer -= dt;
     }

     // Smoothness scoring: not falling fast, not rolling too much
    const smooth = Math.abs(dragon.vy) < 3 && Math.abs(dragon.roll) < 0.3;
    smoothnessCount++;
    if (smoothnessCount % 30 === 0) {
      smoothnessScore += smooth ? 1 : 0;
     }

     // Crash / end conditions
    if (dragon.y < 5 && dragon.vy < -2) {
       // Hit the water
      gamePhase = 'ended';
      playCrash();
      restartFlash = 0;
     } else if (dragon.stamina <= 0 && dragon.vy < -5 && dragon.y < 50) {
       // Ran out of stamina and falling below safe altitude
      gamePhase = 'ended';
      playCrash();
      restartFlash = 0;
     } else if (gameTime > 180) {
       // Time limit
      gamePhase = 'ended';
      restartFlash = 0;
     } else if (landed) {
      gamePhase = 'ended';
      restartFlash = 0;
     }

     // Wing whoosh sound
    wingWhoosh(dragon);

     // Update wind volume based on speed
    if (windGain) {
      windGain.gain.value = 0.04 + dragon.speed * 0.008;
     }
   }

  if (gamePhase === 'landing') {
     // Gentle slow-down
    dragon.update(dt, { glide: true, ...inputState });
    dragon.vx *= 0.98;
    dragon.vz *= 0.98;
    dragon.vy = 0;

    if (dragon.speed < 0.5) {
      gamePhase = 'ended';
      restartFlash = 0;
     }
   }

   // Camera follows dragon
  const camX = dragon.x - Math.sin(dragon.yaw) * 40;
  const camY = dragon.y - 15;
  const camZ = dragon.z - Math.cos(dragon.yaw) * 40;

   // Draw scene
  drawSky(W, H);
  drawStars(dt);
  drawMountains(camX, camY, camZ, dragon.yaw);
  drawWater(W, H, camX, camY, camZ, dragon.yaw);
  drawClouds(camX, camY, camZ, dragon.yaw);
  drawThermalColumns(camX, camY, camZ, dragon.yaw);
  drawSkyRings(camX, camY, camZ, dragon.yaw);
  drawLandingPerch(camX, camY, camZ, dragon.yaw);

   // Thermal highlight on dragon when in thermal
  if (inThermal) {
    const cx = W / 2;
    const cy = H / 2 - 10;
    const shimmer = 0.1 + Math.sin(gameTime * 5) * 0.08;
    const thermalGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 50);
    thermalGlow.addColorStop(0, `rgba(150, 220, 255, ${shimmer})`);
    thermalGlow.addColorStop(1, 'rgba(150, 220, 255, 0)');
    ctx.fillStyle = thermalGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();
   }

  drawSpeedStreaks();
  drawDragon(W, H, dragon);
  drawHUD();

   // Overlays
  if (gamePhase === 'prelaunch') {
    drawLaunchScreen(W, H);
   }
  if (gamePhase === 'ended' && restartFlash > 0.5) {
    drawResultsScreen(W, H);
   }

   // In-thermal indicator
  if (inThermal && gamePhase === 'flying') {
    ctx.fillStyle = 'rgba(150, 220, 255, 0.6)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u2191 THERMAL', W / 2, H - 40);
    ctx.textAlign = 'left';
   }

   // Low stamina warning
  if (dragon.stamina < 15 && gamePhase === 'flying') {
    const blink = Math.sin(gameTime * 10) > 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255, 60, 60, 0.7)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DIVE TO RECOVER', W / 2, H / 2 + 40);
      ctx.textAlign = 'left';
     }
   }

  requestAnimationFrame(gameLoop);
}

// Start
lastTime = performance.now();
requestAnimationFrame(gameLoop);
