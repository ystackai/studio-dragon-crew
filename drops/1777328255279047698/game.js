/**
 * Core breath-responsive ecosystem loop.
 * 56 BPM pulse, 12 Hz low-pass filter, 0.85 intensity cap.
 * WebGL/Canvas rendering with Web Audio context.
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
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
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
  lastX = e.clientX;
  lastY = e.clientY;
});
canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  const speed = Math.sqrt(dx * dx + dy * dy) / 50;
  rawInput = Math.max(0, Math.min(1, speed));
  lastX = e.clientX;
  lastY = e.clientY;
});
canvas.addEventListener("mouseup", () => { isDragging = false; rawInput = 0; });
canvas.addEventListener("mouseleave", () => { isDragging = false; rawInput = 0; });

// Touch
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isDragging = true;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isDragging) return;
  const dx = e.touches[0].clientX - lastX;
  const dy = e.touches[0].clientY - lastY;
  const speed = Math.sqrt(dx * dx + dy * dy) / 50;
  rawInput = Math.max(0, Math.min(1, speed));
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", () => { isDragging = false; rawInput = 0; });

// Mouse wheel / scroll as breath proxy
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  rawInput = Math.max(0, Math.min(1, Math.abs(e.deltaY) / 300));
}, { passive: false });

/* ─── Pulse Clock ─── */
let lastBeatTime = 0;
let currentBeat = 0;
let beatPhase = 0; // 0..1 within current beat cycle

