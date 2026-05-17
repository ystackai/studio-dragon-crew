/**
 * WebAudio + ambient layers + interaction sounds.
 * Sea Dragon ownership. Mute persists via SanctuaryState.
 * All audio has visual equivalents.
 */
(function (global) {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let ambientNodes = [];

  function ensureCtx() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function setMuted(m) {
    muted = !!m;
    if (masterGain) masterGain.gain.value = muted ? 0.0001 : 0.72;
    // pause/resume ambient if needed (future)
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
  }

  // extra tactile feedback sounds (visuals always present; safe when muted)
  function playRotateClick() {
    if (muted || !ensureCtx()) return;
    playChime(365 + (Math.random() * 25 | 0), 0.08, 'sawtooth');
  }
  function playSoftTone(freq = 520, dur = 0.18) {
    if (muted || !ensureCtx()) return;
    playChime(freq, dur, 'sine');
  }
  function playBeamTone() {
    if (muted || !ensureCtx()) return;
    playChime(295, 0.26, 'triangle');
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
    isMuted: () => muted
  };

  // listen to global mute events from state
  window.addEventListener('sanctuary:mute', (e) => {
    setMuted(e.detail.muted);
  });
})(window);
