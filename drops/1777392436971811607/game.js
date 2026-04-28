// ── mulberry32 deterministic PRNG ──────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RNG = mulberry32(42);

// ── Constants & State ──────────────────────────────────
const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;
const DAMPING_DECAY = 0.3;        // seconds
const INACTIVITY_TIMEOUT = 2500;    // ms
const MAX_POLYPHONY = 16;
const AUDIO_BUFFER = 1024;

const ELEMENTS = ['water', 'fire', 'ice', 'lava'];
const ELEMENT_EMOJIS = ['💧', '🔥', '❄️', '🌋'];
let elementIndex = 0;

let playing = false;
let animFrameId = null;
let lastTimestamp = 0;
let accumulated = 0;
let lastInputTime = 0;

// Breath oscillator
let breathPhase = 0;
const BREATH_MIN = 0.1; // Hz
const BREATH_MAX = 0.3; // Hz

// Breath buffer & damping
let breathAmount = 0;         // 0-1
let breathTarget = 0;         // 0-1
let dampingActive = false;

// Input tracking
let mouseX = 0.5;
let mouseY = 0.5;
let inputVelocity = 0;
let prevMouseX = 0.5;
let prevMouseY = 0.5;
let isDragging = false;

// Canvas
const canvas = document.getElementById('sanctuary');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Audio Engine ───────────────────────────────────────
let audioCtx = null;
let masterGain = null;
let reverbGain = null;
let dryGain = null;
let convolver = null;
let stereoPanner = null;
let droneOscillators = [];
let droneBus = null;
let tideOsc = null;
let tideGain = null;
let activeVoices = [];

function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 44100,
      latencyHint: 'interactive',
    });

    // Master bus
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;

    // Reverb chain
    stereoPanner = audioCtx.createStereoPanner();
    dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.7;
    reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.3;

    convolver = audioCtx.createConvolver();
    const irLen = audioCtx.sampleRate * 2.5;
    const irBuf = audioCtx.createBuffer(2, irLen, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = irBuf.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        d[i] = (RNG() * 2 - 1) * Math.pow(1 - i / irLen, 2.0);
      }
    }
    convolver.buffer = irBuf;

    // Pre-delay ~15ms via small gain
    const preDelayGain = audioCtx.createGain();
    preDelayGain.gain.value = 1;

    dryGain.connect(masterGain);
    preDelayGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    droneBus = audioCtx.createGain();
    droneBus.gain.value = 0.25;

    // Stereo panning for hover / interaction
    stereoPanner.connect(dryGain);
    stereoPanner.connect(preDelayGain);

    // Drone oscillators: base layers
    const droneFreqs = [
      55, 82.5, 110, 165, 220
    ];
    const types = ['sine', 'triangle', 'sine', 'sine', 'triangle'];

    for (let i = 0; i < droneFreqs.length; i++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = types[i];
      osc.frequency.value = droneFreqs[i];
      g.gain.value = 0.06;
      osc.connect(g);
      g.connect(droneBus);
      osc.start();
      droneOscillators.push({ osc, gain: g });
    }

    droneBus.connect(stereoPanner);

    // Low-end tide (60Hz)
    tideOsc = audioCtx.createOscillator();
    tideGain = audioCtx.createGain();
    tideOsc.type = 'sine';
    tideOsc.frequency.value = 60;
    tideGain.gain.value = 0.04;
    tideOsc.connect(tideGain);
    tideGain.connect(droneBus);
    tideOsc.start();

  } catch (e) {
    console.warn('WebAudio init failed:', e);
  }
}

