// src/audio.ts — Web Audio API synthesis (zero external assets)

const BPM = 56;
const BEAT_HZ = BPM / 60; // ~0.933 Hz

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

// Tidal pulse
let tidalOsc: OscillatorNode | null = null;
let tidalLfo: OscillatorNode | null = null;
let tidalFilter: BiquadFilterNode | null = null;
let tidalGain: GainNode | null = null;

// Breath layer
let breathGain: GainNode | null = null;
let breathOsc: OscillatorNode | null = null;
let breathOsc2: OscillatorNode | null = null;

// Reverb delay network
let reverbDelay: DelayNode | null = null;
let reverbFeedbackGain: GainNode | null = null;
let reverbDryGain: GainNode | null = null;
let reverbWetGain: GainNode | null = null;

// Noise buffer for coral chimes
let noiseBuffer: AudioBuffer | null = null;

let initialized = false;

/**
 * Initialize audio graph on first user gesture.
 * Builds: tidal pulse → LFO modulated filter → breath layer → reverb → compressor → master → destination
 */
export function initAudio(): void {
    if (initialized) return;

    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    // ---------------------------------------------------------------
    // DynamicsCompressor — prevents clipping during peak input
    // ---------------------------------------------------------------
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(10, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.08, now);

    // ---------------------------------------------------------------
    // Reverb delay network — 0.8 s feedback, 0.3 wet / 0.7 dry
    // ---------------------------------------------------------------
    reverbDelay = audioCtx.createDelay(2.0);
    reverbDelay.delayTime.setValueAtTime(0.8, now);

    reverbFeedbackGain = audioCtx.createGain();
    reverbFeedbackGain.gain.setValueAtTime(0.4, now);

    reverbDryGain = audioCtx.createGain();
    reverbDryGain.gain.setValueAtTime(0.7, now);

    reverbWetGain = audioCtx.createGain();
    reverbWetGain.gain.setValueAtTime(0.3, now);

    // ---------------------------------------------------------------
    // Tidal pulse — 60 Hz sine, low-pass filtered, LFO modulated
    // ---------------------------------------------------------------
    tidalOsc = audioCtx.createOscillator();
    tidalOsc.type = 'sine';
    tidalOsc.frequency.setValueAtTime(60, now);

    tidalLfo = audioCtx.createOscillator();
    tidalLfo.type = 'sine';
    tidalLfo.frequency.setValueAtTime(BEAT_HZ, now); // 56 BPM

    const tidalLfoGain = audioCtx.createGain();
    tidalLfoGain.gain.setValueAtTime(6, now);

    tidalLfo.connect(tidalLfoGain);
    tidalLfoGain.connect(tidalOsc.frequency);

    tidalFilter = audioCtx.createBiquadFilter();
    tidalFilter.type = 'lowpass';
    tidalFilter.frequency.setValueAtTime(110, now);
    tidalFilter.Q.setValueAtTime(1.8, now);

    // Second LFO modulates filter cutoff for "pull" feel
    const filterLfo = audioCtx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.setValueAtTime(BEAT_HZ * 0.5, now);
    const filterLfoG = audioCtx.createGain();
    filterLfoG.gain.setValueAtTime(35, now);
    filterLfo.connect(filterLfoG);
    filterLfoG.connect(tidalFilter.frequency);

    tidalGain = audioCtx.createGain();
    tidalGain.gain.setValueAtTime(0.22, now);

    tidalOsc.connect(tidalFilter);
    tidalFilter.connect(tidalGain);

    // ---------------------------------------------------------------
    // Breath layer — sine + triangle warm pad
    // ---------------------------------------------------------------
    breathOsc = audioCtx.createOscillator();
    breathOsc.type = 'sine';
    breathOsc.frequency.setValueAtTime(185, now);

    breathOsc2 = audioCtx.createOscillator();
    breathOsc2.type = 'triangle';
    breathOsc2.frequency.setValueAtTime(277, now);

    breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0, now);

    breathOsc.connect(breathGain);
    breathOsc2.connect(breathGain);

    // ---------------------------------------------------------------
    // Noise buffer for coral chimes
    // ---------------------------------------------------------------
    const bufLen = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const chData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        chData[i] = Math.random() * 2 - 1;
    }

    // ---------------------------------------------------------------
    // Wire signal chain
    // ---------------------------------------------------------------
    // tidal + breath → compressor
    tidalGain.connect(compressor);
    breathGain.connect(compressor);

    // compressor → dry path · reverb delay
    compressor.connect(reverbDryGain);
    compressor.connect(reverbDelay);

    // reverb feedback loop
    reverbDelay.connect(reverbFeedbackGain);
    reverbFeedbackGain.connect(reverbDelay);
    reverbDelay.connect(reverbWetGain);

    // dry + wet → master → destination
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.65, now);

    reverbDryGain.connect(masterGain);
    reverbWetGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Start all oscillators
    tidalOsc.start();
    tidalLfo.start();
    filterLfo.start();
    breathOsc.start();
    breathOsc2.start();

    initialized = true;
}

/** Resume context for browser autoplay policy */
export function resumeAudio(): void {
    if (audioCtx?.state === 'suspended') {
        audioCtx.resume();
    }
}

/** High-pass noise burst mapped to input velocity — coral chimes */
export function playCoralChime(intensity: number): void {
    if (!initialized || !audioCtx || !noiseBuffer) return;

    const now = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;

    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1800 + intensity * 4000, now);
    hp.Q.setValueAtTime(2.5 + intensity * 3.5, now);

    const g = audioCtx.createGain();
    const peakVol = intensity * 0.14;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peakVol, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.35 + intensity * 0.18);

    src.connect(hp);
    hp.connect(g);
    g.connect(compressor!);

    src.start(now);
    src.stop(now + 0.7);
}

/**
 * Update breath audio per frame — setTargetAtTime for sub-16 ms latency.
 */
export function updateBreathAudio(breath: number): void {
    if (!initialized || !audioCtx || !breathGain) return;
    const now = audioCtx.currentTime;

    breathGain.gain.setTargetAtTime(breath * 0.17, now, 0.035);

    const baseFreq = 185 + breath * 55;
    if (breathOsc) breathOsc.frequency.setTargetAtTime(baseFreq, now, 0.04);
    if (breathOsc2) breathOsc2.frequency.setTargetAtTime(baseFreq * 1.495, now, 0.04);

    if (tidalGain) {
        tidalGain.gain.setTargetAtTime(0.22 + breath * 0.1, now, 0.035);
    }
}

/** Graceful drain on release — exponential fade to silence */
export function drainBreathAudio(): void {
    if (!initialized || !audioCtx || !breathGain) return;
    breathGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.07);
}
