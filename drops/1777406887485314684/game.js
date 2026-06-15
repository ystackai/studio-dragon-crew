// ============================================================
//  SANCTUARY OF THE FIRST BREATH
//  Procedural audiovisual interactive loop
//  60fps, <16ms input latency, all procedural assets
// ============================================================

// ------------------------
// AUDIO ENGINE
// ------------------------
const AudioEngine = {
  ctx: null,
  masterGain: null,
  masterFilter: null,
  reverb: null,
  droneOsc: null,
  droneGain: null,
  swells: [],
  inhaleOsc: null,
  inhaleGain: null,
  exhaleGain: null,
  noiseNode: null,
  noiseGain: null,
  syncChimes: [],
  initialized: false,

  init() {
    if (this.initialized) return;
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = new C();

    // Master filter chain: HPF 40Hz -> reverb -> master gain
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'highpass';
    this.masterFilter.frequency.value = 40;
    this.masterFilter.Q.value = 0.7;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    // Convolver reverb: <1.2s tail, 20ms pre-delay
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.createReverbIR(0.8, 20 / 1000);
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.35;

    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 0.7;

    this.masterFilter.connect(dryGain);
    this.masterFilter.connect(this.reverb);
    this.reverb.connect(reverbGain);
    dryGain.connect(this.masterGain);
    reverbGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // 60Hz base drone
    this.setupDrone();
    this.initialized = true;
  },

  createReverbIR(tail, preDelay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * tail);
    const delaySamples = Math.floor(rate * preDelay);
    const buffer = this.ctx.createBuffer(2, length + delaySamples, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        if (i < delaySamples) {
          data[i] = 0;
        } else {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i - delaySamples) / (length), 2.5);
        }
      }
    }
    return buffer;
  },

  setupDrone() {
    // 60Hz fundamental
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 60;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.12;

    this.droneOsc.connect(this.droneGain);
    // Also send through a subtle filter shaped by breath
    this.droneGain.connect(this.masterFilter);
    this.droneOsc.start();

    // Sub-octave
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 30;
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.07;
    sub.connect(subGain);
    subGain.connect(this.masterFilter);
    sub.start();
    this.subGain = subGain;
  },

  // Additive harmonic swell
  addSwell(freqRatio, startTime) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60 * freqRatio;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.masterFilter);
    osc.start(startTime || this.ctx.currentTime);

    return { osc, gain };
  },

  setSwellVolume(index, vol) {
    if (this.swells[index]) {
      const t = this.ctx.currentTime;
      this.swells[index].gain.gain.setTargetAtTime(vol, t, 0.08);
    }
  },

  // Create harmonic swells layer
  createHarmonicLayers() {
    const ratios = [2, 3, 4, 5, 6]; // octave, fifth, 2-oct, major third, etc.
    const now = this.ctx.currentTime;
    ratios.forEach((r, i) => {
      this.swells.push(this.addSwell(r, now));
    });
  },

  // Inhale: rising sine swell + breath noise
  startInhale() {
    if (!this.initialized) return;
    if (!this.inhaleOsc) {
      this.inhaleOsc = this.ctx.createOscillator();
      this.inhaleOsc.type = 'sine';
      this.inhaleOsc.frequency.value = 220;

      this.inhaleGain = this.ctx.createGain();
      this.inhaleGain.gain.value = 0;

      // Noise source for breath texture
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;
      noiseFilter.Q.value = 0.5;

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = 0;

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterFilter);
      this.noiseNode.start();

      this.inhaleOsc.connect(this.inhaleGain);
      this.inhaleGain.connect(this.masterFilter);
      this.inhaleOsc.start();
    }
    const t = this.ctx.currentTime;
    this.inhaleGain.gain.setTargetAtTime(0.05, t, 0.05);
    this.noiseGain.gain.setTargetAtTime(0.03, t, 0.05);
  },

  updateInhale(breathValue) {
    if (!this.inhaleOsc) return;
    const t = this.ctx.currentTime;
    this.inhaleOsc.frequency.setTargetAtTime(220 + breathValue * 440, t, 0.05);
    this.inhaleGain.gain.setTargetAtTime(0.03 + breathValue * 0.12, t, 0.05);
    this.noiseGain.gain.setTargetAtTime(0.02 + breathValue * 0.04, t, 0.05);
    // Drone responds to breath
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(0.08 + breathValue * 0.15, t, 0.08);
    }
    if (this.subGain) {
      this.subGain.gain.setTargetAtTime(0.05 + breathValue * 0.08, t, 0.08);
    }
    // Harmonic swells scale with breath
    for (let i = 0; i < this.swells.length; i++) {
      this.setSwellVolume(i, breathValue * 0.04 * (i + 1));
    }
  },

  stopInhale() {
    if (!this.inhaleGain) return;
    const t = this.ctx.currentTime;
    this.inhaleGain.gain.setTargetAtTime(0, t, 0.08);
    if (this.noiseGain) {
      this.noiseGain.gain.setTargetAtTime(0, t, 0.06);
    }
  },

  // Exhale smooth decay
  playExhale(intensity) {
    if (!this.initialized) return;
    if (!this.exhaleGain) {
      this.exhaleOsc = this.ctx.createOscillator();
      this.exhaleOsc.type = 'sine';
      this.exhaleOsc.frequency.value = 330;
      this.exhaleGain = this.ctx.createGain();
      this.exhaleGain.gain.value = 0;
      this.exhaleOsc.connect(this.exhaleGain);
      this.exhaleGain.connect(this.masterFilter);
      this.exhaleOsc.start();
    }
    const t = this.ctx.currentTime;
    this.exhaleOsc.frequency.setValueAtTime(440 * intensity, t);
    this.exhaleOsc.frequency.exponentialRampToValueAtTime(110, t + 0.6);
    this.exhaleGain.gain.setValueAtTime(0.1 * intensity, t);
    this.exhaleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  },

  // Sync success: pearl-harmonic chime
  playSyncChime() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    frequencies.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      // Pan: water/ice left/right, fire/lava center, snow high shimmer
      const panner = this.ctx.createStereoPanner();
      if (i === 0 || i === 2) panner.pan.value = -0.3;  // left
      else if (i === 1 || i === 3) panner.pan.value = 0;    // center
      else panner.pan.value = 0.3;                             // right

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterFilter);

      osc.start(t + i * 0.06);
      osc.stop(t + 3);
    });
  },

  // Failure: gentle low thud
  playFailThud() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.masterFilter);
    osc.start(t);
    osc.stop(t + 0.5);
  },

  // Click lock sound at 15% sync threshold
  playClick() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterFilter);
    osc.start(t);
    osc.stop(t + 0.06);
  }
};

