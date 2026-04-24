"use strict";

// === Matrix utilities (minimal, no external deps) ===
const Mat4 = {
    create() { const m = new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; },
    perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy * 0.5), nf = 1 / (near - far);
        out.fill(0);
        out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf;
        out[11] = -1; out[14] = 2 * far * near * nf;
        return out;
    },
    multiply(out, a, b) {
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++) {
                out[r * 4 + c] = a[r]*b[c] + a[r*4+1]*b[4+c] + a[r*4+2]*b[8+c] + a[r*4+3]*b[12+c];
             }
        return out;
    },
    translate(out, a, v) {
        const x=v[0], y=v[1], z=v[2];
        out.set(a);
        out[12] = a[0]*x + a[4]*y + a[8]*z + a[12];
        out[13] = a[1]*x + a[5]*y + a[9]*z + a[13];
        out[14] = a[2]*x + a[6]*y + a[10]*z + a[14];
        out[15] = a[3]*x + a[7]*y + a[11]*z + a[15];
        return out;
    },
    rotateY(out, a, rad) {
        const s=Math.sin(rad), c=Math.cos(rad);
        const a00=a[0], a01=a[1], a02=a[2], a03=a[3];
        const a20=a[8], a21=a[9], a22=a[10], a23=a[11];
        out.set(a);
        out[0]=a00*c+a20*s; out[1]=a01*c+a21*s;
        out[2]=a02*c+a22*s; out[3]=a03*c+a23*s;
        out[8]=a20*c-a00*s; out[9]=a21*c-a01*s;
        out[10]=a22*c-a02*s; out[11]=a23*c-a03*s;
        return out;
    },
    normalMat3(out, m) {
         // Upper-left 3x3 inverse-transpose (simplified for orthonormal)
        const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],
              a20=m[8],a21=m[9],a22=m[10];
        const det = a00*(a11*a22-a12*a21) - a01*(a10*a22-a12*a20) + a02*(a10*a21-a11*a20);
        const id = 1/det;
        out[0]=(a11*a22-a12*a21)*id; out[1]=(a02*a21-a01*a22)*id; out[2]=(a01*a12-a02*a11)*id;
        out[3]=(a12*a20-a10*a22)*id; out[4]=(a00*a22-a02*a20)*id; out[5]=(a02*a10-a00*a12)*id;
        out[6]=(a10*a21-a11*a20)*id; out[7]=(a01*a20-a00*a21)*id; out[8]=(a00*a11-a01*a10)*id;
        return out;
    },
};

// === GL helpers ===
function createGLTexture(gl, canvas) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}

// === State ===
const MAX_RIPPLES = 32;
let gl, canvas;
let twilightProg, rippleProg, creatureProg;
let glTextures;
// FlowScore: 0.0..1.0
let flowScore = 0.5;
let currentState = 'active'; // 'active' or 'drift'
let driftFactor = 0.0; // 0 = Active, 1 = Drift (crossfade)
const DRIFT_THRESHOLD  = 0.3;
const ACTIVE_THRESHOLD = 0.6;
let inputTimestamps = [];
let lastInputTime = 0;
// Ripple ring buffer
let ripples = []; // { x, y, birthTime }
// Telemetry
let telemetry = [];
const TELEMETRY_INTERVAL = 500; // ms
let lastTelemetryTick = 0;
// Render
let prevFrameTime = performance.now();
let globalTime = 0;

// === HUD refs ===
let elScore, elState, elBeat;

