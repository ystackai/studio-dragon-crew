(function (SA) {
'use strict';

/* ─── Canvas Setup ─── */
var canvas = document.getElementById('world');
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

/* ─── State ─── */
var started = false;
var dragon = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, tilt: 0, wingPhase: 0 };
var inputActive = false;
var inputX = 0, inputY = 0;
var charge = 0;
var maxCharge = 1;
var chargeRate = 0.45;
var nodeList = [];
var particles = [];
var trailParticles = [];
var bgStars = [];
var allEnergized = false;
var msgTimeout = null;
var gameTime = 0;

/* ─── Constants ─── */
var NUM_NODES = 6;
var ELEMENT_COLORS = [
  '#30a8ff', '#ff6830', '#20c8a0', '#ff3040', '#ffe8d0', '#80d8ff'
];
var NODE_NAMES = ['water', 'fire', 'sea', 'lava', 'snow', 'ice'];

/* ─── UI References ─── */
var overlay = document.getElementById('start-overlay');
var scoreText = document.getElementById('score-text');
var scoreRing = document.getElementById('score-ring');
var chargeFill = document.getElementById('charge-fill');
var muteBtn = document.getElementById('mute-btn');
var msgEl = document.getElementById('msg');
var instrEl = document.getElementById('instructions');
var resetBtn = document.getElementById('reset-btn');
var iconSnd = muteBtn.querySelector('.icon-snd');
var iconMut = muteBtn.querySelector('.icon-mute');

/* ─── Helpers ─── */
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)); }

function smoothstep(lo, hi, v) {
  var t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

function hash2d(x, y) {
  var h = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  return h - Math.floor(h);
}

/* ─── Background Stars ─── */
function initStars() {
  bgStars = [];
  for (var i = 0; i < 120; i++) {
    bgStars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 1.2,
      twinkleSpeed: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      brightness: 0.15 + Math.random() * 0.35
    });
  }
}

/* ─── Sanctuary Nodes ─── */
function initNodes() {
  nodeList = [];
  var margin = 80;
  for (var i = 0; i < NUM_NODES; i++) {
    var nx, ny, attempts = 0;
    do {
      nx = margin + Math.random() * (W - margin * 2);
      ny = margin + 60 + Math.random() * (H - margin * 2 - 60);
      attempts++;
     } while (attempts < 100 && nodeList.some(function (n) {
      return dist(nx, ny, n.x, n.y) < 140;
    }));
    nodeList.push({
      x: nx, y: ny,
      energized: false,
      pulsePhase: Math.random() * Math.PI * 2,
      baseR: 18 + Math.random() * 6
    });
  }
}

/* ─── Reset ─── */
function resetGame() {
  charge = 0;
  allEnergized = false;
  particles = [];
  trailParticles = [];
  dragon.x = W / 2;
  dragon.y = H / 2;
  dragon.vx = 0;
  dragon.vy = 0;
  dragon.angle = -Math.PI / 2;
  dragon.tilt = 0;
  initNodes();
  SA.playReset();
  updateScoreUI();
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
    dragon.x = W / 2;
    dragon.y = H / 2;
    dragon.angle = -Math.PI / 2;
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
  if (charge >= maxCharge) {
    releaseEnergy();
  }
  charge = 0;
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

/* ─── Release Energy ─── */
function releaseEnergy() {
  var closest = null, closestDist = Infinity;
  nodeList.forEach(function (n) {
    if (n.energized) return;
    var d = dist(dragon.x, dragon.y, n.x, n.y);
    if (d < closestDist) {
      closestDist = d;
      closest = n;
    }
  });
  if (closest) {
    closest.energized = true;
    spawnNodeBurst(closest);
    var idx = nodeList.indexOf(closest);
    SA.playNodeEnergize(idx);
    updateScoreUI();
    if (nodeList.every(function (n) { return n.energized; })) {
      allEnergized = true;
      showVictoryMsg();
      spawnCelebration();
    }
  }
  charge = 0;
}

/* ─── Score UI ─── */
function updateScoreUI() {
  var count = nodeList.filter(function (n) { return n.energized; }).length;
  scoreText.textContent = count + ' / ' + NUM_NODES;
  if (count > 0) scoreRing.classList.add('energized');
}

/* ─── Victory Message ─── */
function showVictoryMsg() {
  msgEl.innerHTML = '<span>⬡ Sanctuary Awakened</span>';
  msgEl.classList.add('visible');
  resetBtn.classList.add('visible');
  if (msgTimeout) clearTimeout(msgTimeout);
  msgTimeout = setTimeout(function () {
    msgEl.classList.remove('visible');
  }, 4500);
}

/* ─── Particles ─── */
function spawnNodeBurst(node) {
  var idx = nodeList.indexOf(node);
  var col = ELEMENT_COLORS[idx];
  for (var i = 0; i < 40; i++) {
    var a = Math.random() * Math.PI * 2;
    var spd = 1.5 + Math.random() * 4;
    particles.push({
      x: node.x, y: node.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 1,
      decay: 0.006 + Math.random() * 0.014,
      r: 1.5 + Math.random() * 3.5,
      color: col
    });
  }
}

function spawnTrail(x, y, speed) {
  var intensity = Math.min(speed / 5, 1);
  var col = intensity > 0.6 ? '#ff8844' : '#88ccff';
  trailParticles.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    life: 1,
    decay: 0.015 + Math.random() * 0.025,
    r: 1 + Math.random() * 2.5 + intensity * 3,
    color: col
  });
}