// ------------------------
// BREATH BUFFER
// ------------------------
const BreathBuffer = {
  holding: false,
  value: 0,         // 0..1 current buffer fill
  inhaleRate: 0,    // calculated each frame
  exhaleRate: 0,
  damping: 0.91,    // soft damping slope
  peakValue: 0,     // tracks max value for this inhale
  syncWindow: 0.15, // 15% timing window
  phase: 'idle',    // 'idle' | 'inhaling' | 'exhaling' | 'synced' | 'drifting'
  syncTimer: 0,
  driftTimer: 0,
  clickPlayed: false,

  // Target sync: peak should land near 1.0, success within ±15%
  get targetSync() { return 1.0; },

  start() {
    this.holding = true;
    this.phase = 'inhaling';
    this.peakValue = 0;
    this.clickPlayed = false;
    AudioEngine.startInhale();
  },

  release() {
    this.holding = false;
    this.phase = 'exhaling';
    AudioEngine.stopInhale();
    AudioEngine.playExhale(this.value);
  },

  update(dt) {
    // Clamp dt to prevent large jumps
    dt = Math.min(dt, 0.034);

    if (this.phase === 'inhaling') {
      // Inhale fills with smooth acceleration curve
      const rate = 0.18 + 0.12 * Math.sin(this.value * Math.PI);
      this.value += rate * dt * 60;
      this.value = Math.min(this.value, 1.0);
      this.peakValue = Math.max(this.peakValue, this.value);

      // Check sync threshold
      if (this.value >= this.targetSync - this.syncWindow && !this.clickPlayed) {
        this.clickPlayed = true;
        AudioEngine.playClick();
      }
      if (this.value >= this.targetSync) {
        this.triggerSync();
      }

    } else if (this.phase === 'exhaling') {
      // Apply soft damping slope
      const baseDecay = 0.025;
      const dampedRate = baseDecay * this.damping;
      this.value -= dampedRate * dt * 60;
      this.value = Math.max(this.value, 0);

      if (this.value <= 0.01) {
        this.value = 0;
        // Check if sync was successful
        if (this.synced) {
          // handled in triggerSync
        } else if (this.peakValue < this.targetSync - this.syncWindow) {
          // Drift: didn't reach sync threshold
          this.phase = 'drifting';
          this.driftTimer = 1.5;
          AudioEngine.playFailThud();
        } else {
          this.phase = 'idle';
        }
        this.synced = false;
      }

    } else if (this.phase === 'synced') {
      // Hold synced state, then gradually release
      this.value *= 0.99;
      if (this.value < 0.01) {
        this.value = 0;
        this.phase = 'idle';
      }

    } else if (this.phase === 'drifting') {
      this.driftTimer -= dt;
      this.value *= 0.97;
      if (this.driftTimer <= 0) {
        this.phase = 'idle';
        this.value = 0;
      }
    }

    AudioEngine.updateInhale(this.holding ? this.value : 0);
  },

  triggerSync() {
    this.phase = 'synced';
    this.synced = true;
    AudioEngine.playSyncChime();
    Sanctuary.triggerCreature();
  },

  reset() {
    this.holding = false;
    this.value = 0;
    this.peakValue = 0;
    this.phase = 'idle';
    this.synced = false;
    this.clickPlayed = false;
  }
};

