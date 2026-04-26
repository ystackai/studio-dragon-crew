// Bundled output — compiled from src/visuals.ts, src/audio.ts, src/main.ts

// === visuals.ts ===
function easeInCubic(t) { return t * t * t; }
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

function seededRandom(seed) {
    var s = seed;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function drawBackground(ctx, w, h, time, breath) {
    var bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    var baseDark = 8 + breath * 12;
    bg.addColorStop(0, 'rgb(' + (baseDark + 20) + ', ' + (baseDark + 15) + ', ' + (baseDark + 25) + ')');
    bg.addColorStop(1, 'rgb(' + Math.round(baseDark * 0.5) + ', ' + Math.round(baseDark * 0.45) + ', ' + Math.round(baseDark * 0.6) + ')');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
}

function drawMossStep(ctx, w, h, breath) {
    var rng = seededRandom(42);
    var stepY = h * 0.7;
    ctx.save();
    var stoneGrad = ctx.createLinearGradient(0, stepY, 0, h);
    stoneGrad.addColorStop(0, 'rgba(40, 38, 45, ' + (0.8 + breath * 0.2) + ')');
    stoneGrad.addColorStop(1, 'rgba(25, 23, 30, 0.95)');
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(0, stepY + 20);
    for (var x = 0; x <= w; x += 40) {
        var offset = Math.sin(x * 0.008 + 1.5) * 12 + Math.sin(x * 0.02) * 5;
        ctx.lineTo(x, stepY + offset);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    for (var i = 0; i < 12; i++) {
        var mx = rng() * w;
        var my = stepY - 10 + rng() * 50;
        var mr = 15 + rng() * 40;
        var mossGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
        var gBase = 80 + breath * 60;
        mossGrad.addColorStop(0, 'rgba(' + (30 + breath * 20) + ', ' + gBase + ', ' + (40 + breath * 15) + ', ' + (0.7 + breath * 0.3) + ')');
        mossGrad.addColorStop(0.6, 'rgba(' + (25 + breath * 15) + ', ' + (gBase * 0.7) + ', ' + (35 + breath * 10) + ', ' + (0.4 + breath * 0.2) + ')');
        mossGrad.addColorStop(1, 'rgba(25, 60, 35, 0)');
        ctx.fillStyle = mossGrad;
        ctx.beginPath();
        ctx.ellipse(mx, my, mr, mr * 0.5, rng() * Math.PI * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(' + (50 + breath * 30) + ', ' + (110 + breath * 50) + ', ' + (55 + breath * 25) + ', ' + (0.4 + breath * 0.2) + ')';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 8; i++) {
        var sx = rng() * w;
        var sy = stepY - 5 + rng() * 30;
        ctx.beginPath();
        var len = 20 + rng() * 30;
        for (var t = 0; t < len; t += 3) {
            var dx = t * 0.8;
            var dy = t * Math.sin(t * 0.2 + i) * 0.3 - t * 0.4;
            if (t === 0) ctx.moveTo(sx + dx, sy + dy);
            else ctx.lineTo(sx + dx, sy + dy);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawGeode(ctx, w, h, breath, time) {
    var cx = w * 0.45;
    var cy = h * 0.48;
    var baseR = Math.min(w, h) * 0.18;
    ctx.save();

    var rockGrad = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, baseR * 1.4);
    rockGrad.addColorStop(0, 'rgba(70, 65, 80, 0.9)');
    rockGrad.addColorStop(0.6, 'rgba(45, 42, 55, 0.85)');
    rockGrad.addColorStop(1, 'rgba(30, 28, 40, 0)');
    ctx.fillStyle = rockGrad;

    ctx.beginPath();
    var rockRng = seededRandom(17);
    var points = 16;
    for (var i = 0; i <= points; i++) {
        var angle = (i / points) * Math.PI * 2;
        var r = baseR * 1.3 * (0.8 + rockRng() * 0.4);
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.7);
    coreGrad.addColorStop(0, 'rgba(' + (140 + breath * 80) + ', ' + (100 + breath * 60) + ', ' + (180 + breath * 40) + ', ' + (0.5 + breath * 0.5) + ')');
    coreGrad.addColorStop(0.4, 'rgba(' + (120 + breath * 60) + ', ' + (80 + breath * 50) + ', ' + (160 + breath * 30) + ', ' + (0.4 + breath * 0.4) + ')');
    coreGrad.addColorStop(0.7, 'rgba(' + (100 + breath * 40) + ', ' + (70 + breath * 40) + ', ' + (140 + breath * 20) + ', ' + (0.25 + breath * 0.3) + ')');
    coreGrad.addColorStop(1, 'rgba(80, 60, 120, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, baseR * 0.65, baseR * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    var shardRng = seededRandom(99);
    for (var i = 0; i < 6; i++) {
        var angle = shardRng() * Math.PI * 2;
        var dist = baseR * 0.2 + shardRng() * baseR * 0.35;
        var sx = cx + Math.cos(angle) * dist;
        var sy = cy + Math.sin(angle) * dist * 0.85;
        var sLen = 8 + shardRng() * 20;
        var sW = 1 + shardRng() * 2;
        var pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
        var alpha = (0.3 + breath * 0.6) * pulse;
        ctx.strokeStyle = 'rgba(' + (180 + breath * 40) + ', ' + (160 + breath * 30) + ', ' + (200 + breath * 20) + ', ' + alpha + ')';
        ctx.lineWidth = sW;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle + 0.3) * sLen, sy + Math.sin(angle + 0.3) * sLen);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(20, 18, 30, ' + (0.5 - breath * 0.3) + ')';
    ctx.lineWidth = 1.5;
    var fracRng = seededRandom(77);
    for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        var fx = cx + (fracRng() - 0.5) * baseR;
        var fy = cy + (fracRng() - 0.4) * baseR * 0.8;
        ctx.moveTo(fx, fy);
        var segs = 3 + Math.floor(fracRng() * 4);
        for (var j = 0; j < segs; j++) {
            fx += (fracRng() - 0.5) * 30;
            fy += (fracRng() - 0.4) * 20;
            ctx.lineTo(fx, fy);
        }
        ctx.stroke();
    }
    ctx.restore();

    if (breath > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        var bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.8);
        bloom.addColorStop(0, 'rgba(212, 165, 116, ' + (breath * 0.35) + ')');
        bloom.addColorStop(0.4, 'rgba(200, 150, 100, ' + (breath * 0.15) + ')');
        bloom.addColorStop(1, 'rgba(180, 130, 80, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.ellipse(cx, cy, baseR * 1.8, baseR * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawVial(ctx, w, h, breath, time) {
    var vx = w * 0.68;
    var vy = h * 0.55;
    var vW = 18;
    var vH = 50;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    var glassGrad = ctx.createLinearGradient(vx - vW, vy - vH, vx + vW, vy);
    var highlight = 0.15 + breath * 0.4;
    glassGrad.addColorStop(0, 'rgba(' + (180 + breath * 30) + ', ' + (200 + breath * 20) + ', ' + (210 + breath * 20) + ', ' + highlight + ')');
    glassGrad.addColorStop(0.5, 'rgba(' + (200 + breath * 25) + ', ' + (210 + breath * 20) + ', ' + (220 + breath * 15) + ', ' + (highlight * 0.7) + ')');
    glassGrad.addColorStop(1, 'rgba(' + (170 + breath * 30) + ', ' + (195 + breath * 20) + ', ' + (205 + breath * 20) + ', ' + (highlight * 0.8) + ')');
    ctx.fillStyle = glassGrad;

    ctx.beginPath();
    var neckH = vH * 0.25;
    var neckW = vW * 0.5;
    ctx.moveTo(vx - vW, vy - vH * 0.2);
    ctx.quadraticCurveTo(vx - vW - 3, vy, vx, vy + 3);
    ctx.quadraticCurveTo(vx + vW + 3, vy, vx + vW, vy - vH * 0.2);
    ctx.lineTo(vx + neckW, vy - vH * 0.2 - neckH);
    ctx.quadraticCurveTo(vx + neckW, vy - vH, vx, vy - vH - 3);
    ctx.quadraticCurveTo(vx - neckW, vy - vH, vx - neckW, vy - vH * 0.2 - neckH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(' + (160 + breath * 40) + ', ' + (180 + breath * 35) + ', ' + (195 + breath * 30) + ', ' + (0.3 + breath * 0.3) + ')';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    var liquidH = vH * 0.4 * (0.4 + breath * 0.6);
    var liqGrad = ctx.createLinearGradient(vx, vy - 3, vx, vy - liquidH);
    var liquidPulse = 0.5 + 0.5 * Math.sin(time * 1.5);
    liqGrad.addColorStop(0, 'rgba(212, 165, 116, ' + (0.3 + breath * 0.4 + liquidPulse * 0.15) + ')');
    liqGrad.addColorStop(1, 'rgba(180, 130, 80, ' + (0.2 + breath * 0.3) + ')');
    ctx.fillStyle = liqGrad;
    ctx.beginPath();
    var liqY = vy - 3;
    ctx.ellipse(vx, liqY, vW - 2, 2, 0, 0, Math.PI, false);
    ctx.lineTo(vx - vW + 2, liqY - liquidH);
    ctx.ellipse(vx, liqY - liquidH, vW - 2, 1.5, 0, Math.PI, 0, true);
    ctx.lineTo(vx + vW - 2, liqY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(vx - vW * 0.5, vy - vH * 0.8);
    ctx.quadraticCurveTo(vx - vW * 0.3, vy - vH * 0.3, vx - vW * 0.6, vy - vH * 0.05);
    ctx.strokeStyle = 'rgba(255, 250, 245, ' + (0.1 + breath * 0.2) + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

var chimeParticles = [];

function spawnChimeParticle(x, y, intensity) {
    var rng = Math.random;
    for (var i = 0; i < Math.ceil(intensity * 3); i++) {
        chimeParticles.push({
            x: x + (rng() - 0.5) * 80,
            y: y + (rng() - 0.5) * 80,
            vx: (rng() - 0.5) * 30 * intensity,
            vy: -20 - rng() * 50,
            life: 0,
            maxLife: 1.5 + rng() * 2,
            size: 2 + rng() * 6,
            hue: 25 + rng() * 35
        });
    }
}

function updateChimeParticles(dt, breath) {
    for (var i = chimeParticles.length - 1; i >= 0; i--) {
        var p = chimeParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 8 * dt;
        p.vx *= 0.98;
        p.life += dt;
        if (p.life >= p.maxLife) {
            chimeParticles.splice(i, 1);
        }
    }
}

function drawChimeParticles(ctx, breath) {
    if (chimeParticles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var k = 0; k < chimeParticles.length; k++) {
        var p = chimeParticles[k];
        var progress = p.life / p.maxLife;
        var alpha = (1 - progress * progress) * (0.3 + breath * 0.6);
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1 + progress * 2));
        grad.addColorStop(0, 'hsla(' + p.hue + ', 70%, 80%, ' + alpha + ')');
        grad.addColorStop(1, 'hsla(' + p.hue + ', 50%, 60%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + progress * 2), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawEdgeMask(ctx, w, h, breath) {
    var maskGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
    maskGrad.addColorStop(0, 'rgba(0,0,0,0)');
    maskGrad.addColorStop(0.7, 'rgba(0,0,0,' + (0.15 - breath * 0.1) + ')');
    maskGrad.addColorStop(1, 'rgba(5,4,10,' + (0.5 + breath * 0.2) + ')');
    ctx.fillStyle = maskGrad;
    ctx.fillRect(0, 0, w, h);
}

function drawRipples(ctx, w, h, time, breath) {
    var stepY = h * 0.78;
    ctx.save();
    var poolGrad = ctx.createRadialGradient(w * 0.35, stepY + 30, 0, w * 0.35, stepY + 30, w * 0.25);
    poolGrad.addColorStop(0, 'rgba(60, 90, 100, ' + (0.12 + breath * 0.1) + ')');
    poolGrad.addColorStop(0.6, 'rgba(45, 70, 85, ' + (0.06 + breath * 0.05) + ')');
    poolGrad.addColorStop(1, 'rgba(30, 50, 60, 0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.35, stepY + 30, w * 0.25, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2 + breath * 0.2;
    ctx.strokeStyle = 'rgba(100, 130, 120, 0.5)';
    ctx.lineWidth = 0.8;
    for (var ring = 0; ring < 5; ring++) {
        var cx = w * 0.35 + ring * w * 0.04;
        var phase = time * 0.6 + ring * 1.4;
        var r = (18 + 12 * Math.sin(phase)) * (0.7 + breath * 0.5);
        ctx.beginPath();
        ctx.ellipse(cx, stepY + 25 + ring * 6, r * 2.2, r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
     }
    ctx.restore();
}

function drawDustMotes(ctx, w, h, time, breath) {
    var rng = seededRandom(123);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < 20; i++) {
        var seed = rng();
        var x = ((seed * 7919 + time * 8 * (i % 3 + 1)) % w);
        var y = (((seed * 104729 + time * 5 * ((i + 2) % 4 + 1)) % h));
        var size = 1 + seed * 2;
        var flicker = 0.1 + 0.2 * Math.sin(time * 1.5 + i * 2.3);
        var alpha = flicker * (0.3 + breath * 0.5);
        var grad = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        grad.addColorStop(0, 'rgba(200, 195, 180, ' + alpha + ')');
        grad.addColorStop(1, 'rgba(200, 195, 180, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawScene(ctx, w, h, time, breath, inputX, inputY, inputIntensity) {
    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h, time, breath);
    drawDustMotes(ctx, w, h, time, breath);
    drawRipples(ctx, w, h, time, breath);
    drawMossStep(ctx, w, h, breath);
    drawGeode(ctx, w, h, breath, time);
    drawVial(ctx, w, h, breath, time);
    if (inputIntensity > 0.1) {
        spawnChimeParticle(inputX, inputY, inputIntensity);
    }
    updateChimeParticles(1 / 60, breath);
    drawChimeParticles(ctx, breath);
    drawEdgeMask(ctx, w, h, breath);
}

// === audio.ts ===
var AUDIO_BPM = 56;
var BEAT_INTERVAL = 60 / AUDIO_BPM;
var audioCtx = null;
var masterGain = null;
var compressor = null;
var tidalOsc = null;
var tidalGain = null;
var tidalFilter = null;
var reverbDelay = null;
var reverbFeedback = null;
var reverbDry = null;
var reverbWet = null;
var noiseBuffer = null;
var audioInitialized = false;
var breathGainNode = null;
var breathOscNode = null;
var breathOsc2Node = null;

function initAudio() {
    if (audioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, audioCtx.currentTime);
    compressor.knee.setValueAtTime(10, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.005, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.1, audioCtx.currentTime);

    reverbDelay = audioCtx.createDelay(2.0);
    reverbDelay.delayTime.setValueAtTime(0.8, audioCtx.currentTime);

    reverbFeedback = audioCtx.createGain();
    reverbFeedback.gain.setValueAtTime(0.45, audioCtx.currentTime);

    reverbDry = audioCtx.createGain();
    reverbDry.gain.setValueAtTime(0.7, audioCtx.currentTime);

    reverbWet = audioCtx.createGain();
    reverbWet.gain.setValueAtTime(0.3, audioCtx.currentTime);

    tidalOsc = audioCtx.createOscillator();
    tidalOsc.type = 'sine';
    tidalOsc.frequency.setValueAtTime(60, audioCtx.currentTime);

    tidalFilter = audioCtx.createBiquadFilter();
    tidalFilter.type = 'lowpass';
    tidalFilter.frequency.setValueAtTime(120, audioCtx.currentTime);
    tidalFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

    tidalGain = audioCtx.createGain();
    tidalGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

    breathOscNode = audioCtx.createOscillator();
    breathOscNode.type = 'sine';
    breathOscNode.frequency.setValueAtTime(180, audioCtx.currentTime);

    breathOsc2Node = audioCtx.createOscillator();
    breathOsc2Node.type = 'triangle';
    breathOsc2Node.frequency.setValueAtTime(270, audioCtx.currentTime);

    breathGainNode = audioCtx.createGain();
    breathGainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    var bufferSize = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    tidalOsc.connect(tidalFilter);
    tidalFilter.connect(tidalGain);
    tidalGain.connect(compressor);

    breathOscNode.connect(breathGainNode);
    breathOsc2Node.connect(breathGainNode);
    breathGainNode.connect(compressor);

    compressor.connect(reverbDry);
    compressor.connect(reverbDelay);

    reverbDelay.connect(reverbFeedback);
    reverbFeedback.connect(reverbDelay);
    reverbDelay.connect(reverbWet);

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);

    reverbDry.connect(masterGain);
    reverbWet.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    tidalOsc.start();
    breathOscNode.start();
    breathOsc2Node.start();

    var lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1 / BEAT_INTERVAL, audioCtx.currentTime);
    var lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(8, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(tidalOsc.frequency);
    lfo.start();

    var filterLfo = audioCtx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.setValueAtTime(1 / BEAT_INTERVAL, audioCtx.currentTime);
    var filterLfoGain = audioCtx.createGain();
    filterLfoGain.gain.setValueAtTime(40, audioCtx.currentTime);
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(tidalFilter.frequency);
    filterLfo.start();

    audioInitialized = true;
}

function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playCoralChime(intensity) {
    if (!audioInitialized || !audioCtx || !noiseBuffer) return;
    var now = audioCtx.currentTime;
    var source = audioCtx.createBufferSource();
    source.buffer = noiseBuffer;

    var chimeFilter = audioCtx.createBiquadFilter();
    chimeFilter.type = 'highpass';
    chimeFilter.frequency.setValueAtTime(2000 + intensity * 3000, now);
    chimeFilter.Q.setValueAtTime(2 + intensity * 3, now);

    var chimeGain = audioCtx.createGain();
    var vol = intensity * 0.15;
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(vol, now + 0.01);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + intensity * 0.2);

    source.connect(chimeFilter);
    chimeFilter.connect(chimeGain);
    chimeGain.connect(compressor);

    source.start(now);
    source.stop(now + 0.6);
}

function updateBreathAudio(breathIntensity) {
    if (!audioInitialized || !audioCtx || !breathGainNode || !breathOscNode || !breathOsc2Node) return;
    var now = audioCtx.currentTime;
    breathGainNode.gain.setTargetAtTime(breathIntensity * 0.18, now, 0.04);
    var baseFreq = 180 + breathIntensity * 60;
    breathOscNode.frequency.setTargetAtTime(baseFreq, now, 0.05);
    breathOsc2Node.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
    if (tidalGain) {
        tidalGain.gain.setTargetAtTime(0.25 + breathIntensity * 0.12, now, 0.04);
    }
}

function drainBreathAudio() {
    if (!audioInitialized || !audioCtx || !breathGainNode) return;
    var now = audioCtx.currentTime;
    breathGainNode.gain.setTargetAtTime(0, now, 0.08);
}

// === main.ts ===
var State = { Rest: 0, Breath: 1, Release: 2 };
var currentState = State.Rest;
var breathIntensity = 0;
var targetIntensity = 0;
var currentX = 0;
var currentY = 0;
var lastInputX = 0;
var lastInputY = 0;
var inputVelocity = 0;
var lastChimeTime = 0;
var lastFrameTime = 0;
var startTime = 0;
var firstInteraction = false;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d', { alpha: false });

function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function clampDt(dt) {
    return Math.min(dt, 33 / 1000);
}

function onInputDown(x, y) {
    if (!firstInteraction) {
        firstInteraction = true;
        initAudio();
        resumeAudio();
    }
    currentState = State.Breath;
    targetIntensity = 1;
    currentX = x;
    currentY = y;
    lastInputX = x;
    lastInputY = y;
    inputVelocity = 0;
}

function onInputMove(x, y) {
    if (!firstInteraction) {
        firstInteraction = true;
        initAudio();
        resumeAudio();
    }
    if (currentState === State.Breath) {
        var dx = x - lastInputX;
        var dy = y - lastInputY;
        inputVelocity = Math.sqrt(dx * dx + dy * dy);
        currentX = x;
        currentY = y;
        lastInputX = x;
        lastInputY = y;
        var now = performance.now();
        if (inputVelocity > 20 && now - lastChimeTime > 80) {
            lastChimeTime = now;
            var chimeIntensity = Math.min(inputVelocity / 200, 1);
            playCoralChime(chimeIntensity);
        }
    }
}

function onInputUp() {
    currentState = currentState === State.Breath ? State.Release : currentState;
    targetIntensity = 0;
}

canvas.addEventListener('pointerdown', function (e) { onInputDown(e.clientX, e.clientY); });
canvas.addEventListener('pointermove', function (e) { onInputMove(e.clientX, e.clientY); });
canvas.addEventListener('pointerup', onInputUp);
canvas.addEventListener('pointerleave', onInputUp);

document.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    onInputDown(window.innerWidth / 2, window.innerHeight / 2);
});
document.addEventListener('keyup', onInputUp);

function frame(timestamp) {
    var now = timestamp / 1000;
    if (startTime === 0) startTime = now;

    var dtRaw = lastFrameTime > 0 ? (now - lastFrameTime) : 1 / 60;
    var dt = clampDt(dtRaw);
    lastFrameTime = now;

    var time = now - startTime;
    var w = window.innerWidth;
    var h = window.innerHeight;

    switch (currentState) {
        case State.Rest:
            breathIntensity = lerp(breathIntensity, 0, dt * 3);
            if (breathIntensity < 0.001) breathIntensity = 0;
            updateBreathAudio(0);
            break;
        case State.Breath:
            var tIn = Math.min(dt * 2.5, 1);
            breathIntensity = lerp(breathIntensity, easeInCubic(tIn) * targetIntensity, dt * 6);
            updateBreathAudio(Math.min(breathIntensity, 1));
            break;
        case State.Release:
            var decayRate = dt * 2.8;
            breathIntensity *= (1 - easeOutExpo(Math.min(decayRate, 1)));
            if (breathIntensity < 0.005) {
                breathIntensity = 0;
                currentState = State.Rest;
                drainBreathAudio();
            } else {
                updateBreathAudio(breathIntensity);
                drainBreathAudio();
            }
            break;
    }

    breathIntensity = Math.max(0, Math.min(breathIntensity, 1));
    drawScene(ctx, w, h, time, breathIntensity, currentX, currentY, inputVelocity * 0.01);
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
