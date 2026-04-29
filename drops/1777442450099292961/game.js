(function (SA) {
'use strict';

var canvas = document.getElementById('breath');
var c = canvas.getContext('2d');

var W, H, dpr;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/* ─── Dragon Data ─── */
var DRAGONS = [
  {
    name: 'Fire Dragon',
    color: '#ff6830',
    glow: 'rgba(255,104,48,0.35)',
    quote: '"Breathe deep. My fire waits."',
    symbol: '✦'
  },
  {
    name: 'Lava Dragon',
    color: '#ff3040',
    glow: 'rgba(255,48,64,0.35)',
    quote: '"Embers rise where intention burns."',
    symbol: '◈'
  },
  {
    name: 'Water Dragon',
    color: '#30a8ff',
    glow: 'rgba(48,168,255,0.35)',
    quote: '"Flow is not force. It is faith."',
    symbol: '◇'
  },
  {
    name: 'Sea Dragon',
    color: '#20c8a0',
    glow: 'rgba(32,200,160,0.35)',
    quote: '"The depths hum what the surface forgets."',
    symbol: '◎'
  },
  {
    name: 'Ice Dragon',
    color: '#80d8ff',
    glow: 'rgba(128,216,255,0.35)',
    quote: '"Stillness is not the absence of fire."',
    symbol: '❖'
  },
  {
    name: 'Snow Dragon',
    color: '#ffe8d0',
    glow: 'rgba(255,232,208,0.35)',
    quote: '"Every breath shapes the world anew."',
    symbol: '✧'
  }
];

/* ─── State ─── */
var started = false;
var orbs = [];
var breathOrb = { x: 0, y: 0, r: 20, targetR: 20, phase: 0 };
var inputActive = false;
var inputX = 0, inputY = 0;
var inhale = 0;
var maxInhale = 1;
var inhaleRate = 0.4;
var bgParticles = [];
var breathParticles = [];
var allAwakened = false;
var msgTimeout = null;
var gameTime = 0;
var nextDragonIdx = 0;
var victoryPulse = 0;

/* ─── UI References ─── */
var overlay = document.getElementById('exhalation-overlay');
var breathText = document.getElementById('breath-text');
var breathRing = document.getElementById('breath-ring');
var inhaleFill = document.getElementById('inhale-fill');
var muteBtn = document.getElementById('mute-btn');
var msgEl = document.getElementById('dragon-msg');
var instrEl = document.getElementById('instructions');
var resetBtn = document.getElementById('reset-btn');
var iconSnd = muteBtn.querySelector('.icon-snd');
var iconMut = muteBtn.querySelector('.icon-mut');

/* ─── Helpers ─── */
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)); }

function hash2d(x, y) {
  var h = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  return h - Math.floor(h);
}

/* ─── Background Particles ─── */
function initBgParticles() {
  bgParticles = [];
  for (var i = 0; i < 80; i++) {
    bgParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 1.0,
      speed: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.1 + Math.random() * 0.25,
      drift: -0.3 + Math.random() * 0.6
    });
  }
}

/* ─── Dragon Placements ─── */
function initOrbs() {
  orbs = [];
  var margin = 70;
  var cx = W / 2, cy = H / 2;
  var radius = Math.min(W, H) * 0.3;

  for (var i = 0; i < DRAGONS.length; i++) {
    var angle = (i / DRAGONS.length) * Math.PI * 2 - Math.PI / 2;
    var ox = cx + Math.cos(angle) * radius;
    var oy = cy + Math.sin(angle) * radius;

    if (ox < margin) ox = margin;
    if (ox > W - margin) ox = W - margin;
    if (oy < margin + 40) oy = margin + 40;
    if (oy > H - margin) oy = H - margin;

    orbs.push({
      x: ox, y: oy,
      awakened: false,
      pulsePhase: Math.random() * Math.PI * 2,
      dragon: DRAGONS[i],
      ringRadius: 0
    });
  }
}

/* ─── Reset ─── */
function resetGame() {
  inhale = 0;
  allAwakened = false;
  nextDragonIdx = 0;
  victoryPulse = 0;
  breathParticles = [];
  breathOrb.r = 20;
  breathOrb.targetR = 20;
  breathOrb.x = W / 2;
  breathOrb.y = H / 2;
  initOrbs();
  SA.playReset();
  updateUI();
  msgEl.classList.remove('visible');
  resetBtn.classList.remove('visible');
  instrEl.classList.remove('hidden');
  instrEl.style.opacity = '1';
}

