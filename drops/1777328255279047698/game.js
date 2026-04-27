/**
 * Core breath-responsive ecosystem loop.
 * 56 BPM pulse, 12 Hz low-pass filter, 0.85 intensity cap.
 * Canvas 2D rendering + Web Audio context with bloom post-pass.
 */

/* ─── Constants ─── */
const BPM = 56;
const BEAT_DURATION = 60000 / BPM; // ~1071.43 ms per beat
const LPF_CUTOFF = 12; // Hz
const INTENSITY_CAP = 0.85;
const BUFFER_SIZE = 1024;
const QUANTUM_WINDOW = 15; // ±15ms
const EASING_DAMPING = 0.06; // velocity-damped factor
const FROST_THRESHOLD = 0.65;
const GEODE_CHIME_THRESHOLD = 0.7;
const PAD_FADE_THRESHOLD = 0.6;
const MAX_PARALLAX = 0.5; // px

/* ─── Canvas Setup ─── */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let W, H, dpr;

// Bloom pass (offscreen, scaled down)
const bloomCanvas = document.createElement("canvas");
const bloomCtx = bloomCanvas.getContext("2d");
const BLOOM_SCALE = 0.25; // 1/4 resolution for performance

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width  = Math.floor(window.innerWidth  * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth  + "px";
  canvas.style.height = window.innerHeight + "px";

  bloomCanvas.width  = Math.floor(W * BLOOM_SCALE);
  bloomCanvas.height = Math.floor(H * BLOOM_SCALE);
}
window.addEventListener("resize", resize);
resize();

/* ─── Render Buffer (fixed-size circular buffer) ─── */
const renderBuffer = new Float32Array(BUFFER_SIZE);
let bufferWriteIdx = 0;
let bufferSamples = 0;

function bufferPush(val) {
  renderBuffer[bufferWriteIdx % BUFFER_SIZE] = val;
  bufferWriteIdx++;
  bufferSamples = Math.min(bufferSamples + 1, BUFFER_SIZE);
}

function bufferAvg() {
  if (bufferSamples === 0) return 0;
  let sum = 0;
  const count = Math.min(bufferSamples, BUFFER_SIZE);
  const start = bufferWriteIdx % BUFFER_SIZE;
  for (let i = 0; i < count; i++) {
    sum += renderBuffer[(start + i) % BUFFER_SIZE];
  }
  return sum / count;
}

/* ─── Low-Pass Filter (12 Hz, exponential moving average) ─── */
let lpfState = 0;
const lpfAlpha = 1 - Math.exp(-2 * Math.PI * LPF_CUTOFF / 60); // 60 fps sample rate

function lowPass(raw) {
  lpfState = lpfState + lpfAlpha * (raw - lpfState);
  return lpfState;
}

/* ─── Breath Input ─── */
let rawInput = 0;
let breathIntensity = 0;
let breathVelocity = 0;
let lastX = 0, lastY = 0;
let isDragging = false;

// Mouse
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX * dpr;
  lastY = e.clientY * dpr;
});
canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX * dpr - lastX;
  const dy = e.clientY * dpr - lastY;
  const speed = Math.sqrt(dx * dx + dy * dy) / (50 * dpr);
  rawInput = Math.max(0, Math.min(1, speed));
  lastX = e.clientX * dpr;
  lastY = e.clientY * dpr;
});
canvas.addEventListener("mouseup", () => { isDragging = false; });
canvas.addEventListener("mouseleave", () => { isDragging = false; });

// Touch
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isDragging = true;
  lastX = e.touches[0].clientX * dpr;
  lastY = e.touches[0].clientY * dpr;
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isDragging) return;
  const dx = e.touches[0].clientX * dpr - lastX;
  const dy = e.touches[0].clientY * dpr - lastY;
  const speed = Math.sqrt(dx * dx + dy * dy) / (50 * dpr);
  rawInput = Math.max(0, Math.min(1, speed));
  lastX = e.touches[0].clientX * dpr;
  lastY = e.touches[0].clientY * dpr;
}, { passive: false });
canvas.addEventListener("touchend", () => { isDragging = false; });

