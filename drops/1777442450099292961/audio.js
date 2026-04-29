(function (_) {
'use strict';

let ctx = null, master = null, compressor = null;
let muted = false;
let droneOscs = [], droneGain = null;
let dragonGains = [];
let breatheSource = null, breatheFilter = null, breatheGain = null;

const DRONE_FREQS = [[65, 98, 131], [82, 123, 165], [55, 82, 110]];

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.45;
  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -4;
  compressor.knee.value = 8;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  droneGain = ctx.createGain();
  droneGain.gain.value = 0.06;
  droneGain.connect(master);

  DRONE_FREQS.forEach(function (chords, ci) {
    var g = ctx.createGain();
    g.gain.value = 0.3 / chords.length;
    chords.forEach(function (f) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f + ci * 2.1;
      o.connect(g);
      o.start();
      droneOscs.push(o);
      });
    g.connect(droneGain);
    });

  initDragonSounds();
  initBreathe();
}

function initDragonSounds() {
  var dragonFreqs = [261.63, 329.63, 392.00, 440.00, 523.25, 587.33];
  dragonFreqs.forEach(function (f, i) {
    var g = ctx.createGain();
    g.gain.value = 0;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 3;
    var o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.connect(bp);
    bp.connect(g);
    g.connect(master);
    o.start();
    dragonGains.push({ osc: o, gain: g, filter: bp, target: 0 });
    });
}

function initBreathe() {
  var bufSize = ctx.sampleRate * 0.5;
  var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  breatheSource = ctx.createBufferSource();
  breatheSource.buffer = buf;
  breatheSource.loop = true;

  breatheFilter = ctx.createBiquadFilter();
  breatheFilter.type = 'bandpass';
  breatheFilter.frequency.value = 500;
  breatheFilter.Q.value = 1;

  breatheGain = ctx.createGain();
  breatheGain.gain.value = 0;

  breatheSource.connect(breatheFilter);
  breatheFilter.connect(breatheGain);
  breatheGain.connect(master);
  breatheSource.start();
}

function toggleMute() {
  muted = !muted;
  if (!master) return muted;
  master.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.08);
  return muted;
}

function playInhale(depth) {
  if (!ctx || muted) return;
  droneGain.gain.setTargetAtTime(0.06 + depth * 0.12, ctx.currentTime, 0.04);
}

function playDragonAwaken(idx) {
  if (!ctx || muted || !dragonGains[idx]) return;
  var dg = dragonGains[idx];
  dg.gain.gain.setTargetAtTime(0.18, ctx.currentTime, 0.01);
  dg.gain.gain.setTargetAtTime(0.06, ctx.currentTime + 0.15, 0.3);
  dg.osc.frequency.setTargetAtTime(dg.osc.frequency.value * 1.5, ctx.currentTime, 0.01);
  dg.osc.frequency.setValueAtTime(dg.osc.frequency.value, ctx.currentTime + 0.08);
  dg.filter.Q.setTargetAtTime(8, ctx.currentTime, 0.01);
  dg.filter.Q.setTargetAtTime(3, ctx.currentTime, 0.3);
}

function playReset() {
  if (!ctx || muted) return;
  if (droneGain) droneGain.gain.setTargetAtTime(0.04, ctx.currentTime, 0.08);
  dragonGains.forEach(function (dg) {
    dg.gain.gain.setTargetAtTime(0.02, ctx.currentTime, 0.15);
    });
}

function playBreatheWhoosh(intensity) {
  if (!ctx || muted || !breatheGain) return;
  var vol = Math.min(intensity / 6, 0.06);
  breatheGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
  breatheFilter.frequency.setTargetAtTime(400 + intensity * 60, ctx.currentTime, 0.05);
}

function playVictory() {
  if (!ctx || muted) return;
  var notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach(function (f, i) {
      (function (freq, idx) {
      setTimeout(function () {
        if (!ctx || muted) return;
        var o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = freq;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        o.connect(g);
        g.connect(master);
        o.start();
        o.stop(ctx.currentTime + 1.6);
        }, idx * 150);
      })(f, i);
    });
}

function updateAudio(inhaling, depth, dragonsAwakened) {
  if (!ctx || !master) return;
  if (inhaling && depth > 0.01) {
    playInhale(depth);
    } else if (droneGain) {
    droneGain.gain.setTargetAtTime(0.06, ctx.currentTime, 0.06);
    }
  dragonGains.forEach(function (dg, i) {
    if (dragonsAwakened[i]) {
      dg.target = 0.06;
      } else {
      dg.target = 0;
      }
    dg.gain.gain.setTargetAtTime(Math.max(dg.target, dg.gain.gain.value * 0.97), ctx.currentTime, 0.05);
    });
}

_.initAudio = init;
_.toggleMute = toggleMute;
_.playDragonAwaken = playDragonAwaken;
_.playReset = playReset;
_.playBreatheWhoosh = playBreatheWhoosh;
_.playVictory = playVictory;
_.updateAudio = updateAudio;

})(window.SA = window.SA || {});
