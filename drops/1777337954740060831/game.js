// ========================================
// Living Sanctuary - Core WebGL + Audio Engine
// 56 BPM master clock, moss-to-geode, frost fractals
// ========================================

(function () {
  "use strict";

  // ─── CONSTANTS ──────────────────────────────────────
  const BPM = 56;
  const BEAT_DURATION = 60 / BPM; // ~1.0714s per beat
  const QUANTUM_MS = 15; // ±15ms sync window
  const SOFT_CAP = 1.0; // max breathIntensity
  const FROST_SHARPEN_MIN = 0.8; // 80%
  const FROST_SHARPEN_MAX = 0.9; // 90%
  const DAMPING_FACTOR = 0.06; // fluid damping for smooth transitions
  const TRANSITION_DURATION = 3.5; // seconds for moss-to-geode

  // ─── STATE ──────────────────────────────────────────
  let gl = null;
  let program = null;
  let audioCtx = null;
  let masterGain = null;
  let heartbeatOsc = null;
  let heartbeatGain = null;
  let swellOsc = null;
  let swellGain = null;
  let swellFilter = null;
  let chimeSource = null;
  let started = false;

  const state = {
    breathIntensity: 0,       // 0..1, player input
    smoothIntensity: 0,       // dampened value
    mossPhase: 1.0,           // 1.0 = full moss, 0.0 = full geode
    frostLevel: 0.0,          // 0..1, frost fractal sharpness
    geodeGlow: 0.0,          // 0..1, geode bloom glow
    time: 0,                  // global time in seconds
    beatCount: 0,             // quantized beat counter
    lastBeatTime: 0,         // time of last quantized beat
    prevTimestamp: 0,         // previous frame timestamp
    targetIntensity: 0,       // raw input target
    dragging: false,
    mouseX: 0,
    mouseY: 0,
    width: 0,
    height: 0,
  };

  // ─── SHADERS ───────────────────────────────────────
  const VERT = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;

    uniform float u_time;
    uniform float u_intensity;    // smooth breath intensity 0..1
    uniform float u_moss;         // moss phase 1.0..0.0
    uniform float u_frost;        // frost fractal level 0..1
    uniform float u_geode;        // geode glow 0..1
    uniform float u_beat;         // beat pulse (0..1 wave)
    uniform vec2  u_resolution;

    varying vec2 v_uv;
    const float BEAT = 1.0714285714;

    // ── Hash & Noise ──
    float hash(float n) { return fract(sin(n) * 43758.5453123); }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash2(i);
      float b = hash2(i + vec2(1.0, 0.0));
      float c = hash2(i + vec2(0.0, 1.0));
      float d = hash2(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        val += amp * noise(p);
        p = rot * p * 2.1 + vec2(0.3, 0.7);
        amp *= 0.45;
      }
      return val;
    }

    // ── Frost Fractal (Koch-like recursive pattern) ──
    float frostPattern(vec2 uv, float sharpness) {
      vec2 p = uv * 6.0;
      float val = 0.0;
      for (int i = 0; i < 4; i++) {
        p = fract(p) - 0.5;
        float d = length(p) * 2.0;
        // Koch-like angular branches
        float angle = atan(p.y, p.x);
        float branch = abs(sin(angle * 6.0 + float(i) * 1.5));
        val += (1.0 - d) * branch * sharpness;
        p *= 2.3;
      }
      return val;
    }

    // ── Geode Crystal Geometry ──
    float geodeCrystals(vec2 uv, float intensity) {
      vec2 center = vec2(0.5);
      vec2 p = (uv - center) * 2.0;
      float r = length(p);
      float a = atan(p.y, p.x);

      // Radial crystal formation
      float crystals = 0.0;
      for (int i = 0; i < 12; i++) {
        float angle = float(i) / 12.0 * 6.28318;
        float crystal = abs(sin((a - angle) * 3.0));
        float dist = smoothstep(0.9, 0.1, r);
        crystals += crystal * dist;
      }
      return crystals * intensity;
    }

    // ── Moss Velvet Texture ──
    vec3 mossColors(vec2 uv, float t) {
      vec2 scaled = uv * 8.0;
      float n1 = fbm(scaled + t * 0.02);
      float n2 = fbm(scaled * 1.5 + vec2(t * 0.015, -t * 0.01));
      float n3 = noise(scaled * 3.0 + t * 0.03);

      // Deep moss palette
      vec3 deep = vec3(0.025, 0.055, 0.035);
      vec3 mid = vec3(0.07, 0.18, 0.10);
      vec3 light = vec3(0.12, 0.28, 0.16);

      float mixVal = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;
      vec3 color = mix(deep, mid, smoothstep(0.2, 0.6, mixVal));
      color = mix(color, light, smoothstep(0.5, 0.85, n2) * 0.4);

      // Subtle moss glow
      float mossGlow = smoothstep(0.55, 0.8, n1) * 0.3;
      color += vec3(0.05, 0.15, 0.08) * mossGlow;

      // Vignette for velvet depth
      float vignette = 1.0 - smoothstep(0.3, 1.4, length(uv - 0.5) * 1.6);
      color *= mix(0.55, 1.0, vignette);

      return color;
    }

    // ── Geode Colors ──
    vec3 geodeColors(vec2 uv, float intensity, float t) {
      vec2 center = vec2(0.5);
      vec2 p = (uv - center) * 2.0;
      float r = length(p);
      float a = atan(p.y, p.x);

      // Crystal facets
      float facet = 0.0;
      for (int i = 0; i < 8; i++) {
        float angle = float(i) / 8.0 * 6.28318 + t * 0.05;
        float d = abs(sin((a - angle) * 4.0));
        facet += d;
      }
      facet /= 8.0;

      // Amethyst / geode palette
      vec3 darkCrystal = vec3(0.08, 0.03, 0.15);
      vec3 midCrystal = vec3(0.35, 0.12, 0.55);
      vec3 brightCrystal = vec3(0.65, 0.35, 0.85);
      vec3 pearl = vec3(0.8, 0.75, 0.9);

      float radial = 1.0 - smoothstep(0.0, 1.1, r);
      vec3 color = mix(darkCrystal, midCrystal, radial * facet * intensity);
      color = mix(color, brightCrystal, smoothstep(0.1, 0.7, radial * facet) * intensity * 0.6);

      // Pearl highlights at edges of crystals
      float pearlEdge = smoothstep(0.7, 0.3, abs(facet - 0.5)) * radial;
      color += pearl * pearlEdge * intensity * 0.35;

      // Morning-light haze
      float haze = fbm(uv * 3.0 + t * 0.04) * 0.2;
      color += vec3(0.15, 0.12, 0.18) * haze * intensity;

      return color;
    }

    void main() {
      float t = u_time;
      float intensity = u_intensity;

      // Beat pulse (smooth sine wave synced to 56 BPM)
      float beatPulse = exp(-abs(sin(t * 3.14159 / BEAT)) * 4.0);

      // Moss layer
      vec3 moss = mossColors(v_uv, t);

      // Geode layer
      vec3 geode = geodeColors(v_uv, intensity * u_geode, t);

      // Blend between moss and geode (fluid interpolation)
      float blend = pow(1.0 - u_moss, 1.5);
      vec3 color = mix(moss, geode, blend);

      // Frost fractals at high intensity (80-90% threshold)
      float frostTrigger = smoothstep(0.8, 0.95, intensity);
      float frost = frostPattern(v_uv, frostTrigger * u_frost);
      vec3 frostColor = vec3(0.78, 0.84, 0.9);
      color = mix(color, frostColor, frost * frostTrigger * 0.25);

      // Frost fades at very high intensity as we transition to obsidian cool
      float obsidianCool = smoothstep(0.92, 1.0, intensity);
      color = mix(color, color * vec3(0.6, 0.55, 0.7), obsidianCool * 0.3);

      // Beat glow pulse (subtle warmth on heartbeat)
      float beatGlow = beatPulse * 0.06;
      color += vec3(0.08, 0.05, 0.1) * beatGlow * (1.0 - obsidianCool);

      // Geode core glow (velvety, diffused)
      float coreGlow = pow(1.0 - length(v_uv - 0.5) * 1.4, 3.0);
      color += vec3(0.12, 0.06, 0.2) * coreGlow * blend * 0.5;

      // Final vignette for depth
      float finalVignette = 1.0 - smoothstep(0.3, 1.5, length(v_uv - 0.5) * 1.5);
      color *= mix(0.5, 1.0, finalVignette);

      // Subtle film grain for organic feel
      float grain = hash2(v_uv * 1000.0 + t * 7.0) * 0.015;
      color += grain - 0.007;

      // Tone mapping
      color = color / (1.0 + color);
      color = pow(color, vec3(0.95));

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const BEAT = 60.0 / BPM; // 1.0714s uniform for shader

  // ─── GL INIT ────────────────────────────────────────
  function initGl() {
    const canvas = document.getElementById("gl");
    gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    if (!gl) return false;

    // ── Compile shaders ──
    const vs = createShader(gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return false;
    }

    // ── Fullscreen quad ──
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    resize();
    return true;
  }

  function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  // ─── AUDIO ENGINE ───────────────────────────────────
  function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    // ── Heartbeat pulse (56 BPM sub-bass) ──
    heartbeatOsc = audioCtx.createOscillator();
    heartbeatOsc.type = "sine";
    heartbeatOsc.frequency.value = 48; // deep sub-bass heartbeat

    heartbeatGain = audioCtx.createGain();
    heartbeatGain.gain.value = 0; // will pulse on beat

    heartbeatOsc.connect(heartbeatGain);
    heartbeatGain.connect(masterGain);
    heartbeatOsc.start();

    // Soft harmonic layer on heartbeat
    const heartbeatHarmonic = audioCtx.createOscillator();
    heartbeatHarmonic.type = "sine";
    heartbeatHarmonic.frequency.value = 96;

    const harmonicGain = audioCtx.createGain();
    harmonicGain.gain.value = 0;

    heartbeatHarmonic.connect(harmonicGain);
    harmonicGain.connect(masterGain);
    heartbeatHarmonic.start();

    // ── Audio swell (breath-reactive) ──
    swellOsc = audioCtx.createOscillator();
    swellOsc.type = "sine";
    swellOsc.frequency.value = 55;

    swellFilter = audioCtx.createBiquadFilter();
    swellFilter.type = "lowpass";
    swellFilter.frequency.value = 80; // under 80Hz until geode blooms
    swellFilter.Q.value = 0.5;

    swellGain = audioCtx.createGain();
    swellGain.gain.value = 0;

    swellOsc.connect(swellFilter);
    swellFilter.connect(swellGain);
    swellGain.connect(masterGain);
    swellOsc.start();

    // Pearl harmonic layer (unlocks at geode bloom)
    const pearlOsc = audioCtx.createOscillator();
    pearlOsc.type = "sine";
    pearlOsc.frequency.value = 220;

    const pearlGain = audioCtx.createGain();
    pearlGain.gain.value = 0;

    const pearlFilter = audioCtx.createBiquadFilter();
    pearlFilter.type = "lowpass";
    pearlFilter.frequency.value = 500;

    pearlOsc.connect(pearlFilter);
    pearlFilter.connect(pearlGain);
    pearlGain.connect(masterGain);
    pearlOsc.start();

    // ── Geode chimes (triggered at bloom peaks) ──
    // Pre-create chime nodes but don't play yet
    window._chimeOsc = audioCtx.createOscillator();
    window._chimeOsc.type = "sine";
    window._chimeOsc.frequency.value = 440;

    window._chimeGain = audioCtx.createGain();
    window._chimeGain.gain.value = 0;

    const chimeFilter = audioCtx.createBiquadFilter();
    chimeFilter.type = "lowpass";
    chimeFilter.frequency.value = 800;
    chimeFilter.Q.value = 1.0; // rolled-off upper harmonics

    window._chimeOsc.connect(chimeFilter);
    chimeFilter.connect(window._chimeGain);
    window._chimeGain.connect(masterGain);
    window._chimeOsc.start();

    // Store references for updates
    window._heartbeatHarmonic = heartbeatHarmonic;
    window._harmonicGain = harmonicGain;
    window._pearlOsc = pearlOsc;
    window._pearlGain = pearlGain;
  }

  // ─── BEAT QUANTIZATION ─────────────────────────────
  function quantizeBeat(time) {
    // Snap to nearest beat within ±15ms window
    const rawBeat = Math.round(time / BEAT_DURATION);
    const quantizedTime = rawBeat * BEAT_DURATION;
    const diff = Math.abs(time - quantizedTime);
    if (diff > QUANTUM_MS / 1000.0) {
      return { beat: rawBeat, quantized: time }; // outside window, use raw
    }
    return { beat: rawBeat, quantized: quantizedTime };
  }

  // ─── AUDIO UPDATE ───────────────────────────────────
  function updateAudio(dt) {
    if (!audioCtx || audioCtx.state === "suspended") return;

    const intensity = state.smoothIntensity;
    const t = state.time;

    // ── Heartbeat pulse on 56 BPM ──
    const { beat: currentBeat, quantized: qt } = quantizeBeat(t);
    const beatDiff = currentBeat - state.beatCount;

    if (beatDiff > 0) {
      // New beat triggered
      state.beatCount = currentBeat;
      state.lastBeatTime = qt;

      // Pulse heartbeat gain
      const now = audioCtx.currentTime;
      heartbeatGain.gain.setTargetAtTime(0.25, now, 0.02);
      heartbeatGain.gain.setTargetAtTime(0.0, now + 0.05, 0.06);

      // Harmonic pulse
      window._harmonicGain.gain.setTargetAtTime(0.08, now, 0.02);
      window._harmonicGain.gain.setTargetAtTime(0.0, now + 0.08, 0.08);

      // Chime trigger at geode bloom peaks
      if (intensity > FROST_SHARPEN_MIN && state._lastPeakBeat !== currentBeat) {
        state._lastPeakBeat = currentBeat;
        triggerChime(currentBeat);
      }
    }

    // Between beats, maintain very subtle heartbeat presence
    const beatPhase = ((t - state.lastBeatTime) / BEAT_DURATION);
    const restingPulse = Math.exp(-beatPhase * 6.0) * 0.04;
    heartbeatGain.gain.setTargetAtTime(restingPulse, audioCtx.currentTime, 0.05);

    // ── Audio swell tracks breath intensity ──
    // Soft cap to prevent buffer spikes
    const cappedIntensity = Math.min(intensity, SOFT_CAP);
    const targetFreq = 55 + cappedIntensity * 25; // 55-80Hz base range
    swellOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.08);

    // Low-pass filter: stays under 80Hz until geode blooms, then opens
    const filterFreq = 80 + (cappedIntensity > 0.5 ? (cappedIntensity - 0.5) * 800 : 0);
    swellFilter.frequency.setTargetAtTime(Math.min(filterFreq, 1200), audioCtx.currentTime, 0.1);

    // Swell gain follows intensity with fluid damping
    const targetGain = cappedIntensity * 0.15;
    swellGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.12);

    // ── Pearl harmonic layer (after geode bloom) ──
    const pearlActivation = smoothstep(0.4, 0.75, cappedIntensity);
    window._pearlOsc.frequency.setTargetAtTime(
      220 + cappedIntensity * 60, audioCtx.currentTime, 0.15
    );
    window._pearlGain.gain.setTargetAtTime(
      pearlActivation * 0.06 * (1.0 + Math.sin(t * 0.8) * 0.3),
      audioCtx.currentTime, 0.1
    );
  }

  function triggerChime(beat) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Pentatonic-ish note based on beat
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
    const note = notes[beat % notes.length];

    window._chimeOsc.frequency.setTargetAtTime(note, now, 0.01);
    window._chimeGain.gain.setTargetAtTime(0.08, now, 0.01);
    window._chimeGain.gain.setTargetAtTime(0.0, now + 0.3, 0.2);
  }

  function smoothstep(min, max, x) {
    const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
    return t * t * (3 - 2 * t);
  }

  // ─── PHYSICS / DAMPING ─────────────────────────────
  function updatePhysics(dt) {
    const t = state.time;

    // Fluid damping: blend target -> smooth
    const lerpSpeed = DAMPING_FACTOR;
    state.smoothIntensity += (state.targetIntensity - state.smoothIntensity) * lerpSpeed;

    // Soft cap enforcement
    state.smoothIntensity = Math.min(state.smoothIntensity, SOFT_CAP);

    // Moss-to-geode transition (3-4 second window)
    const transitionProgress = smoothstep(0.15, 0.75, state.smoothIntensity);
    state.mossPhase = 1.0 - transitionProgress;

    // Geode glow with breathing
    const baseGlow = transitionProgress;
    const breathPulse = Math.sin(t * Math.PI * 2 / BEAT_DURATION) * 0.05;
    state.geodeGlow = Math.max(0, baseGlow + breathPulse);

    // Frost fractal: sharp at 80-90%, fade after
    const frostRaw = smoothstep(FROST_SHARPEN_MIN, FROST_SHARPEN_MAX, state.smoothIntensity);
    const frostCool = 1.0 - smoothstep(0.92, 1.0, state.smoothIntensity);
    state.frostLevel = frostRaw * frostCool;

    // Natural decay (exhale) when input reduces
    if (state.targetIntensity < 0.1 && state.smoothIntensity > 0.01) {
      // Gentle exhale: intensity naturally drifts down
      state.smoothIntensity *= (1.0 - dt * 0.4);
    }
  }

  // ─── RENDER ─────────────────────────────────────────
  function render() {
    if (!gl || !program) return;

    gl.viewport(0, 0, state.width, state.height);
    gl.clearColor(0.02, 0.025, 0.035, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set uniforms
    const loc = (name) => gl.getUniformLocation(program, name);
    gl.uniform1f(loc("u_time"), state.time);
    gl.uniform1f(loc("u_intensity"), state.smoothIntensity);
    gl.uniform1f(loc("u_moss"), state.mossPhase);
    gl.uniform1f(loc("u_frost"), state.frostLevel);
    gl.uniform1f(loc("u_geode"), state.geodeGlow);
    gl.uniform1f(loc("u_beat"), Math.exp(-Math.abs(
      Math.sin(state.time * Math.PI / BEAT_DURATION)
    ) * 4.0));
    gl.uniform2f(loc("u_resolution"), state.width, state.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // ─── RESIZE ─────────────────────────────────────────
  function resize() {
    const canvas = document.getElementById("gl");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.floor(canvas.clientWidth * dpr);
    state.height = Math.floor(canvas.clientHeight * dpr);
    canvas.width = state.width;
    canvas.height = state.height;
    if (gl) gl.viewport(0, 0, state.width, state.height);
  }

  // ─── INPUT HANDLING ─────────────────────────────────
  function setupInput() {
    const canvas = document.getElementById("gl");

    // Mouse
    canvas.addEventListener("mousedown", (e) => {
      if (!started) { start(); started = true; }
      state.dragging = true;
      updateInputPos(e.clientX, e.clientY);
    });
    canvas.addEventListener("mousemove", (e) => {
      if (state.dragging) updateInputPos(e.clientX, e.clientY);
    });
    canvas.addEventListener("mouseup", () => {
      state.dragging = false;
      state.targetIntensity *= 0.3; // gentle exhale on release
    });

    // Touch
    canvas.addEventListener("touchstart", (e) => {
      if (!started) { start(); started = true; }
      e.preventDefault();
      state.dragging = true;
      const touch = e.touches[0];
      updateInputPos(touch.clientX, touch.clientY);
    }, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (state.dragging) {
        const touch = e.touches[0];
        updateInputPos(touch.clientX, touch.clientY);
      }
    }, { passive: false });
    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      state.dragging = false;
      state.targetIntensity *= 0.3;
    }, { passive: false });

    window.addEventListener("resize", resize);
  }

  function updateInputPos(x, y) {
    state.mouseX = x / state.width;
    state.mouseY = y / state.height;

    // Map position and velocity to breath intensity
    const centerDist = Math.sqrt(
      Math.pow(state.mouseX - 0.5, 2) + Math.pow(state.mouseY - 0.5, 2)
    );

    // Intensity from how far from center and how fast you're moving
    // Dragging outward = deeper breath
    const proximityIntensity = 1.0 - centerDist * 1.4;
    const posIntensity = Math.max(0, proximityIntensity);

    // Cap with soft limit
    state.targetIntensity = Math.min(posIntensity, SOFT_CAP);
  }

  // ─── MAIN LOOP ──────────────────────────────────────
  let _frameStart = 0;
  let _prevBeatAudio = -1;

  // Patch BEAT in uniform with correct JS value
  function mainLoop(timestamp) {
    if (!_frameStart) _frameStart = timestamp;

    const dt = Math.min((timestamp - state.prevTimestamp) / 1000.0, 0.05);
    state.prevTimestamp = timestamp;
    state.time += dt;

    // Audio-visual quantization: snap audio state to beat within ±15ms
    const { beat: currentBeat } = quantizeBeat(state.time);
    if (currentBeat !== _prevBeatAudio) {
      _prevBeatAudio = currentBeat;
      // Quantized audio update
      updateAudioQuantized(currentBeat);
    }

    updatePhysics(dt);
    updateAudio(dt);
    render();

    requestAnimationFrame(mainLoop);
  }

  function updateAudioQuantized(beat) {
    if (!audioCtx || audioCtx.state === "suspended") return;
    const now = audioCtx.currentTime;
    const intensity = state.smoothIntensity;

    // Heartbeat pulse at exact beat time
    heartbeatGain.gain.setTargetAtTime(0.28, now, 0.015);
    heartbeatGain.gain.setTargetAtTime(0.02, now + 0.06, 0.05);

    window._harmonicGain.gain.setTargetAtTime(0.1, now, 0.015);
    window._harmonicGain.gain.setTargetAtTime(0.0, now + 0.1, 0.06);

    // Chime on geode bloom beats
    if (intensity > FROST_SHARPEN_MIN) {
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const note = notes[beat % notes.length];
      window._chimeOsc.frequency.setTargetAtTime(note, now, 0.005);
      window._chimeGain.gain.setTargetAtTime(0.06, now, 0.005);
      window._chimeGain.gain.setTargetAtTime(0.0, now + 0.25, 0.18);
    }
  }

  // ─── START ─────────────────────────────────────────
  function start() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  // ─── INIT ───────────────────────────────────────────
  function init() {
    if (!initGl()) return;
    setupInput();
    requestAnimationFrame(mainLoop);
  }

  window.addEventListener("DOMContentLoaded", init);

})();