// Mouse wheel / scroll as breath proxy
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  rawInput = Math.max(0, Math.min(1, Math.abs(e.deltaY) / 300));
}, { passive: false });

// Space key as breath proxy
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); rawInput = 1; }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") rawInput = 0;
});

/* ─── Pulse Clock ─── */
let lastBeatTime = 0;
let currentBeat = 0;
let beatPhase = 0; // 0..1 within current beat cycle
let beatTimestampMS = 0; // ms timestamp of last beat onset

/* ─── Velocity-Damped Easing ─── */
function velocityDamp(current, target, dt, damping) {
  const d = damping || EASING_DAMPING;
  const diff = target - current;
  const factor = 1 - Math.exp(-d * dt);
  return current + diff * factor;
}

/* ─── Audio Setup ─── */
let audioCtx = null;
let masterGain = null;
let subBassOsc = null;
let subBassGain = null;
let droneOsc1 = null, droneOsc2 = null;
let droneGain = null;
let lfoOsc = null;
let lfoGain = null;
let padOsc1 = null, padOsc2 = null, padOsc3 = null;
let padGain = null;
let chimeGain = null;
let limNode = null; // soft-cap limiter
let audioStarted = false;

function initAudio() {
  if (audioStarted) return;
  audioStarted = true;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Soft-cap limiter via WaveShaper
  limNode = audioCtx.createWaveShaper();
  const limCurve = new Float32Array(44100);
  for (let i = 0; i < 44100; i++) {
    const x = (i * 2) / 44100 - 1;
    limCurve[i] = Math.tanh(x * 2.5) / 2.5;
  }
  limNode.curve = limCurve;
  limNode.oversample = "4x";

  // Master gain
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.45;
  masterGain.connect(limNode);
  limNode.connect(audioCtx.destination);

  // Sub-bass pulse (<80Hz)
  subBassOsc = audioCtx.createOscillator();
  subBassOsc.type = "sine";
  subBassOsc.frequency.value = 38;
  subBassGain = audioCtx.createGain();
  subBassGain.gain.value = 0;
  subBassOsc.connect(subBassGain);
  subBassGain.connect(masterGain);
  subBassOsc.start();

  // Ambient drone: two slightly detuned low sines
  droneOsc1 = audioCtx.createOscillator();
  droneOsc1.type = "sine";
  droneOsc1.frequency.value = 73.42; // A2
  droneOsc2 = audioCtx.createOscillator();
  droneOsc2.type = "sine";
  droneOsc2.frequency.value = 73.52;
  droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.05;
  droneOsc1.connect(droneGain);
  droneOsc2.connect(droneGain);
  droneGain.connect(masterGain);
  droneOsc1.start();
  droneOsc2.start();

  // Tidal swell LFO (modulated by breathIntensity)
  lfoOsc = audioCtx.createOscillator();
  lfoOsc.type = "sine";
  lfoOsc.frequency.value = BPM / 60;
  lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0;
  lfoOsc.connect(lfoGain);
  lfoGain.connect(masterGain);
  lfoOsc.start();

  // Pear-harmonic pad
  padOsc1 = audioCtx.createOscillator();
  padOsc1.type = "sine";
  padOsc1.frequency.value = 146.83; // A3
  padOsc2 = audioCtx.createOscillator();
  padOsc2.type = "sine";
  padOsc2.frequency.value = 220; // A4
  padOsc3 = audioCtx.createOscillator();
  padOsc3.type = "triangle";
  padOsc3.frequency.value = 329.63; // E5
  padGain = audioCtx.createGain();
  padGain.gain.value = 0;

  // Low-pass filter to roll off above 2kHz
  const padHPF = audioCtx.createBiquadFilter();
  padHPF.type = "lowpass";
  padHPF.frequency.value = 2000;
  padHPF.Q.value = 0.5;

  padOsc1.connect(padGain);
  padOsc2.connect(padGain);
  padOsc3.connect(padGain);
  padGain.connect(padHPF);
  padHPF.connect(masterGain);
  padOsc1.start();
  padOsc2.start();
  padOsc3.start();

  // Chime gate
  chimeGain = audioCtx.createGain();
  chimeGain.gain.value = 0;
  chimeGain.connect(masterGain);
}

