/**
 * WebAudio + ambient layers + interaction sounds.
 * Sea Dragon ownership. Mute persists via SanctuaryState.
 * All audio has visual equivalents. Expanded per review for more tactile feel.
 */
(function (global) {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let ambientOsc = null;
  let ambientGain = null;
  let ambientFilter = null;
  let blessingCount = 0;

  // Real file-backed assets (loaded on first gesture)
  let assetBuffers = {};
  let assetsLoaded = false;

  function ensureCtx() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.72;
      masterGain.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
    return audioCtx;
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
        // store for ramp
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

  // Load real generated assets (once, on gesture)
  function loadGeneratedAssets() {
    if (assetsLoaded || !ensureCtx()) return;
    const names = ['rotate_click','beam_success','water_flow','mirror_tone','shrine_open','loom_awaken'];
    let remaining = names.length;
    names.forEach((nm) => {
      const url = 'assets/generated/' + nm + '.wav';
      fetch(url).then(r => r.arrayBuffer()).then(buf => audioCtx.decodeAudioData(buf)).then(decoded => {
        assetBuffers[nm] = decoded;
      }).catch(() => { /* fallback to procedural remains */ }).finally(() => {
        remaining--;
        if (remaining <= 0) assetsLoaded = true;
      });
    });
  }

  function playAsset(name, vol = 0.9) {
    if (muted || !ensureCtx() || !assetBuffers[name]) return false;
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = assetBuffers[name];
      const g = audioCtx.createGain();
      g.gain.value = vol;
      src.connect(g); g.connect(masterGain);
      src.start();
      return true;
    } catch (e) { return false; }
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
    if (muted || !ensureCtx()) return;
    const notes = kind === 'fire' ? [520, 660, 780] : [440, 550, 660];
    notes.forEach((f, i) => setTimeout(() => playChime(f, 0.36, 'triangle'), i * 90));
    // warm low bloom for any success
    setTimeout(() => playChime(92, 0.9, 'sine'), 80);
  }

  // extra tactile feedback sounds (visuals always present; safe when muted)
  // prefer real generated assets when present (loaded on gesture)
  function playRotate() {
    if (playAsset('rotate_click', 0.95)) return;
    if (muted || !ensureCtx()) return;
    playChime(365 + (Math.random() * 25 | 0), 0.08, 'sawtooth');
  }
  function playSoftTone(freq = 520, dur = 0.18) {
    if (muted || !ensureCtx()) return;
    playChime(freq, dur, 'sine');
  }
  function playBeam(win) {
    if (win && playAsset('beam_success', 0.92)) return;
    if (playAsset('mirror_tone', 0.7)) return;
    if (muted || !ensureCtx()) return;
    playChime(295, 0.26, 'triangle');
    setTimeout(() => playChime(590, 0.32, 'sine'), 60);
  }
  function playShrineOpen(element = 'fire') {
    if (playAsset('shrine_open', 0.82)) return;
    if (muted || !ensureCtx()) return;
    const base = ({fire: 420, ice: 310, water: 265, snow: 380, sea: 240, lava: 190})[element] || 320;
    playChime(base, 0.22, 'sine');
    setTimeout(() => playChime(base * 1.5, 0.18, 'triangle'), 90);
  }
  function playSeaChord(ok) {
    if (muted || !ensureCtx()) return;
    const chord = ok ? [312, 392, 466, 622] : [280, 355, 420];
    chord.forEach((f, i) => setTimeout(() => playChime(f, ok ? 0.7 : 0.22, 'sine'), i * 38));
    if (ok) {
      // extra distant choir pad layer for success (more sound, visual tide/pearl always present)
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
    if (ok && playAsset('water_flow', 0.8)) return;
    if (muted || !ensureCtx()) return;
    // soft liquid plink for flow progress or win
    const f = ok ? 520 : 410;
    playChime(f, ok ? 0.18 : 0.09, 'sine');
    if (ok) setTimeout(() => playChime(680, 0.22, 'triangle'), 70);
  }
  function playMirror(i) {
    if (playAsset('mirror_tone', 0.85)) return;
    if (muted || !ensureCtx()) return;
    playChime(265 + (i||0)*9, 0.07, 'sine');
  }

  // public API (new names + legacy aliases for existing trial calls)
  global.SanctuaryAudio = {
    ensureCtx,
    setMuted,
    playChime,
    playSuccess,
    playRotateClick: playRotate,
    playRotate,
    playSoftTone,
    playBeamTone: playBeam,
    playBeam,
    playShrineOpen,
    playSeaChord,
    playLavaTurn,
    playSnowCatch,
    playWaterFlow,
    playMirrorTone: playMirror,
    playMirror,
    updateAmbientForBlessings,
    loadGeneratedAssets,
    isMuted: () => muted
  };

  // listen to global mute events from state
  window.addEventListener('sanctuary:mute', (e) => {
    setMuted(e.detail.muted);
  });
})(window);