/* ─── Input ─── */
function getPointerPos(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function beginInput(e) {
  e.preventDefault();
  if (!started) {
    started = true;
    overlay.classList.add('hidden');
    SA.initAudio();
    breathOrb.x = W / 2;
    breathOrb.y = H / 2;
  }
  inputActive = true;
  var p = getPointerPos(e);
  inputX = p.x;
  inputY = p.y;
}

function moveInput(e) {
  if (!inputActive) return;
  e.preventDefault();
  var p = getPointerPos(e);
  inputX = p.x;
  inputY = p.y;
}

function endInput(e) {
  if (!started) return;
  if (e && e.preventDefault) e.preventDefault();
  inputActive = false;
  if (inhale >= maxInhale) {
    exhaleBreath();
  }
  inhale = 0;
}

canvas.addEventListener('pointerdown', function (e) {
  canvas.setPointerCapture(e.pointerId);
  beginInput(e);
});
canvas.addEventListener('pointermove', moveInput);
canvas.addEventListener('pointerup', endInput);
canvas.addEventListener('pointercancel', endInput);

overlay.addEventListener('pointerdown', function (e) {
  overlay.setPointerCapture(e.pointerId);
  beginInput(e);
});

muteBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  var isMuted = SA.toggleMute();
  iconSnd.style.display = isMuted ? 'none' : '';
  iconMut.style.display = isMuted ? '' : 'none';
  muteBtn.setAttribute('aria-label', isMuted ? 'Toggle unmute' : 'Toggle mute');
});

resetBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  resetGame();
});

/* ─── Exhale Breath ─── */
function exhaleBreath() {
  if (allAwakened) {
    spawnCelebration();
    SA.playVictory();
    return;
  }

  /* Find next unawakened dragon */
  var target = null;
  for (var i = nextDragonIdx; i < orbs.length; i++) {
    if (!orbs[i].awakened) {
      target = orbs[i];
      nextDragonIdx = i + 1;
      break;
    }
  }
  if (!target) {
    for (var j = 0; j < orbs.length; j++) {
      if (!orbs[j].awakened) {
        target = orbs[j];
        nextDragonIdx = j + 1;
        break;
      }
    }
  }

  if (target) {
    target.awakened = true;
    spawnBreathStream(breathOrb.x, breathOrb.y, target.x, target.y, target.dragon.color);
    spawnAwakenBurst(target);
    var idx = orbs.indexOf(target);
    SA.playDragonAwaken(idx);
    showDragonMessage(target.dragon.quote);
    updateUI();

    if (orbs.every(function (o) { return o.awakened; })) {
      allAwakened = true;
      victoryPulse = 1;
      spawnCelebration();
      SA.playVictory();
      breathRing.classList.add('complete');
      instrEl.classList.add('hidden');
      instrEl.style.opacity = '0';
      setTimeout(function () {
        resetBtn.classList.add('visible');
      }, 2500);
    }
  }
  inhale = 0;
  breathOrb.targetR = 20;
}

/* ─── UI ─── */
function updateUI() {
  var count = orbs.filter(function (o) { return o.awakened; }).length;
  breathText.textContent = count + ' / ' + DRAGONS.length;
  if (count > 0) breathRing.classList.add('awakened');
}

function showDragonMessage(text) {
  msgEl.innerHTML = '<span>' + text + '</span>';
  msgEl.classList.add('visible');
  if (msgTimeout) clearTimeout(msgTimeout);
  msgTimeout = setTimeout(function () {
    msgEl.classList.remove('visible');
  }, 3000);
}

/* ─── Particles ─── */
function spawnBreathStream(x1, y1, x2, y2, color) {
  var steps = 30;
  for (var i = 0; i < steps; i++) {
    var t = i / steps;
    var px = lerp(x1, x2, t) + (Math.random() - 0.5) * 15;
    var py = lerp(y1, y2, t) + (Math.random() - 0.5) * 15;
    breathParticles.push({
      x: px, y: py,
      vx: (x2 - x1) * 0.01 + (Math.random() - 0.5) * 2,
      vy: (y2 - y1) * 0.01 + (Math.random() - 0.5) * 2,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
      r: 2 + Math.random() * 4,
      color: color
    });
  }
}

function spawnAwakenBurst(target) {
  var col = target.dragon.color;
  for (var i = 0; i < 50; i++) {
    var a = Math.random() * Math.PI * 2;
    var spd = 2 + Math.random() * 5;
    breathParticles.push({
      x: target.x, y: target.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 1,
      decay: 0.005 + Math.random() * 0.012,
      r: 1.5 + Math.random() * 4,
      color: col
    });
  }
}

function spawnCelebration() {
  for (var b = 0; b < 6; b++) {
    (function (bi) {
      setTimeout(function () {
        var cx = W * 0.15 + Math.random() * W * 0.7;
        var cy = H * 0.15 + Math.random() * H * 0.7;
        var col = DRAGONS[bi].color;
        for (var i = 0; i < 25; i++) {
          var a = Math.random() * Math.PI * 2;
          var spd = 1.5 + Math.random() * 4;
          breathParticles.push({
            x: cx, y: cy,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            life: 1,
            decay: 0.006 + Math.random() * 0.01,
            r: 1 + Math.random() * 3,
            color: col
          });
        }
      }, bi * 300);
    })(b);
  }
}