// Ensure audio context resumes on first gesture
const resumeAudio = () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
};
canvas.addEventListener("mousedown", resumeAudio);
canvas.addEventListener("touchstart", resumeAudio);
document.addEventListener("keydown", resumeAudio);

/* ─── Geode Particles ─── */
class GeodeShard {
  constructor() {
    this.reset();
  }
  reset() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * Math.min(W, H) * 0.25;
    this.ox = W / 2 + Math.cos(angle) * radius;
    this.oy = H / 2 + Math.sin(angle) * radius;
    this.x = this.ox;
    this.y = this.oy;
    this.size = 3 + Math.random() * 12;
    this.hue = Math.random() > 0.5 ? 45 : 185; // amber or cyan
    this.phase = Math.random() * Math.PI * 2;
    this.dripSpeed = 0.3 + Math.random() * 0.7;
    this.targetX = this.ox;
    this.targetY = this.oy;
  }
  update(intensity, time) {
    const spread = 8 + intensity * 40;
    this.targetX = this.ox + Math.sin(time * this.dripSpeed + this.phase) * spread;
    this.targetY = this.oy + Math.cos(time * this.dripSpeed * 0.7 + this.phase) * spread;
    // Velocity-damped position
    this.x = velocityDamp(this.x, this.targetX, 1 / 60, 0.12);
    this.y = velocityDamp(this.y, this.targetY, 1 / 60, 0.12);
  }
  draw(ctx, intensity) {
    if (intensity < 0.1) return;
    const alpha = Math.min(1, (intensity - 0.1) * 2.2);
    const glow = this.size * (0.6 + intensity * 1.2);

    ctx.save();
    // Inner glow
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow);
    if (this.hue === 45) {
      grad.addColorStop(0, `rgba(240, 185, 70, ${alpha * 0.55})`);
      grad.addColorStop(0.5, `rgba(220, 150, 50, ${alpha * 0.15})`);
      grad.addColorStop(1, "rgba(240, 185, 70, 0)");
    } else {
      grad.addColorStop(0, `rgba(80, 210, 210, ${alpha * 0.55})`);
      grad.addColorStop(0.5, `rgba(60, 180, 200, ${alpha * 0.15})`);
      grad.addColorStop(1, "rgba(80, 210, 210, 0)");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - glow, this.y - glow, glow * 2, glow * 2);
    // Shard core
    ctx.fillStyle = this.hue === 45
      ? `rgba(240, 210, 120, ${alpha * 0.85})`
      : `rgba(120, 230, 230, ${alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const shards = [];
for (let i = 0; i < 48; i++) shards.push(new GeodeShard());

/* ─── Frost Fractals ─── */
let frostDrift = { x: 0, y: 0 };
function drawFrost(ctx, intensity, time) {
  frostDrift.x = Math.sin(time * 0.15 + 1.3) * 2 * dpr;
  frostDrift.y = Math.cos(time * 0.12 + 0.7) * 1.5 * dpr;

  if (intensity < FROST_THRESHOLD) return;
  const frostAlpha = Math.min(1, (intensity - FROST_THRESHOLD) * 3);
  const numBranches = 6 + Math.floor(intensity * 10);

  ctx.save();
  ctx.globalAlpha = frostAlpha * 0.3;
  ctx.strokeStyle = `rgba(200, 230, 240, ${0.7 + frostAlpha * 0.3})`;
  ctx.lineWidth = 0.8 * dpr;

  for (let b = 0; b < numBranches; b++) {
    const angle = (b / numBranches) * Math.PI * 2 + time * 0.05;
    const len = (40 + intensity * 120) * dpr;
    ctx.beginPath();
    let cx = W / 2 + frostDrift.x, cy = H / 2 + frostDrift.y;
    ctx.moveTo(cx, cy);
    let currentAngle = angle;
    for (let seg = 0; seg < 6; seg++) {
      const seed = b * 31.7 + seg * 17.3 + time * 0.3;
      const perturb = (Math.sin(seed * 0.7) * 0.5) * 0.5;
      const dx = Math.cos(currentAngle + seg * 0.35) * len * (1 - seg * 0.13);
      const dy = Math.sin(currentAngle + seg * 0.35) * len * (1 - seg * 0.13);
      cx += dx;
      cy += dy;
      ctx.lineTo(cx, cy);
      currentAngle += perturb;
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ─── Moss Base Layer ─── */
function drawMossBase(ctx, intensity, time) {
  // Deep background
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  const r1 = 17 + intensity * 10;
  const g1 = 23 + intensity * 18;
  const b1 = 19 + intensity * 8;
  bg.addColorStop(0, `rgb(${Math.floor(r1)}, ${Math.floor(g1)}, ${Math.floor(b1)})`);
  bg.addColorStop(1, `rgb(${Math.floor(r1 * 0.4)}, ${Math.floor(g1 * 0.4)}, ${Math.floor(b1 * 0.4)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Moss texture: organic noise blobs (velocity-damped positions)
  ctx.save();
  const mossAlpha = 0.06 + intensity * 0.1;
  for (let i = 0; i < 16; i++) {
    const baseX = W * ((i * 31 + 17) % 100) / 100;
    const baseY = H * ((i * 47 + 23) % 100) / 100;
    const drift = Math.sin(time * 0.02 + i * 1.7) * 12 * dpr;
    const mx = baseX + drift;
    const my = baseY + Math.cos(time * 0.018 + i * 2.1) * 10 * dpr;
    const mr = (50 + intensity * 80) * dpr;
    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    const green = 100 + Math.floor(intensity * 55);
    mGrad.addColorStop(0, `rgba(60, ${green}, 65, ${mossAlpha})`);
    mGrad.addColorStop(1, "rgba(60, 100, 65, 0)");
    ctx.fillStyle = mGrad;
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  }
  ctx.restore();
}

/* ─── Geode Bloom Transition ─── */
function drawGeodeBloom(ctx, intensity, time) {
  if (intensity < 0.05) return;

  const bloomAlpha = Math.min(1, (intensity - 0.05) * 2.5);
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * (0.15 + intensity * 0.28) * dpr;

  // Central bloom
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const r = 210 + Math.floor(intensity * 45);
  const g = 170 + Math.floor(intensity * 85);
  const b = 90 + Math.floor(intensity * 110);
  bloom.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bloomAlpha * 0.45})`);
  bloom.addColorStop(0.4, `rgba(${r - 30}, ${g - 10}, ${b + 40}, ${bloomAlpha * 0.25})`);
  bloom.addColorStop(0.7, `rgba(${r - 60}, ${g - 40}, ${b + 60}, ${bloomAlpha * 0.08})`);
  bloom.addColorStop(1, `rgba(${r - 80}, ${g - 60}, ${b + 70}, 0)`);
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // Crystalline edges
  if (intensity > 0.25) {
    const edgeAlpha = Math.min(1, (intensity - 0.25) * 1.4);
    ctx.save();
    ctx.globalAlpha = edgeAlpha * 0.5;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + time * 0.06;
      const innerR = radius * 0.35;
      const outerR = radius * (0.85 + intensity * 0.3);
      const spread = 0.14;

      // Crystal facet
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(angle - spread) * innerR,
        cy + Math.sin(angle - spread) * innerR
      );
      ctx.lineTo(
        cx + Math.cos(angle - spread * 0.3) * outerR,
        cy + Math.sin(angle - spread * 0.3) * outerR
      );
      ctx.lineTo(
        cx + Math.cos(angle + spread * 0.3) * outerR * 1.05,
        cy + Math.sin(angle + spread * 0.3) * outerR * 1.05
      );
      ctx.lineTo(
        cx + Math.cos(angle + spread) * innerR * 0.95,
        cy + Math.sin(angle + spread) * innerR * 0.95
      );
      ctx.closePath();

      const facetR = 190 + Math.floor(i * 10);
      const facetG = 155 - Math.floor(i * 8);
      const facetB = 110 + Math.floor(i * 15);
      ctx.fillStyle = `rgba(${facetR}, ${facetG}, ${facetB}, ${0.08 + edgeAlpha * 0.08})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${facetR + 20}, ${facetG + 30}, ${facetB + 20}, ${edgeAlpha * 0.15})`;
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Inner glow halos layered for depth
  if (intensity > 0.4) {
    const haloAlpha = (intensity - 0.4) * 1.5;
    for (let r = 0; r < 3; r++) {
      const haloR = radius * (0.3 + r * 0.25);
      const hGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      const hue = r === 0 ? [240, 190, 80] : r === 1 ? [90, 215, 215] : [200, 170, 140];
      hGrad.addColorStop(0, `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, ${haloAlpha * 0.15})`);
      hGrad.addColorStop(1, `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, 0)`);
      ctx.fillStyle = hGrad;
      ctx.fillRect(cx - haloR, cy - haloR, haloR * 2, haloR * 2);
    }
  }
}

/* ─── Radial Low-Pass Bloom Post-Pass ─── */
const bloomCopyCanvas = document.createElement("canvas");
const bloomCopyCtx = bloomCopyCanvas.getContext("2d");

function applyBloomPass() {
  const bw = bloomCanvas.width;
  const bh = bloomCanvas.height;

  bloomCopyCanvas.width = bw;
  bloomCopyCanvas.height = bh;

  // Draw current frame at reduced res
  bloomCtx.drawImage(canvas, 0, 0, bw, bh);
  bloomCopyCtx.drawImage(bloomCanvas, 0, 0);

  // Gaussian-ish low-pass: multiple drawImage passes with scaling
  const passes = 3;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  let src = bloomCopyCanvas;
  for (let p = 0; p < passes; p++) {
    const scale = 0.5;
    tempCanvas.width = Math.max(2, Math.floor(bw * scale));
    tempCanvas.height = Math.max(2, Math.floor(bh * scale));
    tempCtx.drawImage(src, 0, 0, tempCanvas.width, tempCanvas.height);

    tempCanvas.width = bw;
    tempCanvas.height = bh;
    tempCtx.drawImage(tempCanvas, 0, 0, bw, bh);
    src = tempCanvas;
  }

  // Composite bloom on top of main canvas
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(src, 0, 0, W, H);
  ctx.restore();
}

/* ─── Diffused Glow Falloff (on exhale) ─── */
function drawGlowFalloff(ctx, intensity, prevIntensity) {
  if (prevIntensity > intensity && intensity > 0.05) {
    const exhaleStrength = Math.min(1, (prevIntensity - intensity) * 4);
    const cx = W / 2;
    const cy = H / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.45);
    grad.addColorStop(0, `rgba(170, 195, 182, ${Math.min(0.2, exhaleStrength * 0.35)})`);
    grad.addColorStop(0.5, `rgba(150, 180, 168, ${Math.min(0.08, exhaleStrength * 0.12)})`);
    grad.addColorStop(1, "rgba(150, 180, 168, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ─── Pulse Ring (56 BPM visual indicator) ─── */
function drawPulseRing(ctx, beatPhase, intensity) {
  const cx = W / 2;
  const cy = H / 2;
  const baseRadius = 30 * dpr;
  const pulseRadius = baseRadius + intensity * 60 * dpr + beatPhase * 25 * dpr;
  const ringAlpha = (1 - beatPhase) * 0.12 * (0.3 + intensity * 0.7);

  ctx.save();
  ctx.globalAlpha = Math.min(0.3, ringAlpha);
  ctx.strokeStyle = `rgba(155, 185, 165, ${0.4 + intensity * 0.6})`;
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary ring for depth
  ctx.globalAlpha = ringAlpha * 0.5;
  ctx.lineWidth = 0.8 * dpr;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ─── Morning Snow Highlight (subtle white sparkle at peak) ─── */
function drawSnowHighlights(ctx, intensity, time) {
  if (intensity < 0.35) return;
  const count = Math.floor(intensity * 25);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const sx = (Math.sin(time * 0.25 + i * 47.3) * 0.5 + 0.5) * W;
    const sy = (Math.cos(time * 0.18 + i * 31.7) * 0.5 + 0.5) * H;
    const spark = Math.sin(time * 1.8 + i * 17) * 0.5 + 0.5;
    ctx.globalAlpha = spark * intensity * 0.35;
    ctx.fillStyle = "#e8eef2";
    ctx.beginPath();
    ctx.arc(sx, sy, (1 + spark * 1.5) * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ─── Parallax Drift ─── */
function applyParallax(intensity, time) {
  const drift = Math.sin(time * 0.08) * MAX_PARALLAX * dpr * intensity;
  ctx.translate(drift, drift * 0.3);
}

/* ─── Audio Update ─── */
function updateAudio(intensity, beatPhase, time) {
  if (!audioCtx || !audioStarted) return;

  const now = audioCtx.currentTime;

  // Sub-bass pulse at 56 BPM: 200ms attack, 400ms decay
  if (subBassGain) {
    const pulseEnv = Math.exp(-beatPhase * 3.5) * (0.1 + intensity * 0.3);
    subBassGain.gain.setTargetAtTime(pulseEnv, now, 0.015);
    subBassOsc.frequency.setTargetAtTime(36 + intensity * 10, now, 0.04);
  }

  // Tidal swell LFO modulated by breathIntensity
  if (lfoGain) {
    lfoGain.gain.setTargetAtTime(intensity * 0.07, now, 0.025);
    lfoOsc.frequency.setTargetAtTime((BPM / 60) * (0.4 + intensity * 2.2), now, 0.04);
  }

  // Pad fades in above 0.6 intensity
  if (padGain) {
    const padVol = intensity > PAD_FADE_THRESHOLD
      ? Math.min(0.1, (intensity - PAD_FADE_THRESHOLD) * 0.25)
      : 0;
    padGain.gain.setTargetAtTime(padVol, now, 0.035);
  }

  // Drone breathes slightly with intensity
  if (droneGain) {
    droneGain.gain.setTargetAtTime(0.04 + intensity * 0.025, now, 0.05);
  }
}

/* ─── Geode Chime ─── */
let lastChimeTime = 0;
let prevChimeIntensity = 0;
function maybeTriggerChime(intensity, time) {
  if (!audioCtx) return;

  // Only trigger when crossing threshold on the way up
  if (intensity > GEODE_CHIME_THRESHOLD && prevChimeIntensity <= GEODE_CHIME_THRESHOLD) {
    const now = time;
    if (now - lastChimeTime < 2000) return; // 2s cooldown
    lastChimeTime = now;

    // Geode chime: sine burst with 120ms release envelope
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    const freq = 800 + Math.random() * 600;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(limNode);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);

    // Sometimes layer a harmonic 5th
    if (Math.random() > 0.5) {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 1.5;
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.015, audioCtx.currentTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      osc2.connect(gain2);
      gain2.connect(limNode);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.13);
    }
  }
  prevChimeIntensity = intensity;
}

/* ─── Audio-Visual Sync Tracker ─── */
let bloomPeakTime = 0;
let audioPeakTime = 0;
let syncDelta = 0;
const syncHistory = [];
const SYNC_SAMPLES = 30;

function trackSyncDelta(visualPeakTime, audioPeakTime) {
  const delta = Math.abs(visualPeakTime - audioPeakTime);
  syncHistory.push(delta);
  if (syncHistory.length > SYNC_SAMPLES) syncHistory.shift();
  syncDelta = syncHistory.reduce((a, b) => a + b, 0) / syncHistory.length;
}

/* ─── Main Loop ─── */
let prevIntensity = 0;
let lastFrameTime = performance.now();
let totalSimTime = 0;
let frameCount = 0;
let fps = 0;
let lastFpsCheck = performance.now();
let prevPeakDetected = false;

function frame(now) {
  requestAnimationFrame(frame);

  const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  totalSimTime += dt;

  // FPS counter
  frameCount++;
  if (now - lastFpsCheck > 1000) {
    fps = Math.round(frameCount * 1000 / (now - lastFpsCheck));
    frameCount = 0;
    lastFpsCheck = now;
  }

  // ── 56 BPM Pulse Clock ──
  const beatTime = totalSimTime * 1000;
  const prevBeat = currentBeat;
  currentBeat = Math.floor(beatTime / BEAT_DURATION);
  beatPhase = (beatTime % BEAT_DURATION) / BEAT_DURATION;

  // Quantize beat onset to ±15ms window
  if (currentBeat !== prevBeat) {
    const onsetMS = now % BEAT_DURATION;
    if (onsetMS > QUANTUM_WINDOW && onsetMS < BEAT_DURATION - QUANTUM_WINDOW) {
      // Within window, mark as sync point
      audioPeakTime = now;
    }
  }

  // ── Input → Filter → Cap ──
  let raw = isDragging ? rawInput : Math.max(0, rawInput - dt * 0.35); // slow breath-like decay
  const filtered = lowPass(raw);
  const capped = Math.min(INTENSITY_CAP, filtered);
  prevIntensity = breathIntensity;

  // Velocity-damped easing with acceleration tracking
  breathIntensity = velocityDamp(breathIntensity, capped, dt * 60);
  breathVelocity = (breathIntensity - prevIntensity) / Math.max(dt, 0.001);

  // Push to render buffer
  bufferPush(breathIntensity);
  const smoothed = bufferAvg();

  // ── Audio ──
  updateAudio(breathIntensity, beatPhase, totalSimTime);
  maybeTriggerChime(breathIntensity, totalSimTime);

  // Peak detection for sync tracking
  const isRising = breathVelocity > 0;
  const isFalling = breathVelocity < -0.005;
  if (prevPeakDetected && isFalling) {
    // Just passed a peak
    bloomPeakTime = now;
    trackSyncDelta(bloomPeakTime, audioPeakTime);
    prevPeakDetected = false;
  }
  if (isRising && breathIntensity > 0.6) {
    prevPeakDetected = true;
  }

  // ── Render ──
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  applyParallax(smoothed, totalSimTime);

  drawMossBase(ctx, smoothed, totalSimTime);
  drawPulseRing(ctx, beatPhase, smoothed);
  drawGeodeBloom(ctx, smoothed, totalSimTime);
  drawFrost(ctx, smoothed, totalSimTime);
  drawSnowHighlights(ctx, smoothed, totalSimTime);

  // Geode shards
  for (const s of shards) {
    s.update(smoothed, totalSimTime);
    s.draw(ctx, smoothed);
  }

  // Exhale glow
  drawGlowFalloff(ctx, smoothed, prevIntensity);

  ctx.restore();

  // Bloom post-pass
  applyBloomPass();

   // Hint fade
  const hint = document.getElementById("hint");
  if (hint && breathIntensity > 0.05) {
    hint.style.opacity = "0";
  }

   // Sync debug display
  const dbg = document.getElementById("sync-debug");
  if (dbg) {
    dbg.textContent = `fps:${fps} | bpm:${BPM} | sync:${syncDelta.toFixed(1)}ms | buf:${bufferSamples}`;
   }
}

requestAnimationFrame(frame);