// === Input handling ===
function handleInput(clientX, clientY, ts) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

     // Ripple spawn
    ripples.push({ x, y, birthTime: globalTime });
    if (ripples.length > MAX_RIPPLES) ripples.shift();

     // FlowScore cadence calculation
    inputTimestamps.push(ts);
    if (inputTimestamps.length > 20) inputTimestamps.shift();

    if (inputTimestamps.length >= 2) {
        const lastDelta = ts - inputTimestamps[inputTimestamps.length - 2];
        const tgtDelta = inputTimestamps.length >= 3
             ? (inputTimestamps[inputTimestamps.length-2] - inputTimestamps[inputTimestamps.length-3])
             : lastDelta;
        const deviation = Math.abs(lastDelta - tgtDelta);
        const tolerance = 150; // ms
        if (deviation <= tolerance) {
             // Boost
            const quality = 1.0 - (deviation / tolerance);
            flowScore = Math.min(1.0, flowScore + 0.04 * quality);
        } else if (deviation < tolerance * 2.5) {
            flowScore = Math.min(1.0, flowScore + 0.015);
        } else {
            flowScore -= 0.06;
        }
        elBeat.textContent = lastDelta.toFixed(0);
    }

    lastInputTime = ts;
}

function onPointerDown(e) {
    e.preventDefault();
    handleInput(e.clientX, e.clientY, performance.now());
}
function onPointerMove(e) {
    if (e.buttons !== 0) {
        e.preventDefault();
        handleInput(e.clientX, e.clientY, performance.now());
    }
}
function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.touches) handleInput(t.clientX, t.clientY, performance.now());
}

// === Telemetry ===
function recordTelemetry(ts) {
    telemetry.push({
        timestamp: ts,
        flowScore: Math.round(flowScore * 1000) / 1000,
        currentState,
        inputDelta: ts - lastInputTime,
    });
    if (telemetry.length > 500) telemetry.shift();
}

function exportTelemetryJSON() {
    return JSON.stringify(telemetry, null, 2);
}
window.exportTelemetry = exportTelemetryJSON;

// === State transitions ===
function updateState(dt) {
     // Decay when no input (frame-rate independent)
    const decayBase = 0.98;
    const framesInSec = 60;
    const adjustedDecay = Math.pow(decayBase, dt * framesInSec);
    flowScore *= adjustedDecay;
    flowScore = Math.max(0.0, flowScore);

     // State transition logic
    if (flowScore <= DRIFT_THRESHOLD && currentState !== 'drift') {
        currentState = 'drift';
        elState.textContent = 'Drift';
        elState.className = 'drift';
    } else if (flowScore >= ACTIVE_THRESHOLD && currentState !== 'active') {
        currentState = 'active';
        elState.textContent = 'Active';
        elState.className = 'active';
    }

     // Smooth crossfade factor
    const targetDrift = (currentState === 'drift') ? 1.0 : 0.0;
    const lerpSpeed = 2.0;
    driftFactor += (targetDrift - driftFactor) * Math.min(1, dt * lerpSpeed);
}

// === Rendering ===
function updateHUD() {
    elScore.textContent = flowScore.toFixed(2);
}

