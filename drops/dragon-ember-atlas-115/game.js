/* ─── Ember Atlas — Dragon Crew ─── */
/* 6 elemental dragons, ember-particle grid, interactive canvas */

/* ─── Constants ─── */
const ELEMENT_COLORS = {
  water:  { h: 210, s: 70, l: 55, hueRange: [200,220] },
  sea:    { h: 180, s: 65, l: 50, hueRange: [170,195] },
  ice:    { h: 195, s: 60, l: 70, hueRange: [185,210] },
  snow:   { h: 0,   s:  0, l: 85, hueRange: [0,20] },
  fire:   { h: 25,  s: 85, l: 55, hueRange: [10,45] },
  lava:   { h: 15,  s: 80, l: 40, hueRange: [0,30] }
};
const DRAGON_NAMES = [
  "Water Dragon", "Sea Dragon", "Ice Dragon",
  "Snow Dragon", "Fire Dragon", "Lava Dragon"
];
const DRAGON_ELEMENTS = ["water","sea","ice","snow","fire","lava"];
const MAX_EMBERS = 1200;
const EMBER_LIFETIME = 3200; // ms
const EMBER_RADIUS_BASE = 2.6;
const EMBER_SPEED_BASE = 0.45;
const BREATH_RATE = 48; // beats per minute → ms per beat
const BREATH_DURATION = 60000 / BREATH_RATE; // ~1250 ms
const INTENSITY_CAP = 0.9;
const DAMPING = 0.07;

/* ─── Canvas ─── */
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let W, H, dpr;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width  = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
resize();
window.addEventListener("resize", resize);

/* ─── State ─── */
let activeElement = 0; // index into DRAGON_ELEMENTS
let intensity = 0;     // 0..1 breath intensity
let embers = [];
let emberPool = [];
let emberSpawnTimer = 0;
let breathPhase = 0;
let mouseX = 0.5, mouseY = 0.5;
let touching = false;
let audioCtx = null, breathOsc = null, breathGain = null;
let overlayHidden = false;

/* ─── Audio ─── */
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  breathOsc = audioCtx.createOscillator();
  breathOsc.type = "sine";
  breathOsc.frequency.value = BREATH_RATE / 60; // ~0.8 Hz
  breathGain = audioCtx.createGain();
  breathGain.gain.value = 0;
  breathOsc.connect(breathGain);
  breathGain.connect(audioCtx.destination);
  breathOsc.start();
  overlayHidden = true;
  document.getElementById("overlay").classList.add("hidden");
}

/* ─── Ember Pool ─── */
function allocEmber() {
  if (emberPool.length > 0) return emberPool.pop();
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, hue: 0, sat: 0, light: 0, radius: EMBER_RADIUS_BASE };
}

function freeEmber(e) {
  e.life = -1;
  emberPool.push(e);
}

/* ─── Ember spawning ─── */
function spawnEmber(x, y, vx, vy) {
  if (embers.length >= MAX_EMBERS) return;
  const e = allocEmber();
  e.x = x; e.y = y;
  e.vx = vx; e.vy = vy;
  e.life = EMBER_LIFETIME;
  const elem = DRAGON_ELEMENTS[activeElement];
  const col = ELEMENT_COLORS[elem];
  e.hue = col.hueRange[0] + Math.random() * (col.hueRange[1]-col.hueRange[0]);
  e.sat = col.s / 100 * (0.9 + Math.random() * 0.2);
  e.light = col.l / 100 * (0.8 + Math.random() * 0.3);
  e.radius = EMBER_RADIUS_BASE * (0.8 + Math.random() * 0.4);
  embers.push(e);
}

/* ─── Ember grid population (initial burst) ─── */
function seedEmbers(count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.8 + 0.1;
    spawnEmber(
      W/2 + Math.cos(angle) * W * dist,
      H/2 + Math.sin(angle) * H * dist,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    );
  }
}

/* ─── Input ─── */
function handlePointer(e) {
  const t = e.type === "touchstart" || e.type === "touchmove";
  const ev = t ? e.changedTouches[0] : e;
  const x = ev.clientX / W;
  const y = ev.clientY / H;
  mouseX = Math.min(1, Math.max(0, x));
  mouseY = Math.min(1, Math.max(0, y));
  touching = true;
  if (!audioCtx && !overlayHidden) {
    initAudio();
    seedEmbers(200);
  }
}
canvas.addEventListener("mousedown", handlePointer);
canvas.addEventListener("mousemove", handlePointer);
canvas.addEventListener("touchstart", handlePointer);
canvas.addEventListener("touchmove", handlePointer);
canvas.addEventListener("mouseup", () => { touching = false; });
canvas.addEventListener("touchend", () => { touching = false; });
canvas.addEventListener("mouseleave", () => { touching = false; });

