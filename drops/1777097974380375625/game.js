/* ============================================================
   The Warm Exhale — Core Runtime
   60fps loop, state machine, path buffer, sync lock
   ============================================================ */

// --------------- Easing Curves ---------------
const Easing = {
  // Heavy soft settle — plush decay
  plushOut(t) {
    return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5);
  },

  // Slow roll-in like a tide surfacing
  tideIn(t) {
    return t * t * (3 - 2 * t);
  },

  // Deep slow release with a held tail
  exhale(t) {
    return 1 - Math.pow(1 - t, 2.8);
  },

  // Gentle sine ease for ambient pulse
  breathe(t) {
    return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2;
  },

  // Sharp start, soft tail — for sync lock flash
  syncFlash(t) {
    return t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9 * 0.15;
  },
};

// --------------- State Constants ---------------
const STATE = {
  AWAITING_INPUT: 'AWAITING_INPUT',
  QUEUING: 'QUEUING',
  SYNC_LOCK: 'SYNC_LOCK',
  EXHALE: 'EXHALE',
  DECAY: 'DECAY',
};

// --------------- Config ---------------
const CONFIG = {
  targetFps: 60,
  frameInterval: 1000 / 60,
  bufferCapacity: 8,
  syncThreshold: 5,
  exhaleDuration: 4000,
  decayDuration: 3000,
  syncLockDuration: 800,
  heartbeatInterval: 1200,
};

// --------------- Path Input Buffer ---------------
class PathBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.paths = [];
  }

  get fillLevel() {
    return this.paths.length / this.capacity;
  }

  get count() {
    return this.paths.length;
  }

  push(path) {
    if (this.paths.length < this.capacity) {
      this.paths.push(path);
    }
    return this.paths.length < this.capacity;
  }

  clear() {
    this.paths.length = 0;
  }

  getAt(index) {
    return this.paths[index] || null;
  }
}

// --------------- Path (single user-drawn path) ---------------
class Path {
  constructor(points, color = null) {
    this.points = points;
    this.color = color || `hsl(${30 + Math.random() * 20}, ${60 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`;
    this.progress = 0;
    this.alpha = 0;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}

// --------------- Audio Engine (placeholder for reactive audio swells) ---------------
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.currentGain = 0;
    this.lowEndLevel = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (_) {
      console.warn('Web Audio API unavailable');
    }
  }

  // Play a warm ambient swell
  playSwell(duration, intensity = 1) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lowOsc = this.ctx.createOscillator();
    const lowGain = this.ctx.createGain();

    // Mid swell — the warm exhale
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 * intensity, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + duration / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3 * intensity, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration / 1000);

    // Low-end anchor
    lowOsc.type = 'sine';
    lowOsc.frequency.setValueAtTime(55, now);
    lowOsc.frequency.linearRampToValueAtTime(40, now + duration / 1000);
    lowGain.gain.setValueAtTime(0, now);
    lowGain.gain.linearRampToValueAtTime(0.25 * intensity, now + 0.5);
    lowGain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    lowOsc.connect(lowGain);
    lowGain.connect(this.masterGain);
    lowOsc.start(now);
    lowOsc.stop(now + duration / 1000);

    this.lowEndLevel = 0.25 * intensity;
  }

  // Heartbeat pulse
  playHeartbeat() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 45;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Decay tail — lush, rolling, fading
  playDecay(duration) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration / 1000);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
}

// --------------- State Machine ---------------
class StateMachine {
  constructor() {
    this currentState = STATE.AWAITING_INPUT;
    this.transitions = {};
    this.onEnter = {};
    this.onExit = {};
    this.onUpdate = {};
  }

  register(state, { onEnter, onExit, onUpdate } = {}) {
    this.onEnter[state] = onEnter || (() => {});
    this.onExit[state] = onExit || (() => {});
    this.onUpdate[state] = onUpdate || (() => {});
  }

  addTransition(from, to) {
    if (!this.transitions[from]) this.transitions[from] = [];
    this.transitions[from].push(to);
  }

  canTransition(to) {
    if (!this.transitions[this.currentState]) return true;
    return this.transitions[this.currentState].includes(to);
  }