function spawnCelebration() {
  for (var b = 0; b < 8; b++) {
    (function (bi) {
      setTimeout(function () {
        var cx = W * 0.2 + Math.random() * W * 0.6;
        var cy = H * 0.2 + Math.random() * H * 0.4;
        spawnNodeBurst({ x: cx, y: cy, energized: true });
      }, bi * 250);
    })(b);
  }
}

function updateParticles(dt) {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.vy += 0.02;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (var j = trailParticles.length - 1; j >= 0; j--) {
    var tp = trailParticles[j];
    tp.life -= tp.decay;
    tp.y -= 0.3;
    if (tp.life <= 0) trailParticles.splice(j, 1);
  }
}

/* ─── Dragon Drawing ─── */
function drawDragon(x, y, angle, tilt, wingPhase, chargeLevel) {
  c.save();
  c.translate(x, y);

  var speed = Math.sqrt(dragon.vx * dragon.vx + dragon.vy * dragon.vy);
  var wingFlap = Math.sin(wingPhase) * (0.3 + speed * 0.06);
  
  var bodyAlpha = 0.85 + chargeLevel * 0.15;
  
   /* Body glow */
  var glowR = 30 + chargeLevel * 25;
  var grad = c.createRadialGradient(0, 0, 2, 0, 0, glowR);
  var fireR = Math.floor(lerp(100, 255, chargeLevel));
  var fireG = Math.floor(lerp(180, 120, chargeLevel));
  var fireB = Math.floor(lerp(255, 40, chargeLevel));
  var glowCol = 'rgba(' + fireR + ',' + fireG + ',' + fireB;
  grad.addColorStop(0, glowCol + ',0.45)');
  grad.addColorStop(1, glowCol + ',0)');
  c.fillStyle = grad;
  c.beginPath();
  c.arc(0, 0, glowR, 0, Math.PI * 2);
  c.fill();

  /* ─ Body (sleek teardrop) ─ */
  c.save();
  c.rotate(angle);
  
   /* Main body */
  var bodyGrad = c.createLinearGradient(-14, 0, 14, 0);
  var baseR = Math.floor(lerp(30, 180, chargeLevel));
  var baseG = Math.floor(lerp(60, 100, chargeLevel));
  var baseB = Math.floor(lerp(120, 30, chargeLevel));
  bodyGrad.addColorStop(0, 'rgb(' + baseR + ',' + baseG + ',' + baseB + ')');
  bodyGrad.addColorStop(0.6, 'rgb(' + (baseR+50) + ',' + (baseG+30) + ',' + (baseB-15) + ')');
  bodyGrad.addColorStop(1, 'rgb(' + (Math.min(baseR+90,255)) + ',' + (Math.min(baseG+60,255)) + ',' + baseB + ')');
  c.fillStyle = bodyGrad;
  c.globalAlpha = bodyAlpha;
  c.beginPath();
  c.moveTo(18, 0);
  c.bezierCurveTo(14, -7, -4, -9, -12, -6);
  c.bezierCurveTo(-16, -4, -18, -2, -18, 0);
  c.bezierCurveTo(-18, 2, -16, 4, -12, 6);
  c.bezierCurveTo(-4, 9, 14, 7, 18, 0);
  c.fill();

   /* Belly highlight */
  c.globalAlpha = bodyAlpha * 0.4;
  c.fillStyle = '#ddeeff';
  c.beginPath();
  c.ellipse(4, 2, 8, 3, 0, 0, Math.PI * 2);
  c.fill();

   /* Horns */
  c.globalAlpha = bodyAlpha;
  c.strokeStyle = '#ffcc88';
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(12, -3);
  c.lineTo(16, -10);
  c.stroke();
  c.beginPath();
  c.moveTo(12, 3);
  c.lineTo(16, 10);
  c.stroke();

   /* Eye */
  c.globalAlpha = 1;
  c.fillStyle = chargeLevel > 0.5 ? '#ffaa33' : '#ffffff';
  c.beginPath();
  c.arc(10, -3, 2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(10.5, -3, 1, 0, Math.PI * 2);
  c.fill();

  /* ─ Wings ─ */
  c.globalAlpha = bodyAlpha * 0.85;
  var wingCol = 'rgb(' + Math.floor(lerp(40, 200, chargeLevel)) + ',' +
                     Math.floor(lerp(80, 140, chargeLevel)) + ',' +
                     Math.floor(lerp(150, 40, chargeLevel)) + ')';
  c.fillStyle = wingCol;
  c.strokeStyle = 'rgba(255,220,180,0.35)';
  c.lineWidth = 0.8;

   /* Left wing */
  c.save();
  c.rotate(wingFlap * 0.5);
  c.beginPath();
  c.moveTo(-2, -4);
  c.quadraticCurveTo(-10, -22, 0, -28);
  c.quadraticCurveTo(6, -22, 4, -6);
  c.closePath();
  c.fill();
  c.stroke();
   /* Wing membrane */
  c.globalAlpha = 0.15;
  c.fillStyle = wingCol;
  c.fill();
  c.restore();

   /* Right wing */
  c.globalAlpha = bodyAlpha * 0.85;
  c.save();
  c.rotate(-wingFlap * 0.5);
  c.beginPath();
  c.moveTo(-2, 4);
  c.quadraticCurveTo(-10, 22, 0, 28);
  c.quadraticCurveTo(6, 22, 4, 6);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();

  /* ─ Tail ─ */
  c.globalAlpha = bodyAlpha * 0.7;
  c.strokeStyle = wingCol;
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  var tailWag = Math.sin(wingPhase * 0.7) * 5;
  c.beginPath();
  c.moveTo(-16, 0);
  c.quadraticCurveTo(-24, tailWag, -30, tailWag + 3);
  c.stroke();

  c.restore();
  c.restore();
}

/* ─── Node Drawing ─── */
function drawNode(node, t, idx) {
  var col = ELEMENT_COLORS[idx];
  var pulse = Math.sin(t * 1.8 + node.pulsePhase) * 0.3 + 0.7;
  
  if (node.energized) {
    /* Energized: glowing ring */
    var r = node.baseR * (1 + pulse * 0.15);
    var grad = c.createRadialGradient(node.x, node.y, 2, node.x, node.y, r * 2.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.3, col.replace(')', ',0.3)').replace('rgb', 'rgba'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
    c.fill();

    /* Core ring */
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.globalAlpha = 0.7 + pulse * 0.3;
    c.beginPath();
    c.arc(node.x, node.y, node.baseR, 0, Math.PI * 2);
    c.stroke();
    
    c.globalAlpha = 0.5;
    c.beginPath();
    c.arc(node.x, node.y, node.baseR + 6 * pulse, 0, Math.PI * 2);
    c.stroke();
    
    /* Inner dot */
    c.globalAlpha = 1;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(node.x, node.y, 3, 0, Math.PI * 2);
    c.fill();
    
    /* Cross symbol */
    c.strokeStyle = col;
    c.lineWidth = 1.5;
    c.globalAlpha = 0.8;
    c.beginPath();
    c.moveTo(node.x - 5, node.y);
    c.lineTo(node.x + 5, node.y);
    c.moveTo(node.x, node.y - 5);
    c.lineTo(node.x, node.y + 5);
    c.stroke();
    
  } else {
    /* Dormant: subtle pulsing */
    var r = node.baseR * (0.8 + pulse * 0.2);
    c.globalAlpha = 0.2 + pulse * 0.15;
    c.strokeStyle = col;
    c.lineWidth = 1.2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(node.x, node.y, r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    
    c.globalAlpha = 0.12;
    var g2 = c.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 1.5);
    g2.addColorStop(0, col.replace(')', ',0.2)').replace('rgb', 'rgba'));
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g2;
    c.beginPath();
    c.arc(node.x, node.y, r * 1.5, 0, Math.PI * 2);
    c.fill();

    /* Small center dot */
    c.globalAlpha = 0.3;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
    c.fill();
  }
  
  c.globalAlpha = 1;
}

/* ─── Background ─── */
function drawBackground(t) {
   /* Deep gradient */
  var bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#050a14');
  bg.addColorStop(0.4, '#0a1428');
  bg.addColorStop(1, '#080d1a');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

   /* Nebula wisps */
  for (var i = 0; i < 3; i++) {
    var nx = hash2d(i, 1) * W;
    var ny = hash2d(i, 2) * H;
    var nR = 120 + hash2d(i, 3) * 100;
    var drift = Math.sin(t * 0.08 + i * 2.1) * 30;
    var nCol;
    if (i === 0) nCol = 'rgba(40,80,180,0.06)';
    else if (i === 1) nCol = 'rgba(120,40,100,0.05)';
    else nCol = 'rgba(40,140,120,0.04)';
    var ng = c.createRadialGradient(nx + drift, ny, 0, nx + drift, ny, nR);
    ng.addColorStop(0, nCol);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = ng;
    c.beginPath();
    c.arc(nx + drift, ny, nR, 0, Math.PI * 2);
    c.fill();
  }

   /* Stars */
  bgStars.forEach(function (s) {
    var twinkle = Math.sin(t * s.twinkleSpeed + s.phase) * 0.4 + 0.6;
    c.globalAlpha = s.brightness * twinkle;
    c.fillStyle = '#c8ddee';
    c.beginPath();
    c.arc(s.x, s.y, s.r * twinkle, 0, Math.PI * 2);
    c.fill();
  });
  c.globalAlpha = 1;
}

/* ─── Charge Indicator Around Dragon ─── */
function drawChargeRing() {
  if (charge < 0.05) return;
  c.save();
  c.translate(dragon.x, dragon.y);
  
   /* Rotating ring */
  var ringR = 28 + charge * 18;
  c.strokeStyle = 'rgba(255,180,60,' + (0.2 + charge * 0.6) + ')';
  c.lineWidth = 2;
  c.setLineDash([5, 3]);
  c.lineDashOffset = -gameTime * 80;
  c.beginPath();
  c.arc(0, 0, ringR, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * charge);
  c.stroke();
  c.setLineDash([]);

   /* Inner glow intensifying */
  var innerGlow = c.createRadialGradient(0, 0, 5, 0, 0, ringR * 0.8);
  innerGlow.addColorStop(0, 'rgba(255,140,40,' + (charge * 0.15) + ')');
  innerGlow.addColorStop(1, 'rgba(255,100,20,0)');
  c.fillStyle = innerGlow;
  c.beginPath();
  c.arc(0, 0, ringR * 0.8, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/* ─── Connection Lines ─── */
function drawConnections() {
  if (!allEnergized) return;
  c.globalAlpha = 0.15;
  c.strokeStyle = '#ffe8d0';
  c.lineWidth = 1;
  for (var i = 0; i < nodeList.length - 1; i++) {
    c.beginPath();
    c.moveTo(nodeList[i].x, nodeList[i].y);
    c.lineTo(nodeList[i+1].x, nodeList[i+1].y);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(nodeList[nodeList.length-1].x, nodeList[nodeList.length-1].y);
  c.lineTo(nodeList[0].x, nodeList[0].y);
  c.stroke();
  c.globalAlpha = 1;
}

/* ─── Main Update ─── */
function update(dt, t) {
  if (!started) return;

   /* Compute target velocity toward input */
  var dx = inputX - dragon.x;
  var dy = inputY - dragon.y;
  var d = Math.sqrt(dx * dx + dy * dy);
  var targetSpeed = Math.min(d * 0.015, 6);

  if (inputActive) {
    if (d > 2) {
      var tx = (dx / d) * targetSpeed;
      var ty = (dy / d) * targetSpeed;
      dragon.vx = lerp(dragon.vx, tx, 0.12);
      dragon.vy = lerp(dragon.vy, ty, 0.12);
     }
    charge = Math.min(charge + chargeRate * dt, 1);
  } else {
    dragon.vx *= 0.94;
    dragon.vy *= 0.94;
  }

   /* Apply velocity */
  dragon.x += dragon.vx;
  dragon.y += dragon.vy;

   /* Boundary bounce */
  var pad = 15;
  if (dragon.x < pad) { dragon.x = pad; dragon.vx = Math.abs(dragon.vx) * 0.5; }
  if (dragon.x > W - pad) { dragon.x = W - pad; dragon.vx = -Math.abs(dragon.vx) * 0.5; }
  if (dragon.y < pad) { dragon.y = pad; dragon.vy = Math.abs(dragon.vy) * 0.5; }
  if (dragon.y > H - pad) { dragon.y = H - pad; dragon.vy = -Math.abs(dragon.vy) * 0.5; }

   /* Calculate angle for dragon facing direction of movement */
  var speed = Math.sqrt(dragon.vx * dragon.vx + dragon.vy * dragon.vy);
  if (speed > 0.3) {
    var targetAngle = Math.atan2(dragon.vy, dragon.vx);
    var diff = targetAngle - dragon.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    dragon.angle += diff * 0.1;
  }
  
   /* Tilt based on lateral velocity */
  dragon.tilt = dragon.vy * 0.02;
  dragon.wingPhase += speed * 0.8 + 2.5 * dt * 60;

   /* Trail particles */
  if (speed > 0.8) {
    spawnTrail(dragon.x - Math.cos(dragon.angle) * 12, dragon.y - Math.sin(dragon.angle) * 12, speed);
  }

   /* Check node proximity for proximity hints */
  nodeList.forEach(function (n, idx) {
    if (n.energized) return;
    var nDist = dist(dragon.x, dragon.y, n.x, n.y);
    if (nDist < 50 && charge > 0.7 && !inputActive) {
      // Auto-release hint: node glows brighter
    }
  });

   /* Update particles */
  updateParticles(dt);

   /* Update charge UI */
  var chargePercent = charge * 100;
  chargeFill.style.width = chargePercent + '%';
  if (charge >= 0.95) {
    chargeFill.classList.add('maxed');
  } else {
    chargeFill.classList.remove('maxed');
  }

   /* Update audio */
  SA.updateAudio(inputActive, charge, nodeList.map(function(n){return n.energized;}));
}

/* ─── Main Render ─── */
function render(t) {
  c.clearRect(0, 0, W, H);

  drawBackground(t);
  drawConnections();

   /* Draw nodes */
  nodeList.forEach(function (node, idx) {
    drawNode(node, t, idx);
  });

   /* Draw trail particles */
  trailParticles.forEach(function (p) {
    c.globalAlpha = p.life * 0.5;
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    c.fill();
  });

   /* Draw burst particles */
  particles.forEach(function (p) {
    c.globalAlpha = p.life * 0.8;
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, Math.PI * 2);
    c.fill();
  });
  c.globalAlpha = 1;

   /* Draw charge ring around dragon */
  drawChargeRing();

   /* Draw dragon */
  drawDragon(dragon.x, dragon.y, dragon.angle, dragon.tilt, dragon.wingPhase, charge);
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
initStars();
initNodes();
dragon.x = W / 2;
dragon.y = H / 2;
requestAnimationFrame(loop);

/* Expose reset for testing */
window._sanctuaryReset = resetGame;

})(window.SA = window.SA || {});
