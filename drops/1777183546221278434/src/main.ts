// src/main.ts — Render loop, state management, input handling

import { drawScene, easeInCubic, easeOutExpo, lerp } from './visuals';
import { initAudio, resumeAudio, playCoralChime, updateBreathAudio, drainBreathAudio } from './audio';

enum State { Rest, Breath, Release }

let state: State = State.Rest;
let breathIntensity: number = 0;
let targetIntensity: number = 0;
let currentX: number = 0;
let currentY: number = 0;
let lastInputX: number = 0;
let lastInputY: number = 0;
let inputVelocity: number = 0;
let lastChimeTime: number = 0;
let lastFrameTime: number = 0;
let startTime: number = 0;
let firstInteraction: boolean = false;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;

/** Resize canvas to fill window, tracking device pixel ratio */
function resize(): void {
   const dpr = window.devicePixelRatio || 1;
   canvas.width = window.innerWidth * dpr;
   canvas.height = window.innerHeight * dpr;
   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

/** Clamp delta-time to prevent spiral-of-death and micro-drift */
function clampDt(dt: number): number {
   return Math.min(dt, 33 / 1000); // max ~33ms (3fps floor)
}

/**
 * Unified input handler — pointer and keyboard.
 * State A (Rest) → State B (Breath) on press/move.
 * State B → State C (Release) on release.
 */
function onInputDown(x: number, y: number): void {
   if (!firstInteraction) {
       firstInteraction = true;
       initAudio();
       resumeAudio();
   }
   state = State.Breath;
   targetIntensity = 1;
   currentX = x;
   currentY = y;
   lastInputX = x;
   lastInputY = y;
   inputVelocity = 0;
}

function onInputMove(x: number, y: number): void {
   if (!firstInteraction) {
       firstInteraction = true;
       initAudio();
       resumeAudio();
   }

   if (state === State.Breath) {
       // Calculate velocity for coral chimes
       const dx = x - lastInputX;
       const dy = y - lastInputY;
       inputVelocity = Math.sqrt(dx * dx + dy * dy);

       currentX = x;
       currentY = y;
       lastInputX = x;
       lastInputY = y;

       // Trigger coral chime on significant movement
       const now = performance.now();
       if (inputVelocity > 20 && now - lastChimeTime > 80) {
           lastChimeTime = now;
           const chimeIntensity = Math.min(inputVelocity / 200, 1);
           playCoralChime(chimeIntensity);
       }
   }
}

function onInputUp(): void {
   state = state === State.Breath ? State.Release : state;
   targetIntensity = 0;
}

// Pointer events
canvas.addEventListener('pointerdown', (e) => onInputDown(e.clientX, e.clientY));
canvas.addEventListener('pointermove', (e) => onInputMove(e.clientX, e.clientY));
canvas.addEventListener('pointerup', onInputUp);
canvas.addEventListener('pointerleave', onInputUp);

// Keyboard events
document.addEventListener('keydown', (e) => {
   if (e.repeat) return;
   onInputDown(window.innerWidth / 2, window.innerHeight / 2);
});
document.addEventListener('keyup', onInputUp);

/** Main rAF loop — single render pass, delta-time driven */
function frame(timestamp: number): void {
   const now = timestamp / 1000;
   if (startTime === 0) startTime = now;

   const dtRaw = lastFrameTime > 0 ? (now - lastFrameTime) : 1 / 60;
   const dt = clampDt(dtRaw);
   lastFrameTime = now;

   const time = now - startTime;
   const w = window.innerWidth;
   const h = window.innerHeight;

   // State machine with smooth transitions
   switch (state) {
       case State.Rest:
           breathIntensity = lerp(breathIntensity, 0, dt * 3);
           if (breathIntensity < 0.001) breathIntensity = 0;
           driftBreathAudio(0);
           break;

       case State.Breath:
           // Ramp up with easeInCubic
           const tIn = Math.min(dt * 2.5, 1); // fast ramp
           breathIntensity = lerp(breathIntensity, easeInCubic(tIn) * targetIntensity, dt * 6);
           updateBreathAudio(Math.min(breathIntensity, 1));
           break;

       case State.Release:
           // Decay with easeOutExpo
           const decayRate = dt * 2.8;
           breathIntensity *= (1 - easeOutExpo(Math.min(decayRate, 1)));
           if (breathIntensity < 0.005) {
               breathIntensity = 0;
               state = State.Rest;
               drainBreathAudio();
           } else {
               updateBreathAudio(breathIntensity);
               drainBreathAudio();
           }
           break;
   }

   // 400ms adaptive fade on state transitions
   // (handled implicitly by the lerp/rate above — 1/0.4 = 2.5 scale factor)

   // Clamp
   breathIntensity = Math.max(0, Math.min(breathIntensity, 1));

   // Draw
   drawScene(ctx, w, h, time, breathIntensity, currentX, currentY, inputVelocity * 0.01);

   // Next frame
   requestAnimationFrame(frame);
}

// Wrapper for breath audio to avoid unused import
function driftBreathAudio(intensity: number): void {
   updateBreathAudio(intensity);
}

// Start
requestAnimationFrame(frame);