  transition(state) {
    if (state === this.currentState) return false;
    if (!this.canTransition(state)) {
      console.warn(`Invalid transition: ${this.currentState} -> ${state}`);
      return false;
    }
    const prev = this.currentState;
    // Must call onExit BEFORE onEnter for correct state ordering
    if (this.onExit[prev]) this.onExit[prev]();
    this.currentState = state;
    if (this.onEnter[state]) this.onEnter[state]();
    return true;
  }

  update(dt) {
    if (this.onUpdate[this.currentState]) {
      this.onUpdate[this.currentState](dt);
    }
  }
}

// --------------- Renderer ---------------
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.glowIntensity = 0;
    this.backgroundAlpha = 1;
    this.syncFlashAlpha = 0;
    this.heartbeatPulse = 0;
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * devicePixelRatio;
    this.canvas.height = this.height * devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  clear(alpha) {
    const a = alpha !== undefined ? alpha : 1;
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle = '#0a0806';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;
   }

  // Subtle stone texture overlay
  drawStoneTexture() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 40; i++) {
      const x = (i * 137.5) % this.width;
      const y = (i * 97.3) % this.height;
      const size = 30 + (i % 5) * 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, 'rgba(60, 45, 35, 0.5)');
      grad.addColorStop(1, 'rgba(10, 8, 6, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
    ctx.restore();
   }

   // Draw plush-edge paths with soft glow and melt effect
  drawPath(path, progress) {
    if (!path || path.points.length < 2) return;

    const alpha = path.alpha * (progress >= 1 ? 1 : Easing.exhale(progress));
    if (alpha < 0.01) return;

    const cx = this.width / 2 + path.offsetX;
    const cy = this.height / 2 + path.offsetY;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(path.scale, path.scale);

      // Third pass: deep ambient glow (widest, softest)
    this.ctx.globalAlpha = alpha * 0.15;
    this.ctx.shadowColor = path.color;
    this.ctx.shadowBlur = 50 + this.glowIntensity * 40;
    this.ctx.strokeStyle = path.color;
    this.ctx.lineWidth = 12;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this._drawSmoothPath(path, progress);
    this.ctx.stroke();

      // Second pass: plush edge glow
    this.ctx.globalAlpha = alpha * 0.4;
    this.ctx.shadowBlur = 25 + this.glowIntensity * 25;
    this.ctx.lineWidth = 6;
    this._drawSmoothPath(path, progress);
    this.ctx.stroke();

      // First pass: core stroke
    this.ctx.globalAlpha = alpha;
    this.ctx.shadowBlur = 10 + this.glowIntensity * 15;
    this.ctx.lineWidth = 2.5;
    this._drawSmoothPath(path, progress);
    this.ctx.stroke();

    this.ctx.restore();
   }

   // Helper: draw the smoothed path curve
   _drawSmoothPath(path, progress) {
    const drawCount = Math.max(2, Math.floor(progress * path.points.length));
    this.ctx.beginPath();
    this.ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < drawCount; i++) {
      const prev = path.points[i - 1];
      const curr = path.points[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
     }
    }

  // Ambient warmth vignette centered on canvas
  drawWarmth() {
    if (this.glowIntensity < 0.01) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.max(this.width, this.height) * (0.3 + this.glowIntensity * 0.7);

    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(212, 168, 122, ${0.08 * this.glowIntensity})`);
    grad.addColorStop(0.5, `rgba(180, 110, 60, ${0.04 * this.glowIntensity})`);
    grad.addColorStop(1, 'rgba(10, 8, 6, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Sync lock flash
  drawSyncFlash() {
    if (this.syncFlashAlpha < 0.01) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.max(this.width, this.height) * 0.8;

    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(240, 200, 150, ${0.15 * this.syncFlashAlpha})`);
    grad.addColorStop(0.6, `rgba(212, 168, 122, ${0.05 * this.syncFlashAlpha})`);
    grad.addColorStop(1, 'rgba(10, 8, 6, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Heartbeat ring
  drawHeartbeat(pulse) {
    if (pulse < 0.01) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = 80 + pulse * 200;
    const alpha = Math.max(0, 0.12 * (1 - pulse));

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = '#d4a87a';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }
}