// ------------------------
// ELEMENTAL RINGS
// ------------------------
class ElementalRing {
  constructor(config) {
    this.type = config.type;       // 'water' | 'fire' | 'lava' | 'snow' | 'ice'
    this.baseRadius = config.radius;
    this.width = config.width || 3;
    this.colors = config.colors;     // { body, particle, glow }
    this.particles = [];
    this.maxParticles = config.maxParticles || 60;
    this.time = 0;
    this.reactivity = 0;            // 0..1 how much the ring responds to breath
    this.waveOffset = Math.random() * Math.PI * 2;
    this.numVertices = 128;
  }

  initParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      angle: Math.random() * Math.PI * 2,
      radiusOffset: (Math.random() - 0.5) * 20,
      speed: 0.005 + Math.random() * 0.02,
      life: 0,
      maxLife: 1 + Math.random() * 3,
      size: 1 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 0.5
    };
  }

  update(dt, breathValue) {
    this.time += dt;
    this.reactivity += (breathValue - this.reactivity) * 0.1;

    this.particles.forEach(p => {
      p.angle += p.speed * (1 + this.reactivity * 2) * dt * 60;
      p.life += dt;
      if (p.life > p.maxLife) {
        Object.assign(p, this.createParticle());
      }
    });
  }

  render(ctx, cx, cy, breathValue) {
    const r = this.baseRadius + breathValue * 30;
    ctx.save();
    ctx.translate(cx, cy);

    switch (this.type) {
      case 'water': this.drawWater(ctx, r, breathValue); break;
      case 'fire': this.drawFire(ctx, r, breathValue); break;
      case 'lava': this.drawLava(ctx, r, breathValue); break;
      case 'snow': this.drawSnow(ctx, r, breathValue); break;
      case 'ice':   this.drawIce(ctx, r, breathValue); break;
    }

    // Draw particles
    this.drawParticles(ctx, breathValue);

    ctx.restore();
  }

  drawWater(ctx, r, bv) {
    ctx.lineWidth = 2 + bv * 3;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.4 + bv * 0.4})`;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const wave = Math.sin(a * 6 + this.time * 2 + this.waveOffset) * (4 + bv * 8);
      const rr = r + wave;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Glow
    ctx.shadowColor = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, 0.5)`;
    ctx.shadowBlur = bv * 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawFire(ctx, r, bv) {
    ctx.lineWidth = 2 + bv * 4;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.3 + bv * 0.5})`;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const flicker = Math.sin(a * 8 - this.time * 4) * (3 + bv * 10) +
                        Math.sin(a * 13 + this.time * 1.7) * (2 + bv * 5);
      const rr = r + flicker;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowColor = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, 0.6)`;
    ctx.shadowBlur = bv * 25;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawLava(ctx, r, bv) {
    ctx.lineWidth = 3 + bv * 3;
    const alpha = 0.35 + bv * 0.45;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${alpha})`;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const flow = Math.sin(a * 4 + this.time * 0.8) * (5 + bv * 7) +
                     Math.cos(a * 7 - this.time * 1.2) * (3 + bv * 4);
      const rr = r + flow;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowColor = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, 0.7)`;
    ctx.shadowBlur = bv * 30;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawSnow(ctx, r, bv) {
    ctx.lineWidth = 1.5 + bv * 2;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.3 + bv * 0.4})`;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const drift = Math.sin(a * 5 + this.time * 1.5) * (4 + bv * 6) +
                      Math.cos(a * 9 + this.time * 0.7) * (2 + bv * 3);
      const rr = r + drift;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowColor = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, 0.4)`;
    ctx.shadowBlur = bv * 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawIce(ctx, r, bv) {
    // Crystalline geometric pattern
    ctx.lineWidth = 1.5 + bv * 2;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.35 + bv * 0.4})`;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const crystal = Math.sin(a * 12 + this.time * 1.1) * (2 + bv * 5) +
                       Math.cos(a * 20 + this.time * 0.6) * (1 + bv * 3);
      const rr = r + crystal;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner facet lines
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.time * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
      ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.1 + bv * 0.2})`;
      ctx.stroke();
    }

    ctx.shadowColor = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, 0.5)`;
    ctx.shadowBlur = bv * 20;
    ctx.strokeStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${0.3 + bv * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const crystal = Math.sin(a * 12 + this.time * 1.1) * (2 + bv * 5);
      const rr = r + crystal;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawParticles(ctx, bv) {
    this.particles.forEach(p => {
      const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * (0.3 + bv * 0.5);
      const pr = this.baseRadius + p.radiusOffset + bv * 15;
      const x = Math.cos(p.angle) * pr;
      const y = Math.sin(p.angle) * pr + Math.sin(this.time + p.drift) * 5;

      ctx.fillStyle = `rgba(${this.colors.r}, ${this.colors.g}, ${this.colors.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (0.5 + bv * 0.8), 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Ring definitions
const RING_CONFIGS = [
  { type: 'water', radius: 75, width: 3, colors: { r: 122, g: 227, b: 247 }, maxParticles: 40 },    // cyan/teal
  { type: 'fire', radius: 110, width: 3, colors: { r: 251, g: 191, b: 36 }, maxParticles: 50 },     // amber/gold
  { type: 'lava', radius: 145, width: 4, colors: { r: 220, g: 38, b: 38 }, maxParticles: 45 },     // crimson/obsidian
  { type: 'snow', radius: 180, width: 2, colors: { r: 220, g: 232, b: 243 }, maxParticles: 55 },   // white/frost
  { type: 'ice',  radius: 215, width: 2, colors: { r: 147, g: 179, b: 255 }, maxParticles: 40 },   // silver/blue
];

// ------------------------
// CENTRAL NODE
// ------------------------
const CentralNode = {
  radius: 28,
  pulsePhase: 0,
  glowIntensity: 0,
  frostOpacity: 0.6,

  update(dt, breathValue) {
    this.pulsePhase += dt * 2;
    this.glowIntensity += (breathValue - this.glowIntensity) * 0.15;
  },

  render(ctx, cx, cy) {
    const r = this.radius + Math.sin(this.pulsePhase) * 2 + this.glowIntensity * 8;

    // Outer frost-diffused glow
    const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.5);
    grad.addColorStop(0, `rgba(180, 200, 255, ${0.15 + this.glowIntensity * 0.2})`);
    grad.addColorStop(0.5, `rgba(100, 130, 200, ${0.05 + this.glowIntensity * 0.1})`);
    grad.addColorStop(1, 'rgba(50, 60, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core: obsidian with frost edges
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    coreGrad.addColorStop(0, '#2a2d3a');
    coreGrad.addColorStop(0.6, '#1a1c26');
    coreGrad.addColorStop(1, '#0d0e14');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Frost edge ring
    ctx.strokeStyle = `rgba(180, 200, 240, ${this.frostOpacity * (0.5 + this.glowIntensity * 0.5)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(160, 190, 255, 0.6)`;
    ctx.shadowBlur = 8 + this.glowIntensity * 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner bright core dot
    const innerAlpha = 0.4 + this.glowIntensity * 0.5;
    const innerR = 4 + this.glowIntensity * 3;
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
    innerGrad.addColorStop(0, `rgba(220, 230, 255, ${innerAlpha})`);
    innerGrad.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Interaction prompt ring when idle
    if (BreathBuffer.phase === 'idle') {
      const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.3;
      ctx.strokeStyle = `rgba(180, 200, 240, ${pulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10 + Math.sin(Date.now() * 0.002) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
};

// ------------------------
// CREATURE PAYOFF
// ------------------------
const Creature = {
  active: false,
  opacity: 0,
  body: 0,              // 0..1 anim progress
  particles: [],
  maxParticles: 120,
  duration: 3.5,       // seconds for full animation
  eyeGlow: 0,
  wingPhase: 0,
  chromaShift: 0,
  breathWave: [],       // ripple wave particles

  init() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 10 + Math.random() * 60,
        speed: 0.005 + Math.random() * 0.02,
        size: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.8
      });
    }
  },

  trigger() {
    this.active = true;
    this.opacity = 0;
    this.body = 0;
    this.eyeGlow = 0;
    this.wingPhase = 0;
    this.chromaShift = 0;
    // Spawn ripple wave
    this.breathWave = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      this.breathWave.push({
        angle: a,
        radius: 20,
        speed: 80 + Math.random() * 40,
        alpha: 0.8,
        size: 2 + Math.random() * 3
      });
    }
  },

  update(dt) {
    if (!this.active) return;

    this.body = Math.min(1, this.body + dt / this.duration);
    // Fade in first half, fade out second half
    if (this.body < 0.5) {
      this.opacity = this.body * 2; // 0..1
    } else {
      this.opacity = (1 - this.body) * 2; // 1..0
    }
    this.opacity = Math.max(0, Math.min(1, this.opacity));

    this.eyeGlow += (1 - this.eyeGlow) * 0.1;
    this.wingPhase += dt * 3;
    this.chromaShift = this.opacity * 4;

    if (this.body >= 1) {
      this.active = false;
    }

    // Update ripple wave particles
    this.breathWave.forEach(p => {
      p.radius += p.speed * dt;
      p.alpha *= 0.98;
    });
    this.breathWave = this.breathWave.filter(p => p.alpha > 0.01);

    // Update body particles
    this.particles.forEach(p => {
      p.angle += p.speed * dt * 60;
      p.dist += Math.sin(this.wingPhase + p.phase) * 0.5;
    });
  },

  render(ctx, cx, cy) {
    if (!this.active || this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(cx, cy);

    // Dream ripple wave
    this.breathWave.forEach(p => {
      const x = Math.cos(p.angle) * p.radius;
      const y = Math.sin(p.angle) * p.radius;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, p.size);
      grad.addColorStop(0, `rgba(200, 220, 255, ${p.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Creature body: flowing, organic shape with particle trails
    ctx.rotate(Math.sin(this.wingPhase * 0.5) * 0.1);

    // Main body glow
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 35 + this.eyeGlow * 15);
    bodyGrad.addColorStop(0, `rgba(230, 235, 255, ${0.5 * this.opacity})`);
    bodyGrad.addColorStop(0.4, `rgba(180, 200, 240, ${0.25 * this.opacity})`);
    bodyGrad.addColorStop(1, 'rgba(140, 170, 220, 0)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 + this.eyeGlow * 10, 20 + this.eyeGlow * 8, this.wingPhase * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeY = -8;
    const eyeSpread = 12;
    for (let i = -1; i <= 1; i += 2) {
      const ex = i * eyeSpread;
      const eyeGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, 5 + this.eyeGlow * 4);
      eyeGrad.addColorStop(0, `rgba(255, 250, 230, ${this.eyeGlow * 0.9})`);
      eyeGrad.addColorStop(0.5, `rgba(200, 220, 255, ${this.eyeGlow * 0.4})`);
      eyeGrad.addColorStop(1, 'rgba(180, 200, 240, 0)');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 5 + this.eyeGlow * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particle trails around body
    this.particles.forEach(p => {
      const wobble = Math.sin(this.wingPhase + p.phase) * 5;
      const x = Math.cos(p.angle) * (p.dist + wobble);
      const y = Math.sin(p.angle) * (p.dist * 0.6 + wobble);
      const alpha = 0.3 * this.opacity * (0.5 + 0.5 * Math.sin(p.phase + this.wingPhase));

      const trailGrad = ctx.createRadialGradient(x, y, 0, x, y, p.size);
      trailGrad.addColorStop(0, `rgba(210, 225, 255, ${alpha})`);
      trailGrad.addColorStop(1, 'rgba(210, 225, 255, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ethereal "wings" - flowing curves
    const wingAlpha = 0.15 * this.opacity;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(200, 215, 255, ${wingAlpha})`;
      ctx.lineWidth = 1.5;
      for (let j = 0; j <= 30; j++) {
        const t = j / 30;
        const angle = t * Math.PI * 0.8;
        const wr = 40 + t * 30 + Math.sin(this.wingPhase + t * 3) * 5;
        const wx = i * (Math.cos(angle) * wr * 0.5 + t * 15);
        const wy = -Math.sin(angle) * wr * 0.4 + Math.sin(this.wingPhase * 0.7 + t * 2) * 8;
        j === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
};

// ------------------------
// SANCTUARY (Main Controller)
// ------------------------
const Sanctuary = {
  canvas: null,
  ctx: null,
  offscreenCanvas: null,
  offscreenCtx: null,
  width: 0,
  height: 0,
  cx: 0,
  cy: 0,
  rings: [],
  lastTime: 0,
  frameCount: 0,
  fps: 0,
  fpsCounter: 0,
  fpsStart: 0,
  dreamRipple: [],
  vignetteStrength: 0.7,
  chromaticAberration: 0,
  started: false,
  instructionAlpha: 1,

  init() {
    this.canvas = document.getElementById('sanctuary');
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // Offscreen canvas for bloom pass
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    // Initialize rings
    this.rings = RING_CONFIGS.map(cfg => {
      const ring = new ElementalRing(cfg);
      ring.initParticles();
      return ring;
    });

    // Initialize creature
    Creature.init();

    // Input handling
    this.bindInput();

    // Start loop
    this.fpsStart = performance.now();
    this.fpsCounter = 0;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;

    this.cx = this.width / 2;
    this.cy = this.height / 2;

    // Scale ring radii based on smaller screen dimension
    const scale = Math.min(this.width, this.height) / 500;
    this.rings.forEach((ring, i) => {
      ring.baseRadius = RING_CONFIGS[i].radius * scale;
    });
    CentralNode.radius = 28 * scale;
  },

  bindInput() {
    const holdHandler = (e) => {
      e.preventDefault();
      if (!this.started) {
        AudioEngine.init();
        AudioEngine.createHarmonicLayers();
        this.started = true;
        this.instructionAlpha = 0;
      }
      if (BreathBuffer.phase === 'idle' || BreathBuffer.phase === 'drifting') {
        if (BreathBuffer.phase === 'drifting' && BreathBuffer.driftTimer <= 0) {
          BreathBuffer.start();
        } else if (BreathBuffer.phase === 'idle') {
          BreathBuffer.start();
        }
      }
    };

    const releaseHandler = (e) => {
      e.preventDefault();
      if (BreathBuffer.phase === 'inhaling') {
        BreathBuffer.release();
      }
    };

    this.canvas.addEventListener('mousedown', holdHandler);
    this.canvas.addEventListener('mouseup', releaseHandler);
    this.canvas.addEventListener('mouseleave', releaseHandler);
    this.canvas.addEventListener('touchstart', holdHandler, { passive: false });
    this.canvas.addEventListener('touchend', releaseHandler, { passive: false });
    this.canvas.addEventListener('touchcancel', releaseHandler, { passive: false });

    window.addEventListener('resize', () => this.resize());
  },

  triggerCreature() {
    Creature.trigger();
  },

  loop(timestamp) {
    const rawDt = (timestamp - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.034); // Cap at ~30fps minimum to prevent spiral
    this.lastTime = timestamp;

    // FPS tracking
    this.fpsCounter++;
    if (timestamp - this.fpsStart >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsStart = timestamp;
    }

    // Update
    BreathBuffer.update(dt);
    CentralNode.update(dt, BreathBuffer.value);
    Creature.update(dt);

    this.rings.forEach(ring => {
      ring.update(dt, BreathBuffer.value);
    });

    // Chromatic aberration scales with breath pressure
    this.chromaticAberration = BreathBuffer.value * 4;

    // Render
    this.render();

    requestAnimationFrame(t => this.loop(t));
  },

  render() {
    const { ctx, width: w, height: h, cx, cy } = this;

    // Clear with deep obsidian background
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, w, h);

    // Background star field (subtle)
    this.drawStarfield(ctx, w, h);

    // Element rings (back to front)
    this.rings.forEach(ring => {
      ring.render(ctx, cx, cy, BreathBuffer.value);
    });

    // Central node
    CentralNode.render(ctx, cx, cy);

    // Creature
    Creature.render(ctx, cx, cy);

    // Post-processing: bloom overlay
    this.applyBloom(ctx, w, h);

    // Chromatic aberration (shifted color channels)
    if (this.chromaticAberration > 0.3) {
      this.applyChromaticAberration(ctx, w, h);
    }

    // Vignette
    this.drawVignette(ctx, w, h);

    // Instruction text
    this.drawInstructions(ctx, w, h);
  },

  drawStarfield(ctx, w, h) {
    // Deterministic star positions using seed
    const seed = 42;
    for (let i = 0; i < 80; i++) {
      const x = ((Math.sin(i * 7.3 + seed) * 0.5 + 0.5) * w);
      const y = ((Math.cos(i * 11.7 + seed) * 0.5 + 0.5) * h);
      const s = 0.5 + (Math.sin(i * 3.1 + seed) * 0.5 + 0.5);
      const a = 0.1 + (Math.sin(i * 2.3 + seed) * 0.5 + 0.5) * 0.15;
      const pulse = Math.sin(Date.now() * 0.001 + i) * 0.05;
      ctx.fillStyle = `rgba(180, 200, 240, ${a + pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawVignette(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    const grad = ctx.createRadialGradient(cx, cy, maxR * 0.3, cx, cy, maxR);
    const vs = this.vignetteStrength;
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.6, `rgba(0, 0, 0, ${vs * 0.3})`);
    grad.addColorStop(1, `rgba(0, 0, 0, ${vs})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },

  applyBloom(ctx, w, h) {
    // Simple bloom: draw bright overlay in center
    const breathInfluence = BreathBuffer.value;
    const glowR = 60 + breathInfluence * 80;

    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, glowR);
    grad.addColorStop(0, `rgba(180, 210, 255, ${0.04 + breathInfluence * 0.06})`);
    grad.addColorStop(0.5, `rgba(150, 180, 230, ${0.02 + breathInfluence * 0.03})`);
    grad.addColorStop(1, 'rgba(100, 130, 200, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  },

  applyChromaticAberration(ctx, w, h) {
    const shift = this.chromaticAberration;
    if (shift < 0.5) return;

    // Draw offset red and blue channels for chromatic effect
    const imageData = ctx.getImageData(0, 0,
      ctx.canvas.width / (window.devicePixelRatio || 1),
      ctx.canvas.height / (window.devicePixelRatio || 1));

    // Note: full per-pixel chromatic would be expensive; use simpler ring offsets instead
    // Draw colored rings at offset positions
    const cx = this.cx;
    const cy = this.cy;

    ctx.globalCompositeOperation = 'screen';

    // Red channel shift
    ctx.strokeStyle = `rgba(255, 50, 50, ${shift * 0.04})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - shift, cy, 50 + BreathBuffer.value * 20, 0, Math.PI * 2);
    ctx.stroke();

    // Blue channel shift
    ctx.strokeStyle = `rgba(50, 50, 255, ${shift * 0.04})`;
    ctx.beginPath();
    ctx.arc(cx + shift, cy, 50 + BreathBuffer.value * 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  },

  drawInstructions(ctx, w, h) {
    if (this.instructionAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.instructionAlpha;
    ctx.fillStyle = 'rgba(180, 200, 240, 0.7)';
    ctx.font = `${Math.max(13, Math.min(16, w * 0.02))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';

    ctx.fillText('Hold to inhale • Release to exhale', this.cx, h * 0.88);
    ctx.fillText('Fill the buffer to harmonize the elements', this.cx, h * 0.88 + 24);

    ctx.restore();
  },

  updateBreathIndicator() {
    const el = document.getElementById('breath-indicator');
    if (el) {
      const bar = el.querySelector('::after') || el;
      el.style.setProperty('--breath-pct', (BreathBuffer.value * 100) + '%');
      // Use direct style manipulation for the pseudo-element via CSS variable
    }
  }
};

// ------------------------
// BREATH INDICATOR BAR (CSS-driven)
// ------------------------
function updateBreathBar() {
  const el = document.getElementById('breath-indicator');
  if (el) {
    el.setAttribute('style', `
      --breath-pct: ${Math.round(BreathBuffer.value * 100)}%;
    `);
    // We'll use a direct inner element instead of pseudo
    let bar = el.querySelector('.bar-fill');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'bar-fill';
      bar.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        height: 100%;
        border-radius: 2px;
        background: linear-gradient(90deg, #7ae3f7, #a78bfa);
        transition: width 0.08s linear;
      `;
      el.appendChild(bar);
    }
    bar.style.width = (BreathBuffer.value * 100) + '%';
  }
}

// Override Sanctuary render to also update bar
const origRender = Sanctuary.render.bind(Sanctuary);
Sanctuary.render = function () {
  origRender();
  updateBreathBar();
};

// ------------------------
// BOOT
// ------------------------
window.addEventListener('DOMContentLoaded', () => {
  Sanctuary.init();
});