function updateParticles(dt) {
  for (var i = breathParticles.length - 1; i >= 0; i--) {
    var p = breathParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.vy += 0.01;
    p.life -= p.decay;
    if (p.life <= 0) breathParticles.splice(i, 1);
  }
}

/* ─── Background ─── */
function drawBackground(t) {
  var bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#050a14');
  bg.addColorStop(0.5, '#0a1428');
  bg.addColorStop(1, '#080d1a');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  for (var i = 0; i < 3; i++) {
    var nx = hash2d(i, 10) * W;
    var ny = hash2d(i, 20) * H;
    var nR = 100 + hash2d(i, 30) * 120;
    var drift = Math.sin(t * 0.06 + i * 2.1) * 25;
    var nCol;
    if (i === 0) nCol = 'rgba(40,80,180,0.05)';
    else if (i === 1) nCol = 'rgba(120,40,100,0.04)';
    else nCol = 'rgba(40,140,120,0.03)';
    var ng = c.createRadialGradient(nx + drift, ny, 0, nx + drift, ny, nR);
    ng.addColorStop(0, nCol);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = ng;
    c.beginPath();
    c.arc(nx + drift, ny, nR, 0, Math.PI * 2);
    c.fill();
  }

  bgParticles.forEach(function (p) {
    p.y += p.drift;
    if (p.y < -5) p.y = H + 5;
    if (p.y > H + 5) p.y = -5;
    p.x += Math.sin(t * p.speed + p.phase) * 0.3;
    var flicker = Math.sin(t * 1.5 + p.phase) * 0.15 + 0.85;
    c.globalAlpha = p.alpha * flicker;
    c.fillStyle = '#c0d4e8';
    c.beginPath();
    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    c.fill();
  });
  c.globalAlpha = 1;
}

/* ─── Dragon Orb Drawing ─── */
function drawDragonOrb(orb, t) {
  var pulse = Math.sin(t * 1.5 + orb.pulsePhase) * 0.3 + 0.7;
  var d = orb.dragon;
  var baseR = 28;

  if (orb.awakened) {
    var r = baseR * (1 + pulse * 0.15);

    var grad = c.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, r * 2.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.25)');
    grad.addColorStop(0.3, d.glow);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(orb.x, orb.y, r * 2.5, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = d.color;
    c.lineWidth = 2;
    c.globalAlpha = 0.7 + pulse * 0.3;
    c.beginPath();
    c.arc(orb.x, orb.y, r, 0, Math.PI * 2);
    c.stroke();

    c.globalAlpha = 0.5;
    c.beginPath();
    c.arc(orb.x, orb.y, r + 6 * pulse, 0, Math.PI * 2);
    c.stroke();

    c.globalAlpha = 1;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(orb.x, orb.y, 3, 0, Math.PI * 2);
    c.fill();

    c.font = 'bold 16px "Avenir Next", sans-serif';
    c.globalAlpha = 0.9;
    c.fillStyle = d.color;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(d.symbol, orb.x, orb.y + r + 22);

    c.globalAlpha = 0.5;
    c.font = '10px "Avenir Next", sans-serif';
    c.fillStyle = '#c0d4e8';
    c.fillText(d.name, orb.x, orb.y + r + 36);

  } else {
    var r = baseR * (0.7 + pulse * 0.15);
    c.globalAlpha = 0.15 + pulse * 0.1;
    c.strokeStyle = d.color;
    c.lineWidth = 1.2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(orb.x, orb.y, r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);

    c.globalAlpha = 0.08;
    var g2 = c.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 1.5);
    g2.addColorStop(0, d.glow);
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g2;
    c.beginPath();
    c.arc(orb.x, orb.y, r * 1.5, 0, Math.PI * 2);
    c.fill();

    c.globalAlpha = 0.25;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(orb.x, orb.y, 1.5, 0, Math.PI * 2);
    c.fill();
  }

  c.globalAlpha = 1;
}