// --------------- UI Bindings ---------------
class UIBinder {
  constructor(buffer) {
    this.buffer = buffer;
    this.bufferFill = document.getElementById('buffer-fill');
    this.bufferCount = document.getElementById('buffer-count');
    this.syncBtn = document.getElementById('sync-btn');
    this.stateLabel = document.getElementById('state-label');
    this.canvas = document.getElementById('canvas');
  }

  updateBuffer() {
    const level = this.buffer.fillLevel;
    if (this.bufferFill) {
      this.bufferFill.style.width = (level * 100) + '%';
    }
    if (this.bufferCount) {
      this.bufferCount.textContent = `${this.buffer.count} / ${this.buffer.capacity}`;
    }
    this.updateSyncButton();
  }

  updateSyncButton() {
    if (!this.syncBtn) return;
    const enabled = this.buffer.count >= CONFIG.syncThreshold;
    this.syncBtn.disabled = !enabled;
  }

  setState(state) {
    if (this.stateLabel) {
      this.stateLabel.textContent = state.replace(/_/g, ' ');
    }
  }
}

// --------------- Particle Spore (for exhale visual richness) ---------------
class Spore {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 30;
    this.vy = (Math.random() - 0.5) * 30;
    this.life = 0;
    this.maxLife = 2 + Math.random() * 3;
    this.size = 1.5 + Math.random() * 3;
    this.hue = 25 + Math.random() * 25;
    this.alpha = 0;
  }

  update(dt) {
    this.life += dt;
    const t = this.life / this.maxLife;
    this.x += this.vx * dt * 0.5;
    this.y += this.vy * dt * 0.5;
    this.vx *= 0.99;
    this.vy *= 0.99;
    this.alpha = t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.9);
    return this.life < this.maxLife;
  }

  draw(ctx, cx, cy) {
    if (this.alpha < 0.01) return;
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.6;
    ctx.fillStyle = `hsl(${this.hue}, 70%, 65%)`;
    ctx.shadowColor = `hsl(${this.hue}, 80%, 70%)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx + this.x, cy + this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --------------- Main Game Runtime ---------------
class Game {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.running = false;
    this.lastTime = 0;
    this.accumulatedTime = 0;

    // Core subsystems
    this.buffer = new PathBuffer(CONFIG.bufferCapacity);
    this.audio = new AudioEngine();
    this.stateMachine = new StateMachine();
    this.renderer = new Renderer(this.canvas);
    this.ui = new UIBinder(this.buffer);

    // Drawing state
    this.isDrawing = false;
    this.currentPoints = [];
    this.spores = [];

    // Phase timing
    this.phaseStartTime = 0;
    this.phaseProgress = 0;
    this.heartbeatTimer = 0;
    this.heartbeatPhase = 0;

    // Sync lock clock alignment
    this.syncOffset = 0;
    this.visualClock = 0;
    this.audioClock = 0;

    this._bindEvents();
    this._registerStates();
    this._resizeHandler = () => this.renderer.resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  // ---------- Input bindings ----------
  _bindEvents() {
    const c = this.canvas;

    // Pointer events work for both mouse and touch
    c.addEventListener('pointerdown', (e) => {
      if (this.stateMachine.currentState !== STATE.AWAITING_INPUT &&
          this.stateMachine.currentState !== STATE.QUEUING) return;
      this.audio.init();
      this.isDrawing = true;
      const rect = c.getBoundingClientRect();
      this.currentPoints = [{
        x: e.clientX - rect.left - c.clientWidth / 2,
        y: e.clientY - rect.top - c.clientHeight / 2,
      }];
      c.setPointerCapture(e.pointerId);
    });

    c.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const rect = c.getBoundingClientRect();
      this.currentPoints.push({
        x: e.clientX - rect.left - c.clientWidth / 2,
        y: e.clientY - rect.top - c.clientHeight / 2,
      });
    });

    c.addEventListener('pointerup', (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.currentPoints.length >= 2) {
        this.buffer.push(new Path(this.currentPoints));
        this.ui.updateBuffer();
        if (this.stateMachine.currentState === STATE.AWAITING_INPUT) {
          this.stateMachine.transition(STATE.QUEUING);
        }
        // Auto-trigger sync lock when buffer reaches threshold
        if (this.buffer.count >= CONFIG.syncThreshold &&
            this.stateMachine.currentState === STATE.QUEUING) {
          this._triggerSyncLock();
        }
      }
      this.currentPoints = [];
      c.releasePointerCapture(e.pointerId);
    });

    // Sync Lock button
    document.getElementById('sync-btn').addEventListener('click', () => {
      if (this.stateMachine.currentState === STATE.QUEUING) {
        this.audio.init();
        this._triggerSyncLock();
      }
    });
  }

  // ---------- State registrations ----------
  _registerStates() {
    const sm = this.stateMachine;
    const self = this;

    // Allow transitions
    sm.addTransition(STATE.AWAITING_INPUT, STATE.QUEUING);
    sm.addTransition(STATE.QUEUING, STATE.SYNC_LOCK);
    sm.addTransition(STATE.QUEUING, STATE.AWAITING_INPUT);
    sm.addTransition(STATE.SYNC_LOCK, STATE.EXHALE);
    sm.addTransition(STATE.EXHALE, STATE.DECAY);
    sm.addTransition(STATE.DECAY, STATE.AWAITING_INPUT);

    // AWAITING_INPUT
    sm.register(STATE.AWAITING_INPUT, {
      onEnter() {
        self.ui.setState(STATE.AWAITING_INPUT);
        self.renderer.glowIntensity = 0;
        self.renderer.syncFlashAlpha = 0;
      },
      onUpdate(dt) {
        self._updateIdle(dt);
      },
    });

    // QUEUING — paths collected, waiting for sync lock
    sm.register(STATE.QUEUING, {
      onEnter() {
        self.ui.setState(STATE.QUEUING);
      },
      onUpdate(dt) {
        self._updateIdle(dt);
      },
    });

    // SYNC_LOCK — align clocks, prepare for exhale
    sm.register(STATE.SYNC_LOCK, {
      onEnter() {
        self.ui.setState(STATE.SYNC_LOCK);
        self.phaseStartTime = performance.now();
        self.phaseProgress = 0;
        // Align visual and audio clocks
        self.visualClock = 0;
        self.audioClock = 0;
        self.syncOffset = 0;
        // Heartbeat builds
        self.heartbeatTimer = 0;
        self.heartbeatPhase = 0;
        // Flash in
        self.renderer.syncFlashAlpha = 0;
        // Mute button during sync
        document.getElementById('sync-btn').disabled = true;
      },
      onUpdate(dt) {
        self._updateSyncLock(dt);
      },
    });

    // EXHALE — visual melt, audio swell, spores bloom
    sm.register(STATE.EXHALE, {
      onEnter() {
        self.ui.setState(STATE.EXHALE);
        self.phaseStartTime = performance.now();
        self.phaseProgress = 0;
        // Trigger audio swell
        const intensity = Math.min(1, self.buffer.count / CONFIG.bufferCapacity);
        self.audio.playSwell(CONFIG.exhaleDuration, intensity);
        // Spawn spores from path origins
        self._spawnSpores();
        // Reset path animations
        for (let i = 0; i < self.buffer.paths.length; i++) {
          const p = self.buffer.getAt(i);
          p.progress = 0;
          p.alpha = 0.8 + Math.random() * 0.2;
          p.scale = 0.3;
          p.offsetX = 0;
          p.offsetY = 0;
        }
        self.renderer.glowIntensity = 0;
        self.renderer.syncFlashAlpha = 0.7;
      },
      onUpdate(dt) {
        self._updateExhale(dt);
      },
    });

    // DECAY — fade out, reset for next cycle
    sm.register(STATE.DECAY, {
      onEnter() {
        self.ui.setState(STATE.DECAY);
        self.phaseStartTime = performance.now();
        self.phaseProgress = 0;
        // Play decay tail
        self.audio.playDecay(CONFIG.decayDuration);
      },
      onUpdate(dt) {
        self._updateDecay(dt);
      },
    });
  }

  // ---------- Sync Lock trigger ----------
  _triggerSyncLock() {
    this.stateMachine.transition(STATE.SYNC_LOCK);
  }

  // ---------- Spawn spores (visual richness for exhale) ----------
  _spawnSpores() {
    this.spores = [];
    for (let i = 0; i < this.buffer.paths.length; i++) {
      for (let j = 0; j < 12; j++) {
        this.spores.push(new Spore(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200
        ));
      }
    }
  }

  // ---------- Idle (AWAITING_INPUT / QUEUING) ----------
  _updateIdle(dt) {
    const self = this;
     // Subtle heartbeat ambient during queuing
    if (this.stateMachine.currentState === STATE.QUEUING) {
      this.heartbeatTimer += dt * 1000;
      this.heartbeatPhase += dt * (Math.PI * 2 / (CONFIG.heartbeatInterval / 1000));
      if (this.heartbeatTimer >= CONFIG.heartbeatInterval) {
        this.heartbeatTimer = 0;
        this.audio.playHeartbeat();
        this.heartbeatPhase = 0;
      }
      this.renderer.heartbeatPulse = Easing.breathe(
        (this.heartbeatTimer / CONFIG.heartbeatInterval + Math.sin(this.heartbeatPhase) * 0.1)
      );
      // Glow builds with buffer fill
      this.renderer.glowIntensity += (this.buffer.fillLevel * 0.3 - this.renderer.glowIntensity) * dt * 2;
    } else {
      this.renderer.heartbeatPulse *= 0.95;
      this.renderer.glowIntensity *= 0.98;
    }
  }

  // ---------- Sync Lock phase ----------
  _updateSyncLock(dt) {
    const _ = this;
    const elapsed = performance.now() - this.phaseStartTime;
    this.phaseProgress = Math.min(1, elapsed / CONFIG.syncLockDuration);

    // Sync flash ramps up then fades
    this.renderer.syncFlashAlpha = Easing.syncFlash(this.phaseProgress);

    // Heartbeat pulses accelerate
    this.heartbeatTimer += dt * 1000;
    const pulseInterval = CONFIG.heartbeatInterval * (1 - this.phaseProgress * 0.5);
    if (this.heartbeatTimer >= pulseInterval) {
      this.heartbeatTimer = 0;
      this.audio.playHeartbeat();
     }
    this.renderer.heartbeatPulse = Easing.breathe(this.phaseProgress);

    // Glow intensifies
    this.renderer.glowIntensity = this.phaseProgress * 0.6 + this.buffer.fillLevel * 0.3;

    // Transition to exhale
    if (this.phaseProgress >= 1) {
      this.stateMachine.transition(STATE.EXHALE);
    }
  }

  // ---------- Exhale phase ----------
  _updateExhale(dt) {
    const _ = this;
    const elapsed = performance.now() - this.phaseStartTime;
    this.phaseProgress = Math.min(1, elapsed / CONFIG.exhaleDuration);
    this.visualClock += dt;
    this.audioClock += dt;

    // Animate paths melting in
    const pathCount = this.buffer.paths.length;
    for (let i = 0; i < pathCount; i++) {
      const p = this.buffer.getAt(i);
      const staggerDelay = (i / pathCount) * 0.3;
      const pProgress = Math.max(0, Math.min(1,
        (this.phaseProgress - staggerDelay) / (1 - staggerDelay)
      ));
      p.progress = Easing.exhale(pProgress);
      p.scale = 0.3 + Easing.plushOut(pProgress) * 0.7;
      p.alpha = Easing.tideIn(Math.min(1, pProgress * 2)) * 0.95;
      // Slight rolling motion
      p.offsetX = Math.sin(this.visualClock * 0.8 + i * 1.2) * 8 * p.progress;
      p.offsetY = Math.cos(this.visualClock * 0.6 + i * 0.9) * 5 * p.progress;
    }

    // Glow rises then plateaus
    this.renderer.glowIntensity = Easing.exhale(this.phaseProgress) * 0.9;
    // Flash fades
    this.renderer.syncFlashAlpha *= 0.96;

    // Spores
    this._updateSpores(dt);

    // Transition to decay
    if (this.phaseProgress >= 1) {
      this.stateMachine.transition(STATE.DECAY);
    }
  }

  // ---------- Decay phase ----------
  _updateDecay(dt) {
    const _ = this;
    const elapsed = performance.now() - this.phaseStartTime;
    this.phaseProgress = Math.min(1, elapsed / CONFIG.decayDuration);

    // Fade paths out
    const pathCount = this.buffer.paths.length;
    for (let i = 0; i < pathCount; i++) {
      const p = this.buffer.getAt(i);
      const staggerDelay = (i / (pathCount || 1)) * 0.2;
      const d = Math.max(0, Math.min(1,
        (this.phaseProgress - staggerDelay) / (1 - staggerDelay)
      ));
      p.alpha *= (1 - d) * 0.97;
      p.scale += dt * 0.08;
      p.offsetX += Math.sin(this.visualClock + i) * 0.3;
      p.offsetY += Math.cos(this.visualClock * 0.7 + i) * 0.2;
    }

    // Glow decays
    this.renderer.glowIntensity *= (1 - this.phaseProgress * 0.95);
    this.renderer.heartbeatPulse *= 0.97;
    this.renderer.syncFlashAlpha *= 0.95;

    // Spores fade
    this._updateSpores(dt);

    // Transition back to awaiting
    if (this.phaseProgress >= 1) {
      this._resetForNextCycle();
      this.stateMachine.transition(STATE.AWAITING_INPUT);
    }
  }

  // ---------- Spore system ----------
  _updateSpores(dt) {
    this.spores = this.spores.filter(s => s.update(dt));
  }

  // ---------- Reset for next cycle ----------
  _resetForNextCycle() {
    // Keep buffer contents for reference (optional: clear entirely)
    // For now we clear so user starts fresh
    this.buffer.clear();
    this.spores = [];
    this.ui.updateBuffer();
    this.ui.updateSyncButton();
    this.renderer.glowIntensity = 0;
    this.renderer.syncFlashAlpha = 0;
    this.renderer.heartbeatPulse = 0;
    this.visualClock = 0;
    this.audioClock = 0;
  }

  // ---------- Render frame ----------
    _render() {
    const r = this.renderer;

     // Base clear
    r.clear();

     // Stone texture (subtle, always present)
    r.drawStoneTexture();

     // Warmth vignette
    r.drawWarmth();

    // Heartbeat ring
    r.drawHeartbeat(r.heartbeatPulse);

    // Paths
    const pathCount = this.buffer.paths.length;
    for (let i = 0; i < pathCount; i++) {
      r.drawPath(this.buffer.getAt(i), this.buffer.getAt(i).progress);
    }

    // Current drawing stroke
    if (this.isDrawing && this.currentPoints.length >= 2) {
      const ctx = r.ctx;
      const cx = r.width / 2;
      const cy = r.height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#e8b88a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#e8b88a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
      for (let i = 1; i < this.currentPoints.length; i++) {
        const prev = this.currentPoints[i - 1];
        const curr = this.currentPoints[i];
        ctx.quadraticCurveTo(prev.x, prev.y,
          (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Spores
    for (const s of this.spores) {
      s.draw(r.ctx, r.width / 2, r.height / 2);
    }

    // Sync flash overlay
    r.drawSyncFlash();
  }

  // ---------- Main loop (60fps target) ----------
  _loop(timestamp) {
    if (!this.running) return;

    if (!this.lastTime) this.lastTime = timestamp;
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp delta to avoid spiral of death
    const dt = Math.min(rawDt, 0.05);

    // Update state machine
    this.stateMachine.update(dt);

    // Render
    this._render();

    // Queue next frame
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  // ---------- Public API ----------
  start() {
    this.running = true;
    this.renderer.resize();
    this.ui.updateBuffer();
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._resizeHandler);
  }
}

// --------------- Boot ---------------
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.start();
});