// Modulate drone based on breath amount
function modulateDrone(dt) {
  if (!audioCtx || !playing) return;

  // Update breath oscillator
  const breathFreq = BREATH_MIN + breathAmount * (BREATH_MAX - BREATH_MIN);
  breathPhase += breathFreq * dt;
  const breath = Math.sin(breathPhase * Math.PI * 2);
  const breathNorm = (breath + 1) / 2; // 0-1

  // Modulate drone gains
  droneOscillators.forEach((d, i) => {
    const base = 0.06;
    d.gain.gain.setTargetAtTime(
      base * (0.7 + breathNorm * 0.6),
      audioCtx.currentTime,
      DAMPING_DECAY
    );
    // Slight frequency wobble
    const wobble = breathAmount * 0.3 * (i % 2 === 0 ? 1 : -1);
    d.osc.frequency.setTargetAtTime(
      d.osc.frequency.value + wobble * 0.5,
      audioCtx.currentTime,
      DAMPING_DECAY
    );
  });

  // Tide frequency modulated by mouse Y
  if (tideOsc && tideGain) {
    const tideFreq = 50 + mouseY * 30;
    tideOsc.frequency.setTargetAtTime(tideFreq, audioCtx.currentTime, DAMPING_DECAY);
    tideGain.gain.setTargetAtTime(
      0.02 + breathNorm * 0.04,
      audioCtx.currentTime,
      DAMPING_DECAY
    );
  }

  // Stereo panning based on mouse X
  if (stereoPanner) {
    stereoPanner.pan.setTargetAtTime(
      mouseX * 2 - 1,
      audioCtx.currentTime,
      DAMPING_DECAY
    );
  }
}

// ── Interaction Audio ──────────────────────────────────
function playHoverChime(panX) {
  if (!audioCtx) return;
  spawnTone(1200, 0.08, 0.15, panX, 'sine');
}

function playRipple(panX, velocity) {
  if (!audioCtx) return;
  const vol = Math.min(0.25, velocity * 0.5);
  // Water ripple: multiple sine beeps at 600-900Hz
  spawnTone(600 + RNG() * 300, vol, 0.4, panX, 'sine');
  spawnTone(800 + RNG() * 100, vol * 0.7, 0.3, panX, 'triangle');
}

function spawnTone(freq, volume, decay, pan, type) {
  if (activeVoices.length >= MAX_POLYPHONY) return;

  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner();

  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.value = volume;
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + decay);
  panner.pan.value = pan * 2 - 1;

  osc.connect(g);
  g.connect(panner);
  panner.connect(dryGain);

  osc.start();
  osc.stop(audioCtx.currentTime + decay + 0.05);

  activeVoices.push(osc);
  osc.onended = () => {
    const idx = activeVoices.indexOf(osc);
    if (idx > -1) activeVoices.splice(idx, 1);
  };
}

// ── Visual: Water element ──────────────────────────────
const RIBBON_COUNT = 8;
let ribbons = [];