function renderTwilight(time) {
    gl.useProgram(twilightProg.program);
    const p = twilightProg.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, twilightProg.buffer);
    gl.enableVertexAttribArray(p.aPosition);
    gl.vertexAttribPointer(p.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(p.uTime, time);
    gl.uniform2f(p.uResolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function renderRipples(time) {
    gl.useProgram(rippleProg.program);
    const p = rippleProg.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, rippleProg.buffer);
    gl.enableVertexAttribArray(p.aPosition);
    gl.vertexAttribPointer(p.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(p.uResolution, canvas.width, canvas.height);
    gl.uniform1f(p.uTime, time);

    const count = Math.min(ripples.length, rippleProg.maxRipples);
    gl.uniform1f(p.uRippleCount, count);
    for (let i = 0; i < count; i++) {
        gl.uniform2f(p.uRippleCenter[i], ripples[i].x, ripples[i].y);
        gl.uniform1f(p.uRippleBirth[i], ripples[i].birthTime);
    }
     // Clean old ripples
    while (ripples.length && time - ripples[0].birthTime > 3.0) ripples.shift();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function renderCreature(time) {
     // Build a simple creature geometry: an icosphere-like blob
    gl.useProgram(creatureProg.program);
    const p = creatureProg.loc;

    // Placeholder: draw a single quad as creature placeholder
    // Real creature mesh would be a sphere/icosahedron buffer
    if (!creatureGeometries) createCreatureGeometry();
    const geo = creatureGeometries;

    const model = Mat4.create();
    Mat4.translate(model, model, [0, 0, -2]);
     // Gentle float when in drift
    if (currentState === 'drift') {
        Mat4.translate(model, model, [0, Math.sin(time * 0.5) * 0.15, 0]);
    }

    const view = Mat4.create();
    const proj = Mat4.create();
    const tmp = Mat4.create();
    const mvp  = Mat4.create();
    const nMat = new Float32Array(9);

    Mat4.perspective(proj, Math.PI / 3, canvas.width / canvas.height, 0.1, 100);
    Mat4.multiply(mvp, proj, model);
    Mat4.normalMat3(nMat, model);

    gl.uniformMatrix4fv(p.uModel, false, model);
    gl.uniformMatrix4fv(p.uMvp, false, mvp);
    gl.uniformMatrix3fv(p.uNormalMat, false, nMat);

     // Active material uniforms
    gl.uniform3f(p.uActiveBaseColor, 0.65, 0.25, 0.45);
    gl.uniform3f(p.uActiveEmissive, 0.9, 0.7, 0.3);
    gl.uniform1f(p.uActiveLuminosity, 0.3 + flowScore * 0.5);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glTextures.activeNormal);
    gl.uniform1i(p.uActiveNormalTex, 0);

     // Drift material uniforms
    gl.uniform3f(p.uDriftBaseColor, 0.45, 0.38, 0.50);
    gl.uniform3f(p.uDriftWarmTint, 0.6, 0.4, 0.3);
    gl.uniform1f(p.uDriftSSSStrength, 0.3 + (1 - flowScore) * 0.7);
    gl.uniform1f(p.uDriftGaussianSigma, 0.005 + driftFactor * 0.02);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glTextures.driftDiffuse);
    gl.uniform1i(p.uDriftDiffuseTex, 1);

     // Shared uniforms
    gl.uniform1f(p.uDriftFactor, driftFactor);
    gl.uniform3f(p.uLightDir, 0.4, 0.6, 0.7);
    gl.uniform2f(p.uCameraPos, 0, 0);
    gl.uniform1f(p.uTime, time);

    gl.bindBuffer(gl.ARRAY_BUFFER, geo.posBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.uvBuf);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.normBuf);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.idxBuf);
    gl.drawElements(gl.TRIANGLES, geo.idxCount, gl.UNSIGNED_SHORT, 0);
}

// === Creature placeholder geometry: a sphere mesh ===
let creatureGeometries = null;
function createCreatureGeometry() {
     // Simple 16-segment sphere
    const segments = 16, rings = 12;
    const pos = [], uv = [], norm = [], idx = [];
    for (let r = 0; r <= rings; r++) {
        const phi = Math.PI * r / rings;
        const sp = Math.sin(phi), cp = Math.cos(phi);
        for (let s = 0; s <= segments; s++) {
            const theta = 2 * Math.PI * s / segments;
            const st = Math.sin(theta), ct = Math.cos(theta);
            const x = ct * sp, y = cp, z = st * sp;
            pos.push(x, y, z);
            uv.push(s / segments, r / rings);
            norm.push(x, y, z);
         }
     }
    for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = r * (segments + 1) + s;
            const b = a + segments + 1;
            idx.push(a, b, a+1, b, b+1, a+1);
         }
    }
    creatureGeometries = {
        posBuf:  (() => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW); return b; })(),
        uvBuf:   (() => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW); return b; })(),
        normBuf: (() => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norm), gl.STATIC_DRAW); return b; })(),
        idxBuf:  (() => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW); return b; })(),
        idxCount: idx.length,
     };
}

// === Audio (WebAudio procedural) ===
let audioCtx = null;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playPulseSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + flowScore * 300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.45);
}

