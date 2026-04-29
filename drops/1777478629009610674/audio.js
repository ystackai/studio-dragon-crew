/**
 * Ice Dragon Audio Synthesizer
 * Procedural audio using Web Audio API
 * No external dependencies, graceful silent fallback
 */
const DragonAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;

  // Initialize audio context (must be created after user gesture)
  function init() {
    if (ctx) return;

    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
  }

  function ensureContext() {
    init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return !!ctx;
  }

  // Mute/unmute toggle
  function setMute(val) {
    muted = val;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.3, ctx.currentTime, 0.05);
    }
  }

  function isMuted() {
    return muted;
  }

  // --- Sound synthesis primitives ---

  // Short noise burst for ice crack/input
  function playClick() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 4000;
    bandpass.Q.value = 2;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.6, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    source.connect(bandpass);
    bandpass.connect(env);
    env.connect(masterGain);
    source.start(t);
    source.stop(t + 0.1);
  }

  // Rising tension arpeggio for transition state
  function playTransition() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;
    const baseFreq = 320;
    const notes = [1, 1.25, 1.5, 2]; // Ascending arpeggio
    const step = 0.07;

    notes.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = baseFreq * mult;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * step);
      g.gain.linearRampToValueAtTime(0.15, t + i * step + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * step + 0.25);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(t + i * step);
      osc.stop(t + i * step + 0.3);
    });
  }

  // Crystalline chime for successful exhale
  function playSuccess() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;
    const harmonics = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const durations = [1.2, 1.0, 0.8, 0.7, 0.5, 0.4];

    harmonics.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12 / (i * 0.3 + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + durations[i] + 0.05);
    });

    // Shimmer overlay: noisy sparkle
    const shimmerBufSize = ctx.sampleRate * 1.2;
    const shimmerBuf = ctx.createBuffer(1, shimmerBufSize, ctx.sampleRate);
    const shimmerData = shimmerBuf.getChannelData(0);
    for (let i = 0; i < shimmerBufSize; i++) {
      shimmerData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (shimmerBufSize * 0.3)) * 0.3;
    }
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = shimmerBuf;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 6000;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.25, t);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    shimmer.connect(highpass);
    highpass.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(t);
    shimmer.stop(t + 1.2);
  }

  // Soft reset return tone
  function playReset() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 392;
    osc.frequency.linearRampToValueAtTime(330, t + 0.3);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // --- Exhale wind synthesis ---
  let windNodes = null;

  function startWind() {
    if (!ensureContext()) return;
    stopWind();
    const t = ctx.currentTime;
    const dur = 2.5;

    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.linearRampToValueAtTime(2400, t + 0.4);
    lp.frequency.linearRampToValueAtTime(600, t + dur - 0.5);
    lp.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    gain.gain.setValueAtTime(0.35, t + 1.0);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    source.connect(lp);
    lp.connect(gain);
    gain.connect(masterGain);
    source.start(t);
    source.stop(t + dur);

    // Tonal wind: two detuned saws for icy breath
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 76;
    osc1.frequency.linearRampToValueAtTime(110, t + 0.5);
    osc1.frequency.linearRampToValueAtTime(65, t + dur);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 77;
    osc2.frequency.linearRampToValueAtTime(112, t + 0.5);
    osc2.frequency.linearRampToValueAtTime(66, t + dur);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.12, t + 0.2);
    subGain.gain.setValueAtTime(0.1, t + 1.5);
    subGain.gain.linearRampToValueAtTime(0, t + dur);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 350;
    subFilter.Q.value = 2;

    osc1.connect(subFilter);
    osc2.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(masterGain);
    osc1.start(t);
    osc1.stop(t + dur);
    osc2.start(t);
    osc2.stop(t + dur);

    windNodes = { source, osc1, osc2 };
  }

  function stopWind() {
    // Wind nodes self-terminate; just clear reference
    windNodes = null;
  }

  return {
    init,
    setMute,
    isMuted,
    playClick,
    playTransition,
    playSuccess,
    playReset,
    startWind,
    stopWind,
  };
})();