/* ─── Velocity-Damped Easing ─── */
function velocityDamp(current, target, dt) {
  const diff = target - current;
  const eased = current + diff * (1 - Math.exp(-EASING_DAMPING * dt));
  return eased;
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
    limCurve[i] = Math.tanh(x * 2.5) / 2.5; // soft compression
  }
  limNode.curve = limCurve;
  limNode.oversample = "4x";

  // Master gain
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;
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
  droneGain.gain.value = 0.06;
  droneOsc1.connect(droneGain);
  droneOsc2.connect(droneGain);
  droneGain.connect(masterGain);
  droneOsc1.start();
  droneOsc2.start();

  // Tidal swell LFO (modulated by breathIntensity)
  lfoOsc = audioCtx.createOscillator();
  lfoOsc.type = "sine";
  lfoOsc.frequency.value = BPM / 60; // 56 BPM rate
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
  padOsc3.frequency.value = 329.63; // E4
  padGain = audioCtx.createGain();
  padGain.gain.value = 0;

  // High-pass filter to roll off above 2kHz
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
canvas.addEventListener("mousedown", resumeAudio, { once: false });
canvas.addEventListener("touchstart", resumeAudio, { once: false });

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
  }
  update(intensity, time) {
    const spread = 8 + intensity * 40;
    this.x = this.ox + Math.sin(time * this.dripSpeed + this.phase) * spread;
    this.y = this.oy + Math.cos(time * this.dripSpeed * 0.7 + this.phase) * spread;
  }
  draw(ctx, intensity) {
    if (intensity < 0.1) return;
    const alpha = Math.min(1, (intensity - 0.1) * 2);
    const glow = this.size * (0.5 + intensity);

    ctx.save();
    // Inner glow
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow);
    if (this.hue === 45) {
      grad.addColorStop(0, `rgba(240, 185, 70, ${alpha * 0.7})`);
      grad.addColorStop(1, `rgba(240, 185, 70, 0)`);
    } else {
      grad.addColorStop(0, `rgba(80, 210, 210, ${alpha * 0.7})`);
      grad.addColorStop(1, `rgba(80, 210, 210, 0)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - glow, this.y - glow, glow * 2, glow * 2);
    // Shard core
    ctx.fillStyle = this.hue === 45
      ? `rgba(240, 210, 120, ${alpha * 0.9})`
      : `rgba(120, 230, 230, ${alpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const shards = [];
for (let i = 0; i < 48; i++) shards.push(new GeodeShard());

/* ─── Frost Fractals ─── */
let frostDrift = { x: 0, y: 0 };
function drawFrost(ctx, intensity, time) {
   // Frost drift: slow parallax-like motion
  frostDrift.x = Math.sin(time * 0.15 + 1.3) * 2;
  frostDrift.y = Math.cos(time * 0.12 + 0.7) * 1.5;

  if (intensity < FROST_THRESHOLD) return;
  const frostAlpha = Math.min(1, (intensity - FROST_THRESHOLD) * 3);
  const numBranches = 6 + Math.floor(intensity * 10);

  ctx.save();
  ctx.globalAlpha = frostAlpha * 0.35;
  ctx.strokeStyle = "rgba(200, 230, 240, 0.8)";
  ctx.lineWidth = 0.8;

  for (let b = 0; b < numBranches; b++) {
    const angle = (b / numBranches) * Math.PI * 2 + time * 0.05;
    const len = 40 + intensity * 120;
    ctx.beginPath();
    let cx = W / 2 + frostDrift.x, cy = H / 2 + frostDrift.y;
    let currentAngle = angle;
    for (let seg = 0; seg < 5; seg++) {
      const seed = b * 31.7 + seg * 17.3 + time * 0.3;
      const perturb = (Math.sin(seed * 0.7) * 0.5) * 0.6;
      const dx = Math.cos(currentAngle + seg * 0.4) * len * (1 - seg * 0.15);
      const dy = Math.sin(currentAngle + seg * 0.4) * len * (1 - seg * 0.15);
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
  const g1 = 26 + intensity * 15;
  const g2 = 31 + intensity * 20;
  const g3 = 29 + intensity * 10;
  bg.addColorStop(0, `rgb(${g1}, ${g2}, ${g3})`);
  bg.addColorStop(1, `rgb(${Math.floor(g1 * 0.5)}, ${Math.floor(g2 * 0.5)}, ${Math.floor(g3 * 0.5)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Moss texture: organic noise blobs
  ctx.save();
  const mossAlpha = 0.08 + intensity * 0.12;
  for (let i = 0; i < 12; i++) {
    const mx = W * (0.1 + 0.8 * ((i * 7 + time * 0.02) % 1));
    const my = H * (0.1 + 0.8 * ((i * 13 + time * 0.015) % 1));
    const mr = 50 + intensity * 80;
    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    const green = 110 + Math.floor(intensity * 50);
    mGrad.addColorStop(0, `rgba(80, ${green}, 85, ${mossAlpha})`);
    mGrad.addColorStop(1, "rgba(80, 110, 85, 0)");
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
  const radius = Math.min(W, H) * (0.18 + intensity * 0.22);

  // Central bloom
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const r = 220 + Math.floor(intensity * 35);
  const g = 180 + Math.floor(intensity * 60);
  const b = 100 + Math.floor(intensity * 80);
  bloom.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bloomAlpha * 0.55})`);
  bloom.addColorStop(0.6, `rgba(${r - 40}, ${g - 20}, ${b + 30}, ${bloomAlpha * 0.2})`);
  bloom.addColorStop(1, `rgba(${r - 80}, ${g - 60}, ${b + 50}, 0)`);
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // Crystalline edges
  if (intensity > 0.3) {
    const edgeAlpha = (intensity - 0.3) * 1.2;
    ctx.save();
    ctx.globalAlpha = Math.min(0.6, edgeAlpha);
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + time * 0.08;
      const innerR = radius * 0.4;
      const outerR = radius * (0.9 + intensity * 0.3);
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(angle - 0.12) * innerR,
        cy + Math.sin(angle - 0.12) * innerR
      );
      ctx.lineTo(
        cx + Math.cos(angle - 0.04) * outerR,
        cy + Math.sin(angle - 0.04) * outerR
      );
      ctx.lineTo(
        cx + Math.cos(angle + 0.04) * outerR,
        cy + Math.sin(angle + 0.04) * outerR
      );
      ctx.lineTo(
        cx + Math.cos(angle + 0.12) * innerR,
        cy + Math.sin(angle + 0.12) * innerR
      );
      ctx.closePath();
      ctx.fillStyle = `rgba(${200 + Math.floor(i * 8)}, ${170 - Math.floor(i * 6)}, ${120 + Math.floor(i * 12)}, 0.12)`;
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ─── Diffused Glow Falloff (on exhale) ─── */
function drawGlowFalloff(ctx, intensity, prevIntensity) {
  if (prevIntensity > intensity && intensity > 0.05) {
    const exhaleStrength = (prevIntensity - intensity) * 3;
    const cx = W / 2;
    const cy = H / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.5);
    grad.addColorStop(0, `rgba(180, 200, 190, ${Math.min(0.25, exhaleStrength * 0.4)})`);
    grad.addColorStop(1, "rgba(180, 200, 190, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ─── Pulse Ring (56 BPM visual indicator) ─── */
function drawPulseRing(ctx, beatPhase, intensity) {
  const cx = W / 2;
  const cy = H / 2;
  const pulseRadius = 30 + intensity * 60 + beatPhase * 25;
  const ringAlpha = (1 - beatPhase) * 0.15 * (0.3 + intensity * 0.7);

  ctx.save();
  ctx.globalAlpha = ringAlpha;
  ctx.strokeStyle = `rgba(160, 190, 170, ${0.5 + intensity * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ─── Morning Snow Highlight (subtle white sparkle at peak) ─── */
function drawSnowHighlights(ctx, intensity, time) {
  if (intensity < 0.4) return;
  const count = Math.floor(intensity * 20);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const sx = (Math.sin(time * 0.3 + i * 47.3) * 0.5 + 0.5) * W;
    const sy = (Math.cos(time * 0.2 + i * 31.7) * 0.5 + 0.5) * H;
    const spark = Math.sin(time * 2 + i * 17) * 0.5 + 0.5;
    ctx.globalAlpha = spark * intensity * 0.4;
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + spark, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ─── Parallax Drift ─── */
function applyParallax(intensity, time) {
  const drift = Math.sin(time * 0.1) * MAX_PARALLAX * intensity;
  ctx.translate(drift, drift * 0.3);
}

/* ─── Audio Update ─── */
function updateAudio(intensity, beatPhase, time) {
  if (!audioCtx || !audioStarted) return;

  const now = audioCtx.currentTime;

  // Sub-bass pulse at 56 BPM: short attack (200ms), long decay (400ms)
  if (subBassGain) {
    const pulseEnv = Math.exp(-beatPhase * 4) * (0.12 + intensity * 0.25);
    subBassGain.gain.setTargetAtTime(pulseEnv, now, 0.02);
    subBassOsc.frequency.setTargetAtTime(36 + intensity * 8, now, 0.05);
  }

  // Tidal swell LFO modulated by breathIntensity
  if (lfoGain) {
    lfoGain.gain.setTargetAtTime(intensity * 0.08, now, 0.03);
    lfoOsc.frequency.setTargetAtTime((BPM / 60) * (0.5 + intensity * 2), now, 0.05);
  }

  // Pad fades in above 0.6 intensity
  if (padGain) {
    const padVol = intensity > PAD_FADE_THRESHOLD
      ? Math.min(0.12, (intensity - PAD_FADE_THRESHOLD) * 0.3)
      : 0;
    padGain.gain.setTargetAtTime(padVol, now, 0.04);
  }
}

/* ─── Geode Chime ─── */
let lastChimeTime = 0;
function maybeTriggerChime(intensity, time) {
  if (!audioCtx || intensity <= GEODE_CHIME_THRESHOLD) return;
  // Only trigger when rising above threshold
  const now = time;
  if (now - lastChimeTime < 2000) return; // 2s cooldown
  lastChimeTime = now;

  // Play a brief geode chime: short sine burst with 120ms release
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880 + Math.random() * 440;
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(limNode);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

/* ─── Main Loop ─── */
let prevIntensity = 0;
let lastFrameTime = performance.now();
let totalSimTime = 0;

function frame(now) {
  requestAnimationFrame(frame);

  const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  totalSimTime += dt;

  // ── 56 BPM Pulse Clock ──
  const beatTime = totalSimTime * 1000;
  currentBeat = Math.floor(beatTime / BEAT_DURATION);
  beatPhase = (beatTime % BEAT_DURATION) / BEAT_DURATION;

  // ── Input → Filter → Cap ──
  let raw = isDragging ? rawInput : Math.max(0, rawInput - dt * 0.4); // slow breath-like decay
  const filtered = lowPass(raw);
  const capped = Math.min(INTENSITY_CAP, filtered);
  prevIntensity = breathIntensity;

  // Velocity-damped easing
  breathIntensity = velocityDamp(breathIntensity, capped, dt * 60); // normalize to 60fps

  // Push to render buffer
  bufferPush(breathIntensity);
  const smoothed = bufferAvg();

  // ── Audio ──
  updateAudio(breathIntensity, beatPhase, totalSimTime);
  maybeTriggerChime(breathIntensity, totalSimTime);

    // ── Render ──
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform each frame

  ctx.save();
  applyParallax(smoothed, totalSimTime);

  drawMossBase(ctx, smoothed, totalSimTime);
  drawPulseRing(ctx, beatPhase, smoothed);
  drawGeodeBloom(ctx, smoothed, totalSimTime);

  // Frost fractals at high intensity
  drawFrost(ctx, smoothed, totalSimTime);

  // Snow highlights
  drawSnowHighlights(ctx, smoothed, totalSimTime);

  // Geode shards
  for (const s of shards) {
    s.update(smoothed, totalSimTime);
    s.draw(ctx, smoothed);
  }

  // Exhale glow
  drawGlowFalloff(ctx, smoothed, prevIntensity);

  ctx.restore();

  // Hint fade
  const hint = document.getElementById("hint");
  if (hint && breathIntensity > 0.05) {
    hint.style.opacity = "0";
  }
}

requestAnimationFrame(frame);