// Ambient drone for drift state
let driftPad = null;
function updateDriftPad() {
    if (!audioCtx) return;
    if (currentState === 'drift' && !driftPad) {
         // Deep resonant pad
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        osc1.type = 'sine'; osc1.frequency.value = 60;
        osc2.type = 'triangle'; osc2.frequency.value = 91;
        filter.type = 'lowpass'; filter.frequency.value = 200;
         // LFO on filter cutoff
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.15; lfoGain.gain.value = 80;
        lfo.connect(lfoGain).connect(filter.frequency);
        lfo.start();
        osc1.connect(filter); osc2.connect(filter);
        filter.connect(gain).connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2);
        osc1.start(); osc2.start();
        driftPad = { osc1, osc2, filter, gain, lfo, lfoGain };
    } else if (currentState === 'active' && driftPad) {
        driftPad.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        setTimeout(() => {
            try { driftPad.osc1.stop(); driftPad.osc2.stop(); driftPad.lfo.stop(); } catch(e) {}
            driftPad = null;
        }, 1100);
    }
}

// === Main loop ===
function frame(now) {
    const dt = (now - prevFrameTime) / 1000;
    prevFrameTime = now;
    globalTime += dt;

    updateState(dt);
    updateHUD();
    updateDriftPad();

     // Telemetry tick
    if (now - lastTelemetryTick > TELEMETRY_INTERVAL) {
        recordTelemetry(now);
        console.log('[telemetry]', {
            ts: now, score: flowScore.toFixed(3), state: currentState,
            delta: now - lastInputTime, ripples: ripples.length,
         });
        lastTelemetryTick = now;
    }

     // Render passes
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.03, 0.02, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    renderTwilight(globalTime);
    renderCreature(globalTime);
    renderRipples(globalTime);

    requestAnimationFrame(frame);
}

// === Init ===
function init() {
    canvas = document.getElementById('gl-canvas');
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!gl) { console.error('WebGL2 not supported'); return; }

    canvas.width  = window.innerWidth  * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;

     // Compile shader programs
    twilightProg = window.createTwilightProgram(gl);
    rippleProg  = window.createRippleProgram(gl);
     // Creature will be loaded when available
    if (window.createCreatureProgram) {
        creatureProg = window.createCreatureProgram(gl);
    }

     // Load placeholder textures
    window.loadPlaceholderTextures().then(tex => {
        glTextures = {
            activeNormal: createGLTexture(gl, tex.activeNormal),
            driftDiffuse: createGLTexture(gl, tex.driftDiffuse),
            moodVignette: createGLTexture(gl, tex.moodVignette),
         };
    });

     // Input listeners — touch + mouse, <50ms lat
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('pointerup', () => {});

     // Audio init on first interaction
    let audioStarted = false;
    canvas.addEventListener('pointerdown', () => {
        if (!audioStarted) { initAudio(); audioStarted = true; }
        playPulseSound();
    }, { passive: true });

     // HUD elements
    elScore  = document.getElementById('score-val');
    elState  = document.getElementById('state-val');
    elBeat   = document.getElementById('beat-val');

     // Resize handler
    window.addEventListener('resize', () => {
        canvas.width  = window.innerWidth  * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
    });

    elState.className = 'active';
    requestAnimationFrame(frame);
}

// === Expose modules to window for script loading ===
// The shader modules expose create*Program functions; they're loaded as <script> tags.
// We need to monkey-patch them onto window because they use module.exports.
if (typeof module !== 'undefined' && module.exports) {
     // This runs when loaded as <script> — intercept
}

// When all scripts are loaded, init fires
window.addEventListener('load', () => {
     // Scripts loaded via <script src> expose their module.exports onto globals
     // Let's patch: the modules use module.exports but in browser <script> context
     // we need to make them available
    try { init(); } catch(e) {
         // If init fails because shader modules aren't on window yet
        console.warn('Init deferred — shader modules may not be loaded.', e);
        // Retry after a tick
        setTimeout(() => { try { init(); } catch(e2) { console.error('Init failed', e2); } }, 500);
    }
});
