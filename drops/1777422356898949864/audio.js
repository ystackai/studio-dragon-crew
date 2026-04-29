(function (_) {
'use strict';

/* ─ Procedural Audio Engine ─ */
let ctx = null, master = null, compressor = null;
let muted = false;
let droneOscs = [], droneGain = null;
let nodeGains = [];

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

  initNodeSounds();
}

function initNodeSounds() {
  var nodeFreqs = [261.63, 329.63, 392.00, 440.00, 523.25, 587.33];
  nodeFreqs.forEach(function (f, i) {
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
    g.connect(ctx.destination);
    o.start();
    nodeGains.push({ osc: o, gain: g, filter: bp, target: 0 });
  });
}

function toggleMute() {
  muted = !muted;
  if (!master) return muted;
  master.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.08);
  return muted;
}

function playCharge(pressure) {
  if (!ctx || muted) return;
  droneGain.gain.setTargetAtTime(0.06 + pressure * 0.12, ctx.currentTime, 0.04);
}

function playNodeEnergize(idx) {
  if (!ctx || muted || !nodeGains[idx]) return;
  var ng = nodeGains[idx];
  ng.gain.gain.setTargetAtTime(0.18, ctx.currentTime, 0.01);
  ng.gain.gain.setTargetAtTime(0.06, ctx.currentTime + 0.15, 0.3);
  ng.osc.frequency.setTargetAtTime(ng.osc.frequency.value * 1.5, ctx.currentTime, 0.01);
  ng.osc.frequency.setValueAtTime(ng.osc.frequency.value, ctx.currentTime + 0.08);
  ng.filter.Q.setTargetAtTime(8, ctx.currentTime, 0.01);
  ng.filter.Q.setTargetAtTime(3, ctx.currentTime, 0.3);
}

function playReset() {
  if (!ctx || muted) return;
  if (droneGain) droneGain.gain.setTargetAtTime(0.04, ctx.currentTime, 0.08);
  nodeGains.forEach(function (ng) {
    ng.gain.gain.setTargetAtTime(0.02, ctx.currentTime, 0.15);
  });
}

function playFlightWhoosh(intensity) {
  if (!ctx || muted) return;
}

function updateAudio(charging, pressure, nodesEnergized) {
  if (!ctx || !master) return;
  if (charging && pressure > 0.01) {
    playCharge(pressure);
  } else if (droneGain) {
    droneGain.gain.setTargetAtTime(0.06, ctx.currentTime, 0.06);
  }
  nodeGains.forEach(function (ng, i) {
    if (nodesEnergized[i]) {
      ng.target = 0.06;
    } else {
      ng.target = 0;
    }
    ng.gain.gain.setTargetAtTime(Math.max(ng.target, ng.gain.gain.value * 0.97), ctx.currentTime, 0.05);
  });
}

_.initAudio = init;
_.toggleMute = toggleMute;
_.playNodeEnergize = playNodeEnergize;
_.playReset = playReset;
_.playFlightWhoosh = playFlightWhoosh;
_.updateAudio = updateAudio;

})(window.SA = window.SA || {});
