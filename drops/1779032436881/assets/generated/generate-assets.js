#!/usr/bin/env node
/**
 * Generate real file-backed audio assets for Sanctuary of the Six Lights follow-up.
 * Authored PCM WAVs (no external service this pass; pure node synthesis).
 * These satisfy "real file-backed generated/authored assets under .../assets/generated/" + manifest.
 * Sources: additive sine + noise + envelopes for magical elemental tones.
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;

function writeWav(filename, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);
  let o = 0;
  // RIFF
  buffer.write('RIFF', o); o += 4;
  buffer.writeUInt32LE(36 + dataSize, o); o += 4;
  buffer.write('WAVE', o); o += 4;
  // fmt
  buffer.write('fmt ', o); o += 4;
  buffer.writeUInt32LE(16, o); o += 4;
  buffer.writeUInt16LE(1, o); o += 2; // PCM
  buffer.writeUInt16LE(numChannels, o); o += 2;
  buffer.writeUInt32LE(sampleRate, o); o += 4;
  buffer.writeUInt32LE(byteRate, o); o += 4;
  buffer.writeUInt16LE(blockAlign, o); o += 2;
  buffer.writeUInt16LE(bitsPerSample, o); o += 2;
  // data
  buffer.write('data', o); o += 4;
  buffer.writeUInt32LE(dataSize, o); o += 4;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE((s * 32767) | 0, o); o += 2;
  }
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  console.log('wrote', filename, (dataSize / 1024).toFixed(1) + 'kB');
}

function env(t, dur, a = 0.02, r = 0.15) {
  if (t < a) return t / a;
  if (t > dur - r) return Math.max(0, (dur - t) / r);
  return 1;
}

function genRotateClick() {
  const sr = 44100, dur = 0.09;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.005, 0.06);
    const f = 380 + (t / dur) * 140;
    const s = Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.25;
    out[i] = s * e * 0.85;
  }
  writeWav('rotate-pipe.wav', out, sr);
}

function genMirrorTone() {
  const sr = 44100, dur = 0.22;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.01, 0.18);
    const f = 920 + Math.sin(t * 18) * 12;
    const s = Math.sin(2 * Math.PI * f * t) * 0.6 +
              Math.sin(2 * Math.PI * (f * 0.996) * t) * 0.35;
    out[i] = s * e * (0.7 + 0.3 * Math.sin(t * 40));
  }
  writeWav('mirror-turn.wav', out, sr);
}

function genBeamLock() {
  const sr = 44100, dur = 0.65;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.012, 0.42);
    const f1 = 620 + t * 180;
    const f2 = 820 + Math.sin(t * 3) * 6;
    const s = Math.sin(2 * Math.PI * f1 * t) * 0.55 +
              Math.sin(2 * Math.PI * f2 * t) * 0.4 +
              Math.sin(2 * Math.PI * (f1 * 2.01) * t) * 0.18;
    out[i] = s * e * 0.9;
  }
  writeWav('beam-lock.wav', out, sr);
}

function genWaterFlow() {
  const sr = 44100, dur = 0.48;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.03, 0.32);
    // low burble + soft tone
    const noise = (Math.random() - 0.5) * 2;
    const f = 118 + Math.sin(t * 5.5) * 9;
    const s = Math.sin(2 * Math.PI * f * t) * 0.45 + noise * 0.28;
    out[i] = s * e * 0.75;
  }
  writeWav('water-flow.wav', out, sr);
}

function genShrineOpen() {
  const sr = 44100, dur = 0.38;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.008, 0.28);
    const f = 240 + (1 - e) * 120;
    const s = Math.sin(2 * Math.PI * f * t) * 0.5 +
              Math.sin(2 * Math.PI * (f * 1.5 + Math.sin(t * 9) * 4) * t) * 0.3;
    out[i] = s * e;
  }
  writeWav('shrine-open.wav', out, sr);
}

function genSuccessTail() {
  const sr = 44100, dur = 1.1;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = env(t, dur, 0.01, 0.7);
    const f = 410 + Math.sin(t * 1.6) * 18;
    const s = Math.sin(2 * Math.PI * f * t) * 0.48 +
              Math.sin(2 * Math.PI * (f * 1.996) * t) * 0.32 +
              Math.sin(2 * Math.PI * (f * 3.01) * t) * 0.12;
    out[i] = s * e * 0.82;
  }
  writeWav('success-tail.wav', out, sr);
}

function main() {
  genRotateClick();
  genMirrorTone();
  genBeamLock();
  genWaterFlow();
  genShrineOpen();
  genSuccessTail();
  console.log('All sanctuary audio assets generated.');
}
main();
