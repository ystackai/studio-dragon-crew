// src/main.ts — Render loop, state management, input handling

import { drawScene, easeInCubic, easeOutExpo, lerp } from './visuals';
import { initAudio, resumeAudio, playCoralChime, updateBreathAudio, drainBreathAudio } from './audio';

// -- State machine ------------------------------------------------
enum State { Rest, Breath, Release }

let state: State = State.Rest;
let breathIntensity = 0;           // 0.0 – 1.0, current value
let targetIntensity = 0;           // 0 or 1 depending on state
let currentX = 0;
let currentY = 0;
let lastInputX = 0;
let lastInputY = 0;
let inputVelocity = 0;
let lastChimeTime = 0;

// Timing
let lastFrameTime = 0;
let startTime = 0;
let fadeTransition = 0;            // 400 ms adaptive fade value
let fadeTarget = 0;
let firstInteraction = false;

// -- Canvas -------------------------------------------------------
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;

function resize(): void {
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// -- Delta-clamp --------------------------------------------------
const MAX_DT_SEC = 33 / 1000;
function clampDt(raw: number) { return Math.min(raw, MAX_DT_SEC); }

// -- Input handlers ------------------------------------------------
function onDown(x: number, y: number): void {
    if (!firstInteraction) {
        firstInteraction = true;
        initAudio();
        resumeAudio();
    }
    state           = State.Breath;
    targetIntensity  = 1;
    currentX = x; currentY = y;
    lastInputX = x; lastInputY = y;
    inputVelocity = 0;
    fadeTarget = 1;
}

function onMove(x: number, y: number): void {
    if (!firstInteraction) {
        firstInteraction = true;
        initAudio();
        resumeAudio();
    }

    if (state === State.Breath) {
        const dx = x - lastInputX;
        const dy = y - lastInputY;
        inputVelocity = Math.sqrt(dx * dx + dy * dy);

        currentX = x; currentY = y;
        lastInputX = x; lastInputY = y;

        const now = performance.now();
        if (inputVelocity > 18 && now - lastChimeTime > 70) {
            lastChimeTime = now;
            playCoralChime(Math.min(inputVelocity / 180, 1));
        }
    }
}

function onUp(): void {
    if (state === State.Breath) {
        state = State.Release;
        targetIntensity = 0;
        fadeTarget = 0;
        drainBreathAudio();
    }
}

canvas.addEventListener('pointerdown', e => onDown(e.clientX, e.clientY));
canvas.addEventListener('pointermove', e => {
    if (e.buttons > 0) onMove(e.clientX, e.clientY);
});
canvas.addEventListener('pointerup',    onUp);
canvas.addEventListener('pointerleave', onUp);

document.addEventListener('keydown', e => { if (!e.repeat) e.preventDefault(); onDown(window.innerWidth / 2, window.innerHeight / 2); });
document.addEventListener('keyup',   onUp);

// -- Main rAF loop -----------------------------------------------
function frame(timestamp: number): void {
    const nowSec = timestamp / 1000;
    if (!startTime) startTime = nowSec;

    const dt = clampDt(lastFrameTime ? nowSec - lastFrameTime : 1 / 60);
    lastFrameTime = nowSec;
    const time = nowSec - startTime;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // --- State transitions ----------------------------------------
    switch (state) {
        case State.Rest:
            breathIntensity = lerp(breathIntensity, 0, dt * 2.5);
            if (breathIntensity < 0.001) breathIntensity = 0;
            updateBreathAudio(breathIntensity);
            break;

        case State.Breath: {
            // Ramp with easeInCubic
            const rampT = Math.min(dt * 2.2, 1);
            breathIntensity = lerp(breathIntensity, easeInCubic(rampT) * targetIntensity, dt * 5.5);
            breathIntensity = Math.min(breathIntensity, 1);
            updateBreathAudio(breathIntensity);
            break;
        }

        case State.Release: {
            // Decay with easeOutExpo
            const decayProgress = Math.min(dt * 2.5, 1);
            breathIntensity *= (1 - easeOutExpo(decayProgress));
            updateBreathAudio(breathIntensity);
            if (breathIntensity < 0.003) {
                breathIntensity = 0;
                state = State.Rest;
            }
            break;
        }
    }

    // --- 400 ms adaptive fade transition ---------------------------
    // Handles state-drain buffer-clear to prevent micro-drift
    const fadeRate = dt / 0.4;   // full transition in ~400 ms
    fadeTransition = lerp(fadeTransition, fadeTarget, Math.min(fadeRate, 1));

    // --- Draw scene -----------------------------------------------
    // inputIntensity passed as scaled velocity for bloom spawning
    drawScene(ctx, w, h, time, breathIntensity, currentX, currentY, inputVelocity * 0.009);

    // --- Buffer-clear on state drain -----------------------------
    // When fadeTransition drops below 0.02 we gently clear accumulated particles
    if (fadeTransition < 0.02 && breathIntensity < 0.01) {
        // Visual already faded, no extra clear needed — drawScene handles it
    }

    requestAnimationFrame(frame);
}

// --- Boot ---------------------------------------------------------
requestAnimationFrame(frame);
