// src/audio.ts — Web Audio API synthesis (zero external assets)

const BPM = 56;
const BEAT_INTERVAL = 60 / BPM; // ~1.07s per beat

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let tidalOsc: OscillatorNode | null = null;
let tidalGain: GainNode | null = null;
let tidalFilter: BiquadFilterNode | null = null;
let reverbDelay: DelayNode | null = null;
let reverbFeedback: GainNode | null = null;
let reverbDry: GainNode | null = null;
let reverbWet: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

let initialized = false;
let breathGain: GainNode | null = null;
let breathOsc: OscillatorNode | null = null;
let breathOsc2: OscillatorNode | null = null;

/**
 * Initialize audio graph. Called once on first user gesture.
 * Creates all nodes, connects them, starts tidal pulse oscillator.
 */
export function initAudio(): void {
   if (initialized) return;

   audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

   // Compressor — prevents clipping during peak input
   compressor = audioCtx.createDynamicsCompressor();
   compressor.threshold.setValueAtTime(-20, audioCtx.currentTime);
   compressor.knee.setValueAtTime(10, audioCtx.currentTime);
   compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
   compressor.attack.setValueAtTime(0.005, audioCtx.currentTime);
   compressor.release.setValueAtTime(0.1, audioCtx.currentTime);

   // Reverb via delay network: 0.8s feedback, 0.3 wet/dry mix
   reverbDelay = audioCtx.createDelay(2.0);
   reverbDelay.delayTime.setValueAtTime(0.8, audioCtx.currentTime);

   reverbFeedback = audioCtx.createGain();
   reverbFeedback.gain.setValueAtTime(0.45, audioCtx.currentTime);

   reverbDry = audioCtx.createGain();
   reverbDry.gain.setValueAtTime(0.7, audioCtx.currentTime);

   reverbWet = audioCtx.createGain();
   reverbWet.gain.setValueAtTime(0.3, audioCtx.currentTime);

   // Tidal pulse: 60Hz sine, low-pass filtered
   tidalOsc = audioCtx.createOscillator();
   tidalOsc.type = 'sine';
   tidalOsc.frequency.setValueAtTime(60, audioCtx.currentTime);

   tidalFilter = audioCtx.createBiquadFilter();
   tidalFilter.type = 'lowpass';
   tidalFilter.frequency.setValueAtTime(120, audioCtx.currentTime);
   tidalFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

   tidalGain = audioCtx.createGain();
   tidalGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

   // Breath layer — two oscillators for warmth
   breathOsc = audioCtx.createOscillator();
   breathOsc.type = 'sine';
   breathOsc.frequency.setValueAtTime(180, audioCtx.currentTime);

   breathOsc2 = audioCtx.createOscillator();
   breathOsc2.type = 'triangle';
   breathOsc2.frequency.setValueAtTime(270, audioCtx.currentTime);

   breathGain = audioCtx.createGain();
   breathGain.gain.setValueAtTime(0, audioCtx.currentTime);

   // Noise buffer for coral chimes
   const bufferSize = audioCtx.sampleRate * 2;
   noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
   const data = noiseBuffer.getChannelData(0);
   for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
   }

   // Connection graph:
   // tidalOsc -> tidalFilter -> tidalGain -> compressor
   tidalOsc.connect(tidalFilter);
   tidalFilter.connect(tidalGain);
   tidalGain.connect(compressor);

   // breathOsc + breathOsc2 -> breathGain -> compressor
   breathOsc.connect(breathGain);
   breathOsc2.connect(breathGain);
   breathGain.connect(compressor);

   // compressor -> reverbDry + reverbDelay
   compressor.connect(reverbDry);
   compressor.connect(reverbDelay);

   // reverbDelay -> reverbFeedback -> reverbDelay (feedback loop)
   reverbDelay.connect(reverbFeedback);
   reverbFeedback.connect(reverbDelay);
   reverbDelay.connect(reverbWet);

   // Dry + wet -> master -> destination
   masterGain = audioCtx.createGain();
   masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);

   reverbDry.connect(masterGain);
   reverbWet.connect(masterGain);
   masterGain.connect(audioCtx.destination);

   // Start oscillators
   tidalOsc.start();
   breathOsc.start();
   breathOsc2.start();

   // Modulate tidal pulse at BPM rate
   const lfo = audioCtx.createOscillator();
   lfo.type = 'sine';
   lfo.frequency.setValueAtTime(1 / BEAT_INTERVAL, audioCtx.currentTime); // 56 BPM

   const lfoGain = audioCtx.createGain();
   lfoGain.gain.setValueAtTime(8, audioCtx.currentTime);

   lfo.connect(lfoGain);
   lfoGain.connect(tidalOsc.frequency);
   lfo.start();

   // Modulate filter at BPM — creates the tidal "pull" effect
   const filterLfo = audioCtx.createOscillator();
   filterLfo.type = 'sine';
   filterLfo.frequency.setValueAtTime(1 / BEAT_INTERVAL, audioCtx.currentTime);

   const filterLfoGain = audioCtx.createGain();
   filterLfoGain.gain.setValueAtTime(40, audioCtx.currentTime);

   filterLfo.connect(filterLfoGain);
   filterLfoGain.connect(tidalFilter.frequency);
   filterLfo.start();

   initialized = true;
}

/** Resume audio context (browser autoplay compliance) */
export function resumeAudio(): void {
   if (audioCtx && audioCtx.state === 'suspended') {
       audioCtx.resume();
   }
}

/** Play a coral chime — high-pass filtered noise burst */
export function playCoralChime(intensity: number): void {
   if (!initialized || !audioCtx || !noiseBuffer) return;

   const now = audioCtx.currentTime;
   const source = audioCtx.createBufferSource();
   source.buffer = noiseBuffer;

   const chimeFilter = audioCtx.createBiquadFilter();
   chimeFilter.type = 'highpass';
   chimeFilter.frequency.setValueAtTime(2000 + intensity * 3000, now);
   chimeFilter.Q.setValueAtTime(2 + intensity * 3, now);

   const chimeGain = audioCtx.createGain();
   const vol = intensity * 0.15;
   chimeGain.gain.setValueAtTime(0, now);
   chimeGain.gain.linearRampToValueAtTime(vol, now + 0.01);
   chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + intensity * 0.2);

   source.connect(chimeFilter);
   chimeFilter.connect(chimeGain);
   chimeGain.connect(compressor!);

   source.start(now);
   source.stop(now + 0.6);
}

/**
 * Update breath audio — called every frame based on breathIntensity.
 * Uses smooth ramping via setTargetAtTime for <16ms latency.
 */
export function updateBreathAudio(breathIntensity: number): void {
   if (!initialized || !audioCtx || !breathGain || !breathOsc || !breathOsc2) return;

   const now = audioCtx.currentTime;

   // Smooth gain ramp
   breathGain.gain.setTargetAtTime(breathIntensity * 0.18, now, 0.04);

   // Slight frequency modulation for organic feel
   const baseFreq = 180 + breathIntensity * 60;
   breathOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
   breathOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);

   // Increase tidal volume with breath
   if (tidalGain) {
       tidalGain.gain.setTargetAtTime(0.25 + breathIntensity * 0.12, now, 0.04);
   }
}

/** Gradually drain breath audio when input released */
export function drainBreathAudio(): void {
   if (!initialized || !audioCtx || !breathGain) return;
   const now = audioCtx.currentTime;
   breathGain.gain.setTargetAtTime(0, now, 0.08);
}