class Ribbon {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = RNG() * canvas.width;
    this.y = -50;
    this.speed = 15 + RNG() * 30;
    this.amplitude = 30 + RNG() * 60;
    this.frequency = 0.003 + RNG() * 0.006;
    this.phase = RNG() * Math.PI * 2;
    this.lineWidth = 1.5 + RNG() * 3;
    this.alpha = 0.3 + RNG() * 0.4;
    this.controls = [];
    const segments = 6 + Math.floor(RNG() * 8);
    for (let i = 0; i < segments; i++) {
      this.controls.push({
        offset: (i / segments) * 200,
        cx: (RNG() - 0.5) * 100,
      });
    }
  }

  update(dt) {
    this.y += this.speed * dt;
    this.phase += dt * 1.2;

    // Influence from breath
    this.y += breathAmount * 40 * dt;
    this.speed += breathAmount * 5 * dt;

    if (this.y > canvas.height + 200) {
      this.reset();
      this.y = -50;
      this.speed = 15 + RNG() * 30;
    }
  }

  draw(ctx) {
    const time = performance.now() * 0.001;
    const baseAlpha = this.alpha * (0.6 + breathAmount * 0.4);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 220, 255, ${baseAlpha})`;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Start point
    let prevX = this.x;
    let prevY = this.y;

    // First point
    ctx.moveTo(prevX + this.controls[0].cx * Math.sin(time + this.phase), prevY);

    for (let i = 0; i < this.controls.length; i++) {
      const seg = this.controls[i];
      const px = this.x + seg.cx * Math.sin(time * 1.5 + this.phase + i * 0.5);
      const py = this.y + seg.offset;

      const cpx = this.x + (seg.cx + (i > 0 ? this.controls[i - 1].cx : 0)) * 0.5
        * Math.cos(time + this.phase + i);
      const cpy = prevY + (py - prevY) * 0.5;

      ctx.quadraticCurveTo(cpx, cpy, px, py);
      prevX = px;
      prevY = py;
    }
    ctx.stroke();

    // Inner glow
    ctx.beginPath();
    ctx.strokeStyle = `rgba(100, 255, 255, ${baseAlpha * 0.3})`;
    ctx.lineWidth = this.lineWidth * 3;
    ctx.globalAlpha = 0.3;

    ctx.moveTo(prevX, prevY);
    for (let i = this.controls.length - 1; i >= 0; i--) {
      const seg = this.controls[i];
      const px2 = this.x + seg.cx * Math.sin(time * 1.5 + this.phase + i * 0.5);
      const py2 = this.y + seg.offset;
      const cpx2 = this.x + (seg.cx + (i > 0 ? this.controls[i - 1].cx : 0)) * 0.5
        * Math.cos(time + this.phase + i);
      const cpy2 = prevY + (py2 - prevY) * 0.5;

      ctx.quadraticCurveTo(cpx2, cpy2, px2, py2);
      prevX = px2;
      prevY = py2;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// Initialize ribbons
for (let i = 0; i < RIBBON_COUNT; i++) {
  ribbons.push(new Ribbon());
}

// ── Visual: Background gradient ────────────────────────
function drawBackground() {
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
  );
  grad.addColorStop(0, '#1a1f2e');
  grad.addColorStop(1, '#0a0e17');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ── Damping & Auto-stabilize ──────────────────────────
let dampingStart = 0;
let dampingFrom = 0;

function triggerDamping(fromValue) {
  dampingFrom = fromValue;
  dampingStart = performance.now();
  dampingActive = true;
}

function getDampedBreath() {
  if (dampingActive) {
    const elapsed = (performance.now() - dampingStart) / 1000;
    const t = Math.min(1, elapsed / DAMPING_DECAY);
    return dampingFrom * (1 - t);
  }
  return breathAmount;
}

function checkAutoStabilize() {
  const now = performance.now();
  if (now - lastInputTime > INACTIVITY_TIMEOUT && breathAmount > 0.01) {
    triggerDamping(breathAmount);
    breathAmount = 0.05; // exhale base
  }
}

// ── Input Handling ─────────────────────────────────────
let lastHoverChime = 0;
const HOVER_CHIME_INTERVAL = 200; // ms

function getPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
   }
  return { x: e.clientX, y: e.clientY };
}

function handleMove(e) {
  const pos = getPos(e);
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  mouseX = pos.x / canvas.width;
  mouseY = pos.y / canvas.height;

  const dx = mouseX - prevMouseX;
  const dy = mouseY - prevMouseY;
  inputVelocity = Math.sqrt(dx * dx + dy * dy) * 1000;

  lastInputTime = performance.now();

   // Breath response: input increases breath
  breathTarget = Math.min(1, breathTarget + 0.02 * Math.max(0.1, inputVelocity / 300));

   // Hover chime (throttled)
  const now = performance.now();
  if (now - lastHoverChime > HOVER_CHIME_INTERVAL) {
    playHoverChime(mouseX);
    lastHoverChime = now;
   }

  e.preventDefault();
}

function handleStart(e) {
  isDragging = true;
  lastInputTime = performance.now();

    // Trigger ripple
  playRipple(mouseX, inputVelocity);

    // Cycle element
  elementIndex = (elementIndex + 1) % ELEMENTS.length;
  updateElementButton();

  e.preventDefault();
}

function handleEnd(e) {
  isDragging = false;
  breathTarget = 0.05; // return to exhale
  triggerDamping(breathAmount);
}

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchend', handleEnd);

// ── UI Controls ─────────────────────────────────────────
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnElement = document.getElementById('btn-element');

function updateElementButton() {
  btnElement.textContent = ELEMENT_EMOJIS[elementIndex];
}

btnPlay.addEventListener('click', () => {
  if (!audioCtx) {
    initAudio();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  playing = !playing;
  btnPlay.textContent = playing ? '⏸' : '▶';
  if (playing) {
    lastInputTime = performance.now();
    startLoop();
  }
});

btnReset.addEventListener('click', () => {
  breathAmount = 0.05;
  breathTarget = 0.05;
  breathPhase = 0;
  dampingActive = false;
  mouseX = 0.5;
  mouseY = 0.5;
  inputVelocity = 0;
  elementIndex = 0;
  updateElementButton();
});

btnElement.addEventListener('click', () => {
  elementIndex = (elementIndex + 1) % ELEMENTS.length;
  updateElementButton();
});

updateElementButton();

// ── Main Loop ──────────────────────────────────────────
let tickCount = 0;

function startLoop() {
  if (animFrameId) return;
  lastTimestamp = performance.now();
  tick();
}

function tick() {
  if (!playing) return;
  animFrameId = requestAnimationFrame(tick);

  const now = performance.now();
  accumulated += (now - lastTimestamp);
  lastTimestamp = now;

  // Fixed timestep: 60fps
  while (accumulated >= FRAME_MS) {
    accumulated -= FRAME_MS;
    const dt = FRAME_MS / 1000; // seconds
    step(dt);
  }

  render();
}

function step(dt) {
  tickCount++;

  // Smooth breath interpolation
  const lerpRate = dampingActive ? 4 : 2;
  breathAmount += (breathTarget - breathAmount) * lerpRate * dt;

  // Damping
  if (dampingActive) {
    const elapsed = (performance.now() - dampingStart) / 1000;
    if (elapsed > DAMPING_DECAY) {
      dampingActive = false;
      breathAmount = breathTarget;
    }
  }

  // Auto-stabilize
  checkAutoStabilize();

   // Decay breath target
  breathTarget *= (1 - 3 * dt);
  if (breathTarget < 0.05) breathTarget = 0.05;

  // Modulate audio
  modulateDrone(dt);

  // Update ribbons
  updateRibbons(dt);
}

function updateRibbons(dt) {
  ribbons.forEach(r => r.update(dt));
}

function render() {
  drawBackground();

  const currentElement = ELEMENTS[elementIndex];

  if (currentElement === 'water') {
    drawWaterRibbonGlow();
    ribbons.forEach(r => r.draw(ctx));
  } else {
    // Placeholder: still draw ribbons dim for other elements
    ctx.globalAlpha = 0.2;
    ribbons.forEach(r => r.draw(ctx));
    ctx.globalAlpha = 1;
  }
}

function drawWaterRibbonGlow() {
  // Subtle radial glow at mouse position
  const gx = mouseX * canvas.width;
  const gy = mouseY * canvas.height;
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 120 + breathAmount * 100);
  glow.addColorStop(0, `rgba(0, 220, 255, ${0.04 + breathAmount * 0.06})`);
  glow.addColorStop(1, 'rgba(0, 220, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(gx - 300, gy - 300, 600, 600);
}

// ── Exhale base state ──────────────────────────────────
breathAmount = 0.05;
breathTarget = 0.05;

// Auto-init audio on first user interaction (browser policy)
document.addEventListener('click', function autoInit() {
  if (!audioCtx) {
    initAudio();
  }
  document.removeEventListener('click', autoInit);
}, { once: true });
