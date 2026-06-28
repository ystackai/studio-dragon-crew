/**
 * WebAudio + real file-backed assets + ambient layers + interaction sounds.
 * Sea Dragon ownership. Mute persists via SanctuaryState.
 * Real WAVs from assets/generated/ for rotate, mirror, beam, flow, shrine, success (per feedback + asset v2).
 * All audio has visual equivalents. Gesture-gated only.
 */
(function (global) {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let ambientOsc = null;
  let ambientGain = null;
  let ambientFilter = null;
  let blessingCount = 0;

  // Real asset cache (loaded after first gesture)
  const assetMap = {
    'rotate-pipe': null,
    'mirror-turn': null,
    'beam-lock': null,
    'water-flow': null,
    'shrine-open': null,
    'success-tail': null
  };
  let assetsLoaded = false;

  function ensureCtx() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.72;
      masterGain.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
    loadRealAssets(); // ensure real assets are ready (after gesture in practice)
    return audioCtx;
  }

  function loadRealAssets() {
    if (assetsLoaded) return;
    assetsLoaded = true;
    const base = 'assets/generated/';
    Object.keys(assetMap).forEach((key) => {
      try {
        const a = new Audio(base + key + '.wav');
        a.preload = 'auto';
        // decode for webaudio use if desired; for simplicity we .play() the elements
        assetMap[key] = a;
      } catch (e) {}
    });
  }

  function playAsset(name, vol = 0.85) {
    if (muted) return;
    const a = assetMap[name];
    if (!a) return false;
    try {
      // clone for overlapping plays
      const p = a.cloneNode ? a.cloneNode() : a;
      p.volume = Math.min(1, vol);
      p.currentTime = 0;
      const pr = p.play();
      if (pr && pr.catch) pr.catch(() => {});
      return true;
    } catch (e) { return false; }
  }

  function setMuted(m) {
    muted = !!m;
    if (masterGain) masterGain.gain.value = muted ? 0.0001 : 0.72;
    if (ambientGain) ambientGain.gain.value = muted ? 0.0001 : (0.035 + Math.min(0.06, blessingCount * 0.012));
  }

  function updateAmbientForBlessings(count) {
    blessingCount = Math.max(0, Math.min(6, count | 0));
    if (!ensureCtx() || muted) return;
    if (!ambientOsc) {
      try {
        ambientOsc = audioCtx.createOscillator();
        ambientOsc.type = 'sine';
        ambientOsc.frequency.value = 58;
        ambientGain = audioCtx.createGain();
        ambientGain.gain.value = 0.0001;
        ambientFilter = audioCtx.createBiquadFilter();
        ambientFilter.type = 'lowpass';
        ambientFilter.frequency.value = 420;
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = 0.07;
        const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 4.5;
        lfo.connect(lfoGain); lfoGain.connect(ambientOsc.frequency);
        ambientOsc.connect(ambientFilter); ambientFilter.connect(ambientGain); ambientGain.connect(masterGain);
        lfo.start(); ambientOsc.start();
        // second soft layer for richer waking sanctuary (more ambient depth with blessings)
        const pad = audioCtx.createOscillator(); pad.type = 'sine'; pad.frequency.value = 87;
        const padG = audioCtx.createGain(); padG.gain.value = 0.0001;
        const padF = audioCtx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 260;
        pad.connect(padF); padF.connect(padG); padG.connect(masterGain);
        pad.start();
        ambientOsc._pad = pad; ambientOsc._padG = padG;
      } catch (e) {}
    }
    if (ambientGain) {
      const target = 0.0001 + (blessingCount * 0.013);
      ambientGain.gain.cancelScheduledValues(audioCtx.currentTime);
      ambientGain.gain.linearRampToValueAtTime(target, audioCtx.currentTime + 1.2);
      if (ambientOsc && ambientOsc._padG) {
        const pTarget = 0.0001 + (blessingCount * 0.007);
        ambientOsc._padG.gain.cancelScheduledValues(audioCtx.currentTime);
        ambientOsc._padG.gain.linearRampToValueAtTime(pTarget, audioCtx.currentTime + 1.6);
      }
    }
  }

  function playChime(freq = 620, dur = 0.28, type = 'sine') {
    if (muted || !ensureCtx()) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0.18;
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800;
    osc.connect(f); f.connect(g); g.connect(masterGain);
    osc.start();
    g.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    setTimeout(() => { osc.stop(); }, dur * 1000 + 40);
  }

  function playSuccess(kind = 'fire') {
    if (muted) return;
    // prefer real asset tail
    if (playAsset('success-tail', 0.9)) {
      // light synth layer on top
      if (ensureCtx()) setTimeout(() => playChime(620, 0.4, 'triangle'), 90);
      return;
    }
    const notes = kind === 'fire' ? [520, 660, 780] : [440, 550, 660];
    notes.forEach((f, i) => setTimeout(() => playChime(f, 0.36, 'triangle'), i * 90));
    setTimeout(() => playChime(92, 0.9, 'sine'), 80);
  }

  // extra tactile feedback sounds — use real WAV when present
  function playRotateClick() {
    if (muted) return;
    if (playAsset('rotate-pipe', 0.95)) return;
    if (!ensureCtx()) return;
    playChime(365 + (Math.random() * 25 | 0), 0.08, 'sawtooth');
  }
  function playSoftTone(freq = 520, dur = 0.18) {
    if (muted || !ensureCtx()) return;
    playChime(freq, dur, 'sine');
  }
  function playBeamTone(useReal) {
    if (muted) return;
    if (useReal && playAsset('beam-lock', 0.88)) return;
    if (!ensureCtx()) return;
    playChime(295, 0.26, 'triangle');
    setTimeout(() => playChime(590, 0.32, 'sine'), 60);
  }
  function playShrineOpen(element = 'fire') {
    if (muted) return;
    if (playAsset('shrine-open', 0.8)) return;
    if (!ensureCtx()) return;
    const base = ({fire: 420, ice: 310, water: 265, snow: 380, sea: 240, lava: 190})[element] || 320;
    playChime(base, 0.22, 'sine');
    setTimeout(() => playChime(base * 1.5, 0.18, 'triangle'), 90);
  }
  function playSeaChord(ok) {
    if (muted || !ensureCtx()) return;
    const chord = ok ? [312, 392, 466, 622] : [280, 355, 420];
    chord.forEach((f, i) => setTimeout(() => playChime(f, ok ? 0.7 : 0.22, 'sine'), i * 38));
    if (ok) {
      setTimeout(() => playChime(740, 1.1, 'sine'), 120);
      setTimeout(() => playChime(495, 0.9, 'triangle'), 260);
    }
  }
  function playLavaTurn() {
    if (muted || !ensureCtx()) return;
    playChime(168 + Math.random()*12, 0.11, 'sawtooth');
  }
  function playSnowCatch(n) {
    if (muted || !ensureCtx()) return;
    playChime(810 + ((n||0)%3)*22, 0.11, 'sine');
  }
  function playWaterFlow(ok) {
    if (muted) return;
    if (ok && playAsset('water-flow', 0.82)) return;
    if (!ensureCtx()) return;
    const f = ok ? 520 : 410;
    playChime(f, ok ? 0.18 : 0.09, 'sine');
    if (ok) setTimeout(() => playChime(680, 0.22, 'triangle'), 70);
  }
  function playMirrorTone(i, useReal) {
    if (muted) return;
    if (useReal && playAsset('mirror-turn', 0.75)) return;
    if (!ensureCtx()) return;
    playChime(265 + (i||0)*9, 0.07, 'sine');
  }

  // public
  global.SanctuaryAudio = {
    ensureCtx,
    setMuted,
    playChime,
    playSuccess,
    playRotateClick,
    playSoftTone,
    playBeamTone,
    playShrineOpen,
    playSeaChord,
    playLavaTurn,
    playSnowCatch,
    playWaterFlow,
    playMirrorTone,
    updateAmbientForBlessings,
    preloadAssets: loadRealAssets,
    isMuted: () => muted
  };

  // listen to global mute events from state
  window.addEventListener('sanctuary:mute', (e) => {
    setMuted(e.detail.muted);
  });
})(window);