/* ─── Connection Lines ─── */
function drawConnections() {
  if (!allAwakened) return;
  c.globalAlpha = 0.12;
  c.strokeStyle = '#ffe8d0';
  c.lineWidth = 1;
  for (var i = 0; i < orbs.length - 1; i++) {
    c.beginPath();
    c.moveTo(orbs[i].x, orbs[i].y);
    c.lineTo(orbs[i+1].x, orbs[i+1].y);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(orbs[orbs.length-1].x, orbs[orbs.length-1].y);
  c.lineTo(orbs[0].x, orbs[0].y);
  c.stroke();
  c.globalAlpha = 1;
}

/* ─── Breath Orb Drawing ─── */
function drawBreathOrb(t) {
  var intensity = inhale;
  var r = breathOrb.r;

  c.save();
  c.translate(breathOrb.x, breathOrb.y);

  var glowR = 30 + intensity * 35;
  var grad = c.createRadialGradient(0, 0, 3, 0, 0, glowR);
  var fr = Math.floor(lerp(100, 255, intensity));
  var fg = Math.floor(lerp(180, 120, intensity));
  var fb = Math.floor(lerp(255, 40, intensity));
  var gc = 'rgba(' + fr + ',' + fg + ',' + fb;
  grad.addColorStop(0, gc + ',0.5)');
  grad.addColorStop(1, gc + ',0)');
  c.fillStyle = grad;
  c.beginPath();
  c.arc(0, 0, glowR, 0, Math.PI * 2);
  c.fill();

  /* Core orb */
  var bodyGrad = c.createRadialGradient(-3, -3, 0, 0, 0, r);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.3, 'rgba(' + fr + ',' + fg + ',' + fb + ',0.9)');
  bodyGrad.addColorStop(1, 'rgba(' + fr + ',' + fg + ',' + fb + ',0.3)');
  c.fillStyle = bodyGrad;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();

  /* Charge ring */
  if (inhale > 0.05) {
    var ringR = r + 8 + inhale * 12;
    c.strokeStyle = 'rgba(255,180,60,' + (0.2 + inhale * 0.5) + ')';
    c.lineWidth = 2;
    c.setLineDash([5, 3]);
    c.lineDashOffset = -t * 80;
    c.beginPath();
    c.arc(0, 0, ringR, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * inhale);
    c.stroke();
    c.setLineDash([]);
  }

  /* Victory pulse */
  if (victoryPulse > 0) {
    var vpR = r + (1 - victoryPulse) * 200;
    c.globalAlpha = victoryPulse * 0.4;
    c.strokeStyle = '#ffe8d0';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, vpR, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }

  c.restore();
}

/* ─── Main Update ─── */
function update(dt, t) {
  if (!started) return;

  /* Follow pointer with smoothing */
  breathOrb.x = lerp(breathOrb.x, inputX, 0.08);
  breathOrb.y = lerp(breathOrb.y, inputY, 0.08);

  if (inputActive) {
    inhale = Math.min(inhale + inhaleRate * dt, 1);
    breathOrb.targetR = 20 + inhale * 25;
  } else {
    breathOrb.targetR = 20;
  }

  /* Smooth radius */
  breathOrb.r = lerp(breathOrb.r, breathOrb.targetR, 0.1);

  /* Boundary */
  var pad = breathOrb.r + 5;
  if (breathOrb.x < pad) breathOrb.x = pad;
  if (breathOrb.x > W - pad) breathOrb.x = W - pad;
  if (breathOrb.y < pad) breathOrb.y = pad;
  if (breathOrb.y > H - pad) breathOrb.y = H - pad;

  /* Update orb pulsing */
  orbs.forEach(function (o) {
    o.pulsePhase += dt * 2;
  });

  updateParticles(dt);

  /* Update inhale bar */
  var pct = inhale * 100;
  inhaleFill.style.width = pct + '%';
  if (inhale >= 0.95) {
    inhaleFill.classList.add('full');
  } else {
    inhaleFill.classList.remove('full');
  }

  /* Breath audio */
  SA.playBreatheWhoosh(breathOrb.r / 5);

  SA.updateAudio(inputActive, inhale, orbs.map(function(o){return o.awakened;}));

  /* Victory pulse decay */
  if (victoryPulse > 0) {
    victoryPulse = Math.max(0, victoryPulse - dt * 0.5);
  }
}

/* ─── Main Render ─── */
function render(t) {
  c.clearRect(0, 0, W, H);

  drawBackground(t);
  drawConnections();

  orbs.forEach(function (orb) {
    drawDragonOrb(orb, t);
  });

  breathParticles.forEach(function (p) {
    c.globalAlpha = p.life * 0.7;
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, Math.PI * 2);
    c.fill();
  });
  c.globalAlpha = 1;

  drawBreathOrb(t);
}

/* ─── Game Loop ─── */
var lastTime = 0;

function loop(now) {
  requestAnimationFrame(loop);
  var dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  gameTime = now / 1000;

  update(dt, gameTime);
  render(gameTime);
}

/* ─── Init ─── */
initBgParticles();
initOrbs();
breathOrb.x = W / 2;
breathOrb.y = H / 2;
requestAnimationFrame(loop);

window._breathReset = resetGame;

})(window.SA = window.SA || {});