/* ─── UI Buttons ─── */
document.getElementById("ui").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  activeElement = idx;
  document.querySelectorAll("#ui button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("dragon-label").textContent = DRAGON_NAMES[idx].toUpperCase();
});

/* ─── Overlay click ─── */
document.getElementById("overlay").addEventListener("click", () => {
  initAudio();
  seedEmbers(200);
});

/* ─── Update ─── */
function update(dt) {
  // Breath intensity from pointer
  if (touching) {
    const intensityTarget = Math.min(INTENSITY_CAP, 
      Math.sqrt(Math.abs(mouseX - 0.5)*2 + Math.abs(mouseY - 0.5)*2) * 1.2);
    intensity += (intensityTarget - intensity) * DAMPING * dt * 60;
  } else {
    intensity *= 0.96; // slow decay
  }
  intensity = Math.max(0, Math.min(INTENSITY_CAP, intensity));

  // Breath phase for audio
  breathPhase += dt * (BREATH_RATE / 60);
  if (breathGain) breathGain.gain.value = intensity * 0.15;

  // Spawn embers based on intensity
  emberSpawnTimer += dt;
  if (emberSpawnTimer >= BREATH_DURATION / MAX_EMBERS * 10) {
    emberSpawnTimer = 0;
    if (intensity > 0.02) {
      const count = Math.floor(intensity * 6) + 1;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = EMBER_SPEED_BASE * intensity * (0.8 + Math.random() * 0.4);
        const originX = touching ? mouseX * W : W/2;
        const originY = touching ? mouseY * H : H/2;
        spawnEmber(
          originX + (Math.random() - 0.5) * 40,
          originY + (Math.random() - 0.5) * 40,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
      }
    }
  }

  // Update embers
  let alive = 0;
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i];
    e.life -= dt;
    if (e.life <= 0 || e.life > EMBER_LIFETIME+100) {
      freeEmber(e);
      embers.splice(i, 1);
      continue;
    }
    alive++;
    // Motion
    e.x += e.vx * dt * 60;
    e.y += e.vy * dt * 60;
    // Bounce off edges (soft)
    if (e.x < 0 || e.x > W) e.vx *= -0.6;
    if (e.y < 0 || e.y > H) e.vy *= -0.6;
    // Clamp
    e.x = Math.max(0, Math.min(W, e.x));
    e.y = Math.max(0, Math.min(H, e.y));
    // Age affects brightness
    const lifeRatio = e.life / EMBER_LIFETIME;
    e.light = (col => col.l / 100 * (0.6 + 0.4 * lifeRatio))(
      ELEMENT_COLORS[DRAGON_ELEMENTS[activeElement]]
    );
  }
  // Update ember count display
  document.getElementById("ember-count").textContent = alive;
}

/* ─── Render ─── */
function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 0.85 + intensity * 0.1;

  // Background gradient by active element
  const elem = DRAGON_ELEMENTS[activeElement];
  const col = ELEMENT_COLORS[elem];
  const bgHue = col.h;
  const bgSat = col.s * 0.3;
  const bgLight = 12 + intensity * 20;
  ctx.fillStyle = `hsl(${bgHue},${bgSat}%,${bgLight}%)`;
  ctx.fillRect(0, 0, W, H);

  // Ember particles
  const ambientIntensity = intensity * 0.6;
  for (const e of embers) {
    const lifeRatio = e.life / EMBER_LIFETIME;
    const alpha = lifeRatio * (0.4 + ambientIntensity * 0.6);
    const radius = e.radius * (0.7 + lifeRatio * 0.6);
    ctx.beginPath();
    ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${e.hue},${e.sat*100}%,${e.light*100}%,${alpha})`;
    ctx.fill();
    // Glow
    if (lifeRatio > 0.6) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${e.hue},${e.sat*100}%,${e.light*100}%,${alpha * 0.15})`;
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;

  // Dragon name overlay
  if (intensity > 0.1) {
    const labelScale = 0.6 + intensity * 0.4;
    ctx.save();
    ctx.translate(W/2, H/2 - 70);
    ctx.rotate(breathPhase * 0.008);
    ctx.scale(labelScale, labelScale);
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `hsla(${col.h},${col.s*90}%,${col.l*80}%,${0.3 + intensity * 0.5})`;
    ctx.fillText(DRAGON_NAMES[activeElement].toUpperCase(), 0, 0);
    ctx.restore();
  }
}

/* ─── Loop ─── */
let lastTime = 0;
function loop(t) {
  const dt = t - lastTime;
  lastTime = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ─── Boot ─── */
console.log("Ember Atlas · Dragon Crew loaded");
